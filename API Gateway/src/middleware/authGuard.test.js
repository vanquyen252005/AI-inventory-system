const { authGuard } = require("./authGuard");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

describe("authGuard Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  test("should return 401 if Authorization header is missing and required is true", () => {
    const middleware = authGuard(true);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Missing or invalid Authorization header" });
    expect(next).not.toHaveBeenCalled();
  });

  test("should call next if Authorization header is missing and required is false", () => {
    const middleware = authGuard(false);
    middleware(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test("should return 401 if token is invalid and required is true", () => {
    req.headers["authorization"] = "Bearer invalidtoken";
    const middleware = authGuard(true);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    expect(next).not.toHaveBeenCalled();
  });

  test("should call next if token is invalid and required is false", () => {
    req.headers["authorization"] = "Bearer invalidtoken";
    const middleware = authGuard(false);
    middleware(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test("should call next and set req.user if token is valid", () => {
    const payload = { id: 1, name: "Test User" };
    const token = jwt.sign(payload, jwtSecret);
    req.headers["authorization"] = `Bearer ${token}`;

    const middleware = authGuard(true);
    middleware(req, res, next);

    expect(req.user).toEqual(payload);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});