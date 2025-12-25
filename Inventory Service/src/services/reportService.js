const { query } = require("../config/db");

async function getDashboardStats() {
    try {
      // 1. Tổng số tài sản
      // [SỬA] Dùng query() thay vì db.query()
      const totalAssetsQuery = await query('SELECT COUNT(*) FROM assets');
      const totalAssets = parseInt(totalAssetsQuery.rows[0].count);

      // 2. Tổng giá trị tài sản (Xử lý null bằng COALESCE)
      const totalValueQuery = await query('SELECT COALESCE(SUM(value), 0) FROM assets');
      const totalValue = parseInt(totalValueQuery.rows[0].coalesce);

      // 3. Thống kê theo trạng thái (Active, Maintenance...)
      const statusQuery = await query(`
        SELECT status, COUNT(*) as count 
        FROM assets 
        GROUP BY status
      `);
      
      // Chuyển array thành object { active: 10, maintenance: 2 ... }
      const statusCounts = { active: 0, maintenance: 0, inactive: 0 };
      statusQuery.rows.forEach(row => {
        if(statusCounts[row.status] !== undefined) {
             statusCounts[row.status] = parseInt(row.count);
        }
      });

      // 4. Lấy 5 lần quét gần nhất
      const recentScansQuery = await query(`
        SELECT id, scan_code, status, scanned_at as created_at, location 
        FROM scans 
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      return {
        totalAssets,
        totalValue,
        statusCounts,
        recentScans: recentScansQuery.rows
      };

    } catch (error) {
      console.error("Dashboard Stats Error:", error);
      throw new Error("Lỗi lấy dữ liệu thống kê");
    }
}

async function getSummary() {
  // 1. Tổng số lượt quét AI
  const scansResult = await query("SELECT COUNT(*) as total FROM scans");
  const totalScans = parseInt(scansResult.rows[0].total, 10);

  // 2. Tổng số tài sản trong kho
  const assetsResult = await query("SELECT COUNT(*) as total FROM assets");
  const totalAssets = parseInt(assetsResult.rows[0].total, 10);

  // 3. Số tài sản cần bảo trì (status = maintenance HOẶC condition < 50%)
  const maintenanceResult = await query(
    `SELECT COUNT(*) as total FROM assets 
      WHERE status = 'maintenance' OR condition < 50`
  );
  const maintenanceCount = parseInt(maintenanceResult.rows[0].total, 10);

  // 4. Tổng giá trị tài sản (VNĐ)
  const valueResult = await query("SELECT SUM(value) as total FROM assets");
  const totalValue = valueResult.rows[0].total ? parseFloat(valueResult.rows[0].total) : 0;

  return {
    totalScans,
    totalAssets,
    maintenanceCount,
    totalValue,
  };
}

async function getTrends(startDate, endDate) {
  // Thống kê số lượng quét theo tháng (6 tháng gần nhất nếu không truyền ngày)
  const result = await query(
    `SELECT 
      TO_CHAR(scanned_at, 'Mon') as month_name,
      DATE_TRUNC('month', scanned_at) as month_date,
      COUNT(*) as scans
     FROM scans
     WHERE scanned_at >= NOW() - INTERVAL '6 months'
     GROUP BY DATE_TRUNC('month', scanned_at), TO_CHAR(scanned_at, 'Mon')
     ORDER BY month_date ASC`
  );

  return result.rows.map((row) => ({
    month: row.month_name,
    scans: parseInt(row.scans, 10),
  }));
}

async function getIssueDistribution() {
  // Thống kê tài sản theo Danh mục (Category)
  const result = await query(
    `SELECT category, COUNT(*) as value
     FROM assets
     GROUP BY category
     ORDER BY value DESC
     LIMIT 5`
  );

  return result.rows.map((row) => ({
    name: row.category,
    value: parseInt(row.value, 10),
  }));
}

module.exports = {
  getDashboardStats,
  getSummary,
  getTrends,
  getIssueDistribution,
};