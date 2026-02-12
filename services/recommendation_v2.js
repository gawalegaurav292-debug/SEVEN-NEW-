
import { GoogleGenAI, Type } from "@google/genai";
import { cosineSim } from "../utils/similarity.js";
import { getCollaborativeCandidates, getUserHistory, pool } from "./db.js";

// TUNING KNOBS
const MMR_LAMBDA = 0.50;
const DUPLICATE_THRESHOLD = 0.75;
const EXPLORATION_WEIGHT = 0.3;

// Fix: Removed top-level GoogleGenAI instance to ensure instantiation happens right before API calls
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function buildUserPosterior(userId) {
  const DIM = 64;
  const mu = new Float32Array(DIM).fill(0);
  const precision = new Float32Array(DIM).fill(1.0);

  if (!userId || userId === 'guest-user') return { mu, precision };

  const history = await getUserHistory(userId); 
  
  for (const event of history) {
    const x = event.product.embeddings;
    const y = event.weight;
    
    if (!x || x.length !== DIM) continue;

    for (let i = 0; i < DIM; i++) {
      const precOld = precision[i];
      const muOld = mu[i];
      
      const precNew = precOld + (x[i] * x[i]);
      const muNew = (precOld * muOld + y * x[i]) / precNew;
      
      precision[i] = precNew;
      mu[i] = muNew;
    }
  }

  return { mu, precision };
}

function scoreCandidate(product, userPosterior, userPrefs) {
  const x = product.embeddings;
  if (!x) return 0;
  
  let mean = 0;
  let variance = 0;
  
  for (let i = 0; i < 64; i++) {
    mean += userPosterior.mu[i] * x[i];
    variance += (x[i] * x[i]) / userPosterior.precision[i];
  }
  
  const uncertainty = Math.sqrt(variance);
  const bayesianScore = mean + (EXPLORATION_WEIGHT * uncertainty);

  // Style Tag Match Bonus - Enhancing relevance (60% priority)
  const userStyles = userPrefs.style || userPrefs.styles || [];
  const itemTags = product.style_tags || product.tags || [];
  const matchCount = itemTags.filter(t => 
    userStyles.some(s => s.toLowerCase() === t.toLowerCase())
  ).length;
  
  const styleBonus = userStyles.length > 0 ? (matchCount / userStyles.length) : 0.5;

  return (styleBonus * 0.6) + (bayesianScore * 0.4);
}

async function rankWithGemini(candidates, userPrefs) {
  if (candidates.length === 0) return [];
  if (!process.env.API_KEY) return candidates; 

  // Fix: Instantiate GoogleGenAI right before the API call to use the most up-to-date key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const productContext = candidates.map(p => ({
    id: p.id,
    b: p.brand,
    t: p.title,
    p: p.price,
    c: p.category,
    s: p.style_tags
  }));

  const prompt = `
    You are a luxury fashion stylist.
    User Context: Style="${userPrefs.style}", Occasion="${userPrefs.occasion}", Gender="${userPrefs.gender}".
    
    Task: Rank these products and provide a 4-8 word "Match Reason" for the top 5.
    
    Rules:
    1. STRICTLY prioritize items that match the Style/Occasion.
    2. "Match Reason" must be specific to the item and user vibe.
    3. Output JSON array: [{ "id": "...", "reason": "..." }, ...].
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    // Fix: Access response.text directly (property, not method)
    const rankedData = JSON.parse(response.text || "[]");
    const ordered = [];
    const candidateMap = new Map(candidates.map(c => [c.id, c]));
    
    for (const item of rankedData) {
      if (candidateMap.has(item.id)) {
        const prod = candidateMap.get(item.id);
        prod.matchReason = item.reason;
        ordered.push(prod);
        candidateMap.delete(item.id);
      }
    }
    for (const item of candidateMap.values()) ordered.push(item);
    return ordered;
  } catch (e) {
    return candidates; 
  }
}

function mmrSelect(candidates, k=50, lambda=MMR_LAMBDA) {
  if (!Array.isArray(candidates) || candidates.length === 0) return [];
  const pool = candidates.slice().sort((a,b) => (b.score || 0) - (a.score || 0));
  const selected = [];
  const brandCounts = new Map();
  
  while (selected.length < k && pool.length > 0) {
    let bestIdx = -1;
    let bestVal = -Infinity;
    
    for (let i = 0; i < pool.length; i++) {
      const cand = pool[i];
      if ((brandCounts.get(cand.brand) || 0) >= 2) continue; // MAX 2 PER BRAND

      const rel = cand.score || 0;
      let maxSim = 0;
      for (const s of selected) {
        let sim = cosineSim(cand.embeddings, s.embeddings);
        if (sim > DUPLICATE_THRESHOLD) maxSim = 1.0;
        else maxSim = Math.max(maxSim, sim);
      }
      const mmr = lambda * rel - (1 - lambda) * maxSim;
      if (mmr > bestVal) { bestVal = mmr; bestIdx = i; }
    }
    
    if (bestIdx > -1) {
      const item = pool.splice(bestIdx, 1)[0];
      selected.push(item);
      brandCounts.set(item.brand, (brandCounts.get(item.brand) || 0) + 1);
    } else break;
  }
  return selected;
}

function composeGraphOutfits(byCat, budget) {
  const outfits = [];
  const tops = byCat.tops.slice(0, 10); 
  const bottoms = byCat.bottoms.slice(0, 10);
  const shoes = byCat.shoes.slice(0, 8);
  
  for (const t of tops) {
    for (const b of bottoms) {
      if (t.price + b.price > budget) continue;
      for (const s of shoes) {
        const total = t.price + b.price + s.price;
        if (total <= budget) {
           outfits.push({ 
             items: [t, b, s], 
             total, 
             score: (t.score || 0) + (b.score || 0) + (s.score || 0)
           });
        }
      }
    }
  }
  return outfits.sort((a,b) => b.score - a.score).slice(0, 5);
}

export async function generateOutfitsV2({ verifiedProducts, user, budget, options = {}, topNOutfits = 3 }) {
  const userPosterior = await buildUserPosterior(user.id);

  verifiedProducts.forEach(p => { 
    p.score = scoreCandidate(p, userPosterior, user); 
  }); 

  const byCat = { tops: [], bottoms: [], shoes: [] };
  for (const p of verifiedProducts) {
    const c = (p.category || "").toLowerCase();
    if (c.includes("top") || c.includes("outerwear") || c.includes("shirt")) byCat.tops.push(p);
    else if (c.includes("shoe") || c.includes("footwear")) byCat.shoes.push(p);
    else if (c.includes("bottom") || c.includes("pant")) byCat.bottoms.push(p);
  }

  byCat.tops = mmrSelect(byCat.tops, 20);
  byCat.bottoms = mmrSelect(byCat.bottoms, 20);
  byCat.shoes = mmrSelect(byCat.shoes, 15);

  const rankedTops = await rankWithGemini(byCat.tops, user);
  const rankedBottoms = await rankWithGemini(byCat.bottoms, user);
  const rankedShoes = await rankWithGemini(byCat.shoes, user); 

  byCat.tops = rankedTops.length > 0 ? rankedTops : byCat.tops;
  byCat.bottoms = rankedBottoms.length > 0 ? rankedBottoms : byCat.bottoms;
  byCat.shoes = rankedShoes.length > 0 ? rankedShoes : byCat.shoes;

  const finalOutfits = composeGraphOutfits(byCat, budget);
  
  return finalOutfits.map((o, idx) => ({
    id: `outfit-gen-${Date.now()}-${idx}`,
    items: o.items,
    totalPrice: o.total,
    score: o.score,
    stylistNote: `Match Score: ${Math.min(99, Math.round(50 + (o.score * 10)))}%`,
    hasFallbackItems: false 
  }));
}
