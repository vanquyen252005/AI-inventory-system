// src/config/env.js
require("dotenv").config();

const config = {
  port: process.env.PORT || 4000,
  accessSecret: process.env.JWT_ACCESS_SECRET || "access_secret",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "refresh_secret",
  accessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
  refreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
};

module.exports = config;
