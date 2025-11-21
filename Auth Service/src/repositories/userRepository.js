// src/repositories/userRepository.js

const db = require("../config/db");

// Tạo user mới
async function createUser({ email, passwordHash, fullName, role = "USER" }) {
  const result = await db.query(
    `
    INSERT INTO users (email, password_hash, full_name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, full_name, role, created_at
    `,
    [email, passwordHash, fullName, role]
  );

  return result.rows[0];
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
};
