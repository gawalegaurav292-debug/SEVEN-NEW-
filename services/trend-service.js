import { pool } from './db.js';

export const trendService = {
  async getGlobalTrends() {
    const client = await pool.connect();
    try {
      // 1. Most Popular Categories (Inventory count as proxy for supply trend)
      const catRes = await client.query(`
        SELECT category, COUNT(*) as count 
        FROM products 
        WHERE verified = true 
        GROUP BY category 
        ORDER BY count DESC 
        LIMIT 5
      `);

      // 2. Top Brands (Supply trend)
      const brandRes = await client.query(`
        SELECT brand, COUNT(*) as count 
        FROM products 
        WHERE verified = true 
        GROUP BY brand 
        ORDER BY count DESC 
        LIMIT 5
      `);

      // 3. User Demand (Mocked click tracking aggregation)
      // In real prod: SELECT product_id, COUNT(*) FROM product_clicks ...
      const demandData = [
         { label: 'Oversized Hoodies', value: 85, trend: '+12%' },
         { label: 'Vintage Denim', value: 65, trend: '+8%' },
         { label: 'Techwear Pants', value: 45, trend: '+5%' },
      ];

      return {
        categories: catRes.rows,
        brands: brandRes.rows,
        demand: demandData
      };
    } finally {
      client.release();
    }
  }
};