// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet"); // Bảo mật Header
const assetRoutes = require("./routes/assetRoutes");
const scanRoutes = require("./routes/scanRoutes");
const reportRoutes = require("./routes/reportRoutes");
const logger = require("./config/logger"); // Dùng logger mới
const apiLimiter = require("./middleware/rateLimiter"); // Rate limit
const { metricsMiddleware, metricsEndpoint } = require("./middleware/monitoring"); // Monitoring
const app = express();

// 1. Security Headers (Bảo mật)
app.use(helmet());

// 2. CORS
app.use(cors());

// 3. Rate Limiting (Bảo vệ)
// Áp dụng cho tất cả request
app.use(apiLimiter);

// 4. Monitoring (Quan sát)
app.use(metricsMiddleware);

// 5. Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6. Request Logging (Thay thế logger cũ)
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes Metrics (Quan trọng cho Monitoring)
app.get('/metrics', metricsEndpoint);

// Routes
app.use("/", assetRoutes);
app.use("/", scanRoutes);
app.use("/", reportRoutes);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    message: err.message || "Internal server error",
  });
});

module.exports = app;

