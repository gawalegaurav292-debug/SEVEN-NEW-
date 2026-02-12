
import { PRODUCT_CATALOG } from "./catalog";
import { normalizeIntent } from "./intent";

export function buildOutfit({
  description,
  gender,
  budget,
}: {
  description: string;
  gender: "men" | "women";
  budget: number;
}) {
  const intent = normalizeIntent(description);
  let remaining = budget;

  // 1. FILTER TOPS
  const topCandidates = PRODUCT_CATALOG.filter(
    (p) =>
      p.gender === gender &&
      p.category === "TOP" &&
      (intent.colors.length === 0 || intent.colors.includes(p.color)) &&
      p.price <= remaining
  );

  // If strict color match fails, try relaxing color filter for tops if none found?
  // For Zero-Drift, we prefer failing or showing a neutral option if user was specific.
  // But let's stick to the prompt's logic: strict filter.
  // If no specific top color requested, show any.
  
  const tops = intent.colors.length > 0 
    ? topCandidates 
    : PRODUCT_CATALOG.filter(p => p.gender === gender && p.category === "TOP" && p.price <= remaining);

  if (!tops.length) {
    return { status: "UNAVAILABLE", reason: "No matching top found." };
  }

  // Pick cheapest valid top to maximize chance for bottom, or first valid
  const top = tops[0]; 
  remaining -= top.price;

  // 2. FILTER BOTTOMS
  const bottomCandidates = PRODUCT_CATALOG.filter(
    (p) =>
      p.gender === gender &&
      p.category === "BOTTOM" &&
      (intent.colors.length === 0 || intent.colors.includes(p.color)) &&
      p.price <= remaining
  );

  const bottoms = intent.colors.length > 0
    ? bottomCandidates
    : PRODUCT_CATALOG.filter(p => p.gender === gender && p.category === "BOTTOM" && p.price <= remaining);

  if (!bottoms.length) {
    return { status: "UNAVAILABLE", reason: "Budget matched top, but not bottom." };
  }

  const bottom = bottoms[0];

  return {
    status: "OK",
    items: [top, bottom],
    total: top.price + bottom.price,
  };
}
