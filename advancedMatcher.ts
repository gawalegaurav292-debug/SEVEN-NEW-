
import { PRODUCT_CATALOG } from "./catalog";
import { Product, DecisionResult, SlotItem } from "./types";

export function buildOutfit(description: string, gender: 'Men' | 'Women', budget: number): DecisionResult {
  const tokens = description.toLowerCase();
  const selectedGender = gender.toLowerCase() as 'men' | 'women';

  const pool = PRODUCT_CATALOG.filter(p => 
    (p.gender === selectedGender || p.gender === 'unisex') && p.price <= budget
  );

  const matched = pool.filter(p => 
    p.tags.some(tag => tokens.includes(tag)) || tokens.includes(p.color)
  );

  let top = matched.find(p => p.category === "TOP");
  let bottom = matched.find(p => p.category === "BOTTOM");

  // Fallback if specific keywords failed
  if (!top) top = pool.find(p => p.category === "TOP");
  if (!bottom) bottom = pool.find(p => p.category === "BOTTOM");

  if (!top || !bottom) {
    return { status: 'UNAVAILABLE', items: [], reason: "Inventory mismatch.", total: 0 };
  }

  const items: SlotItem[] = [
    { id: top.id, category: 'TOP', name: top.name, brand: top.brand, image_url: top.image.primary, product_url: top.product_url, price: top.price },
    { id: bottom.id, category: 'BOTTOM', name: bottom.name, brand: bottom.brand, image_url: bottom.image.primary, product_url: bottom.product_url, price: bottom.price }
  ];

  return {
    status: 'OK',
    items,
    reason: "Aesthetic parity achieved.",
    total: top.price + bottom.price
  };
}
