// scripts/migrate.js
// Script để chạy migration - tạo thêm các bảng cho Inventory Service
// Sử dụng chung database với Auth Service
require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("neon.tech") || process.env.DATABASE_URL?.includes("neon")
    ? { rejectUnauthorized: false }
    : false,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log("🔄 Starting database migration...");
    console.log("📝 Adding Inventory Service tables to existing database...\n");
    
    // Read migration file
    const migrationPath = path.join(__dirname, "..", "migrations", "001_create_tables.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    
    // Execute migration (IF NOT EXISTS ensures it's safe to run multiple times)
    await client.query(migrationSQL);
    
    console.log("✅ Migration completed successfully!");
    
    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('assets', 'scans', 'detections')
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log("\n📊 Inventory Service tables:");
      tablesResult.rows.forEach((row) => {
        console.log(`   ✓ ${row.table_name}`);
      });
    }
    
    // Check if users table exists (from Auth Service)
    const usersTable = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `);
    
    if (usersTable.rows.length > 0) {
      console.log("\n✅ Database contains both Auth Service and Inventory Service tables");
    }
    
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error(error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log("\n✨ Database setup complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration error:", error);
    process.exit(1);
  });

