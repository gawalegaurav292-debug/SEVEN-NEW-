
import { pool } from '../services/db.js';

export async function computeTrendIndex() {
  const client = await pool.connect();
  console.log("[Worker] Computing Global Trend Index...");
  
  try {
    // 1. Analyze recent verified inventory (Supply Side)
    // In a real B2B moat, we would also analyze 'product_clicks' (Demand Side)
    const res = await client.query(`
      SELECT category, sub_category, COUNT(*) as volume
      FROM products
      WHERE brand_verified = true
      GROUP BY category, sub_category
      ORDER BY volume DESC
    `);

    const index = {};
    res.rows.forEach(row => {
      const key = row.sub_category || row.category;
      if (key) {
        index[key] = parseInt(row.volume);
      }
    });

    // 2. Store Snapshot
    await client.query(`
      INSERT INTO global_trends (id, index_data, updated_at)
      VALUES ('global_latest', $1, NOW())
      ON CONFLICT (id) DO UPDATE SET index_data = $1, updated_at = NOW()
    `, [JSON.stringify(index)]);

    console.log('✅ Trend index updated:', index);
    return index;

  } catch (e) {
    console.error("Trend Worker Failed:", e);
  } finally {
    client.release();
  }
};
