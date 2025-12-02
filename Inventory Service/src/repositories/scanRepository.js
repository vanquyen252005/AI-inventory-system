const { query } = require("../config/db");

async function findAll(filters = {}) {
  let sql = `
    SELECT 
      s.id,
      s.scan_code as "scan_code",    -- Đã sửa: scanCode -> scan_code
      s.image_url as "image_url",    -- Đã sửa: imageUrl -> image_url
      s.status,
      s.result_data as "result_data", -- Đã sửa: resultData -> result_data
      s.device_cnt as "device_cnt",   -- Đã sửa: deviceCnt -> device_cnt
      s.location,
      s.scanned_at as "scanned_at"    -- Đã sửa: scannedAt -> scanned_at
    FROM scans s
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.search) {
    sql += ` AND (s.location ILIKE $${paramIndex} OR s.scan_code ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  sql += " ORDER BY s.scanned_at DESC";

  // Phân trang
  if (filters.limit) {
    sql += ` LIMIT $${paramIndex}`;
    params.push(filters.limit);
    paramIndex++;
  }

  if (filters.offset) {
    sql += ` OFFSET $${paramIndex}`;
    params.push(filters.offset);
  }

  const result = await query(sql, params);
  return result.rows;
}

async function findById(id) {
  const result = await query(
    `SELECT 
      s.id,
      s.scan_code as "scan_code",      -- Sửa đồng bộ ở đây luôn
      s.image_url as "image_url",
      s.status,
      s.result_data as "result_data",
      s.device_cnt as "device_cnt",
      s.location,
      s.scanned_at as "scanned_at"
     FROM scans s
     WHERE s.id = $1`,
    [id]
  );
  return result.rows[0];
}

async function create(data) {
  const { scan_code, image_url, status, location } = data;
  const result = await query(
    `INSERT INTO scans (scan_code, image_url, status, location)
     VALUES ($1, $2, $3, $4)
     RETURNING 
      id,
      scan_code as "scan_code",
      image_url as "image_url",
      status,
      location,
      scanned_at as "scanned_at"`,
    [scan_code, image_url, status || 'processing', location]
  );
  return result.rows[0];
}

async function updateResult(id, status, resultData, deviceCount) {
  const result = await query(
    `UPDATE scans 
     SET status = $1, result_data = $2, device_cnt = $3
     WHERE id = $4
     RETURNING 
      id,
      scan_code as "scan_code",
      image_url as "image_url",
      status,
      result_data as "result_data",
      device_cnt as "device_cnt"`,
    [status, resultData, deviceCount, id]
  );
  return result.rows[0];
}

module.exports = {
  findAll,
  findById,
  create,
  updateResult,
};