// src/middleware/proxy.js
const { createProxyMiddleware } = require("http-proxy-middleware");
const { services } = require("../config/env");

/**
 * Create proxy middleware for a service
 * @param {string} target - Target service URL
 * @param {object} options - Additional proxy options
 */
function createServiceProxy(target, options = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: options.pathRewrite || {},
    // Support file uploads
    preserveHeaderKeyCase: true,
    onProxyReq: (proxyReq, req, res) => {
      // Forward original headers including Authorization
      // The backend services will validate the token themselves
      
      // Log proxy request
      const targetPath = req.path;
      console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${target}${targetPath}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // Log proxy response
      console.log(`[Proxy] ${req.method} ${req.originalUrl} <- ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy Error] ${req.method} ${req.originalUrl}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({
          message: "Service unavailable",
          error: err.message,
        });
      }
    },
    ...options,
  });
}

// Pre-configured proxies for each service
const authServiceProxy = createServiceProxy(services.auth, {
  pathRewrite: {
    "^/api/auth": "/auth", // /api/auth/login -> /auth/login
  },
});

const inventoryServiceProxy = createServiceProxy(services.inventory, {
  pathRewrite: {
    "^/api/inventory": "", // /api/inventory/assets -> /assets
    // /api/v1 and /api/v2 are kept as-is (no rewrite needed)
    // Direct routes like /assets, /scans, /reports are kept as-is
  },
});

const aiScanServiceProxy = createServiceProxy(services.aiScan, {
  pathRewrite: {
    "^/api/ai-scan": "", // Remove /api/ai-scan prefix
  },
});

module.exports = {
  authServiceProxy,
  inventoryServiceProxy,
  aiScanServiceProxy,
  createServiceProxy,
};

