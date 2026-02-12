
import { Pool } from 'pg';
import { GoogleGenAI } from '@google/genai';
import { logRAG } from './observability.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/sevendb" });
// Fix: Removed top-level GoogleGenAI instance to follow guidelines
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const ragEngine = {
  async generate(userPrefs) {
    // Fix: Instantiate GoogleGenAI right before the API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const client = await pool.connect();
    try {
      // Hard Gate 1: DB query filters verified ONLY
      // Enhanced to search sub_categories and style tags for niche items
      let sql = `
        SELECT * FROM products 
        WHERE brand_verified = true 
        AND in_stock = true 
      `;
      
      const params = [];
      let idx = 1;

      if (userPrefs.gender && userPrefs.gender.toLowerCase() !== 'all') {
        sql += ` AND (gender = $${idx} OR gender = 'unisex')`;
        params.push(userPrefs.gender.toLowerCase());
        idx++;
      }

      if (userPrefs.product_type) {
         // Deep Search: Match category, sub-category, title, OR style tags
         const term = userPrefs.product_type.toLowerCase();
         sql += ` AND (
           category = $${idx} 
           OR sub_category ILIKE $${idx} 
           OR title ILIKE $${idx} 
           OR $${idx} = ANY(style_tags)
           OR description ILIKE $${idx}
         )`;
         params.push(`%${term}%`); // wildcard search for text fields
         idx++;
      }

      if (userPrefs.max_price) {
        sql += ` AND price <= $${idx}`;
        params.push(userPrefs.max_price);
        idx++;
      }
      
      if (userPrefs.brand) {
        sql += ` AND brand ILIKE $${idx}`;
        params.push(userPrefs.brand);
        idx++;
      }

      // Increased limit to 1000 to allow finding niche items in large catalogs
      sql += ` ORDER BY popularity_score DESC LIMIT 1000`;

      const { rows } = await client.query(sql, params);
      const items = rows.map(r => ({
        id: r.id,
        title: r.title,
        brand: r.brand,
        price: Number(r.price),
        sizes: r.sizes,
        category: r.category,
        sub_category: r.sub_category,
        image_url: r.images?.[0] || r.image,
        affiliate_url: r.affiliate_url || `https://${r.brand}.com`, 
        verified: true,
        style_tags: r.style_tags || []
      }));

      // If no items found, return empty early
      if (items.length === 0) {
        logRAG(JSON.stringify(userPrefs), 0);
        return [];
      }

      // Hard Gate 3: LLM Selection (Context-Aware)
      // We send a diverse subset to the LLM to ensure it sees variety
      const candidatePool = items.length > 100 
        ? items.sort(() => 0.5 - Math.random()).slice(0, 80) // Shuffle if too many to avoid bias
        : items;

      const prompt = `
        User Request: ${JSON.stringify(userPrefs)}
        Task: Select the 20 best matching product IDs from the list.
        
        Guidelines:
        - Prioritize exact matches for "${userPrefs.product_type}" (e.g. if user asks for "Corset", prioritize "Corset Top" over generic "Top").
        - Ensure style consistency with user request (e.g. "Y2K", "Streetwear").
        - Include diverse options if the request is broad.
        
        Available Items: ${JSON.stringify(candidatePool.map(i => ({
          id: i.id, 
          title: i.title, 
          brand: i.brand, 
          price: i.price, 
          tags: i.style_tags,
          sub_cat: i.sub_category
        })))}
        
        Return ONLY a JSON array of strings (product IDs).
      `;

      try {
        // Fix: Updated to gemini-3-flash-preview for product selection task
        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        
        // Fix: Access response.text directly
        const selectedIds = JSON.parse(result.text);
        // Preserve order from LLM if possible, or just filter
        const finalSelection = items.filter(p => selectedIds.includes(p.id));
        
        logRAG(JSON.stringify(userPrefs), finalSelection.length);
        return finalSelection;

      } catch (e) {
        console.error("LLM RAG Selection failed, returning top database matches", e);
        return items.slice(0, 20);
      }

    } finally {
      client.release();
    }
  }
};
