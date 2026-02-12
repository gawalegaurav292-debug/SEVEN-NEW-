
import { Pool } from "pg";

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/sevendb"
});

const sql = `
  ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS image_valid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS image_quality NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS brand_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS validation_errors TEXT[];
`;

(async () => {
  const client = await pool.connect();
  try {
    console.log("🚀 Running DB Migration...");
    await client.query(sql);
    console.log("✅ Validation fields added to products table.");
  } catch (err) {
    console.error("❌ Migration Failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
})();
