// src/repositories/detectionRepository.js
const { query } = require("../config/db");

async function findByScanId(scanId) {
  const result = await query(
    "SELECT * FROM detections WHERE scan_id = $1 ORDER BY confidence DESC",
    [scanId]
  );
  return result.rows;
}

async function create(detectionData) {
  const { scanId, name, confidence, location, severity = "low", description } = detectionData;

  const result = await query(
    `INSERT INTO detections (scan_id, name, confidence, location, severity, description)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [scanId, name, confidence, location, severity, description]
  );
  return result.rows[0];
}

async function createMany(detections) {
  if (detections.length === 0) return [];

  const values = detections.map((_, index) => {
    const base = index * 6;
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
  }).join(", ");

  const params = detections.flatMap((d) => [
    d.scanId,
    d.name,
    d.confidence,
    d.location,
    d.severity || "low",
    d.description || null,
  ]);

  const sql = `
    INSERT INTO detections (scan_id, name, confidence, location, severity, description)
    VALUES ${values}
    RETURNING *
  `;

  const result = await query(sql, params);
  return result.rows;
}

async function removeByScanId(scanId) {
  await query("DELETE FROM detections WHERE scan_id = $1", [scanId]);
}

module.exports = {
  findByScanId,
  create,
  createMany,
  removeByScanId,
};

