// src/routes/v2_scanRoutes.js
const express = require("express");
const router = express.Router();
const scanService = require("../services/scanService");

// --- API v2: GET All Scans ---
router.get("/scans", async (req, res, next) => {
  try {
    const filters = req.query;
    const result = await scanService.getAllScans(filters);

    // [BREAKING CHANGE LOGIC]
    // Transform dữ liệu từ v1 sang format v2
    const v2Scans = result.scans.map(scan => ({
      scanId: scan.id,            // Đổi tên field: id -> scanId
      assetId: scan.assetId,
      scannedAt: scan.timestamp,  // Đổi tên: timestamp -> scannedAt
      location: scan.location,
      // Bỏ field 'image_url' nếu thấy không cần thiết nữa (Demo bỏ field)
      status: "active"            // Thêm field mới
    }));

    // Cấu trúc trả về thay đổi: Bọc trong "data" và "meta"
    res.json({
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        version: "v2.0"
      },
      data: v2Scans
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;