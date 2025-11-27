// src/routes/index.js
const express = require("express");
const router = express.Router();
const { authServiceProxy, inventoryServiceProxy, aiScanServiceProxy } = require("../middleware/proxy");
const { authGuard } = require("../middleware/authGuard");

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    service: "api-gateway",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

router.get("/", (req, res) => {
  res.json({
    service: "api-gateway",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth/*",
      inventory: "/api/inventory/*",
      aiScan: "/api/ai-scan/*",
    },
  });
});

// Auth Service Routes (no authentication required for login/register)
router.use("/api/auth", authServiceProxy);

// Inventory Service Routes (require authentication)
router.use("/api/inventory", authGuard(true), inventoryServiceProxy);

// Backward compatibility: Direct routes to inventory service
// These routes maintain compatibility with existing frontend
router.use("/api/v1", authGuard(true), inventoryServiceProxy);
router.use("/api/v2", authGuard(true), inventoryServiceProxy);
router.use("/assets", authGuard(true), inventoryServiceProxy);
router.use("/scans", authGuard(true), inventoryServiceProxy);
router.use("/reports", authGuard(true), inventoryServiceProxy);

// AI Scan Service Routes (require authentication)
router.use("/api/ai-scan", authGuard(true), aiScanServiceProxy);

module.exports = router;

