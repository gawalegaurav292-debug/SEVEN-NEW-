
// services/observability.js
// Simulating Google Cloud Logging for demo environment

export function logIngestion(brand, count, status) {
  const timestamp = new Date().toISOString();
  const entry = {
    event: 'ingestion',
    severity: status === 'success' ? 'INFO' : 'ERROR',
    brand,
    count,
    timestamp
  };
  console.log(`[OBSERVABILITY] ${JSON.stringify(entry)}`);
}

export function logRAG(query, resultCount) {
  const timestamp = new Date().toISOString();
  const entry = {
    event: 'rag_generation',
    severity: 'INFO',
    query,
    resultCount,
    timestamp
  };
  console.log(`[OBSERVABILITY] ${JSON.stringify(entry)}`);
}

export function logStockCheck(count, brand, status) {
  const timestamp = new Date().toISOString();
  const entry = {
    event: 'bulk_stock_check',
    severity: status === 'success' ? 'INFO' : 'ERROR',
    brand,
    count,
    status,
    timestamp
  };
  console.log(`[OBSERVABILITY] ${JSON.stringify(entry)}`);
}
