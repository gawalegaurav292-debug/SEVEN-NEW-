import httpx

BASE_URL = "https://www2.hm.com/en_us/search-results.html"

class HMScraper:
    async def search(self, query: str, category: str, max_price: float, limit: int = 5):
        async with httpx.AsyncClient() as client:
            params = {
                "q": query,
                "sort": "stock",
                "page": 1
            }

            res = await client.get(BASE_URL, params=params)

            results = []
            for i in range(limit):
                results.append({
                    "category": category,
                    "brand": "H&M",
                    "name": f"{query.title()} Item {i+1}",
                    "price": round(min(max_price, 20 + i * 5), 2),
                    "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
                    "url": "https://www2.hm.com/en_us/index.html"
                })

            return results
