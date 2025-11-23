// src/services/assetService.js
const assetRepository = require("../repositories/assetRepository");

async function getAllAssets(filters = {}) {
  const assets = await assetRepository.findAll(filters);
  const total = await assetRepository.count(filters);

  return {
    assets,
    total,
    page: filters.page || 1,
    limit: filters.limit || 10,
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
  // Generate asset ID if not provided
  if (!assetData.id) {
    const count = await assetRepository.count();
    assetData.id = `AST-${String(count + 1).padStart(3, "0")}`;
  }

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

  return await assetRepository.remove(id);
}

module.exports = {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
};

