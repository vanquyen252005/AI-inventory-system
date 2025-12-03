const assetRepository = require("../repositories/assetRepository");

async function getAllAssets(filters = {}) {
  // 1. Tính toán phân trang tại Service
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;

  // 2. Gọi findAll mới (trả về cả assets và total)
  // Truyền thêm limit và offset xuống repo
  const { assets, total } = await assetRepository.findAll({ 
    ...filters, 
    limit, 
    offset 
  });

  // 3. Trả về cấu trúc chuẩn cho Controller
  return {
    assets,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

async function getAssetById(id) {
  const asset = await assetRepository.findById(id);
  if (!asset) {
    throw new Error("Asset not found");
  }
  return asset;
}

async function createAsset(assetData) {
  // 4. Bỏ logic tự sinh ID (AST-001...)
  // Database đã tự sinh UUID rồi.
  
  return await assetRepository.create(assetData);
}

async function updateAsset(id, assetData) {
  const existing = await assetRepository.findById(id);
  if (!existing) {
    throw new Error("Asset not found");
  }

  return await assetRepository.update(id, assetData);
}

async function deleteAsset(id) {
  const existing = await assetRepository.findById(id);
  if (!existing) {
    throw new Error("Asset not found");
  }

  // 5. Đổi tên hàm từ .remove() thành .delete() cho khớp với Repository
  return await assetRepository.delete(id);
}
async function createBulkAssets(assetsData) {
  return await assetRepository.createMany(assetsData);
}
module.exports = {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  createBulkAssets,
};