import express from 'express';
import { trendService } from '../services/trend-service.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const trends = await trendService.getGlobalTrends();
    res.json({ success: true, trends });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;