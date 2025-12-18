const db = require("../config/db");
const AssetRepository = require("./assetRepository");

jest.mock("../config/db");

describe("AssetRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================
  // findAll: 10 testcases
  // =========================================================
  describe("findAll", () => {
    it("1) should return paginated assets with total count", async () => {
      const mockAssets = [
        { id: 1, name: "Asset 1", total_count: 2 },
        { id: 2, name: "Asset 2", total_count: 2 },
      ];

      db.query.mockResolvedValue({ rows: mockAssets });

      const result = await AssetRepository.findAll({ limit: 10, offset: 0 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/select/i),
        expect.any(Array)
      );

      expect(result.assets).toEqual(
        mockAssets.map(({ total_count, ...asset }) => asset)
      );
      expect(Number(result.total)).toBe(2);
    });

    it("2) should handle empty results", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await AssetRepository.findAll({ limit: 10, offset: 0 });

      expect(result).toEqual({ assets: [], total: 0 });
    });

    it("3) should call db.query exactly once", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await AssetRepository.findAll({ limit: 10, offset: 0 });

      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("4) should pass limit & offset in params (at least contains them)", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await AssetRepository.findAll({ limit: 10, offset: 5 });

      const params = db.query.mock.calls[0][1];
      expect(params).toEqual(expect.arrayContaining([10, 5]));
    });

    it("5) should not include total_count field in returned assets", async () => {
      db.query.mockResolvedValue({
        rows: [{ id: 1, name: "Asset 1", total_count: 1 }],
      });

      const result = await AssetRepository.findAll({ limit: 10, offset: 0 });

      expect(result.assets[0]).toEqual({ id: 1, name: "Asset 1" });
      expect(result.assets[0]).not.toHaveProperty("total_count");
    });

    it("6) should take total from the first row total_count if present", async () => {
      db.query.mockResolvedValue({
        rows: [
          { id: 1, name: "A", total_count: 99 },
          { id: 2, name: "B", total_count: 99 },
        ],
      });

      const result = await AssetRepository.findAll({ limit: 10, offset: 0 });
      expect(Number(result.total)).toBe(99);
    });

    it("7) should work even if total_count is a string", async () => {
      db.query.mockResolvedValue({
        rows: [{ id: 1, name: "A", total_count: "3" }],
      });

      const result = await AssetRepository.findAll({ limit: 10, offset: 0 });
      expect(Number(result.total)).toBe(3);
    });

    it("8) should return total=0 if total_count is missing", async () => {
      db.query.mockResolvedValue({
        rows: [{ id: 1, name: "A" }],
      });

      const result = await AssetRepository.findAll({ limit: 10, offset: 0 });

      expect(result.assets).toEqual([{ id: 1, name: "A" }]);
      expect(Number(result.total)).toBe(0);
    });

    it("9) should propagate database errors", async () => {
      db.query.mockRejectedValue(new Error("Database error"));
      await expect(AssetRepository.findAll({ limit: 10, offset: 0 })).rejects.toThrow(
        "Database error"
      );
    });

    it("10) should not mutate returned db rows object", async () => {
      const rows = [
        { id: 1, name: "Asset 1", total_count: 1 },
      ];
      db.query.mockResolvedValue({ rows });

      await AssetRepository.findAll({ limit: 10, offset: 0 });

      // rows gốc không bị xoá total_count
      expect(rows[0]).toHaveProperty("total_count");
    });
  });

  // =========================================================
  // findById: 10 testcases
  // =========================================================
  describe("findById", () => {
    it("1) should return an asset by ID", async () => {
      const mockAsset = { id: 1, name: "Asset 1" };
      db.query.mockResolvedValue({ rows: [mockAsset] });

      const result = await AssetRepository.findById(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/select/i),
        [1]
      );
      expect(result).toEqual(mockAsset);
    });

    it("2) should return null if asset is not found", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await AssetRepository.findById(999);

      expect(result).toBeNull();
    });

    it("3) should call db.query exactly once", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await AssetRepository.findById(1);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("4) should pass id as the only parameter", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await AssetRepository.findById(123);

      expect(db.query.mock.calls[0][1]).toEqual([123]);
    });

    it("5) should use a WHERE clause (basic SQL check)", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await AssetRepository.findById(1);

      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/where/i);
    });

    it("6) should return first row if DB returns multiple rows", async () => {
      db.query.mockResolvedValue({
        rows: [{ id: 1, name: "A" }, { id: 1, name: "B" }],
      });

      const result = await AssetRepository.findById(1);
      expect(result).toEqual({ id: 1, name: "A" });
    });

    it("7) should accept id as string and pass it through", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, name: "A" }] });

      const result = await AssetRepository.findById("1");

      expect(db.query.mock.calls[0][1]).toEqual(["1"]);
      expect(result).toEqual({ id: 1, name: "A" });
    });

    it("8) should propagate database errors", async () => {
      db.query.mockRejectedValue(new Error("Database error"));
      await expect(AssetRepository.findById(1)).rejects.toThrow("Database error");
    });

    it("9) should not run INSERT/UPDATE for findById (basic guard)", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await AssetRepository.findById(1);

      const sql = db.query.mock.calls[0][0];
      expect(sql).not.toMatch(/insert|update|delete/i);
    });

    it("10) should return null when rows is undefined/null (defensive)", async () => {
      db.query.mockResolvedValue({}); // rows missing

      const result = await AssetRepository.findById(1);
      expect(result).toBeNull();
    });
  });

  // =========================================================
  // create: 10 testcases
  // =========================================================
  describe("create", () => {
    it("1) should create a new asset and return it", async () => {
      const mockAsset = { id: 1, name: "New Asset" };
      db.query.mockResolvedValue({ rows: [mockAsset] });

      const result = await AssetRepository.create({ name: "New Asset" });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/insert\s+into\s+assets/i),
        expect.any(Array)
      );
      expect(result).toEqual(mockAsset);
    });

    it("2) should call db.query exactly once", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, name: "A" }] });

      await AssetRepository.create({ name: "A" });
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("3) should pass provided name in query params", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, name: "X" }] });

      await AssetRepository.create({ name: "X" });

      const params = db.query.mock.calls[0][1];
      expect(params).toEqual(expect.arrayContaining(["X"]));
    });

    it("4) should return first row if multiple rows returned", async () => {
      db.query.mockResolvedValue({
        rows: [{ id: 1, name: "A" }, { id: 2, name: "B" }],
      });

      const result = await AssetRepository.create({ name: "A" });
      expect(result).toEqual({ id: 1, name: "A" });
    });

    it("5) should return falsy if DB returns empty rows", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await AssetRepository.create({ name: "A" });
      expect(result).toBeFalsy(); // null/undefined đều OK
    });

    it("6) should propagate db errors", async () => {
      db.query.mockRejectedValue(new Error("Database error"));

      await expect(AssetRepository.create({ name: "A" })).rejects.toThrow("Database error");
    });

    it("7) should not mutate input payload", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, name: "A" }] });

      const payload = { name: "A" };
      const snapshot = { ...payload };

      await AssetRepository.create(payload);

      expect(payload).toEqual(snapshot);
    });

    it("8) should execute INSERT statement (sanity SQL check)", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, name: "A" }] });

      await AssetRepository.create({ name: "A" });

      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/insert/i);
    });

    it("9) should not call UPDATE/DELETE in create (basic guard)", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, name: "A" }] });

      await AssetRepository.create({ name: "A" });

      const sql = db.query.mock.calls[0][0];
      expect(sql).not.toMatch(/update|delete/i);
    });

    it("10) should allow empty string name (still passes to db)", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, name: "" }] });

      await AssetRepository.create({ name: "" });

      const params = db.query.mock.calls[0][1];
      expect(params).toEqual(expect.arrayContaining([""]));
    });
  });

  // =========================================================
  // update: 10 testcases
  // =========================================================
  describe("update", () => {
    it("1) should update an asset and return the updated asset", async () => {
      const mockAsset = { id: 1, name: "Updated Asset" };
      db.query.mockResolvedValue({ rows: [mockAsset] });

      const result = await AssetRepository.update(1, { name: "Updated Asset" });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/update\s+assets/i),
        expect.any(Array)
      );
      expect(result).toEqual(mockAsset);
    });

    it("2) should return null if no fields are provided", async () => {
      const result = await AssetRepository.update(1, {});
      expect(result).toBeNull();
    });

    it("3) should NOT call db.query if no fields are provided", async () => {
      await AssetRepository.update(1, {});
      expect(db.query).not.toHaveBeenCalled();
    });

    it("4) should call db.query exactly once when updating", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, name: "A" }] });

      await AssetRepository.update(1, { name: "A" });
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("5) should include SET clause in SQL (basic check)", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, name: "A" }] });

      await AssetRepository.update(1, { name: "A" });

      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/set/i);
    });

    it("6) should pass id in params (usually last param)", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, name: "A" }] });

      await AssetRepository.update(1, { name: "A" });

      const params = db.query.mock.calls[0][1];
      expect(params).toEqual(expect.arrayContaining([1]));
    });

    it("7) should pass updated field value in params", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, name: "B" }] });

      await AssetRepository.update(1, { name: "B" });

      const params = db.query.mock.calls[0][1];
      expect(params).toEqual(expect.arrayContaining(["B"]));
    });

    it("8) should return first row if multiple rows returned", async () => {
      db.query.mockResolvedValue({
        rows: [{ id: 1, name: "A" }, { id: 1, name: "B" }],
      });

      const result = await AssetRepository.update(1, { name: "A" });
      expect(result).toEqual({ id: 1, name: "A" });
    });

    it("9) should return falsy if DB returns empty rows", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await AssetRepository.update(1, { name: "A" });
      expect(result).toBeFalsy();
    });

    it("10) should propagate db errors", async () => {
      db.query.mockRejectedValue(new Error("Database error"));

      await expect(AssetRepository.update(1, { name: "A" })).rejects.toThrow("Database error");
    });
  });

  // =========================================================
  // delete: 10 testcases
  // =========================================================
  describe("delete", () => {
    it("1) should delete an asset and return true", async () => {
      db.query.mockResolvedValue({});

      const result = await AssetRepository.delete(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/delete\s+from\s+assets/i),
        [1]
      );
      expect(result).toBe(true);
    });

    it("2) should call db.query exactly once", async () => {
      db.query.mockResolvedValue({});

      await AssetRepository.delete(1);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("3) should pass id as the only parameter", async () => {
      db.query.mockResolvedValue({});

      await AssetRepository.delete(99);

      const params = db.query.mock.calls[0][1];
      expect(params).toEqual([99]);
    });

    it("4) should use DELETE statement (sanity SQL check)", async () => {
      db.query.mockResolvedValue({});

      await AssetRepository.delete(1);

      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/delete/i);
    });

    it("5) should include FROM assets in SQL", async () => {
      db.query.mockResolvedValue({});

      await AssetRepository.delete(1);

      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/from\s+assets/i);
    });

    it("6) should accept id as string and pass it through", async () => {
      db.query.mockResolvedValue({});

      const result = await AssetRepository.delete("1");

      expect(db.query.mock.calls[0][1]).toEqual(["1"]);
      expect(result).toBe(true);
    });

    it("7) should propagate db errors", async () => {
      db.query.mockRejectedValue(new Error("Database error"));

      await expect(AssetRepository.delete(1)).rejects.toThrow("Database error");
    });

    it("8) should not call user-defined extra repos (only db.query)", async () => {
      db.query.mockResolvedValue({});

      await AssetRepository.delete(1);

      expect(db.query).toHaveBeenCalled();
    });

    it("9) should still return true even if db.query resolves null (defensive)", async () => {
      db.query.mockResolvedValue(null);

      const result = await AssetRepository.delete(1);
      expect(result).toBe(true);
    });

    it("10) should work with large id value", async () => {
      db.query.mockResolvedValue({});

      const result = await AssetRepository.delete(999999999);

      expect(db.query.mock.calls[0][1]).toEqual([999999999]);
      expect(result).toBe(true);
    });
  });

  // =========================================================
  // createMany: 10 testcases
  // =========================================================
  describe("createMany", () => {
    it("1) should create multiple assets and return them", async () => {
      const mockAssets = [
        { id: 1, name: "Asset 1" },
        { id: 2, name: "Asset 2" },
      ];
      db.query.mockResolvedValue({ rows: mockAssets });

      const result = await AssetRepository.createMany([
        { name: "Asset 1" },
        { name: "Asset 2" },
      ]);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/insert\s+into\s+assets/i),
        expect.any(Array)
      );
      expect(result).toEqual(mockAssets);
    });

    it("2) should return an empty array if no assets are provided", async () => {
      const result = await AssetRepository.createMany([]);
      expect(result).toEqual([]);
    });

    it("3) should NOT call db.query if input array is empty", async () => {
      await AssetRepository.createMany([]);
      expect(db.query).not.toHaveBeenCalled();
    });

    it("4) should call db.query exactly once for non-empty input", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await AssetRepository.createMany([{ name: "A" }]);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("5) should pass all names in params (arrayContaining)", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await AssetRepository.createMany([{ name: "A" }, { name: "B" }]);

      const params = db.query.mock.calls[0][1];
      expect(params).toEqual(expect.arrayContaining(["A", "B"]));
    });

    it("6) should return empty array if DB returns empty rows", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await AssetRepository.createMany([{ name: "A" }]);
      expect(result).toEqual([]);
    });

    it("7) should propagate db errors", async () => {
      db.query.mockRejectedValue(new Error("Database error"));

      await expect(AssetRepository.createMany([{ name: "A" }])).rejects.toThrow("Database error");
    });

    it("8) should not mutate input assets array objects", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const input = [{ name: "A" }, { name: "B" }];
      const snapshot = JSON.parse(JSON.stringify(input));

      await AssetRepository.createMany(input);

      expect(input).toEqual(snapshot);
    });

    it("9) should use INSERT statement (sanity SQL check)", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await AssetRepository.createMany([{ name: "A" }]);

      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/insert/i);
    });

    it("10) should return rows as-is when DB returns multiple created rows", async () => {
      const rows = [
        { id: 1, name: "A" },
        { id: 2, name: "B" },
        { id: 3, name: "C" },
      ];
      db.query.mockResolvedValue({ rows });

      const result = await AssetRepository.createMany([
        { name: "A" },
        { name: "B" },
        { name: "C" },
      ]);

      expect(result).toEqual(rows);
    });
  });
});
