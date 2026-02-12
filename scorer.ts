
import { Product } from "./types";

export function scoreProduct(
  product: Product,
  intentType?: string,
  intentColor?: string,
  budgetLeft?: number
) {
  let score = 0;

  // 0. VISUAL SAFETY (Critical)
  // Ensure the image exists
  if (product.image?.primary) {
    score += 100;
  } else {
    score -= 1000;
  }

  // 1. Strict Category/Type Boost
  if (intentType) {
    if (product.type === intentType) score += 50;
    else if (product.type.includes(intentType)) score += 25;
  }

  // 2. Color Boost
  if (intentColor) {
    if (product.color === intentColor) score += 30;
    // Handle synonyms
    else if (intentColor === 'gray' && product.color === 'grey') score += 30;
    else if (intentColor === 'navy' && product.color === 'blue') score += 20;
  }

  // 3. Budget Efficiency
  if (budgetLeft !== undefined && product.price <= budgetLeft) {
    score += 20;
  }

  return score;
}
