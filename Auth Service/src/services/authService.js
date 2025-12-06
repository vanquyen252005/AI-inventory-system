// src/services/authService.js
const axios = require('axios');
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
async function loginWithGoogle(accessToken) {
  console.log("--- Bắt đầu xử lý Google Login ---");
  console.log("Token nhận được:", accessToken ? accessToken.substring(0, 10) + "..." : "KHÔNG CÓ TOKEN");

  try {
    // Bước 1: Gọi Google API
    console.log("1. Đang gọi Google API...");
    const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log("2. Google trả về:", googleRes.data);
    const { sub: googleId, email, name, picture } = googleRes.data;

    if (!email) throw new Error("Google account không có email");

    // Bước 2: Tìm user trong DB
    console.log("3. Đang tìm user trong DB với email:", email);
    let user = await userRepo.findByEmail(email);

    if (user) {
      console.log("-> User đã tồn tại, ID:", user.id);
      if (!user.google_id) {
        console.log("-> Đang cập nhật google_id...");
        await userRepo.updateGoogleId(user.id, googleId);
      }
    } else {
      console.log("-> User chưa có, đang tạo mới...");
      user = await userRepo.createUser({
        email,
        passwordHash: null,
        fullName: name,
        role: "USER",
        googleId
      });
    }

    // Bước 3: Tạo Token
    console.log("4. Đang tạo JWT Token...");
    const newAccessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user.id });
    await refreshTokenRepo.createRefreshToken({ userId: user.id, token: newRefreshToken });

    console.log("--- Google Login Thành Công ---");
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role }
    };

  } catch (error) {
    // IN LỖI CHI TIẾT RA TERMINAL
    console.error("!!! LỖI GOOGLE LOGIN !!!");
    console.error("Message:", error.message);
    if (error.response) {
      console.error("Google API Error Data:", error.response.data);
      console.error("Google API Status:", error.response.status);
    } else if (error.code === '23505') {
       console.error("Lỗi trùng lặp Database (Unique constraint)");
    } else {
       console.error("Stack trace:", error.stack);
    }
    
    const err = new Error("Xác thực Google thất bại: " + error.message);
    err.statusCode = 401;
    throw err;
  }
}
module.exports = {
  register,
  login,
  refresh,
  logout,
  getProfile,
  loginWithGoogle
};
