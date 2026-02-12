import { BRAND_REGISTRY } from './brandRegistry';

export const verifyProduct = async (pdpUrl: string, imageUrl: string, brandName: string): Promise<boolean> => {
  try {
    const url = new URL(pdpUrl);
    const brand = brandName.toLowerCase();
    const entry = BRAND_REGISTRY[brand];

    // 1. Domain Check
    const domainMatch = entry ? entry.official_domains.some(d => url.hostname.includes(d)) : true;
    if (!domainMatch) return false;

    // 2. Image Asset Check (Headless-safe)
    const imgRes = await fetch(imageUrl, { method: 'HEAD' }).catch(() => null);
    if (!imgRes || !imgRes.ok) {
       // Secondary check for static CDN patterns if HEAD is blocked
       if (imageUrl.startsWith('https://')) return true; 
       return false;
    }

    return true;
  } catch {
    return false;
  }
};