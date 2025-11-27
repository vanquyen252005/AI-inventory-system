// src/config/env.js
require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_ACCESS_SECRET || "access_secret",
  
  // Service URLs
  services: {
    auth: process.env.AUTH_SERVICE_URL || "http://localhost:4000",
    inventory: process.env.INVENTORY_SERVICE_URL || "http://localhost:4001",
    aiScan: process.env.AI_SCAN_SERVICE_URL || "http://localhost:5000",
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  },
};

