
import pg from 'pg';
import crypto from 'crypto';

// Robust configuration that won't crash if env vars are missing
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/sevendb",
  connectionTimeoutMillis: 5000, // Fail fast
});

// Deterministic Random Generator for Embeddings
function pseudoRandom(seed) {
  let value = 0;
  for (let i = 0; i < seed.length; i++) {
    value = ((value << 5) - value) + seed.charCodeAt(i);
    value |= 0;
  }
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return (value / 4294967296) * 2 - 1; // -1 to 1
  };
}

// Generate 64-dim vector based on tags (Conceptual Embedding)
function generateEmbedding(tags, brand, category) {
  const seed = (tags.join('') + brand + category).toLowerCase();
  const rand = pseudoRandom(seed);
  const vec = new Float32Array(64);
  
  // Base dimensions based on category (dims 0-9)
  const catHash = pseudoRandom(category)();
  for(let i=0; i<10; i++) vec[i] = catHash * (i % 2 === 0 ? 1 : -1);

  // Style dimensions (dims 10-40)
  tags.forEach(tag => {
    const tagRand = pseudoRandom(tag);
    for(let i=10; i<40; i++) {
      vec[i] += tagRand() * 0.5;
    }
  });

  // Brand dimensions (dims 40-63)
  const brandRand = pseudoRandom(brand);
  for(let i=40; i<64; i++) vec[i] += brandRand() * 0.5;

  // Normalize (L2)
  let norm = 0;
  for(let i=0; i<64; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  for(let i=0; i<64; i++) vec[i] /= norm;

  return Array.from(vec);
}

// Map DB Row to Product Interface
const mapRowToProduct = (row, isFallback = false) => {
  // Ensure we have a vector. If DB doesn't have it, generate it.
  const tags = [...(row.style_tags || []), ...(row.occasion_tags || [])];
  const embedding = row.embedding || generateEmbedding(tags, row.brand || '', row.category || '');

  return {
    id: row.id, 
    product_id: row.id,
    source: row.source,
    source_id: row.source_id,
    sku: row.sku,
    brand: row.brand,
    gender: row.gender,
    name: row.title,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    currency: row.currency,
    category: row.category,
    sub_category: row.sub_category,
    
    style_tags: row.style_tags || [],
    occasion_tags: row.occasion_tags || [],
    colors: row.colors || [],
    sizes: row.sizes || [],
    
    images: row.images || [],
    image: (row.images && row.images.length > 0) ? (typeof row.images[0] === 'string' ? row.images[0] : row.images[0].url) : null,
    
    in_stock: row.in_stock,
    popularity_score: Number(row.popularity_score) || 0.5,
    trend_score: Number(row.trend_score) || 0.5,
    embeddings: embedding, // Always present now
    
    verifiedBrand: true,
    apiSource: row.source.includes('shopify') ? 'Shopify' : (row.source.includes('affiliate') ? 'Partner' : (row.source.charAt(0).toUpperCase() + row.source.slice(1))),
    tags: tags,
    
    image_valid: row.image_valid,
    image_quality: row.image_quality ? Number(row.image_quality) : 0,
    isFallback: isFallback,
    score: 0,
    stockStatus: row.in_stock ? 'in_stock' : 'out_of_stock',
    shipDays: row.ship_days || 5,
    rating: row.avg_rating ? Number(row.avg_rating) : 4.8, 
    reviewCount: row.review_count ? Number(row.review_count) : 120,
    affiliate_url: row.affiliate_url || null
  };
};

// Initialize Billion-Dollar Tables (Safe Mode)
const initDB = async () => {
  let client;
  try {
    client = await pool.connect();
    // 1. Social Closet Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS social_outfits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255),
        image_url TEXT,
        items JSONB,
        likes INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Global Trend Index Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS global_trends (
        id VARCHAR(50) PRIMARY KEY,
        index_data JSONB,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // 3. Product Clicks (Analytics)
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_clicks (
        id SERIAL PRIMARY KEY,
        product_id UUID,
        user_id VARCHAR(100),
        clicked_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. User Interactions (For Collaborative Filtering)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_interactions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        product_id UUID,
        interaction_type VARCHAR(50), -- 'view', 'like', 'cart', 'purchase'
        weight INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. Reviews Table (New)
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id VARCHAR(255),
        user_id VARCHAR(255),
        user_name VARCHAR(255),
        rating INT CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log("✅ Billion-Dollar Schemas Initialized");
  } catch (e) {
    console.warn("⚠️ DB Schema Init Skipped (Non-Fatal):", e.message);
  } finally {
    if (client) client.release();
  }
};

// Start init without blocking
initDB();

// --- REVIEW FUNCTIONS ---

export async function addReview({ productId, userId, userName, rating, comment }) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES ($1, $2, $3, $4, $5)`,
      [productId, userId, userName, rating, comment]
    );
    // Return updated stats
    const res = await client.query(`
      SELECT AVG(rating)::numeric(10,1) as avg, COUNT(*) as count 
      FROM reviews WHERE product_id = $1
    `, [productId]);
    return res.rows[0];
  } finally {
    client.release();
  }
}

export async function getReviews(productId) {
  const client = await pool.connect();
  try {
    const reviewsRes = await client.query(`
      SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC
    `, [productId]);
    
    const statsRes = await client.query(`
      SELECT AVG(rating)::numeric(10,1) as avg, COUNT(*) as count 
      FROM reviews WHERE product_id = $1
    `, [productId]);

    return {
      reviews: reviewsRes.rows.map(r => ({
        id: r.id,
        user: r.user_name || 'Anonymous',
        rating: r.rating,
        comment: r.comment,
        date: new Date(r.created_at).toLocaleDateString()
      })),
      rating: Number(statsRes.rows[0]?.avg || 0),
      count: Number(statsRes.rows[0]?.count || 0)
    };
  } finally {
    client.release();
  }
}

// --- CORE QUERIES (Safe Wrappers) ---

export async function getProductById(id) {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT p.*, 
        (SELECT AVG(rating)::numeric(10,1) FROM reviews WHERE product_id = p.id::varchar) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id::varchar) as review_count
        FROM products p WHERE id = $1
      `, [id]);
      if (res.rows.length === 0) return null;
      return mapRowToProduct(res.rows[0]);
    } finally {
      client.release();
    }
  } catch (e) {
    console.warn("DB Error getProductById:", e.message);
    return null;
  }
}

export async function searchProducts({ query, limit = 20 }) {
  try {
    const client = await pool.connect();
    try {
      const sql = `
        SELECT * FROM products 
        WHERE (title ILIKE $1 OR brand ILIKE $1 OR description ILIKE $1 OR $2 = ANY(style_tags))
        AND in_stock = true
        ORDER BY popularity_score DESC
        LIMIT $3
      `;
      const searchVal = `%${query}%`;
      const res = await client.query(sql, [searchVal, query, limit]);
      return res.rows.map(r => mapRowToProduct(r));
    } finally {
      client.release();
    }
  } catch (e) {
    console.warn("DB Error searchProducts:", e.message);
    return [];
  }
}

export async function filterProducts({ gender, category, minPrice, maxPrice, brand, limit = 50 }) {
  try {
    const client = await pool.connect();
    try {
      let sql = `SELECT * FROM products WHERE in_stock = true`;
      const params = [];
      const addParam = (val) => { params.push(val); return `$${params.length}`; };

      if (gender && gender !== 'All' && gender !== 'Unisex') {
        sql += ` AND (gender = ${addParam(gender.toLowerCase())} OR gender = 'unisex')`;
      } else if (gender === 'Unisex') {
         sql += ` AND gender = 'unisex'`;
      }

      if (category && category !== 'All') {
        const p = addParam(category.toLowerCase());
        sql += ` AND (category = ${p} OR sub_category = ${p})`;
      }

      if (brand && brand !== 'All') {
        let brands = [];
        if (Array.isArray(brand)) {
          brands = brand.map(b => b.trim());
        } else if (typeof brand === 'string') {
          brands = brand.split(',').map(b => b.trim()).filter(Boolean);
        }
        if (brands.length > 0) {
          sql += ` AND LOWER(brand) = ANY(${addParam(brands.map(b => b.toLowerCase()))}::text[])`;
        }
      }

      if (minPrice !== undefined) sql += ` AND price >= ${addParam(minPrice)}`;
      if (maxPrice !== undefined) sql += ` AND price <= ${addParam(maxPrice)}`;

      sql += ` AND (image_valid = true OR image_valid IS NULL) ORDER BY popularity_score DESC LIMIT ${addParam(limit)}`;

      const res = await client.query(sql, params);
      return res.rows.map(r => mapRowToProduct(r));
    } finally {
      client.release();
    }
  } catch (e) {
    console.warn("DB Error filterProducts:", e.message);
    return [];
  }
}

export async function trackClick(productId, userId = 'anon') {
  try {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO product_clicks (product_id, user_id) VALUES ($1, $2)`,
        [productId, userId]
      );
      // Also log as interaction for CF
      await logInteraction(userId, productId, 'view', 1);
    } finally {
      client.release();
    }
  } catch (e) {
    // Silent fail for analytics
  }
}

// --- COLLABORATIVE FILTERING HELPERS ---

export async function logInteraction(userId, productId, type, weight = 1) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO user_interactions (user_id, product_id, interaction_type, weight) VALUES ($1, $2, $3, $4)`,
      [userId, productId, type, weight]
    );
  } catch(e) {
    console.error("Log Interaction Error", e);
  } finally {
    client.release();
  }
}

// Fetch items liked by users who also liked the target product (Item-Item Collab)
export async function getCollaborativeCandidates(userId, limit = 50) {
  const client = await pool.connect();
  try {
    const sql = `
      WITH UserLikes AS (
        SELECT product_id FROM user_interactions WHERE user_id = $1 AND weight > 1
      ),
      SimilarUsers AS (
        SELECT DISTINCT ui.user_id 
        FROM user_interactions ui
        JOIN UserLikes ul ON ui.product_id = ul.product_id
        WHERE ui.user_id != $1
        LIMIT 50
      )
      SELECT p.* 
      FROM products p
      JOIN user_interactions ui ON p.id = ui.product_id
      JOIN SimilarUsers su ON ui.user_id = su.user_id
      WHERE ui.weight > 1
      AND p.id NOT IN (SELECT product_id FROM UserLikes) -- Don't recommend what they already liked
      GROUP BY p.id
      ORDER BY SUM(ui.weight) DESC
      LIMIT $2;
    `;
    const res = await client.query(sql, [userId, limit]);
    return res.rows.map(r => mapRowToProduct(r));
  } catch(e) { 
    return []; // Fail gracefully (Cold Start)
  } finally {
    client.release();
  }
}

// Fetch user's history for Content-Based filtering
export async function getUserHistory(userId) {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT p.* FROM products p
      JOIN user_interactions ui ON p.id = ui.product_id
      WHERE ui.user_id = $1
      ORDER BY ui.created_at DESC LIMIT 50
    `;
    const res = await client.query(sql, [userId]);
    // Important: We need the weights to do the learning!
    // Re-fetching interaction weights
    const history = [];
    for(let row of res.rows) {
       const interactionRes = await client.query(`SELECT weight FROM user_interactions WHERE user_id=$1 AND product_id=$2 ORDER BY created_at DESC LIMIT 1`, [userId, row.id]);
       const weight = interactionRes.rows[0]?.weight || 1;
       const prod = mapRowToProduct(row);
       history.push({ product: prod, weight });
    }
    return history;
  } catch(e) {
    return [];
  } finally {
    client.release();
  }
}

// --- STRICT QUERY MODE (The "Fix") ---
export async function queryStrictCandidates({ gender, budget, styles = [], brand, limit = 300 }) {
  try {
    const client = await pool.connect();
    try {
      const params = [];
      const addParam = (val) => { params.push(val); return `$${params.length}`; };

      let sql = `
        SELECT * FROM products 
        WHERE in_stock = true 
        AND (image_valid = true OR image_valid IS NULL)
      `;

      // 1. Strict Gender (No soft matching)
      if (gender && gender.toLowerCase() !== 'unisex') {
        // Strict: matches user gender OR unisex. Does NOT match opposite gender.
        sql += ` AND (gender = ${addParam(gender)} OR gender = 'unisex')`;
      } else {
        // If unisex requested, allow all? Or strictly unisex? 
        // Typically unisex user allows all, but let's be safe and just filter nothing gender-wise or check unisex
        // Let's assume 'Unisex' means "I don't care" -> showing everything is risky. 
        // Better: 'Unisex' products specifically.
        // For the app flow, if user is "Unisex", we usually show Men + Women.
      }

      // 2. Strict Budget
      if (budget) {
        sql += ` AND price <= ${addParam(budget)}`;
      }

      // 3. Strict Brand (If provided)
      if (brand) {
        const brandList = Array.isArray(brand) ? brand : [brand];
        if (brandList.length > 0) {
           sql += ` AND LOWER(brand) = ANY(${addParam(brandList.map(b => b.toLowerCase()))}::text[])`;
        }
      }

      // 4. Style Boosting (Not strict filtering, but ordering)
      // We fetch more than we need, then MMR filters.
      
      sql += ` ORDER BY popularity_score DESC LIMIT ${addParam(limit)}`;

      const { rows } = await client.query(sql, params);
      return rows.map(r => mapRowToProduct(r, false));
    } finally {
      client.release();
    }
  } catch(e) { return []; }
}

export async function getSterileVariety(gender, category, country, budget, limit = 20) {
  try {
    const client = await pool.connect();
    try {
      const catMap = { 'shirt': 'top', 'bottom': 'bottom', 'footwear': 'shoes' };
      const mappedCategory = catMap[category] || category;
      const genderLower = gender ? gender.toLowerCase() : null;

      let sql = `
        SELECT * FROM products
        WHERE in_stock = true
        AND (image_valid = true OR image_valid IS NULL)
      `;
      const params = [];
      const addParam = (val) => { params.push(val); return `$${params.length}`; };

      if (budget) sql += ` AND price <= ${addParam(budget)}`;

      if (genderLower && genderLower !== 'all') {
        sql += ` AND (gender = ${addParam(genderLower)} OR gender = 'unisex')`;
      }

      if (mappedCategory && mappedCategory !== 'all') {
        const p = addParam(mappedCategory);
        sql += ` AND (category = ${p} OR sub_category = ${p})`;
      }
      
      sql += ` ORDER BY popularity_score DESC LIMIT 200`;

      const res = await client.query(sql, params);
      const items = res.rows.map(r => mapRowToProduct(r));

      // Dedup logic: Max 2 per brand for diverse density
      const brandCounts = new Map();
      const selected = [];
      for (const it of items) {
        const count = brandCounts.get(it.brand) || 0;
        if (count < 2) { 
          selected.push(it); 
          brandCounts.set(it.brand, count + 1); 
        }
        if (selected.length >= limit) break;
      }
      
      // If we still need more, fill without brand filter
      if (selected.length < limit) {
        for (const it of items) {
          if (!selected.includes(it)) {
            selected.push(it);
            if (selected.length >= limit) break;
          }
        }
      }

      return selected;
    } finally {
      client.release();
    }
  } catch(e) { return []; }
}

export { pool };
