// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { cors: corsConfig } = require("./config/env");
const logger = require("./middleware/logger");
const routes = require("./routes");

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors(corsConfig));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(logger);

// Routes
app.use(routes);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Error:", err);
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.path,
  });
});

module.exports = app;

