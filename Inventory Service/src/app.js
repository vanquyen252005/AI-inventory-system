// src/app.js
const express = require("express");
const cors = require("cors");
const assetRoutes = require("./routes/assetRoutes");
const scanRoutes = require("./routes/scanRoutes");
const reportRoutes = require("./routes/reportRoutes");
const { logger } = require("./middleware/logger");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(logger);

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

