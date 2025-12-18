const { logger } = require("./logger");
const { sanitize } = require("./logger");

describe("sanitize function", () => {
  it("should mask password and refreshToken fields", () => {
    const input = { username: "test", password: "secret", refreshToken: "token" };
    const sanitized = sanitize(input);

    expect(sanitized.password).toBe("***");
    expect(sanitized.refreshToken).toBe("***");
    expect(sanitized.username).toBe("test");
  });

  it("should return non-object values unchanged", () => {
    expect(sanitize(null)).toBe(null);
    expect(sanitize("string")).toBe("string");
    expect(sanitize(123)).toBe(123);
  });

  it("should not modify objects without sensitive fields", () => {
    const input = { username: "test" };
    const sanitized = sanitize(input);

    expect(sanitized).toEqual(input);
  });
});

describe("logger middleware", () => {
  let req, res, next, consoleSpy;

  beforeEach(() => {
    req = { method: "GET", originalUrl: "/test", body: { username: "test", password: "secret" } };
    res = { statusCode: 200, json: jest.fn() };
    next = jest.fn();
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should log request and response details", () => {
    const middleware = logger;
    const oldJson = res.json;

    res.json = function (data) {
      oldJson.call(this, data);
    };

    middleware(req, res, next);

    const responseData = { success: true };
    res.json(responseData);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[GET \/test\].*200.*req=.*username.*res=.*success.*/)
    );
    expect(next).toHaveBeenCalled();
  });

  it("should log with red color for 500 status codes", () => {
    res.statusCode = 500;

    const middleware = logger;
    middleware(req, res, next);

    const responseData = { error: "Internal Server Error" };
    res.json(responseData);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\x1b\[31m500\x1b\[0m/)
    );
  });

  it("should log with yellow color for 400 status codes", () => {
    res.statusCode = 400;

    const middleware = logger;
    middleware(req, res, next);

    const responseData = { error: "Bad Request" };
    res.json(responseData);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\x1b\[33m400\x1b\[0m/)
    );
  });

  it("should log with green color for 200 status codes", () => {
    res.statusCode = 200;

    const middleware = logger;
    middleware(req, res, next);

    const responseData = { success: true };
    res.json(responseData);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\x1b\[32m200\x1b\[0m/)
    );
  });
});