// src/repositories/refreshTokenRepository.js

const db = require("../config/db");

async function createRefreshToken({ userId, token }) {
  const result = await db.query(
    `
    INSERT INTO refresh_tokens (user_id, token)
    VALUES ($1, $2)
    RETURNING id, user_id, token, created_at, revoked
    `,
    [userId, token]
  );

  return result.rows[0];
}

async function findByToken(token) {
  const result = await db.query(
    `
    SELECT id, user_id, token, created_at, revoked
    FROM refresh_tokens
    WHERE token = $1
    LIMIT 1
    `,
    [token]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

async function revokeToken(token) {
  await db.query(
    `
    UPDATE refresh_tokens
    SET revoked = true
    WHERE token = $1
    `,
    [token]
  );
}

async function revokeAllForUser(userId) {
  await db.query(
    `
    UPDATE refresh_tokens
    SET revoked = true
    WHERE user_id = $1
    `,
    [userId]
  );
}

module.exports = {
  createRefreshToken,
  findByToken,
  revokeToken,
  revokeAllForUser,
};
