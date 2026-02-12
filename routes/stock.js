
import express from 'express';
import { checkBulkStock } from '../services/stock-checker.js';
import { logStockCheck } from '../services/observability.js';

const router = express.Router();

// POST /api/stock/check (Singular wrapper for Product Detail)
router.post('/check', async (req, res) => {
  try {
    const { productId, brand } = req.body;
    const stockResults = await checkBulkStock([productId], brand || 'generic');
    
    // Log singular check
    logStockCheck(1, brand || 'generic', 'success');
    
    res.json({ success: true, stock: stockResults[0] });
  } catch (error) {
    logStockCheck(1, req.body.brand || 'unknown', 'error');
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/stock/bulk-check (For Outfits)
router.post('/bulk-check', async (req, res) => {
  try {
    // Frontend sends { items: [{ id, brand }, ...] }
    const { items } = req.body; 
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: "Invalid items array" });
    }

    // Group items by brand to batch API calls efficiently
    const byBrand = {};
    items.forEach(item => {
      const b = item.brand || 'generic';
      const id = item.id || item.productId;
      if (!byBrand[b]) byBrand[b] = [];
      byBrand[b].push(id);
    });

    const allResults = [];
    
    // Execute checks per brand
    for (const [brand, ids] of Object.entries(byBrand)) {
      const brandResults = await checkBulkStock(ids, brand);
      allResults.push(...brandResults);
      logStockCheck(ids.length, brand, 'success');
    }

    res.json({ success: true, results: allResults });
  } catch (error) {
    logStockCheck(0, 'mixed-bulk', 'error');
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
