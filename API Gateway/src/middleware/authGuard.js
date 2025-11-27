// src/middleware/authGuard.js
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

/**
 * Middleware to validate JWT token
 * This validates the token but doesn't block the request - it just adds user info to req.user
 * The actual blocking is done by the route handlers that need authentication
 */
function authGuard(required = false) {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      if (required) {
        return res.status(401).json({ 
          message: "Missing or invalid Authorization header" 
        });
      }
      // If not required, just continue without user info
      return next();
    }

    const token = authHeader.slice("Bearer ".length);

    try {
      const payload = jwt.verify(token, jwtSecret);
      req.user = payload;
      next();
    } catch (err) {
      if (required) {
        return res.status(401).json({ 
          message: "Invalid or expired token" 
        });
      }
      // If not required, continue without user info
      next();
    }
  };
}

module.exports = {
  authGuard,
};

