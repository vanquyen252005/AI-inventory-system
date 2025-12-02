// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet"); // Bảo mật Header
const logger = require("./config/logger"); // Logger
const apiLimiter = require("./middleware/rateLimiter"); // Rate limit
const { metricsMiddleware, metricsEndpoint } = require("./middleware/monitoring"); // Monitoring
const deprecationWarning = require("./middleware/deprecation"); // Middleware cảnh báo
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");
// Import Routes
const assetRoutes = require("./routes/assetRoutes");
const scanRoutes = require("./routes/scanRoutes"); // Route v1 (Cũ)
const scanRoutesV2 = require("./routes/v2_scanRoutes"); // Route v2 (Mới)
const reportRoutes = require("./routes/reportRoutes");
const path = require("path");
const app = express();

// 1. Security Headers (Bảo mật)
app.use(helmet());

// 2. CORS
app.use(cors());

// 3. Rate Limiting (Bảo vệ)
app.use(apiLimiter);

// 4. Monitoring (Quan sát)
app.use(metricsMiddleware);

// 5. Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
// 6. Request Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes Metrics
app.get('/metrics', metricsEndpoint);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
// --- CHIẾN LƯỢC VERSIONING (QUAN TRỌNG) ---

// Group 1: API v1 (Sắp bỏ - Deprecated)
// Logic: Ai gọi vào /api/v1 sẽ bị dính middleware cảnh báo Warning ở Header
const v1Router = express.Router();
v1Router.use(deprecationWarning); 

// Mount các route cũ vào v1
v1Router.use("/", assetRoutes);
v1Router.use("/", scanRoutes); // /api/v1/scans -> Trả về cấu trúc cũ
v1Router.use("/", reportRoutes);

app.use("/api/v1", v1Router);


// Group 2: API v2 (Hiện đại - Modern)
// Logic: /api/v2 dùng code xử lý mới (v2_scanRoutes)
const v2Router = express.Router();
v2Router.use("/", scanRoutesV2); // /api/v2/scans -> Trả về cấu trúc mới
// Với các route chưa kịp nâng cấp (như asset, report), ta có thể tạm thời tái sử dụng logic cũ
// hoặc để trống chờ nâng cấp sau.
v2Router.use("/", assetRoutes); 
v2Router.use("/", reportRoutes);

app.use("/api/v2", v2Router);


// Group 3: Backward Compatibility (Tương thích ngược)
// Logic: Giữ nguyên các đường dẫn gốc (không có /api/v...) để Front-end hiện tại không bị chết
// Khi nào Front-end sửa xong thì xóa đoạn này đi.
app.use("/", assetRoutes);
app.use("/", scanRoutes);
app.use("/", reportRoutes);


// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Dùng logger ghi lỗi thay vì console.error
  logger.error(err.message, { stack: err.stack });
  
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    message: err.message || "Internal server error",
  });
});

module.exports = app;