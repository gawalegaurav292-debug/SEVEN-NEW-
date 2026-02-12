
import express from "express";
import { getProductById, searchProducts, filterProducts, getSterileVariety, addReview, getReviews } from "../services/db.js";

const router = express.Router();

router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json({ products: [] });
    const products = await searchProducts({ query, limit: 50 });
    res.json({ products });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// General Filter Endpoint
router.get("/", async (req, res) => {
  try {
    const { gender, category, minPrice, maxPrice, brand } = req.query;
    
    // Ensure variety by fetching slightly more than needed and shuffling/deduping on frontend or here
    // For now, we rely on the DB to return valid items
    const products = await filterProducts({
      gender,
      category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      brand,
      limit: 100 // Fetch decent amount to allow for variety selection
    });
    
    res.json({ products });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== STERILE VARIETY ENDPOINT =====
router.post('/variety', async (req, res) => {
  try {
    const { gender, category, country, budget } = req.body;
    const pack = await getSterileVariety(gender, category, country, budget);
    res.json({ success: true, count: pack.length, products: pack });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get Reviews
router.get("/:id/reviews", async (req, res) => {
  try {
    const data = await getReviews(req.params.id);
    res.json({ success: true, ...data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Submit Review
router.post("/:id/reviews", async (req, res) => {
  try {
    const { rating, comment, user } = req.body;
    const newStats = await addReview({
      productId: req.params.id,
      userId: 'user-' + Date.now(), // simple ID generation
      userName: user || 'Anonymous',
      rating,
      comment
    });
    res.json({ success: true, stats: newStats });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
