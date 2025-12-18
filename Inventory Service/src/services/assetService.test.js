// src/services/assetService.test.js
const assetRepository = require("../repositories/assetRepository");

jest.mock("../repositories/assetRepository", () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createMany: jest.fn(),
}));

// ⚠️ chỉnh path này cho đúng file service của bạn
const {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  createBulkAssets,
} = require("./assetService");

describe("assetService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================
  // getAllAssets: 10 testcases
  // =========================================================
  describe("getAllAssets", () => {
    it("1) should use default page=1, limit=10 when filters empty", async () => {
      assetRepository.findAll.mockResolvedValue({ assets: [], total: 0 });

      const res = await getAllAssets();

      expect(assetRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 0 })
      );
      expect(res.page).toBe(1);
      expect(res.limit).toBe(10);
      expect(res.totalPages).toBe(0);
    });

    it("2) should compute offset correctly from page & limit", async () => {
      assetRepository.findAll.mockResolvedValue({ assets: [], total: 0 });

      await getAllAssets({ page: 3, limit: 20 });

      expect(assetRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20, offset: 40 })
      );
    });

    it("3) should parse page & limit from string", async () => {
      assetRepository.findAll.mockResolvedValue({ assets: [], total: 0 });

      const res = await getAllAssets({ page: "2", limit: "5" });

      expect(assetRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5, offset: 5 })
      );
      expect(res.page).toBe(2);
      expect(res.limit).toBe(5);
    });

    it("4) should include original filters when calling repo", async () => {
      assetRepository.findAll.mockResolvedValue({ assets: [], total: 0 });

      await getAllAssets({ search: "chair", status: "ACTIVE", page: 1, limit: 10 });

      expect(assetRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: "chair", status: "ACTIVE", limit: 10, offset: 0 })
      );
    });

    it("5) should return assets & total from repo", async () => {
      const mockAssets = [{ id: 1 }, { id: 2 }];
      assetRepository.findAll.mockResolvedValue({ assets: mockAssets, total: 2 });

      const res = await getAllAssets({ page: 1, limit: 10 });

      expect(res.assets).toEqual(mockAssets);
      expect(res.total).toBe(2);
    });

    it("6) should compute totalPages using Math.ceil(total/limit)", async () => {
      assetRepository.findAll.mockResolvedValue({ assets: [], total: 21 });

      const res = await getAllAssets({ page: 1, limit: 10 });

      expect(res.totalPages).toBe(3); // ceil(21/10)=3
    });

    it("7) should compute totalPages=0 when total=0", async () => {
      assetRepository.findAll.mockResolvedValue({ assets: [], total: 0 });

      const res = await getAllAssets({ page: 1, limit: 10 });

      expect(res.totalPages).toBe(0);
    });

    it("8) should treat invalid page as default 1", async () => {
      assetRepository.findAll.mockResolvedValue({ assets: [], total: 0 });

      const res = await getAllAssets({ page: "abc", limit: 10 });

      expect(res.page).toBe(1);
      expect(assetRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 0 })
      );
    });

    it("9) should treat invalid limit as default 10", async () => {
      assetRepository.findAll.mockResolvedValue({ assets: [], total: 0 });

      const res = await getAllAssets({ page: 2, limit: "abc" });

      expect(res.limit).toBe(10);
      expect(assetRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 10 })
      );
    });

    it("10) should propagate errors from repository.findAll", async () => {
      assetRepository.findAll.mockRejectedValue(new Error("DB error"));

      await expect(getAllAssets({ page: 1, limit: 10 })).rejects.toThrow("DB error");
    });
  });

  // =========================================================
  // getAssetById: 10 testcases
  // =========================================================
  describe("getAssetById", () => {
    it("1) should return asset when found", async () => {
      assetRepository.findById.mockResolvedValue({ id: 1, name: "A" });

      const res = await getAssetById(1);

      expect(res).toEqual({ id: 1, name: "A" });
    });

    it("2) should throw 'Asset not found' when repo returns null", async () => {
      assetRepository.findById.mockResolvedValue(null);

      await expect(getAssetById(999)).rejects.toThrow("Asset not found");
    });

    it("3) should call findById with provided id", async () => {
      assetRepository.findById.mockResolvedValue(null);

      await expect(getAssetById(123)).rejects.toThrow("Asset not found");
      expect(assetRepository.findById).toHaveBeenCalledWith(123);
    });

    it("4) should call findById exactly once", async () => {
      assetRepository.findById.mockResolvedValue({ id: 1 });

      await getAssetById(1);
      expect(assetRepository.findById).toHaveBeenCalledTimes(1);
    });

    it("5) should accept id as string and pass through", async () => {
      assetRepository.findById.mockResolvedValue({ id: "1" });

      const res = await getAssetById("1");

      expect(assetRepository.findById).toHaveBeenCalledWith("1");
      expect(res).toEqual({ id: "1" });
    });

    it("6) should throw when repo returns undefined", async () => {
      assetRepository.findById.mockResolvedValue(undefined);

      await expect(getAssetById(1)).rejects.toThrow("Asset not found");
    });

    it("7) should propagate errors from repository.findById", async () => {
      assetRepository.findById.mockRejectedValue(new Error("DB fail"));

      await expect(getAssetById(1)).rejects.toThrow("DB fail");
    });

    it("8) should not call other repository methods", async () => {
      assetRepository.findById.mockResolvedValue({ id: 1 });

      await getAssetById(1);

      expect(assetRepository.findAll).not.toHaveBeenCalled();
      expect(assetRepository.create).not.toHaveBeenCalled();
      expect(assetRepository.update).not.toHaveBeenCalled();
      expect(assetRepository.delete).not.toHaveBeenCalled();
      expect(assetRepository.createMany).not.toHaveBeenCalled();
    });

    it("9) should return the exact object from repo (no mapping)", async () => {
      const asset = { id: 1, foo: "bar" };
      assetRepository.findById.mockResolvedValue(asset);

      const res = await getAssetById(1);
      expect(res).toBe(asset);
    });

    it("10) should not mutate returned asset", async () => {
      const asset = { id: 1, name: "A" };
      assetRepository.findById.mockResolvedValue(asset);

      const res = await getAssetById(1);
      expect(res).toEqual({ id: 1, name: "A" });
      expect(asset).toEqual({ id: 1, name: "A" });
    });
  });

  // =========================================================
  // createAsset: 10 testcases
  // =========================================================
  describe("createAsset", () => {
    it("1) should call repository.create with assetData", async () => {
      assetRepository.create.mockResolvedValue({ id: 1 });

      await createAsset({ name: "A" });

      expect(assetRepository.create).toHaveBeenCalledWith({ name: "A" });
    });

    it("2) should return created asset from repo", async () => {
      const created = { id: 1, name: "A" };
      assetRepository.create.mockResolvedValue(created);

      const res = await createAsset({ name: "A" });

      expect(res).toEqual(created);
    });

    it("3) should call repository.create exactly once", async () => {
      assetRepository.create.mockResolvedValue({ id: 1 });

      await createAsset({ name: "A" });
      expect(assetRepository.create).toHaveBeenCalledTimes(1);
    });

    it("4) should allow empty payload object", async () => {
      assetRepository.create.mockResolvedValue({ id: 1 });

      await createAsset({});
      expect(assetRepository.create).toHaveBeenCalledWith({});
    });

    it("5) should allow extra fields in payload", async () => {
      assetRepository.create.mockResolvedValue({ id: 1 });

      await createAsset({ name: "A", status: "ACTIVE", price: 100 });
      expect(assetRepository.create).toHaveBeenCalledWith({
        name: "A",
        status: "ACTIVE",
        price: 100,
      });
    });

    it("6) should not call findById before creating", async () => {
      assetRepository.create.mockResolvedValue({ id: 1 });

      await createAsset({ name: "A" });
      expect(assetRepository.findById).not.toHaveBeenCalled();
    });

    it("7) should propagate errors from repository.create", async () => {
      assetRepository.create.mockRejectedValue(new Error("create failed"));

      await expect(createAsset({ name: "A" })).rejects.toThrow("create failed");
    });

    it("8) should not mutate input payload", async () => {
      assetRepository.create.mockResolvedValue({ id: 1 });

      const payload = { name: "A" };
      const snapshot = { ...payload };

      await createAsset(payload);
      expect(payload).toEqual(snapshot);
    });

    it("9) should accept null assetData (passes through)", async () => {
      assetRepository.create.mockResolvedValue({ id: 1 });

      await createAsset(null);
      expect(assetRepository.create).toHaveBeenCalledWith(null);
    });

    it("10) should return falsy if repository returns undefined", async () => {
      assetRepository.create.mockResolvedValue(undefined);

      const res = await createAsset({ name: "A" });
      expect(res).toBeUndefined();
    });
  });

  // =========================================================
  // updateAsset: 10 testcases
  // =========================================================
  describe("updateAsset", () => {
    it("1) should throw 'Asset not found' if asset does not exist", async () => {
      assetRepository.findById.mockResolvedValue(null);

      await expect(updateAsset(1, { name: "X" })).rejects.toThrow("Asset not found");
    });

    it("2) should call findById before updating", async () => {
      assetRepository.findById.mockResolvedValue(null);

      await expect(updateAsset(1, { name: "X" })).rejects.toThrow("Asset not found");
      expect(assetRepository.findById).toHaveBeenCalledWith(1);
    });

    it("3) should not call update if asset not found", async () => {
      assetRepository.findById.mockResolvedValue(null);

      await expect(updateAsset(1, { name: "X" })).rejects.toThrow("Asset not found");
      expect(assetRepository.update).not.toHaveBeenCalled();
    });

    it("4) should call repository.update when asset exists", async () => {
      assetRepository.findById.mockResolvedValue({ id: 1, name: "A" });
      assetRepository.update.mockResolvedValue({ id: 1, name: "X" });

      await updateAsset(1, { name: "X" });

      expect(assetRepository.update).toHaveBeenCalledWith(1, { name: "X" });
    });

    it("5) should return updated asset from repo", async () => {
      assetRepository.findById.mockResolvedValue({ id: 1, name: "A" });
      assetRepository.update.mockResolvedValue({ id: 1, name: "X" });

      const res = await updateAsset(1, { name: "X" });

      expect(res).toEqual({ id: 1, name: "X" });
    });

    it("6) should call findById exactly once", async () => {
      assetRepository.findById.mockResolvedValue({ id: 1 });
      assetRepository.update.mockResolvedValue({ id: 1 });

      await updateAsset(1, { name: "X" });

      expect(assetRepository.findById).toHaveBeenCalledTimes(1);
    });

    it("7) should call update exactly once", async () => {
      assetRepository.findById.mockResolvedValue({ id: 1 });
      assetRepository.update.mockResolvedValue({ id: 1 });

      await updateAsset(1, { name: "X" });

      expect(assetRepository.update).toHaveBeenCalledTimes(1);
    });

    it("8) should propagate errors from findById", async () => {
      assetRepository.findById.mockRejectedValue(new Error("db fail"));

      await expect(updateAsset(1, { name: "X" })).rejects.toThrow("db fail");
    });

    it("9) should propagate errors from update", async () => {
      assetRepository.findById.mockResolvedValue({ id: 1 });
      assetRepository.update.mockRejectedValue(new Error("update fail"));

      await expect(updateAsset(1, { name: "X" })).rejects.toThrow("update fail");
    });

    it("10) should not mutate assetData input", async () => {
      assetRepository.findById.mockResolvedValue({ id: 1 });
      assetRepository.update.mockResolvedValue({ id: 1 });

      const payload = { name: "X" };
      const snapshot = { ...payload };

      await updateAsset(1, payload);

      expect(payload).toEqual(snapshot);
    });
  });

  // =========================================================
  // deleteAsset: 10 testcases
  // =========================================================
  describe("deleteAsset", () => {
    it("1) should throw 'Asset not found' if asset does not exist", async () => {
      assetRepository.findById.mockResolvedValue(null);

      await expect(deleteAsset(1)).rejects.toThrow("Asset not found");
    });

    it("2) should call findById before delete", async () => {
      assetRepository.findById.mockResolvedValue(null);

      await expect(deleteAsset(1)).rejects.toThrow("Asset not found");
      expect(assetRepository.findById).toHaveBeenCalledWith(1);
    });

    it("3) should not call delete if asset not found", async () => {
      assetRepository.findById.mockResolvedValue(null);

      await expect(deleteAsset(1)).rejects.toThrow("Asset not found");
      expect(assetRepository.delete).not.toHaveBeenCalled();
    });

    it("4) should call repository.delete when asset exists", async () => {
      assetRepository.findById.mockResolvedValue({ id: 1 });
      assetRepository.delete.mockResolvedValue(true);

      await deleteAsset(1);

      expect(assetRepository.delete).toHaveBeenCalledWith(1);
    });

    it("5) should return repository.delete result", async () => {
      assetRepository.findById.mockResolvedValue({ id: 1 });
      assetRepository.delete.mockResolvedValue(true);

      const res = await deleteAsset(1);
      expect(res).toBe(true);
    });

    it("6) should call findById exactly once", async () => {
      assetRepository.findById.mockResolvedValue({ id: 1 });
      assetRepository.delete.mockResolvedValue(true);

      await deleteAsset(1);

      expect(assetRepository.findById).toHaveBeenCalledTimes(1);
    });

    it("7) should call delete exactly once", async () => {
      assetRepository.findById.mockResolvedValue({ id: 1 });
      assetRepository.delete.mockResolvedValue(true);

      await deleteAsset(1);

      expect(assetRepository.delete).toHaveBeenCalledTimes(1);
    });

    it("8) should propagate errors from findById", async () => {
      assetRepository.findById.mockRejectedValue(new Error("db fail"));

      await expect(deleteAsset(1)).rejects.toThrow("db fail");
    });

    it("9) should propagate errors from delete", async () => {
      assetRepository.findById.mockResolvedValue({ id: 1 });
      assetRepository.delete.mockRejectedValue(new Error("delete fail"));

      await expect(deleteAsset(1)).rejects.toThrow("delete fail");
    });

    it("10) should accept id as string and pass through", async () => {
      assetRepository.findById.mockResolvedValue({ id: "1" });
      assetRepository.delete.mockResolvedValue(true);

      await deleteAsset("1");

      expect(assetRepository.findById).toHaveBeenCalledWith("1");
      expect(assetRepository.delete).toHaveBeenCalledWith("1");
    });
  });

  // =========================================================
  // createBulkAssets: 10 testcases
  // =========================================================
  describe("createBulkAssets", () => {
    it("1) should call repository.createMany with assetsData", async () => {
      assetRepository.createMany.mockResolvedValue([{ id: 1 }]);

      await createBulkAssets([{ name: "A" }]);

      expect(assetRepository.createMany).toHaveBeenCalledWith([{ name: "A" }]);
    });

    it("2) should return created rows from repo", async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      assetRepository.createMany.mockResolvedValue(rows);

      const res = await createBulkAssets([{ name: "A" }, { name: "B" }]);

      expect(res).toEqual(rows);
    });

    it("3) should call createMany exactly once", async () => {
      assetRepository.createMany.mockResolvedValue([]);

      await createBulkAssets([{ name: "A" }]);
      expect(assetRepository.createMany).toHaveBeenCalledTimes(1);
    });

    it("4) should accept empty array", async () => {
      assetRepository.createMany.mockResolvedValue([]);

      const res = await createBulkAssets([]);
      expect(assetRepository.createMany).toHaveBeenCalledWith([]);
      expect(res).toEqual([]);
    });

    it("5) should accept undefined (passes through)", async () => {
      assetRepository.createMany.mockResolvedValue([]);

      await createBulkAssets(undefined);
      expect(assetRepository.createMany).toHaveBeenCalledWith(undefined);
    });

    it("6) should propagate errors from createMany", async () => {
      assetRepository.createMany.mockRejectedValue(new Error("bulk fail"));

      await expect(createBulkAssets([{ name: "A" }])).rejects.toThrow("bulk fail");
    });

    it("7) should not call findAll/findById/update/delete", async () => {
      assetRepository.createMany.mockResolvedValue([]);

      await createBulkAssets([{ name: "A" }]);

      expect(assetRepository.findAll).not.toHaveBeenCalled();
      expect(assetRepository.findById).not.toHaveBeenCalled();
      expect(assetRepository.update).not.toHaveBeenCalled();
      expect(assetRepository.delete).not.toHaveBeenCalled();
      expect(assetRepository.create).not.toHaveBeenCalled();
    });

    it("8) should not mutate input array", async () => {
      assetRepository.createMany.mockResolvedValue([]);

      const input = [{ name: "A" }, { name: "B" }];
      const snapshot = JSON.parse(JSON.stringify(input));

      await createBulkAssets(input);

      expect(input).toEqual(snapshot);
    });

    it("9) should return undefined if repo returns undefined", async () => {
      assetRepository.createMany.mockResolvedValue(undefined);

      const res = await createBulkAssets([{ name: "A" }]);
      expect(res).toBeUndefined();
    });

    it("10) should handle large bulk input", async () => {
      const big = Array.from({ length: 100 }, (_, i) => ({ name: `A${i}` }));
      assetRepository.createMany.mockResolvedValue(big.map((x, i) => ({ id: i + 1, ...x })));

      const res = await createBulkAssets(big);

      expect(assetRepository.createMany).toHaveBeenCalledWith(big);
      expect(res.length).toBe(100);
    });
  });
});
