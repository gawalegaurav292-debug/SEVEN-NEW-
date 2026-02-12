
import fetch from 'node-fetch';

// Brand API endpoints
const STOCK_API = {
  nike: 'https://api.nike.com/merch/skus/v1',
  zara: 'https://www.zara.com/api/v1/product/store-stock',
  asos: 'https://api.asos.com/product/v1/stock'
};

export async function checkBulkStock(productIds, brand) {
  const normalizedBrand = (brand || 'generic').toLowerCase();

  // Robust fallback: If no API key is present OR brand not supported, simulate.
  if (!process.env.RAKUTEN_API_KEY || !STOCK_API[normalizedBrand]) {
     return productIds.map(id => ({
        productId: id,
        inStock: true, 
        shippingDays: 3 + Math.floor(Math.random() * 4),
        lastChecked: new Date().toISOString(),
        simulated: true
     }));
  }

  try {
    const response = await fetch(STOCK_API[normalizedBrand], {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.RAKUTEN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ product_ids: productIds, country: 'US' })
    });

    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();

    return data.map(p => ({
      productId: p.id,
      inStock: p.available,
      shippingDays: p.delivery?.estimatedDays || 3,
      lastChecked: new Date().toISOString()
    }));

  } catch (error) {
    console.error(`Stock check failed for ${brand}:`, error.message);
    // Fallback on error to prevent frontend failure
    return productIds.map(id => ({
      productId: id,
      inStock: null,
      fallback: true,
      message: 'Check stock on brand site'
    }));
  }
}
