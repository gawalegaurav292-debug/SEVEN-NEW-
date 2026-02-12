
export type SlotCategory = 'TOP' | 'BOTTOM' | 'SHOES' | 'ACCESSORY' | 'LAYER';
export type SlotStatus = 'EMPTY' | 'READY' | 'SKIPPED';

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  image: { primary: string };
  product_url: string;
  category: SlotCategory;
  gender: 'men' | 'women' | 'unisex';
  color: string;
  colors?: string[];
  tags: string[];
  verified: boolean;
  in_stock: boolean;
  description?: string;
  type: string;
  affiliate_url?: string;
  sizes?: string[];
}

export interface SlotItem {
  id: string;
  category: SlotCategory;
  name: string;
  brand: string;
  image_url: string | null;
  product_url: string | null;
  price: number | null;
  status?: SlotStatus;
  score?: number;
}

export interface DecisionResult {
  status: 'OK' | 'UNAVAILABLE';
  items: SlotItem[];
  reason: string;
  total?: number;
  stylistDirectives?: string[];
  meta?: {
    total_price: number;
    currency: string;
  };
}

export interface DecisionContext {
  gender: 'Men' | 'Women';
  investment: number;
  refinement: string;
  identity?: string;
  build?: string;
  fit?: string;
  age?: string;
  occasion?: string;
  colorDNA?: string;
  exclusions?: string;
  inspiration?: string;
  currency?: string;
}

export interface CartItem extends Product {
  selectedSize: string;
}

export interface Outfit {
  id?: string;
  items: SlotItem[];
  totalPrice?: number;
  score?: number;
  stylistNote?: string;
  reason?: string;
}

export interface Order {
  id: string;
  items: any[];
  total: number;
  status: string;
  date: string;
  currency: string;
}

export interface UserPreferences {
  budget: number;
  gender?: string;
  style?: string[];
}

export interface UserMemory {
  history: DecisionResult[];
  tasteVector: {
    color: Record<string, number>;
    fit: string;
    brands: string[];
  };
}

export interface UserIntent {
  gender: 'Men' | 'Women' | 'Unisex';
  budget_cap: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY';
  items: {
    category: SlotCategory;
    color_constraints: string[];
    type_keywords: string[];
  }[];
}

export interface AdvancedIntent {
  gender: 'Men' | 'Women' | 'Unisex';
  budget: number;
  requested_items: {
    category: SlotCategory;
    color?: string;
    type?: string;
  }[];
}

export type CandidatePools = Record<SlotCategory, SlotItem[]>;

export interface TasteSelection {
  selection: Record<SlotCategory, string>;
  reason: string;
}

export interface BrandEntry {
  brand: string;
  official_domains: string[];
  cdn_domains: string[];
  image_strategy: 'static' | 'headless_required';
  hotlink_allowed: boolean;
}
