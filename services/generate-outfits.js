// services/generate-outfits.js (Recommendation Service V2)

const MMR_LAMBDA = parseFloat(process.env.MMR_LAMBDA || "0.72");

// Utility: Cosine Similarity
function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na)*Math.sqrt(nb) + 1e-12);
}

// Option match: style, occasion, color, size
function optionMatchScore(user, product) {
  const styles = user.styles || [];
  const occasions = user.occasions || [];
  const colors = user.colors || [];
  
  const styleMatch = styles.length === 0 ? 0.5 : ((product.style_tags || []).filter(s => styles.includes(s)).length / Math.max(1, styles.length));
  const occasionMatch = occasions.length === 0 ? 0.5 : ((product.occasion_tags || []).filter(s => occasions.includes(s)).length / Math.max(1, occasions.length));
  const colorMatch = colors.length === 0 ? 0.5 : ((product.colors || []).filter(c => colors.includes(c)).length / Math.max(1, colors.length));
  const sizeMatch = user.size ? ((product.sizes||[]).includes(user.size) ? 1 : 0) : 0.5;
  
  return 0.45*styleMatch + 0.2*occasionMatch + 0.2*colorMatch + 0.15*sizeMatch;
}

// Brand affinity lookup
function getBrandAffinity(user, brand) {
  if (!user || !user.brand_affinity) return 0.5;
  return user.brand_affinity[brand.toLowerCase()] || 0.5;
}

// Score each product
function computeScore(user, product) {
  const userVector = user.preference_vector;
  const embeddingSim = (userVector && product.embeddings) ? cosineSim(userVector, product.embeddings) : 0;
  const optMatch = optionMatchScore(user, product);
  const brandAff = getBrandAffinity(user, product.brand);
  
  // Weights
  const score = 0.45 * optMatch + 0.35 * embeddingSim + 0.15 * brandAff + 0.05 * (product.popularity_score || 0.5);
  return score;
}

// MMR selection
function mmrSelect(candidates, k = 3, lambda = MMR_LAMBDA) {
  if (!Array.isArray(candidates)) return [];
  const pool = candidates.slice().sort((a,b) => b.score - a.score);
  const selected = [];
  
  while (selected.length < k && pool.length > 0) {
    let bestIdx = -1;
    let bestVal = -Infinity;
    
    for (let i = 0; i < pool.length; i++) {
      const cand = pool[i];
      const rel = cand.score;
      let maxSim = 0;
      for (const s of selected) {
        // Use embedding if avail, else fallback to naive similarity
        const sim = (cand.embeddings && s.embeddings) 
          ? cosineSim(cand.embeddings, s.embeddings)
          : (cand.brand === s.brand ? 0.5 : 0) + (cand.category === s.category ? 0.5 : 0);
        maxSim = Math.max(maxSim, sim);
      }
      const mmr = lambda * rel - (1 - lambda) * maxSim;
      if (mmr > bestVal) { bestVal = mmr; bestIdx = i; }
    }
    
    if (bestIdx > -1) {
      selected.push(pool.splice(bestIdx, 1)[0]);
    } else {
      break;
    }
  }
  return selected;
}

// Simple Knapsack for Top/Bottom/Shoe combo
function knapsackCompose(candidatesByCat, budget) {
  const tops = candidatesByCat.tops.slice(0, 20);
  const bottoms = candidatesByCat.bottoms.slice(0, 20);
  const shoes = candidatesByCat.shoes.slice(0, 20);
  const outfits = [];

  for (const t of tops) {
    for (const b of bottoms) {
      const base = t.price + b.price;
      if (base > budget) continue;
      
      // Try with shoes
      for (const s of shoes) {
        const total = base + s.price;
        if (total <= budget) {
          const avgScore = (t.score + b.score + s.score) / 3;
          outfits.push({ items: [t,b,s], total, score: avgScore });
        }
      }
      
      // Try without shoes
      const avgScore = (t.score + b.score) / 2;
      outfits.push({ items: [t,b], total: base, score: avgScore });
    }
  }
  
  outfits.sort((a,b) => b.score - a.score);
  return outfits.slice(0, 5);
}

export async function generateFromVerified({ verifiedProducts, user, budget, topNOutfits = 2 }) {
  // Score items
  verifiedProducts.forEach(p => { p.score = computeScore(user, p); });

  // Group by category
  const byCat = { tops: [], bottoms: [], shoes: [] };
  for (const p of verifiedProducts) {
    const cat = (p.category || "").toLowerCase();
    if (cat.includes("top") || cat.includes("shirt") || cat.includes("jacket") || cat.includes("outerwear")) byCat.tops.push(p);
    else if (cat.includes("shoe") || cat.includes("sneaker") || cat.includes("boot")) byCat.shoes.push(p);
    else byCat.bottoms.push(p); 
  }

  // Apply MMR diversity per category
  byCat.tops = mmrSelect(byCat.tops, 30);
  byCat.bottoms = mmrSelect(byCat.bottoms, 30);
  byCat.shoes = mmrSelect(byCat.shoes, 30);

  // Compose
  const candidateOutfits = knapsackCompose(byCat, budget);
  
  // Format Output
  const selectedOutfits = candidateOutfits.slice(0, topNOutfits);
  
  return selectedOutfits.map((o, idx) => ({
    id: `outfit-${Date.now()}-${idx}`,
    items: o.items,
    totalPrice: o.total,
    score: o.score,
    stylistNote: `Match Score: ${Math.round(o.score * 100)}%`,
    createdAt: new Date().toISOString(),
    hasFallbackItems: o.items.some(i => i.isFallback)
  }));
}
