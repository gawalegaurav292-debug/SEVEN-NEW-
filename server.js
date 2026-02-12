
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import coreIngestWorker from './services/core-ingest-worker.js';
import unlimitedRagRoutes from './routes/unlimited-rag.js';
import productRoutes from './routes/products.js';
import wardrobeRoutes from './routes/wardrobe.js';
import trendRoutes from './routes/trends.js';
import tribeRoutes from './routes/tribe.js';
import eventStylistRoutes from './routes/event-stylist.js';
import stockRoutes from './routes/stock.js';
import ragRoutes from './routes/rag.js';
import generateOutfitRoutes from './routes/generateOutfit.js';
import socialClosetRoutes from './routes/social-closet.js';
import feedbackRoutes from './routes/feedback.js'; // <--- NEW
import { generateMorningOutfit } from './services/morning-outfit.js';
import { computeTrendIndex } from './workers/trend-index.js';
import * as recService from './services/recommendation_v2.js';
import { trackClick } from './services/db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/sevendb";

const db = new Pool({ connectionString: DATABASE_URL });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Inject Services for Routes
app.set("recommendationService", recService);

// ROUTES
app.use("/api/products", productRoutes);
app.use("/api/core-ingest", coreIngestWorker);
app.use("/api/unlimited-rag", unlimitedRagRoutes);
app.use("/api/wardrobe", wardrobeRoutes);
app.use("/api/trends", trendRoutes);
app.use("/api/tribe", tribeRoutes);
app.use("/api/event-stylist", eventStylistRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/rag", ragRoutes);
app.use("/api/generate-outfit", generateOutfitRoutes);
app.use("/api/social", socialClosetRoutes);
app.use("/api/feedback", feedbackRoutes); // <--- NEW

// Morning Outfit Endpoint
app.post("/api/morning-outfit", async (req, res) => {
  try {
    const { userId, prefs } = req.body;
    const outfit = await generateMorningOutfit(userId, prefs);
    res.json({ success: true, outfit });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Trigger Trend Worker manually (for demo)
app.post("/api/workers/trend-index", async (req, res) => {
  try {
    const index = await computeTrendIndex();
    res.json({ success: true, index });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/track-click", async (req, res) => {
  const { productId, userId } = req.body;
  if (productId) {
    await trackClick(productId, userId);
  }
  res.json({ status: 'tracked' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SÉVEN Core Backend' });
});

app.listen(PORT, () => {
  console.log(`🚀 SÉVEN Core Backend running on http://localhost:${PORT}`);
});
