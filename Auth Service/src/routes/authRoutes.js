// src/routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const { authGuard } = require("../middleware/authGuard");

// --- SWAGGER SCHEMAS ---

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User ID (UUID)
 *         email:
 *           type: string
 *           format: email
 *         fullName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *     RegisterInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - fullName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: "123456"
 *         fullName:
 *           type: string
 *           example: "Nguyen Van A"
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: "123456"
 *     TokenResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *     RefreshTokenInput:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: API xác thực và quản lý phiên đăng nhập
 */

// --- ROUTES ---

/**
 * @swagger
 * /auth:
 *   get:
 *     summary: Health Check Auth Service
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Service hoạt động tốt
 */
router.get("/", (req, res) => {
  return res.json({ service: "auth-service", status: "ok" });
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       409:
 *         description: Email đã tồn tại
 */
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    const result = await authService.register({ email, password, fullName });
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về Access Token và Refresh Token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: Sai email hoặc mật khẩu
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Cấp lại Access Token mới (Refresh Token)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenInput'
 *     responses:
 *       200:
 *         description: Cấp lại token thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Refresh Token không hợp lệ hoặc hết hạn
 */
router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh({ refreshToken });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất (Thu hồi Refresh Token)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenInput'
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post("/logout", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout({ refreshToken });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin cá nhân (Profile)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng hiện tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Chưa đăng nhập hoặc Token hết hạn
 */
router.get("/me", authGuard(), async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const result = await authService.getProfile({ userId });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});
router.post("/login/google", async (req, res, next) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ message: "Thiếu Access Token" });

    const result = await authService.loginWithGoogle(accessToken);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;