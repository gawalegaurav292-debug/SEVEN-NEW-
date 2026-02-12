import express from 'express';
import { ragEngine } from '../services/rag-engine.js';

const router = express.Router();

router.post('/generate-outfit', async (req, res) => {
  try {
    const outfit = await ragEngine.generate(req.body);
    res.json({ success: true, outfit });
  } catch (e) {
    console.error("RAG Endpoint Error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;