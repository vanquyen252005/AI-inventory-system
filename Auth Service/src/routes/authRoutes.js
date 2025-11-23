// src/routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const { authGuard } = require("../middleware/authGuard");

// Health check
router.get("/", (req, res) => {
  return res.json({ service: "auth-service", status: "ok" });
});

// POST /auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    const result = await authService.register({ email, password, fullName });
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh
router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh({ refreshToken });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post("/logout", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout({ refreshToken });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /auth/me
router.get("/me", authGuard(), (req, res, next) => {
  try {
    const userId = req.user.sub;
    const result = authService.getProfile({ userId });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
