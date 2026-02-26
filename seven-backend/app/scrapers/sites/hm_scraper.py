import aiohttp
import asyncio
from urllib.parse import quote


class HMScraper:
    BASE_API = "https://api.hm.com/search-services/v1/en_us/search/articles"

    def __init__(self):
        pass

    async def search(self, query="white t-shirt", limit=5):
        query_encoded = quote(query)
        url = f"{self.BASE_API}?q={query_encoded}&page-size={limit}"

        print("Calling H&M API:", url)

        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    print("❌ API error:", resp.status)
                    return []

                data = await resp.json()

        products = []

        try:
            articles = data.get("results", [])
        except:
            print("❌ Unexpected API format")
            return []

        for item in articles[:limit]:
            try:
                article_id = item.get("code")
                name = item.get("name")
                price = item.get("whitePrice", {}).get("formattedValue")

                image = None
                images = item.get("images", [])
                if images:
                    image = images[0].get("url")

                url = f"https://www2.hm.com/en_us/productpage.{article_id}.html"

                products.append({
                    "name": name,
                    "price": price,
                    "image": image,
                    "url": url,
                    "retailer": "H&M"
                })

            except Exception as e:
                print("Parse error:", e)

        return products


# Test runner
if __name__ == "__main__":
    async def run():
        scraper = HMScraper()
        results = await scraper.search("white t-shirt", 5)

        print("\nRESULTS\n")
        for r in results:
            print(r)

    asyncio.run(run())