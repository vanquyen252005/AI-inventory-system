// src/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Format JSON để dễ dàng phân tích sau này
  ),
  defaultMeta: { service: 'inventory-service' },
  transports: [
    // Ghi lỗi ra file riêng
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // Ghi tất cả log ra file combine
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Nếu không phải production, log ra console cho đẹp
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;