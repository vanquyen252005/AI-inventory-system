// src/middleware/deprecation.js
const deprecationWarning = (req, res, next) => {
  // Thêm header cảnh báo chuẩn HTTP
  // 299 là mã cảnh báo chung
  res.set('Warning', '299 - This API version is deprecated and will be removed in 2025. Please migrate to /api/v2.');
  
  // Có thể thêm link tới document hướng dẫn migration
  res.set('Link', '<http://localhost:3001/docs/migration>; rel="deprecation"');
  
  next();
};

module.exports = deprecationWarning;