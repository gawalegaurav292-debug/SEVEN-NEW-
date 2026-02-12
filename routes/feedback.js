
import express from 'express';
import { logInteraction } from '../services/db.js';

const router = express.Router();

// POST /api/feedback
// Body: { userId, productId, type: 'like' | 'dislike' | 'view' }
router.post('/', async (req, res) => {
  const { userId, productId, type } = req.body;
  
  try {
    const weight = type === 'like' ? 5 : type === 'dislike' ? -2 : 1;
    
    // Asynchronous "Fire and Forget" for speed
    // In production we would use a queue. Here we await but keep it fast.
    await logInteraction(userId || 'guest-user', productId, type, weight);
    
    res.json({ success: true });
  } catch (e) {
    console.error("Feedback error:", e);
    // Fail silent to user, log internally
    res.status(500).json({ success: false });
  }
});

export default router;
