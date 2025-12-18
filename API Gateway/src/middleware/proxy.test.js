const { createServiceProxy, authServiceProxy, inventoryServiceProxy, aiScanServiceProxy } = require("./proxy");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { services } = require("../config/env");

jest.mock("http-proxy-middleware", () => ({
  createProxyMiddleware: jest.fn(() => jest.fn()),
}));

describe("createServiceProxy", () => {
  it("should create a proxy middleware with the correct options", () => {
    const target = "http://example.com";
    const options = { pathRewrite: { "^/api/test": "/test" } };

    createServiceProxy(target, options);

    expect(createProxyMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({
        target,
        changeOrigin: true,
        pathRewrite: options.pathRewrite,
        preserveHeaderKeyCase: true,
      })
    );
  });

  it("should handle proxy request logging", () => {
    const target = "http://example.com";
    const middleware = createServiceProxy(target);

    const req = { method: "GET", originalUrl: "/api/test", path: "/test" };
    const proxyReq = {};
    const res = {};

    const options = createProxyMiddleware.mock.calls[0][0];
    options.onProxyReq(proxyReq, req, res);

    expect(console.log).toHaveBeenCalledWith(
      `[Proxy] GET /api/test -> http://example.com/test`
    );
  });

  it("should handle proxy response logging", () => {
    const target = "http://example.com";
    const middleware = createServiceProxy(target);

    const req = { method: "GET", originalUrl: "/api/test" };
    const proxyRes = { statusCode: 200 };
    const res = {};

    const options = createProxyMiddleware.mock.calls[0][0];
    options.onProxyRes(proxyRes, req, res);

    expect(console.log).toHaveBeenCalledWith(
      `[Proxy] GET /api/test <- 200`
    );
  });

  it("should handle proxy errors", () => {
    const target = "http://example.com";
    const middleware = createServiceProxy(target);

    const req = { method: "GET", originalUrl: "/api/test" };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), headersSent: false };
    const err = new Error("Test error");

    const options = createProxyMiddleware.mock.calls[0][0];
    options.onError(err, req, res);

    expect(console.error).toHaveBeenCalledWith(
      `[Proxy Error] GET /api/test:`, "Test error"
    );
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      message: "Service unavailable",
      error: "Test error",
    });
  });
});

describe("Pre-configured proxies", () => {
  it("should configure authServiceProxy correctly", () => {
    expect(createProxyMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({
        target: services.auth,
        pathRewrite: { "^/api/auth": "/auth" },
      })
    );
  });

  it("should configure inventoryServiceProxy correctly", () => {
    expect(createProxyMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({
        target: services.inventory,
        pathRewrite: { "^/api/inventory": "" },
      })
    );
  });

  it("should configure aiScanServiceProxy correctly", () => {
    expect(createProxyMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({
        target: services.aiScan,
        pathRewrite: { "^/api/ai-scan": "" },
      })
    );
  });
});