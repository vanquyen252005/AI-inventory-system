// src/services/authService.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  accessSecret,
  refreshSecret,
  accessExpires,
  refreshExpires,
} = require("../config/env");
const userRepo = require("../repositories/userRepository");

// lưu refresh token hợp lệ
const refreshTokenRepo = require("../repositories/refreshTokenRepository");

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    accessSecret,
    { expiresIn: accessExpires }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      type: "refresh",
    },
    refreshSecret,
    { expiresIn: refreshExpires }
  );
}

async function register({ email, password, fullName }) {
  if (!email || !password) {
    const error = new Error("Email và password là bắt buộc");
    error.statusCode = 400;
    throw error;
  }

  const existing = await userRepo.findByEmail(email);
  if (existing) {
    const error = new Error("Email đã tồn tại");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await userRepo.createUser({
    email,
    passwordHash,
    fullName,
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    createdAt: user.created_at,
  };
}

async function login({ email, password }) {
  if (!email || !password) {
    const error = new Error("Email và password là bắt buộc");
    error.statusCode = 400;
    throw error;
  }

  const user = await userRepo.findByEmail(email);

  if (!user || !user.password_hash) {
    const error = new Error("Email hoặc mật khẩu không đúng");
    error.statusCode = 401;
    throw error;
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const error = new Error("Email hoặc mật khẩu không đúng");
    error.statusCode = 401;
    throw error;
  }

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ id: user.id });
  await refreshTokenRepo.createRefreshToken({
    userId: user.id,
    token: refreshToken,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    },
  };
}

async function refresh({ refreshToken }) {
  if (!refreshToken) {
    const error = new Error("Missing refreshToken");
    error.statusCode = 400;
    throw error;
  }

  // 1) Check trong DB xem token này có tồn tại & chưa revoked không
  const stored = await refreshTokenRepo.findByToken(refreshToken);
  if (!stored || stored.revoked) {
    const error = new Error("Refresh token không hợp lệ hoặc đã logout");
    error.statusCode = 401;
    throw error;
  }

  // 2) Verify chữ ký + hạn token
  let payload;
  try {
    payload = jwt.verify(refreshToken, refreshSecret);
  } catch (err) {
    const error = new Error("Refresh token invalid/expired");
    error.statusCode = 401;
    throw error;
  }

  if (payload.type !== "refresh") {
    const error = new Error("Token không phải refresh token");
    error.statusCode = 400;
    throw error;
  }

  // 3) Lấy user từ DB
  const user = await userRepo.findById(payload.sub);
  if (!user) {
    const error = new Error("User không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  // 4) Rotate token: revoke token cũ, tạo token mới
  await refreshTokenRepo.revokeToken(refreshToken);

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken({ id: user.id });

  await refreshTokenRepo.createRefreshToken({
    userId: user.id,
    token: newRefreshToken,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}


async function logout({ refreshToken }) {
  if (!refreshToken) {
    const error = new Error("Missing refreshToken");
    error.statusCode = 400;
    throw error;
  }

  // Đánh dấu token là revoked (hoặc xóa cũng được)
  await refreshTokenRepo.revokeToken(refreshToken);

  return { success: true };
}


async function getProfile({ userId }) {
  const user = await userRepo.findById(userId);
  if (!user) {
    const error = new Error("User không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    createdAt: user.created_at,
  };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getProfile,
};
