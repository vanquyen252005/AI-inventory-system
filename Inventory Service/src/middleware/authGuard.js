// src/middleware/authGuard.js

const jwt = require("jsonwebtoken");
const { jwtSecret: accessSecret } = require("../config/env");

function authGuard(requiredRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Missing or invalid Authorization header" });
    }

    const token = authHeader.slice("Bearer ".length);

    try {
      const payload = jwt.verify(token, accessSecret);
      req.user = payload;

      if (requiredRoles.length > 0 && !requiredRoles.includes(payload.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (err) {
      console.error(err);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}

module.exports = {
  authGuard,
};

