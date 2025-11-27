// src/middleware/monitoring.js
const client = require('prom-client');
const responseTime = require('response-time');

// Tạo Registry để chứa các metrics
const register = new client.Registry();

// Mặc định thu thập các chỉ số của NodeJS (CPU, Memory...)
client.collectDefaultMetrics({ register });

// Tạo custom metric: Đếm số lượng request và thời gian xử lý
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.5, 1, 1.5, 2, 5] // Các mốc thời gian (giây)
});

register.registerMetric(httpRequestDurationMicroseconds);

// Middleware để đo thời gian phản hồi
const metricsMiddleware = responseTime((req, res, time) => {
  if (req.path !== '/metrics') {
    httpRequestDurationMicroseconds.observe(
      {
        method: req.method,
        route: req.path,
        code: res.statusCode
      },
      time / 1000 // Chuyển đổi sang giây
    );
  }
});

module.exports = {
  metricsMiddleware,
  metricsEndpoint: async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  }
};