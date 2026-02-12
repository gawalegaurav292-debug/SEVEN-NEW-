import fetch from "node-fetch";
const TOKEN = process.env.SHOPIFY_TOKEN;
const SHOP = process.env.SHOPIFY_SHOP;
const PAGE_SIZE = parseInt(process.env.INGEST_PAGE_SIZE || "50", 10);

async function graphql(query, variables) {
  const url = `https://${SHOP}/api/2024-10/graphql.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

export async function fetchAllProductsShopify({ maxPages = 200 } = {}) {
  const products = [];
  let hasNext = true;
  let cursor = null;
  let pages = 0;

  const query = `
    query ($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        pageInfo { hasNextPage }
        edges {
          cursor
          node {
            id
            handle
            title
            description
            vendor
            productType
            tags
            images(first:5) { edges { node { url } } }
            variants(first: 10) { edges { node { id, sku, priceV2 { amount, currencyCode }, availableForSale } } }
          }
        }
      }
    }
  `;

  while (hasNext && pages < maxPages) {
    const vars = { first: PAGE_SIZE, after: cursor };
    const data = await graphql(query, vars);
    const edges = data.products.edges;
    if (!edges || edges.length === 0) break;
    for (const e of edges) {
      const n = e.node;
      const images = (n.images.edges || []).map(x => x.node.url).filter(Boolean);
      const variants = (n.variants.edges || []).map(v => ({
        variant_id: v.node.id,
        sku: v.node.sku,
        price: Number(v.node.priceV2.amount || 0),
        currency: v.node.priceV2.currencyCode,
        available: v.node.availableForSale
      }));
      products.push({
        source: `shopify:${SHOP}`,
        source_id: n.id,
        sku: variants[0]?.sku || n.handle,
        brand: n.vendor,
        category: (n.productType || "apparel").toLowerCase(),
        sub_category: n.productType,
        style_tags: n.tags || [],
        title: n.title,
        description: n.description,
        images,
        variants,
        last_fetched: new Date().toISOString()
      });
    }
    pages++;
    hasNext = data.products.pageInfo.hasNextPage;
    cursor = edges[edges.length - 1].cursor;
  }
  return products;
}
