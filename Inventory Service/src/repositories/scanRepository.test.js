const db = require("../config/db");
const ScanRepository = require("./scanRepository");

jest.mock("../config/db");

describe("ScanRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================
  // findAll: 10 testcases
  // =========================================================
  describe("findAll", () => {
    it("1) should return a list of scans with filters applied", async () => {
      const mockScans = [
        { id: 1, scan_code: "SCAN001", location: "Room 1" },
        { id: 2, scan_code: "SCAN002", location: "Room 2" },
      ];

      db.query.mockResolvedValue({ rows: mockScans });

      const result = await ScanRepository.findAll({ search: "Room", limit: 10, offset: 0 });

      expect(db.query).toHaveBeenCalledWith(expect.stringMatching(/select/i), expect.any(Array));
      expect(result).toEqual(mockScans);
    });

    it("2) should handle empty results", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await ScanRepository.findAll({});

      expect(result).toEqual([]);
    });

    it("3) should call db.query exactly once", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await ScanRepository.findAll({ search: "x", limit: 10, offset: 0 });

      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("4) should pass limit & offset in params when provided", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await ScanRepository.findAll({ search: "Room", limit: 7, offset: 21 });

      const params = db.query.mock.calls[0][1];
      expect(params).toEqual(expect.arrayContaining([7, 21]));
    });

    it("5) should not break when search is empty string", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await ScanRepository.findAll({ search: "", limit: 10, offset: 0 });

      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("6) should still run without any filters object keys", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await ScanRepository.findAll({});

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it("7) should use SELECT statement (sanity SQL check)", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await ScanRepository.findAll({ search: "Room", limit: 10, offset: 0 });

      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/select/i);
    });

    it("8) should not use INSERT/UPDATE/DELETE in findAll (basic guard)", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await ScanRepository.findAll({ search: "Room", limit: 10, offset: 0 });

      const sql = db.query.mock.calls[0][0];
      expect(sql).not.toMatch(/insert|update|delete/i);
    });

    it("9) should return rows as-is (does not mutate)", async () => {
      const rows = [{ id: 1, scan_code: "S1", location: "Room 1" }];
      db.query.mockResolvedValue({ rows });

      const result = await ScanRepository.findAll({ search: "Room", limit: 10, offset: 0 });

      expect(result).toEqual(rows);
      expect(rows[0]).toEqual({ id: 1, scan_code: "S1", location: "Room 1" });
    });

    it("10) should propagate database errors", async () => {
      db.query.mockRejectedValue(new Error("Database error"));

      await expect(
        ScanRepository.findAll({ search: "Room", limit: 10, offset: 0 })
      ).rejects.toThrow("Database error");
    });
  });

  // =========================================================
  // findById: 10 testcases
  // =========================================================
  describe("findById", () => {
    it("1) should return a scan by ID", async () => {
      const mockScan = { id: 1, scan_code: "SCAN001", location: "Room 1" };
      db.query.mockResolvedValue({ rows: [mockScan] });

      const result = await ScanRepository.findById(1);

      expect(db.query).toHaveBeenCalledWith(expect.stringMatching(/select/i), [1]);
      expect(result).toEqual(mockScan);
    });

    it("2) should return null if scan is not found", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await ScanRepository.findById(999);

      expect(result).toBeNull();
    });

    it("3) should call db.query exactly once", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await ScanRepository.findById(1);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("4) should pass id as the only parameter", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await ScanRepository.findById(123);

      expect(db.query.mock.calls[0][1]).toEqual([123]);
    });

    it("5) should include WHERE clause (basic SQL check)", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await ScanRepository.findById(1);

      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/where/i);
    });

    it("6) should return first row if multiple rows returned", async () => {
      db.query.mockResolvedValue({
        rows: [
          { id: 1, scan_code: "SCAN001", location: "A" },
          { id: 1, scan_code: "SCAN001", location: "B" },
        ],
      });

      const result = await ScanRepository.findById(1);
      expect(result).toEqual({ id: 1, scan_code: "SCAN001", location: "A" });
    });

    it("7) should accept id as string and pass it through", async () => {
      db.query.mockResolvedValue({
        rows: [{ id: 1, scan_code: "SCAN001", location: "Room 1" }],
      });

      const result = await ScanRepository.findById("1");
      expect(db.query.mock.calls[0][1]).toEqual(["1"]);
      expect(result).toEqual({ id: 1, scan_code: "SCAN001", location: "Room 1" });
    });

    it("8) should propagate database errors", async () => {
      db.query.mockRejectedValue(new Error("Database error"));

      await expect(ScanRepository.findById(1)).rejects.toThrow("Database error");
    });

    it("9) should not run INSERT/UPDATE/DELETE (basic guard)", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await ScanRepository.findById(1);

      const sql = db.query.mock.calls[0][0];
      expect(sql).not.toMatch(/insert|update|delete/i);
    });

    it("10) should return null if rows is missing (defensive)", async () => {
      db.query.mockResolvedValue({}); // no rows

      const result = await ScanRepository.findById(1);
      expect(result).toBeNull();
    });
  });

  // =========================================================
  // create: 10 testcases
  // =========================================================
  describe("create", () => {
    it("1) should create a new scan and return it", async () => {
      const mockScan = { id: 1, scan_code: "SCAN001", location: "Room 1" };
      db.query.mockResolvedValue({ rows: [mockScan] });

      const result = await ScanRepository.create({ scan_code: "SCAN001", location: "Room 1" });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/insert\s+into\s+scans/i),
        expect.any(Array)
      );
      expect(result).toEqual(mockScan);
    });

    it("2) should call db.query exactly once", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, scan_code: "S", location: "R" }] });

      await ScanRepository.create({ scan_code: "S", location: "R" });
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("3) should include scan_code and location in params (arrayContaining)", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, scan_code: "S", location: "R" }] });

      await ScanRepository.create({ scan_code: "S", location: "R" });

      const params = db.query.mock.calls[0][1];
      expect(params).toEqual(expect.arrayContaining(["S", "R"]));
    });

    it("4) should use INSERT statement (sanity SQL check)", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, scan_code: "S", location: "R" }] });

      await ScanRepository.create({ scan_code: "S", location: "R" });

      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/insert/i);
    });

    it("5) should return first row if multiple rows returned", async () => {
      db.query.mockResolvedValue({
        rows: [
          { id: 1, scan_code: "S1", location: "R1" },
          { id: 2, scan_code: "S2", location: "R2" },
        ],
      });

      const result = await ScanRepository.create({ scan_code: "S1", location: "R1" });
      expect(result).toEqual({ id: 1, scan_code: "S1", location: "R1" });
    });

    it("6) should return falsy if DB returns empty rows", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await ScanRepository.create({ scan_code: "S", location: "R" });
      expect(result).toBeFalsy();
    });

    it("7) should propagate database errors", async () => {
      db.query.mockRejectedValue(new Error("Database error"));

      await expect(ScanRepository.create({ scan_code: "S", location: "R" })).rejects.toThrow(
        "Database error"
      );
    });

    it("8) should not mutate input payload", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, scan_code: "S", location: "R" }] });

      const payload = { scan_code: "S", location: "R" };
      const snapshot = { ...payload };

      await ScanRepository.create(payload);

      expect(payload).toEqual(snapshot);
    });

    it("9) should allow empty location (still passes to db)", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, scan_code: "S", location: "" }] });

      await ScanRepository.create({ scan_code: "S", location: "" });

      const params = db.query.mock.calls[0][1];
      expect(params).toEqual(expect.arrayContaining(["S", ""]));
    });

    it("10) should not use UPDATE/DELETE in create (basic guard)", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, scan_code: "S", location: "R" }] });

      await ScanRepository.create({ scan_code: "S", location: "R" });

      const sql = db.query.mock.calls[0][0];
      expect(sql).not.toMatch(/update|delete/i);
    });
  });

  // =========================================================
  // updateResult: 10 testcases
  // =========================================================
  describe("updateResult", () => {
    it("1) should update a scan's result and return the updated scan", async () => {
      const mockScan = { id: 1, scan_code: "SCAN001", status: "completed" };
      db.query.mockResolvedValue({ rows: [mockScan] });

      const result = await ScanRepository.updateResult(1, "completed", { data: "result" }, 5);

      expect(db.query).toHaveBeenCalledWith(expect.stringMatching(/update\s+scans/i), expect.any(Array));
      expect(result).toEqual(mockScan);
    });

    it("2) should call db.query exactly once", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await ScanRepository.updateResult(1, "completed", { ok: true }, 5);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("3) should include status/result/assetCount/id in params (arrayContaining)", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await ScanRepository.updateResult(1, "completed", { data: "result" }, 5);

      const params = db.query.mock.calls[0][1];
      // có thể result được stringify JSON, nên ta check theo cách mềm:
      expect(params).toEqual(expect.arrayContaining(["completed", 5, 1]));
      expect(params.join(" ")).toEqual(expect.stringContaining("completed"));
    });

    it("4) should use UPDATE statement (sanity SQL check)", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await ScanRepository.updateResult(1, "completed", { data: "result" }, 5);

      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/update/i);
    });

    it("5) should include SET clause in SQL", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await ScanRepository.updateResult(1, "completed", { data: "result" }, 5);

      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/set/i);
    });

    it("6) should include WHERE clause in SQL", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await ScanRepository.updateResult(1, "completed", { data: "result" }, 5);

      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/where/i);
    });

    it("7) should return first row if multiple rows returned", async () => {
      db.query.mockResolvedValue({
        rows: [{ id: 1, status: "completed" }, { id: 1, status: "x" }],
      });

      const result = await ScanRepository.updateResult(1, "completed", { data: "r" }, 5);
      expect(result).toEqual({ id: 1, status: "completed" });
    });

    it("8) should return falsy if DB returns empty rows", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await ScanRepository.updateResult(1, "completed", { data: "r" }, 5);
      expect(result).toBeFalsy();
    });

    it("9) should propagate database errors", async () => {
      db.query.mockRejectedValue(new Error("Database error"));

      await expect(ScanRepository.updateResult(1, "completed", { data: "r" }, 5)).rejects.toThrow(
        "Database error"
      );
    });

    it("10) should not mutate the result object passed in", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const payload = { data: "result" };
      const snapshot = JSON.parse(JSON.stringify(payload));

      await ScanRepository.updateResult(1, "completed", payload, 5);

      expect(payload).toEqual(snapshot);
    });
  });
});
