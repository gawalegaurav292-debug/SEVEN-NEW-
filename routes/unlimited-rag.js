import express from 'express';
import { ragEngine } from '../services/rag-engine.js';

const router = express.Router();

router.post('/unlimited-outfits', async (req, res) => {
  try {
    const products = await ragEngine.generate(req.body);
    res.json({ success: true, count: products.length, products });
  } catch (e) {
    console.error("Unlimited RAG Error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
