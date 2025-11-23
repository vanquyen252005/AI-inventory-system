// src/config/db.js
// Load dotenv first to ensure .env is loaded
require("dotenv").config();
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL is not set!");
  process.exit(1);
}

// Log connection info (first 30 and last 20 chars for security)
const preview = connectionString.length > 50 
  ? connectionString.substring(0, 30) + "..." + connectionString.slice(-20)
  : "***";
console.log(`[DB] Connecting to: ${preview}`);

const pool = new Pool({
  connectionString: connectionString,
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

