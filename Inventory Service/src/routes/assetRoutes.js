// src/routes/assetRoutes.js
const express = require("express");
const router = express.Router();
const assetService = require("../services/assetService");
const { authGuard } = require("../middleware/authGuard");

// Health check
router.get("/", (req, res) => {
  return res.json({ service: "inventory-service", resource: "assets", status: "ok" });
});

// GET /assets - List all assets
router.get("/assets", authGuard(), async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      category: req.query.category,
      status: req.query.status,
      location: req.query.location,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      offset: (parseInt(req.query.page) - 1) * (parseInt(req.query.limit) || 10) || 0,
    };

    const result = await assetService.getAllAssets(filters);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /assets/:id - Get asset by ID
router.get("/assets/:id", authGuard(), async (req, res, next) => {
  try {
    const asset = await assetService.getAssetById(req.params.id);
    return res.json(asset);
  } catch (err) {
    next(err);
  }
});

// POST /assets - Create new asset
router.post("/assets", authGuard(), async (req, res, next) => {
  try {
    const assetData = {
      ...req.body,
      userId: req.user.sub,
    };
    const asset = await assetService.createAsset(assetData);
    return res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
});

// PUT /assets/:id - Update asset
router.put("/assets/:id", authGuard(), async (req, res, next) => {
  try {
    const asset = await assetService.updateAsset(req.params.id, req.body);
    return res.json(asset);
  } catch (err) {
    next(err);
  }
});

// DELETE /assets/:id - Delete asset
router.delete("/assets/:id", authGuard(), async (req, res, next) => {
  try {
    await assetService.deleteAsset(req.params.id);
    return res.json({ message: "Asset deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

