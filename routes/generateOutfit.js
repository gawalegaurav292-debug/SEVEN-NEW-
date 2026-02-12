
import express from "express";
import { brandStrictMiddleware } from "../middleware/brandStrict.js";
import { queryStrictCandidates } from "../services/db.js";

const router = express.Router();

// Apply middleware
router.use(brandStrictMiddleware);

router.post("/", async (req,res) => {
  const recService = req.app.get("recommendationService");
  try {
    const { user, budget, country, options } = req.body;
    
    // --- 1. HARD FILTERS (Deterministic) ---
    // We strictly respect: Gender, Budget, Brand(s)
    
    let brandFilter = null;
    if (options?.brandFilter) {
      if (Array.isArray(options.brandFilter)) {
        brandFilter = options.brandFilter.length > 0 ? options.brandFilter : null;
      } else {
        brandFilter = [options.brandFilter];
      }
    }

    const gender = options?.gender || user?.gender || 'unisex';
    const styles = user?.style || [];

    console.log(`[Architecture] Hard Filter: Gender=${gender}, Budget=${budget}, Brands=${brandFilter?.join(',') || 'All'}`);

    // Fetch a large pool of VALID candidates
    const pool = await queryStrictCandidates({
      gender,
      budget,
      brand: brandFilter,
      styles,
      limit: 300 // Fetch plenty to allow MMR to do its job
    });

    if (pool.length === 0) {
      return res.json({ 
        outfits: [], 
        message: "No items matched strict criteria. Please broaden filters." 
      });
    }

    // --- 2. PIPELINE: MMR + GEMINI RANKING ---
    // Pass the clean pool to the service
    const outfits = await recService.generateOutfitsV2({ 
      verifiedProducts: pool, 
      user: { ...user, gender, style: styles }, // Ensure context is passed
      budget, 
      options,
      topNOutfits: 5 
    });

    return res.json({ outfits });

  } catch (e) {
    console.error("generateOutfit error:", e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
