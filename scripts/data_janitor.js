
import { Pool } from 'pg';
import { GoogleGenAI } from "@google/genai";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/sevendb",
});

async function forceCleanProduct(product) {
  // Moved GoogleGenAI initialization inside the function as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Product title: "${product.title}"
Brand: ${product.brand}
Description: "${product.description || ''}"
Current Category: "${product.category}"

=== RULES (VIOLATION = FAILURE) ===
1. Return EXACTLY 2 words: "gender category"
2. Gender MUST be: men, women, unisex
3. Category MUST be one of: top, bottom, shoes, outerwear, accessory, dress
4. NO JSON, NO explanation, NO punctuation
5. Example: "men top" or "women shoes"

Now answer:`;

  try {
    // Updated to gemini-3-flash-preview for data processing task
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "text/plain" }
    });
    
    const text = res.text.trim().toLowerCase().replace(/[^a-z ]/g, '');
    const parts = text.split(/\s+/);
    
    if (parts.length !== 2) return null;
    
    const [gender, category] = parts;
    const validGenders = ['men', 'women', 'unisex'];
    const validCategories = ['top', 'bottom', 'shoes', 'outerwear', 'accessory', 'dress'];
    
    if (!validGenders.includes(gender) || !validCategories.includes(category)) {
      return null;
    }
    
    return { gender, category };
  } catch (e) {
    console.error(`Gemini Error for ${product.id}:`, e.message);
    return null;
  }
}

async function runJanitor() {
  const client = await pool.connect();
  try {
    console.log("🧹 Starting Data Janitor (Strict Force Clean Mode)...");
    
    // Fetch products that might have ambiguous data
    const res = await client.query(`SELECT id, title, description, brand, gender, category FROM products WHERE gender_verified = false OR gender IS NULL LIMIT 500`);
    const products = res.rows;

    console.log(`Found ${products.length} products to verify.`);

    let fixedCount = 0;

    for (const p of products) {
      const correction = await forceCleanProduct(p);
      
      if (correction) {
        const { gender, category } = correction;
        
        // Map 'dress' to 'outerwear' or 'top' if your schema requires, or keep as is if schema allows
        // For this schema, we map 'dress' to 'outerwear' to be safe, or keep as sub_category
        let finalCategory = category;
        if (category === 'dress') finalCategory = 'outerwear'; 

        if (gender !== p.gender || finalCategory !== p.category) {
          console.log(`✅ Fixed ${p.id}: ${p.gender || '?'}->${gender}, ${p.category || '?'}->${finalCategory}`);
          await client.query(
            `UPDATE products SET gender = $1, category = $2, sub_category = $3, gender_verified = true WHERE id = $4`,
            [gender, finalCategory, category, p.id]
          );
          fixedCount++;
        } else {
          await client.query(`UPDATE products SET gender_verified = true WHERE id = $1`, [p.id]);
        }
      }
    }
    console.log(`✨ Janitor cycle complete. Fixed ${fixedCount} items.`);
  } catch (e) {
    console.error("Janitor failed:", e);
  } finally {
    client.release();
    pool.end();
  }
}

runJanitor();
