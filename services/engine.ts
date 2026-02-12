
import { DecisionResult, SlotItem, SlotCategory, UserIntent, AdvancedIntent, CandidatePools, TasteSelection, Product } from '../types';
import { INVENTORY, COLOR_MAP } from '../constants';

/**
 * SÉVEN — ZERO-DRIFT DETERMINISTIC ENGINE
 * 
 * CORE PRINCIPLE:
 * Phase 1: Hard Filter (Gender, Category, Budget, Verification) -> Safety
 * Phase 2: Soft Score (Color, Style, Fit) -> Relevance
 */

// --- 1. DETERMINISTIC PARSER (No AI) ---

export function parseIntentDeterministic(advancedIntent: AdvancedIntent, currency: string): UserIntent {
  return {
    gender: advancedIntent.gender,
    budget_cap: advancedIntent.budget,
    currency: currency as any,
    items: advancedIntent.requested_items.map(req => {
      // Deterministic Color Normalization
      const rawColor = (req.color || '').toLowerCase();
      let normalizedColors: string[] = [];
      
      // Iterate over COLOR_MAP keys (e.g., 'blue') and check their variants
      for (const [key, variants] of Object.entries(COLOR_MAP)) {
        if (variants.some(v => rawColor.includes(v))) {
          normalizedColors.push(key);
        }
      }

      return {
        category: req.category,
        color_constraints: normalizedColors, // e.g. ['blue']
        type_keywords: req.type ? [req.type] : []
      };
    })
  };
}

// --- 2. THE VAULT (Hard Filter + Soft Score) ---

function calculateRelevanceScore(product: Product, req: UserIntent['items'][0]): number {
  let score = 0;

  // A. Color Match (Soft)
  if (req.color_constraints.length > 0 && product.colors) {
    const pColors = product.colors.map(c => c.toLowerCase());
    const hasColor = pColors.some(c => req.color_constraints.includes(c));
    
    if (hasColor) {
      score += 100; // Major boost for color match
    }
  } else if (req.color_constraints.length === 0) {
    score += 20; // Bonus for "no color specified" (avoids penalizing neutrals)
  }

  // B. Type/Keyword Match (Soft)
  const productText = `${product.name} ${product.description || ''} ${product.tags?.join(' ') || ''}`.toLowerCase();
  req.type_keywords.forEach(kw => {
    if (productText.includes(kw.toLowerCase())) score += 50;
  });

  return score;
}

function getCandidatesForSlot(
  req: UserIntent['items'][0],
  gender: 'Men' | 'Women' | 'Unisex',
  budget: number
): SlotItem[] {
  // 1. HARD FILTER (The non-negotiables)
  const validProducts = INVENTORY.filter(p => {
    // Gender strictness: If user is Men, do NOT show Women items.
    if (gender !== 'Unisex') {
       const userGender = gender.toLowerCase();
       if (p.gender !== 'unisex' && p.gender !== userGender) return false;
    }
    
    // Category strictness
    if (p.category !== req.category) return false;
    
    // Budget strictness (Item must fit within total budget - simple heuristic)
    // In a real multi-item solver we'd use LP, but here we filter items > budget.
    if (p.price > budget) return false;
    
    // Verification strictness
    if (!p.verified || !p.in_stock) return false;
    
    return true;
  });

  // 2. SOFT SCORE
  const scoredProducts = validProducts.map(p => ({
    ...p,
    relevance: calculateRelevanceScore(p, req)
  }));

  // 3. SORT & SELECT (Best matches first)
  // Sort by score DESC, then price ASC (cheaper is better tie breaker for now)
  return scoredProducts
    .sort((a, b) => (b.relevance - a.relevance) || (a.price - b.price))
    .slice(0, 5) // Top 5 candidates per slot
    .map(p => ({
      id: p.id,
      status: 'READY',
      category: p.category as SlotCategory,
      name: p.name,
      brand: p.brand,
      image_url: p.image.primary,
      product_url: p.affiliate_url || null,
      price: p.price,
      score: p.relevance
    }));
}

export function getValidCandidates(intent: UserIntent): CandidatePools {
  // Fix: Property 'LAYER' was missing in the CandidatePools object.
  const pools: CandidatePools = { TOP: [], BOTTOM: [], SHOES: [], ACCESSORY: [], LAYER: [] };
  
  intent.items.forEach(req => {
    pools[req.category] = getCandidatesForSlot(req, intent.gender, intent.budget_cap);
  });

  return pools;
}

// --- 3. ASSEMBLY (Deterministic) ---

export function constructDecisionResult(
  intent: UserIntent, 
  pools: CandidatePools, 
  selection: TasteSelection
): DecisionResult {
  const finalItems: SlotItem[] = [];
  let totalSpent = 0;
  const missingCategories: string[] = [];

  // Iterate through user requests to fulfill them based on AI selection or Fallback
  intent.items.forEach(req => {
    const cat = req.category;
    const pool = pools[cat];
    
    // Strict Check: If pool is empty, we CANNOT fulfill this request.
    if (pool.length === 0) {
      missingCategories.push(cat);
      return;
    }

    // Try AI Selection first (TASTE Layer)
    const selectedId = selection.selection[cat];
    let item = pool.find(i => i.id === selectedId);

    // Fallback: If AI picked invalid ID (or didn't pick), take the #1 scored item from strict code filter
    if (!item) {
       item = pool[0]; // The Engine's top pick
    }

    // Double check budget accumulation
    if ((totalSpent + (item.price || 0)) <= intent.budget_cap) {
      finalItems.push(item);
      totalSpent += (item.price || 0);
    } else {
      // If adding this item breaks the budget, try to find a cheaper one in the pool?
      // For this MVP, we just fail the item to be safe, or pick cheaper.
      const cheaperItem = pool.find(i => (totalSpent + (i.price || 0)) <= intent.budget_cap);
      if (cheaperItem) {
        finalItems.push(cheaperItem);
        totalSpent += (cheaperItem.price || 0);
      } else {
        missingCategories.push(cat + " (Budget)");
      }
    }
  });

  // CRITICAL FAIL: If any requested item is missing, return UNAVAILABLE.
  // We do not partial-match outfits. All or nothing.
  if (missingCategories.length > 0) {
    return {
      status: 'UNAVAILABLE',
      items: [],
      reason: `No verified items found for: ${missingCategories.join(', ')} within criteria.`,
      stylistDirectives: ["Inventory Constraint"],
      meta: { total_price: 0, currency: intent.currency }
    };
  }

  return {
    status: 'OK',
    items: finalItems,
    reason: selection.reason || "Matches strict criteria.",
    stylistDirectives: [
      `Gender: ${intent.gender}`,
      `Total: $${totalSpent}`,
      `Verified: True`
    ],
    meta: {
      total_price: totalSpent,
      currency: intent.currency
    }
  };
}
