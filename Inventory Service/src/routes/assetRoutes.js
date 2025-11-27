// src/routes/assetRoutes.js
const express = require("express");
const router = express.Router();
const assetService = require("../services/assetService");
const { authGuard } = require("../middleware/authGuard");

// --- SWAGGER SCHEMAS ---

/**
 * @swagger
 * components:
 *   schemas:
 *     Asset:
 *       type: object
 *       required:
 *         - name
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: ID tự động của tài sản
 *         name:
 *           type: string
 *           description: Tên tài sản
 *         category:
 *           type: string
 *           description: Loại tài sản
 *         status:
 *           type: string
 *           enum: [active, inactive, maintenance, lost]
 *           description: Trạng thái hiện tại
 *         location:
 *           type: string
 *           description: Vị trí đặt tài sản
 *         userId:
 *           type: string
 *           description: ID người tạo
 *         createdAt:
 *           type: string
 *           format: date-time
 *     AssetInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         status:
 *           type: string
 *         location:
 *           type: string
 *         description:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   - name: Assets
 *     description: API quản lý tài sản
 *   - name: System
 *     description: API hệ thống
 */

// --- ROUTES ---

/**
 * @swagger
 * /:
 *   get:
 *     summary: Kiểm tra trạng thái Health Check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service hoạt động bình thường
 */
router.get("/", (req, res) => {
  return res.json({ service: "inventory-service", resource: "assets", status: "ok" });
});

/**
 * @swagger
 * /test-token:
 *   get:
 *     summary: Debug Token (Dev Only)
 *     description: Giải mã token để kiểm tra thông tin
 *     tags: [System]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         description: Bearer Token
 *     responses:
 *       200:
 *         description: Thông tin payload trong token
 *       401:
 *         description: Token lỗi hoặc thiếu
 */
router.get("/test-token", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      error: "No token",
      header: authHeader || "missing"
    });
  }

  const token = authHeader.slice("Bearer ".length);
  const jwt = require("jsonwebtoken");
  const { jwtSecret } = require("../config/env");

  try {
    const payload = jwt.verify(token, jwtSecret);
    return res.json({ 
      success: true, 
      payload,
      secretUsed: jwtSecret ? "***" + jwtSecret.slice(-4) : "NOT SET"
    });
  } catch (err) {
    return res.status(401).json({ 
      error: err.message,
      tokenPreview: token.substring(0, 20) + "...",
      secretUsed: jwtSecret ? "***" + jwtSecret.slice(-4) : "NOT SET"
    });
  }
});

/**
 * @swagger
 * /assets:
 *   get:
 *     summary: Lấy danh sách tài sản (có phân trang & lọc)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo danh mục
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Lọc theo vị trí
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng item mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách tài sản thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Asset'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 */
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

/**
 * @swagger
 * /assets/{id}:
 *   get:
 *     summary: Lấy chi tiết một tài sản
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của tài sản
 *     responses:
 *       200:
 *         description: Thông tin tài sản
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asset'
 *       404:
 *         description: Không tìm thấy tài sản
 */
router.get("/assets/:id", authGuard(), async (req, res, next) => {
  try {
    const asset = await assetService.getAssetById(req.params.id);
    return res.json(asset);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /assets:
 *   post:
 *     summary: Tạo mới một tài sản
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssetInput'
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asset'
 */
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

/**
 * @swagger
 * /assets/{id}:
 *   put:
 *     summary: Cập nhật thông tin tài sản
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssetInput'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/assets/:id", authGuard(), async (req, res, next) => {
  try {
    const asset = await assetService.updateAsset(req.params.id, req.body);
    return res.json(asset);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /assets/{id}:
 *   delete:
 *     summary: Xóa tài sản
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/assets/:id", authGuard(), async (req, res, next) => {
  try {
    await assetService.deleteAsset(req.params.id);
    return res.json({ message: "Asset deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;