// src/repositories/userRepository.js

const db = require("../config/db");

// 1. Cập nhật hàm createUser: nhận thêm tham số googleId
async function createUser({ email, passwordHash, fullName, role = "USER", facebookId = null, googleId = null }) {
  const result = await db.query(
    `
    INSERT INTO users (email, password_hash, full_name, role, facebook_id, google_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, email, full_name, role, created_at
    `,
    [email, passwordHash, fullName, role, facebookId, googleId] // Thêm googleId vào params
  );
  return result.rows[0];
}

// 2. Thêm hàm updateGoogleId
async function updateGoogleId(userId, googleId) {
  const query = 'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING *';
  const { rows } = await db.query(query, [googleId, userId]);
  return rows[0];
}

// Tìm user theo email
async function findByEmail(email) {
  const result = await db.query(
    `SELECT id, email, password_hash, full_name, role, created_at 
     FROM users 
     WHERE email = $1 
     LIMIT 1`,
    [email]
  );

  // ❗ QUAN TRỌNG: nếu không có thì phải trả về null
  if (result.rows.length === 0) return null;
  return result.rows[0];
}

// Tìm user theo id
async function findById(id) {
  const result = await db.query(
    `SELECT * FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  updateGoogleId    // <-- Mới thêm
};
