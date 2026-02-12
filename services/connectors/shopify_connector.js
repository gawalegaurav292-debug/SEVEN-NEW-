import fetch from "node-fetch";

const TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
if (!TOKEN && process.env.NODE_ENV !== 'test') {
  console.warn("⚠️ SHOPIFY_STOREFRONT_TOKEN not set - Shopify connector will not work.");
}

async function graphqlShopify(shopDomain, query, variables = {}) {
  const url = `https://${shopDomain}/api/2023-10/graphql.json`;
  const headers = {
    "Content-Type": "application/json"
  };
  
  if (TOKEN) {
    headers["X-Shopify-Storefront-Access-Token"] = TOKEN;
  }

  try {
    const r = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      timeout: 20000
    });
    const j = await r.json();
    return j;
  } catch (e) {
    console.error(`Shopify fetch error for ${shopDomain}:`, e.message);
    return null;
  }
}

export async function fetchProductsFromShopify({ shopDomain, limit = 100, cursor = null, collectionHandle = null } = {}) {
  if (!shopDomain) return [];
  
  const products = [];
  let hasNext = true;
  let after = cursor;
  const pageSize = Math.min(50, limit);

  // Safety break to prevent infinite loops
  let pages = 0;
  const MAX_PAGES = 10; 

  while (hasNext && products.length < limit && pages < MAX_PAGES) {
    pages++;
    const query = `
      query ($first: Int!, $after: String, $query: String) {
        products(first: $first, after: $after, query: $query) {
          edges {
            cursor
            node {
              id
              handle
              title
              description
              vendor
              productType
              images(first: 2) { edges { node { transformedSrc } } }
              variants(first: 5) { edges { node { id, title, priceV2 { amount, currencyCode }, availableForSale } } }
            }
          }
          pageInfo { hasNextPage }
        }
      }
    `;
    
    const variables = { 
      first: pageSize, 
      after, 
      query: collectionHandle ? `collection:${collectionHandle}` : null 
    };
    
    const res = await graphqlShopify(shopDomain, query, variables);
    if (!res || !res.data) break;

    const edges = res?.data?.products?.edges || [];
    
    for (const edge of edges) {
      const node = edge.node;
      const images = (node.images.edges || []).map(e => e.node.transformedSrc).filter(Boolean);
      const variants = (node.variants.edges || []).map(v => ({
        id: v.node.id,
        price: Number(v.node.priceV2.amount || 0),
        currency: v.node.priceV2.currencyCode,
        available: v.node.availableForSale,
        size: v.node.title
      }));
      
      if (variants.length === 0) continue;

      const p = {
        source: `shopify:${shopDomain}`,
        source_id: node.id, // e.g. gid://shopify/Product/12345
        brand: node.vendor,
        // Simple mapping logic
        category: (node.productType || "tops").toLowerCase().match(/pant|jean|trouser|bottom/i) ? "bottoms" : 
                  (node.productType || "tops").toLowerCase().match(/shoe|boot|sneaker/i) ? "shoes" : "tops",
        type: node.productType || "apparel",
        title: node.title,
        description: node.description,
        price: variants[0].price,
        currency: variants[0].currency,
        sizes: variants.map(v => v.size),
        colors: [], // Could extract from options if needed
        images: images, // Raw URLs
        in_stock: variants.some(v => v.available),
        ship_countries: ["US", "CA", "UK", "EU"]
      };
      
      products.push(p);
      if (products.length >= limit) break;
      after = edge.cursor;
    }

    hasNext = res?.data?.products?.pageInfo?.hasNextPage && products.length < limit;
  }
  
  return products;
}