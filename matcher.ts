
import { PRODUCT_CATALOG } from "./catalog";
import { ParsedIntent } from "./intentParser";
import { Product } from "./types";

type MatcherContext = {
  intent: ParsedIntent;
  defaultGender: "men" | "women";
  budget: number;
};

export function matchOutfit({ intent, defaultGender, budget }: MatcherContext) {
  // 1. Gender Barrier (Strict)
  const gender = intent.gender || defaultGender;
  const pool = PRODUCT_CATALOG.filter(p => p.gender === gender || p.gender === 'unisex');

  let remainingBudget = budget;
  
  // Extract active colors from intent
  const activeColors: string[] = [];
  if (intent.wantsBlack) activeColors.push("black");
  if (intent.wantsGrey) activeColors.push("grey");
  if (intent.wantsBlue) activeColors.push("blue");
  if (intent.wantsWhite) activeColors.push("white");
  if (intent.wantsBeige) activeColors.push("beige");

  const hasColorConstraint = activeColors.length > 0;

  // 2. Match Top
  // We filter the pool for tops.
  const topCandidates = pool.filter(p => {
    if (p.category !== "TOP") return false;
    
    // Check type match based on intent flags
    if (intent.wantsHoodie && p.type !== "hoodie") return false;
    if (intent.wantsShirt && p.type !== "shirt") return false;
    if (intent.wantsTshirt && p.type !== "tshirt") return false;
    
    // Check color
    if (hasColorConstraint && !activeColors.includes(p.color)) return false;

    return p.price <= remainingBudget;
  });

  // Fallback: If strict type match fails, try relaxing type but keep color/budget
  let finalTopCandidates = topCandidates;
  if (topCandidates.length === 0) {
     finalTopCandidates = pool.filter(p => p.category === "TOP" && (!hasColorConstraint || activeColors.includes(p.color)) && p.price <= remainingBudget);
  }
  // Ultimate Fallback: Just any top within budget
  if (finalTopCandidates.length === 0) {
     finalTopCandidates = pool.filter(p => p.category === "TOP" && p.price <= remainingBudget);
  }

  const top = finalTopCandidates.length > 0 ? finalTopCandidates[0] : null;

  if (top) {
    remainingBudget -= top.price;
  }

  // 3. Match Bottom
  const bottomCandidates = pool.filter(p => {
    if (p.category !== "BOTTOM") return false;
    
    // Check type match
    if (intent.wantsJeans && p.type !== "jeans") return false;
    if (intent.wantsPants && p.type === "jeans") return false; // Exclude jeans if pants requested (assuming distinction)
    if (intent.wantsChino && p.type !== "chino") return false;

    // Check color
    if (hasColorConstraint && !activeColors.includes(p.color)) return false;

    return p.price <= remainingBudget;
  });

  // Fallback for bottom
  let finalBottomCandidates = bottomCandidates;
  if (bottomCandidates.length === 0) {
      finalBottomCandidates = pool.filter(p => p.category === "BOTTOM" && (!hasColorConstraint || activeColors.includes(p.color)) && p.price <= remainingBudget);
  }
  if (finalBottomCandidates.length === 0) {
      finalBottomCandidates = pool.filter(p => p.category === "BOTTOM" && p.price <= remainingBudget);
  }

  const bottom = finalBottomCandidates.length > 0 ? finalBottomCandidates[0] : null;

  const items: Product[] = [];
  if (top) items.push(top);
  if (bottom) items.push(bottom);

  return {
    status: (top && bottom) ? "OK" : "UNAVAILABLE",
    items,
    total: (top?.price || 0) + (bottom?.price || 0)
  };
}