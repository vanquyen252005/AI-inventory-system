// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10000, // Giới hạn mỗi IP chỉ được gửi 100 requests trong 15 phút
  standardHeaders: true, // Trả về thông tin rate limit trong headers `RateLimit-*`
  legacyHeaders: false, // Tắt headers `X-RateLimit-*` cũ
  message: {
    status: 429,
    message: "Too many requests, please try again later."
  }
});

module.exports = apiLimiter;