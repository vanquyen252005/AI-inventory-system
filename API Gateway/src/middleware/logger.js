// src/middleware/logger.js
const morgan = require("morgan");

// Custom format for logging
const logFormat = ":method :url :status :response-time ms - :res[content-length]";

// Create logger middleware
const logger = morgan(logFormat, {
  skip: (req, res) => {
    // Skip logging for health checks
    return req.path === "/health" || req.path === "/";
  },
});

module.exports = logger;

