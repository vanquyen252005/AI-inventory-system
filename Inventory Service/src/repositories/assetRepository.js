// src/repositories/assetRepository.js
const { query } = require("../config/db");

async function findAll(filters = {}) {
  let sql = `SELECT 
    id,
    name,
    category,
    location,
    status,
    value,
    condition,
    description,
    last_scanned as "lastScanned",
    created_by as "createdBy",
    created_at as "createdAt",
    updated_at as "updatedAt"
    FROM assets WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (filters.search) {
    sql += ` AND (name ILIKE $${paramIndex} OR id ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.category) {
    sql += ` AND category = $${paramIndex}`;
    params.push(filters.category);
    paramIndex++;
  }

  if (filters.status) {
    sql += ` AND status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.location) {
    sql += ` AND location = $${paramIndex}`;
    params.push(filters.location);
    paramIndex++;
  }

  sql += " ORDER BY created_at DESC";

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
  const result = await query(`SELECT 
    id,
    name,
    category,
    location,
    status,
    value,
    condition,
    description,
    last_scanned as "lastScanned",
    created_by as "createdBy",
    created_at as "createdAt",
    updated_at as "updatedAt"
    FROM assets WHERE id = $1`, [id]);
  return result.rows[0];
}

async function create(assetData) {
  const {
    id,
    name,
    category,
    location,
    status = "active",
    value,
    condition = 100,
    description,
    userId,
  } = assetData;

  const result = await query(
    `INSERT INTO assets (id, name, category, location, status, value, condition, description, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING 
       id,
       name,
       category,
       location,
       status,
       value,
       condition,
       description,
       last_scanned as "lastScanned",
       created_by as "createdBy",
       created_at as "createdAt",
       updated_at as "updatedAt"`,
    [id, name, category, location, status, value, condition, description, userId]
  );
  return result.rows[0];
}

async function update(id, assetData) {
  const {
    name,
    category,
    location,
    status,
    value,
    condition,
    description,
    last_scanned,
  } = assetData;

  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    params.push(name);
  }
  if (category !== undefined) {
    updates.push(`category = $${paramIndex++}`);
    params.push(category);
  }
  if (location !== undefined) {
    updates.push(`location = $${paramIndex++}`);
    params.push(location);
  }
  if (status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    params.push(status);
  }
  if (value !== undefined) {
    updates.push(`value = $${paramIndex++}`);
    params.push(value);
  }
  if (condition !== undefined) {
    updates.push(`condition = $${paramIndex++}`);
    params.push(condition);
  }
  if (description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    params.push(description);
  }
  if (last_scanned !== undefined) {
    updates.push(`last_scanned = $${paramIndex++}`);
    params.push(last_scanned);
  }

  updates.push(`updated_at = NOW()`);
  params.push(id);

  const sql = `UPDATE assets SET ${updates.join(", ")} WHERE id = $${paramIndex} 
    RETURNING 
      id,
      name,
      category,
      location,
      status,
      value,
      condition,
      description,
      last_scanned as "lastScanned",
      created_by as "createdBy",
      created_at as "createdAt",
      updated_at as "updatedAt"`;
  const result = await query(sql, params);
  return result.rows[0];
}

async function remove(id) {
  const result = await query("DELETE FROM assets WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
}

async function count(filters = {}) {
  let sql = "SELECT COUNT(*) FROM assets WHERE 1=1";
  const params = [];
  let paramIndex = 1;

  if (filters.search) {
    sql += ` AND (name ILIKE $${paramIndex} OR id ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.category) {
    sql += ` AND category = $${paramIndex}`;
    params.push(filters.category);
    paramIndex++;
  }

  if (filters.status) {
    sql += ` AND status = $${paramIndex}`;
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

