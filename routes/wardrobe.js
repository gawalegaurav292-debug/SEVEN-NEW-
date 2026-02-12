import express from 'express';
import { wardrobeService } from '../services/wardrobe-service.js';

const router = express.Router();

router.post('/digitize', async (req, res) => {
  try {
    const { image } = req.body;
    const items = await wardrobeService.digitize(image);
    
    // Automatically find similar affiliate items
    const enriched = await Promise.all(items.map(async (item) => {
      const similar = await wardrobeService.findSimilar(item);
      return { ...item, similar };
    }));

    res.json({ success: true, items: enriched });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;