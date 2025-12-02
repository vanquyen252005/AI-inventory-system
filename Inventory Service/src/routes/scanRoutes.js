const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const scanService = require("../services/scanService");
const { authGuard } = require("../middleware/authGuard");
const { uploadPath } = require("../config/env");

// 1. Cấu hình Upload
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Lưu tên file gọn gàng
    cb(null, `scan-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|mov|avi|mkv|jpg|jpeg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) return cb(null, true);
    cb(new Error("Chỉ hỗ trợ file Video hoặc Ảnh!"));
  },
});

// 2. Các Routes

// GET /scans - Lấy danh sách
router.get("/scans", authGuard(), async (req, res, next) => {
  try {
    const result = await scanService.getAllScans(req.query);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /scans/upload - API Upload mới
router.post("/scans/upload", authGuard(), upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Chưa chọn file" });

    const scan = await scanService.createScanRecord({
      filename: req.file.filename,
      path: req.file.path, // Đường dẫn file tương đối hoặc tuyệt đối
      location: req.body.location || "Chưa xác định"
    });
    
    return res.status(201).json(scan);
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
});

// GET /scans/:id - Chi tiết (QUAN TRỌNG: Route này đang bị thiếu/lỗi ở server bạn)
router.get("/scans/:id", authGuard(), async (req, res, next) => {
  try {
    const scan = await scanService.getScanById(req.params.id);
    return res.json(scan);
  } catch (err) {
    next(err);
  }
});

// PUT /scans/:id - Cập nhật kết quả (Giả lập AI)
router.put("/scans/:id", authGuard(), async (req, res, next) => {
  try {
    const { status, result_data } = req.body;
    let deviceCount = 0;
    if (Array.isArray(result_data)) deviceCount = result_data.length;

    const updated = await scanService.updateScanResult(
      req.params.id,
      status,
      JSON.stringify(result_data),
      deviceCount
    );
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;