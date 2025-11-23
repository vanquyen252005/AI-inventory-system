// src/config/env.js
require("dotenv").config();

module.exports = {
  port: process.env.PORT || 4001,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_ACCESS_SECRET || "access_secret",
  uploadPath: process.env.UPLOAD_PATH || "./uploads",
};

