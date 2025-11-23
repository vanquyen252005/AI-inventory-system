// src/routes/scanRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const scanService = require("../services/scanService");
const { authGuard } = require("../middleware/authGuard");
const { uploadPath } = require("../config/env");

// Ensure upload directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `scan-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|mov|avi|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith("video/");

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

// GET /scans - List all scans
router.get("/scans", authGuard(), async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      status: req.query.status,
      assetId: req.query.assetId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      offset: (parseInt(req.query.page) - 1) * (parseInt(req.query.limit) || 10) || 0,
    };

    const result = await scanService.getAllScans(filters);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /scans/:id - Get scan by ID
router.get("/scans/:id", authGuard(), async (req, res, next) => {
  try {
    const scan = await scanService.getScanById(req.params.id);
    return res.json(scan);
  } catch (err) {
    next(err);
  }
});

// POST /scans - Create new scan (with file upload)
router.post("/scans", authGuard(), upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!req.body.assetId) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Asset ID is required" });
    }

    const scanData = {
      assetId: req.body.assetId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      status: "processing",
      userId: req.user.sub,
    };

    const scan = await scanService.createScan(scanData);
    return res.status(201).json(scan);
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
});

// PUT /scans/:id - Update scan
router.put("/scans/:id", authGuard(), async (req, res, next) => {
  try {
    const scan = await scanService.updateScan(req.params.id, req.body);
    return res.json(scan);
  } catch (err) {
    next(err);
  }
});

// DELETE /scans/:id - Delete scan
router.delete("/scans/:id", authGuard(), async (req, res, next) => {
  try {
    // Get scan to delete file
    const scan = await scanService.getScanById(req.params.id);
    
    await scanService.deleteScan(req.params.id);

    // Delete uploaded file if exists
    if (scan && scan.file_path && fs.existsSync(scan.file_path)) {
      fs.unlinkSync(scan.file_path);
    }

    return res.json({ message: "Scan deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// POST /scans/:id/detections - Add detections to scan
router.post("/scans/:id/detections", authGuard(), async (req, res, next) => {
  try {
    const detections = Array.isArray(req.body) ? req.body : [req.body];
    const result = await scanService.addDetections(req.params.id, detections);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

