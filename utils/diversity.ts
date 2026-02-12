
import { Product } from '../types';

/**
 * SÉVEN Diversity Engine
 * Strictly enforces a max items per brand limit and interleaves 
 * brands and styles to ensure a premium, variety-rich visual feed.
 */
export const applyDiversity = (products: Product[], maxPerBrand: number = 2): Product[] => {
  if (!products || products.length === 0) return [];

  const brandBuckets: Record<string, Product[]> = {};
  
  // 1. Group by brand and strictly enforce the cap
  // We assume input products are already sorted by relevance/popularity
  products.forEach(p => {
    const brand = p.brand || 'Unknown';
    if (!brandBuckets[brand]) brandBuckets[brand] = [];
    if (brandBuckets[brand].length < maxPerBrand) {
      brandBuckets[brand].push(p);
    }
  });

  const result: Product[] = [];
  const brands = Object.keys(brandBuckets);
  
  // Find the max length across all buckets for interleaving
  const maxInBucket = Math.max(...Object.values(brandBuckets).map(b => b.length), 0);

  // 2. Interleave brands
  // This ensures that the top of the feed doesn't cluster items from the same brand
  for (let i = 0; i < maxInBucket; i++) {
    // We shuffle the brand keys slightly per iteration to avoid the same brand order
    const shuffledBrands = [...brands].sort(() => 0.5 - Math.random());
    
    shuffledBrands.forEach(brand => {
      if (brandBuckets[brand][i]) {
        result.push(brandBuckets[brand][i]);
      }
    });
  }

  return result;
};
