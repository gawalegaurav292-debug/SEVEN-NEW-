import { GoogleGenAI } from '@google/genai';
import { pool } from './db.js';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const wardrobeService = {
  // 1. Digitize: Convert Image -> JSON List of Items
  async digitize(imageBase64) {
    // In production, use Gemini Vision. Here we mock for speed/stability if key missing.
    // Real implementation:
    /*
    const prompt = "Identify clothing items. Return JSON: [{category, color, type, material}].";
    const res = await ai.models.generateContent({
       model: 'gemini-2.5-flash',
       contents: [{ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }, { text: prompt }]
    });
    return JSON.parse(res.text);
    */
    
    // Simulated detection for demo
    return [
      { id: 'w1', title: 'Vintage Denim Jacket', category: 'outerwear', color: 'blue', material: 'denim' },
      { id: 'w2', title: 'White Cotton Tee', category: 'top', color: 'white', material: 'cotton' },
      { id: 'w3', title: 'Black Slim Jeans', category: 'bottom', color: 'black', material: 'denim' }
    ];
  },

  // 2. Shop Similar: Find verified affiliate items matching the user's wardrobe
  async findSimilar(wardrobeItem) {
    const client = await pool.connect();
    try {
      const sql = `
        SELECT * FROM products 
        WHERE verified = true 
        AND (category = $1 OR sub_category = $1)
        AND (title ILIKE $2 OR brand ILIKE $2)
        LIMIT 3
      `;
      // Naive text match
      const search = `%${wardrobeItem.material || ''} ${wardrobeItem.category}%`;
      const res = await client.query(sql, [wardrobeItem.category, search]);
      
      // If no exact match, fallback to category
      if (res.rows.length === 0) {
         const fallback = await client.query(`SELECT * FROM products WHERE verified = true AND category = $1 LIMIT 3`, [wardrobeItem.category]);
         return fallback.rows;
      }
      return res.rows;
    } finally {
      client.release();
    }
  }
};