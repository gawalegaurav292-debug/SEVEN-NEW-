
import { SlotItem, SlotStatus, SlotCategory } from '../types';

/**
 * THE STABLE SLOT ENGINE (Step 4 & 5)
 * Enforces budget safety first and maintains invariant fixed slots.
 */
export function createSlots(items: any[], budget: number): SlotItem[] {
  let remaining_budget = budget;
  
  // INVARIANT SLOTS (Step 1): Fixed structural allocation
  const categories: SlotCategory[] = ['TOP', 'BOTTOM', 'ACCESSORY', 'SHOES'];
  
  const slots: SlotItem[] = categories.map(cat => ({
    id: `slot-${cat}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'EMPTY' as SlotStatus,
    category: cat,
    name: "Awaiting Retrieval",
    brand: "SÉVEN Node",
    image_url: null,
    product_url: null,
    price: null
  }));

  // Map resolver results to invariant slots
  categories.forEach((cat, idx) => {
    const match = items.find(item => item.slot?.toUpperCase() === cat);
    
    if (match) {
      // Step 4: Budget Safety (First)
      // Only allocate if price is valid and fits the remaining ceiling
      if (match.price && match.price > 0 && match.price <= remaining_budget) {
        slots[idx] = {
          ...slots[idx],
          status: 'READY',
          name: match.name,
          brand: match.brand,
          image_url: match.image_url,
          product_url: match.product_url,
          price: match.price
        };
        remaining_budget -= match.price;
      } else {
        // Fail-safe: Skip item if budget is violated
        slots[idx].status = 'SKIPPED';
      }
    } else {
      slots[idx].status = 'EMPTY';
    }
  });

  return slots;
}
