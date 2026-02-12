
import express from 'express';
import { pool } from '../services/db.js';

const router = express.Router();

router.post('/upload-outfit', async (req, res) => {
  const { userId, imageUrl, items } = req.body;
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO social_outfits (user_id, image_url, items, likes)
      VALUES ($1, $2, $3, 0)
      RETURNING id
    `;
    const values = [userId, imageUrl, JSON.stringify(items)];
    const result = await client.query(query, values);
    
    const outfitId = result.rows[0].id;
    
    res.json({ 
      success: true, 
      outfitId, 
      shareUrl: `/social/outfit/${outfitId}` 
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  } finally {
    client.release();
  }
});

router.post('/shop-look', async (req, res) => {
  const { outfitId } = req.body;
  const client = await pool.connect();
  
  try {
    const result = await client.query('SELECT items FROM social_outfits WHERE id = $1', [outfitId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Outfit not found" });
    
    const items = result.rows[0].items;
    
    // Generate affiliate cart link (Mock implementation)
    // In prod: Construct a multi-brand checkout URL or specific affiliate links
    const cartUrl = `https://affiliate.com/cart?items=${encodeURIComponent(JSON.stringify(items))}`;
    
    res.json({ success: true, cartUrl, items });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  } finally {
    client.release();
  }
});

// Get Feed
router.get('/feed', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM social_outfits ORDER BY created_at DESC LIMIT 20');
    res.json({ outfits: result.rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  } finally {
    client.release();
  }
});

export default router;
