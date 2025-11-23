// src/repositories/scanRepository.js
const { query } = require("../config/db");

async function findAll(filters = {}) {
  let sql = `
    SELECT 
      s.id,
      s.asset_id as "assetId",
      s.file_name as "fileName",
      s.file_path as "filePath",
      s.file_size as "fileSize",
      s.status,
      s.accuracy,
      s.detected_items as "detectedItems",
      s.error_message as "errorMessage",
      s.uploaded_by as "uploadedBy",
      s.uploaded_at as "uploadedAt",
      s.updated_at as "updatedAt",
      a.name as "assetName"
    FROM scans s
    LEFT JOIN assets a ON s.asset_id = a.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.search) {
    sql += ` AND (a.name ILIKE $${paramIndex} OR s.id ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.status) {
    sql += ` AND s.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.assetId) {
    sql += ` AND s.asset_id = $${paramIndex}`;
    params.push(filters.assetId);
    paramIndex++;
  }

  sql += " ORDER BY s.uploaded_at DESC";

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
      s.asset_id as "assetId",
      s.file_name as "fileName",
      s.file_path as "filePath",
      s.file_size as "fileSize",
      s.status,
      s.accuracy,
      s.detected_items as "detectedItems",
      s.error_message as "errorMessage",
      s.uploaded_by as "uploadedBy",
      s.uploaded_at as "uploadedAt",
      s.updated_at as "updatedAt",
      a.name as "assetName",
      a.id as "assetId"
     FROM scans s
     LEFT JOIN assets a ON s.asset_id = a.id
     WHERE s.id = $1`,
    [id]
  );
  return result.rows[0];
}

async function create(scanData) {
  const {
    id,
    assetId,
    fileName,
    filePath,
    fileSize,
    status = "processing",
    accuracy = 0,
    detectedItems = 0,
    userId,
  } = scanData;

  const result = await query(
    `INSERT INTO scans (id, asset_id, file_name, file_path, file_size, status, accuracy, detected_items, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING 
       id,
       asset_id as "assetId",
       file_name as "fileName",
       file_path as "filePath",
       file_size as "fileSize",
       status,
       accuracy,
       detected_items as "detectedItems",
       error_message as "errorMessage",
       uploaded_by as "uploadedBy",
       uploaded_at as "uploadedAt",
       updated_at as "updatedAt"`,
    [id, assetId, fileName, filePath, fileSize, status, accuracy, detectedItems, userId]
  );
  return result.rows[0];
}

async function update(id, scanData) {
  const { status, accuracy, detectedItems, errorMessage } = scanData;

  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    params.push(status);
  }
  if (accuracy !== undefined) {
    updates.push(`accuracy = $${paramIndex++}`);
    params.push(accuracy);
  }
  if (detectedItems !== undefined) {
    updates.push(`detected_items = $${paramIndex++}`);
    params.push(detectedItems);
  }
  if (errorMessage !== undefined) {
    updates.push(`error_message = $${paramIndex++}`);
    params.push(errorMessage);
  }

  updates.push(`updated_at = NOW()`);
  params.push(id);

  const sql = `UPDATE scans SET ${updates.join(", ")} WHERE id = $${paramIndex} 
    RETURNING 
      id,
      asset_id as "assetId",
      file_name as "fileName",
      file_path as "filePath",
      file_size as "fileSize",
      status,
      accuracy,
      detected_items as "detectedItems",
      error_message as "errorMessage",
      uploaded_by as "uploadedBy",
      uploaded_at as "uploadedAt",
      updated_at as "updatedAt"`;
  const result = await query(sql, params);
  return result.rows[0];
}

async function remove(id) {
  const result = await query("DELETE FROM scans WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
}

async function count(filters = {}) {
  let sql = "SELECT COUNT(*) FROM scans s WHERE 1=1";
  const params = [];
  let paramIndex = 1;

  if (filters.search) {
    sql += ` AND EXISTS (
      SELECT 1 FROM assets a 
      WHERE a.id = s.asset_id 
      AND (a.name ILIKE $${paramIndex} OR s.id ILIKE $${paramIndex})
    )`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.status) {
    sql += ` AND s.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  const result = await query(sql, params);
  return parseInt(result.rows[0].count, 10);
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  count,
};

