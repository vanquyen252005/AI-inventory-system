require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";

// ===== In-memory store (tạm thời) =====
const users = []; // { id, email, passwordHash, fullName, role, createdAt }
let nextId = 1;

const refreshTokens = new Set(); // lưu refresh token hợp lệ

// ===== Helper =====
function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      type: "refresh"
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );
}

function authGuard(requiredRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const token = authHeader.slice("Bearer ".length);

    try {
      const payload = jwt.verify(token, ACCESS_SECRET);
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

// ===== Routes =====
app.get("/", (req, res) => {
  res.json({ service: "auth-service", status: "ok" });
});

// POST /auth/register
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email và password là bắt buộc" });
    }

    const existing = users.find((u) => u.email === email);
    if (existing) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: String(nextId++),
      email,
      passwordHash,
      fullName,
      role: "USER",
      createdAt: new Date().toISOString()
    };
    users.push(user);

    return res.status(201).json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /auth/login
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email và password là bắt buộc" });
    }

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    refreshTokens.add(refreshToken);

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /auth/refresh
app.post("/auth/refresh", (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Missing refreshToken" });
    }

    if (!refreshTokens.has(refreshToken)) {
      return res.status(401).json({ message: "Refresh token không hợp lệ hoặc đã logout" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Refresh token invalid/expired" });
    }

    if (payload.type !== "refresh") {
      return res.status(400).json({ message: "Token không phải refresh token" });
    }

    const user = users.find((u) => u.id === payload.sub);
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    // rotate refresh token
    refreshTokens.delete(refreshToken);
    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);
    refreshTokens.add(newRefreshToken);

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /auth/logout
app.post("/auth/logout", (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Missing refreshToken" });
    }
    refreshTokens.delete(refreshToken);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /auth/me
app.get("/auth/me", authGuard(), (req, res) => {
  try {
    const userId = req.user.sub;
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }
    return res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Auth service listening on port ${PORT}`);
});
