// scripts/sterile-ingest.js – ingest 1 verified brand
// Usage: node scripts/sterile-ingest.js <brand> <gender> <country> <feedUrl>
import fetch from "node-fetch";

const brand = process.argv[2] || 'Myntra';
const gender = process.argv[3] || 'men';
const country = process.argv[4] || 'IN';
const feedUrl = process.argv[5]; 

if (!feedUrl) {
  console.log('Usage: node scripts/sterile-ingest.js <brand> <gender> <country> <feedUrl>');
  process.exit(1);
}

// Note: This script assumes a "variety ingest" endpoint exists similar to the worker logic 
// provided in the previous turn. However, since the current codebase uses a robust ingest worker
// (`services/ingest-worker.js`), this script acts as a trigger wrapper or direct injector.
// 
// For this implementation, we will mock the trigger to the new endpoint, 
// but in a real scenario, this would POST to a worker endpoint.
// 
// Since the user asked for this specific file content:

console.log(`Triggering Sterile Ingest for ${brand}...`);

// We are calling the local backend which has the variety endpoint, 
// though typically ingestion happens via the worker. 
// This acts as a manual trigger for the "Sterile" flow.

fetch('http://localhost:3001/api/products/variety', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ingest: {
      feed_url: feedUrl,
      brand: brand,
      country: country,
      gender: gender
    }
  })
})
.then(async (res) => {
  const text = await res.text();
  console.log("Response:", text);
})
.catch(err => console.error("Error:", err.message));
