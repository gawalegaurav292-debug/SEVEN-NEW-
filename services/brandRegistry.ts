import { BrandEntry } from '../types';

export const BRAND_REGISTRY: Record<string, BrandEntry> = {
  "nike": {
    brand: "Nike",
    official_domains: ["nike.com"],
    cdn_domains: ["static.nike.com", "images.nike.com"],
    image_strategy: 'headless_required',
    hotlink_allowed: true
  },
  "zara": {
    brand: "Zara",
    official_domains: ["zara.com"],
    cdn_domains: ["static.zara.net", "zara-images.com"],
    image_strategy: 'headless_required',
    hotlink_allowed: true
  },
  "the row": {
    brand: "The Row",
    official_domains: ["therow.com"],
    cdn_domains: ["therow.com"],
    image_strategy: 'static',
    hotlink_allowed: true
  },
  "loro piana": {
    brand: "Loro Piana",
    official_domains: ["loropiana.com"],
    cdn_domains: ["loropiana.com"],
    image_strategy: 'headless_required',
    hotlink_allowed: false
  },
  "gucci": {
    brand: "Gucci",
    official_domains: ["gucci.com"],
    cdn_domains: ["gucci.com", "media.gucci.com"],
    image_strategy: 'static',
    hotlink_allowed: true
  }
};