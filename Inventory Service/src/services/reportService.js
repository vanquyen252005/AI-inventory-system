// src/services/reportService.js
const { query } = require("../config/db");

async function getSummary() {
  // Total scans
  const scansResult = await query("SELECT COUNT(*) as total FROM scans");
  const totalScans = parseInt(scansResult.rows[0].total, 10);

  // Issues found (detections with severity medium or high)
  const issuesResult = await query(
    `SELECT COUNT(*) as total FROM detections WHERE severity IN ('medium', 'high')`
  );
  const issuesFound = parseInt(issuesResult.rows[0].total, 10);

  // Resolved (completed scans with no high severity issues)
  const resolvedResult = await query(
    `SELECT COUNT(DISTINCT s.id) as total
     FROM scans s
     LEFT JOIN detections d ON s.id = d.scan_id AND d.severity = 'high'
     WHERE s.status = 'completed' AND d.id IS NULL`
  );
  const resolved = parseInt(resolvedResult.rows[0].total, 10);

  // Average accuracy
  const accuracyResult = await query(
    `SELECT AVG(accuracy) as avg FROM scans WHERE status = 'completed' AND accuracy > 0`
  );
  const avgAccuracy = accuracyResult.rows[0].avg
    ? parseFloat(accuracyResult.rows[0].avg).toFixed(1)
    : 0;

  return {
    totalScans,
    issuesFound,
    resolved,
    avgAccuracy: parseFloat(avgAccuracy),
  };
}

async function getTrends(startDate, endDate) {
  const result = await query(
    `SELECT 
      DATE_TRUNC('month', uploaded_at) as month,
      COUNT(*) as scans,
      COUNT(CASE WHEN EXISTS (
        SELECT 1 FROM detections d 
        WHERE d.scan_id = s.id AND d.severity IN ('medium', 'high')
      ) THEN 1 END) as issues,
      COUNT(CASE WHEN status = 'completed' AND NOT EXISTS (
        SELECT 1 FROM detections d 
        WHERE d.scan_id = s.id AND d.severity = 'high'
      ) THEN 1 END) as resolved
     FROM scans s
     WHERE uploaded_at >= $1 AND uploaded_at <= $2
     GROUP BY DATE_TRUNC('month', uploaded_at)
     ORDER BY month`,
    [startDate || "2024-01-01", endDate || new Date().toISOString()]
  );

  return result.rows.map((row) => ({
    month: new Date(row.month).toLocaleDateString("en-US", { month: "short" }),
    scans: parseInt(row.scans, 10),
    issues: parseInt(row.issues, 10),
    resolved: parseInt(row.resolved, 10),
  }));
}

async function getIssueDistribution() {
  const result = await query(
    `SELECT 
      CASE 
        WHEN name ILIKE '%hydraulic%' THEN 'Hydraulic Issues'
        WHEN name ILIKE '%wear%' OR name ILIKE '%tear%' THEN 'Wear & Tear'
        WHEN name ILIKE '%rust%' OR name ILIKE '%corrosion%' THEN 'Rust/Corrosion'
        ELSE 'Other'
      END as category,
      COUNT(*) as value
     FROM detections
     WHERE severity IN ('medium', 'high')
     GROUP BY category
     ORDER BY value DESC`
  );

  return result.rows.map((row) => ({
    name: row.category,
    value: parseInt(row.value, 10),
  }));
}

module.exports = {
  getSummary,
  getTrends,
  getIssueDistribution,
};

