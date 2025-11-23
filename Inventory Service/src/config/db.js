// src/config/db.js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // optional:
  ssl: {
    rejectUnauthorized: false,
  },
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log(`[DB] ${text.split("\n")[0]} (${duration}ms)`);
  return res;
}

module.exports = {
  query,
  pool,
};

