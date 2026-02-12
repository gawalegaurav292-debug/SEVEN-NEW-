
import { Product } from './types';
import { VISIBLE_PRODUCTS } from './catalog';

export const APP_NAME = "SÉVEN";

export const COLOR_MAP: Record<string, string[]> = {
  "blue": ["blue", "navy", "ocean"],
  "black": ["black", "dark", "noir"],
  "white": ["white", "cream", "pearl"],
  "beige": ["beige", "skin", "nude", "khaki"],
  "grey": ["grey", "gray", "silver"]
};

export const CATEGORY_MAP: Record<string, string> = {
  "shirt": "TOP",
  "hoodie": "TOP",
  "pant": "BOTTOM",
  "pants": "BOTTOM",
  "jeans": "BOTTOM",
  "jacket": "LAYER",
  "sneakers": "SHOES"
};

// Use the safe filtered list directly
export const INVENTORY: Product[] = VISIBLE_PRODUCTS.map(p => ({
  ...p,
  colors: [p.color],
  tags: [p.type, p.color, p.category.toLowerCase()],
  sizes: ['S', 'M', 'L', 'XL'], // Default sizes for prototype
  in_stock: true,
  affiliate_url: p.product_url
}));

export const CURRENCY_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.94,
  GBP: 0.81,
  JPY: 151.2
};

export const BRAND_OPTIONS = ['H&M', 'Zara', 'Uniqlo', 'Nike', 'Adidas'];
