import express from 'express';
import { Pool } from 'pg';

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/sevendb" });

// Known Sterile Feeds
const brandFeeds = {
  nike: { url: 'https://api.rakuten.com/nike-feed-mock', country: 'US', gender: 'men' },
  zara: { url: 'https://api.rakuten.com/zara-feed-mock', country: 'ES', gender: 'women' },
  uniqlo: { url: 'https://api.rakuten.com/uniqlo-feed-mock', country: 'JP', gender: 'unisex' }
};

// Insert Query that sets brand_verified = true (STERILE FLAG)
const UPSERT_STERILE_SQL = `
  INSERT INTO products (
    source, source_id, title, brand, gender, category, sub_category, 
    price, currency, images, sizes, in_stock, brand_verified, 
    last_fetched, last_upserted, image_valid
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, 
    $8, $9, $10, $11, $12, true, 
    NOW(), NOW(), true
  )
  ON CONFLICT (source, source_id) 
  DO UPDATE SET 
    in_stock = EXCLUDED.in_stock,
    price = EXCLUDED.price,
    brand_verified = true,
    last_upserted = NOW();
`;

router.post('/', async (req, res) => {
  const { brand } = req.body;
  if (!brand || !brandFeeds[brand.toLowerCase()]) {
    return res.status(400).json({ error: "Unknown or unsupported brand" });
  }

  const feed = brandFeeds[brand.toLowerCase()];
  const client = await pool.connect();

  try {
    // SIMULATED STERILE DATA (Clean, consistent)
    // In production: const { data } = await axios.get(feed.url, { headers: ... });
    const mockProducts = [
        {
            id: `${brand}-sterile-001`,
            title: `${brand} Verified Premium Hoodie`,
            category: 'top',
            sub_category: 'hoodie',
            price: 89.99,
            currency: 'USD',
            sizes: ['S', 'M', 'L', 'XL'],
            images: ['https://images.unsplash.com/photo-1556906781-9a412961d28c?auto=format&fit=crop&w=800&q=80'],
            in_stock: true
        },
        {
            id: `${brand}-sterile-002`,
            title: `${brand} Verified Slim Fit Chinos`,
            category: 'bottom',
            sub_category: 'pants',
            price: 65.00,
            currency: 'USD',
            sizes: ['30', '32', '34'],
            images: ['https://images.unsplash.com/photo-1624378439575-d8aa138f48ce?auto=format&fit=crop&w=800&q=80'],
            in_stock: true
        },
        {
            id: `${brand}-sterile-003`,
            title: `${brand} Verified Signature Sneakers`,
            category: 'shoes',
            sub_category: 'sneakers',
            price: 120.00,
            currency: 'USD',
            sizes: ['US 9', 'US 10', 'US 11'],
            images: ['https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80'],
            in_stock: true
        }
    ];

    let count = 0;
    for (const p of mockProducts) {
      await client.query(UPSERT_STERILE_SQL, [
        `sterile:${brand.toLowerCase()}`,
        p.id,
        p.title,
        brand,
        feed.gender,
        p.category,
        p.sub_category,
        p.price,
        p.currency,
        p.images,
        p.sizes,
        p.in_stock
      ]);
      count++;
    }

    res.json({ success: true, ingested: count, brand, status: "Sterile Data Ingested" });

  } catch (error) {
    console.error("Sterile Ingest Failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

export default router;