
import { pool } from './db.js';
import { GoogleGenAI } from '@google/genai';

class CoreRAG {
  async generate(prefs) {
    // Moved GoogleGenAI initialization inside the method as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const client = await pool.connect();
    try {
      // 1. Retrieval: Fetch candidates from Postgres
      let sql = `
        SELECT id, title, brand, price, category, sizes, images
        FROM products 
        WHERE verifiedBrand = true 
        AND in_stock = true
      `;
      const params = [];
      let idx = 1;

      if (prefs.gender && prefs.gender !== 'unisex') {
        sql += ` AND (gender = $${idx} OR gender = 'unisex')`;
        params.push(prefs.gender);
        idx++;
      }

      if (prefs.product_type) {
        sql += ` AND (category ILIKE $${idx} OR sub_category ILIKE $${idx} OR title ILIKE $${idx})`;
        params.push(`%${prefs.product_type}%`);
        idx++;
      }

      if (prefs.max_price) {
        sql += ` AND price <= $${idx}`;
        params.push(prefs.max_price);
        idx++;
      }

      if (prefs.size) {
        sql += ` AND $${idx} = ANY(sizes)`;
        params.push(prefs.size);
        idx++;
      }

      sql += ` LIMIT 100`; // Fetch broad pool for RAG

      const res = await client.query(sql, params);
      const items = res.rows;

      if (items.length === 0) return [];

      // 2. Generation: Select Top 20 using GenAI
      const prompt = `
        Context: User wants "${prefs.occasion || 'casual'}" style for "${prefs.product_type}".
        Budget: ${prefs.max_price}.
        
        Task: Select the best 5 items from the provided list that perfectly match the request.
        Return ONLY a JSON array of the selected product IDs.
        
        List: ${JSON.stringify(items.map(i => ({ id: i.id, title: i.title, brand: i.brand, price: i.price })))}
      `;

      // Updated to gemini-3-flash-preview for product filtering task
      const result = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt, 
        config: { responseMimeType: 'application/json' } 
      });

      const selectedIds = JSON.parse(result.text || "[]");
      
      return items.filter(p => selectedIds.includes(p.id)).map(p => ({
        ...p,
        image_url: p.images && p.images[0] ? p.images[0] : null
      }));

    } catch (e) {
      console.error("Core RAG Error:", e);
      return [];
    } finally {
      client.release();
    }
  }
}

export default new CoreRAG();
