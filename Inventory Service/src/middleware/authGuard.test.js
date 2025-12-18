const { authGuard } = require("./authGuard");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

jest.mock("jsonwebtoken");

describe("authGuard Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it("should return 401 if Authorization header is missing", () => {
    const middleware = authGuard();
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Missing or invalid Authorization header" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if token is invalid", () => {
    req.headers["authorization"] = "Bearer invalidtoken";
    jwt.verify.mockImplementation(() => { throw new Error("Invalid token"); });

    const middleware = authGuard();
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next if token is valid and no roles are required", () => {
    const payload = { id: 1, role: "user" };
    req.headers["authorization"] = "Bearer validtoken";
    jwt.verify.mockReturnValue(payload);

    const middleware = authGuard();
    middleware(req, res, next);

    expect(req.user).toEqual(payload);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should call next if token is valid and role matches", () => {
    const payload = { id: 1, role: "admin" };
    req.headers["authorization"] = "Bearer validtoken";
    jwt.verify.mockReturnValue(payload);

    const middleware = authGuard(["admin"]);
    middleware(req, res, next);

    expect(req.user).toEqual(payload);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should return 403 if token is valid but role does not match", () => {
    const payload = { id: 1, role: "user" };
    req.headers["authorization"] = "Bearer validtoken";
    jwt.verify.mockReturnValue(payload);

    const middleware = authGuard(["admin"]);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    expect(next).not.toHaveBeenCalled();
  });
});