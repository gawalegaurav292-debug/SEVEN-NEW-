import asyncio
import json
from urllib.parse import urlencode
from playwright.async_api import async_playwright


class HMScraper:
    BASE_URL = "https://www2.hm.com/en_us"

    def __init__(self, headless=False):
        self.headless = headless

    async def search(self, query="white t-shirt", limit=5):

        params = {"q": query}
        url = f"{self.BASE_URL}/search-results.html?{urlencode(params)}"

        print("Opening:", url)

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=self.headless)
            page = await browser.new_page()

            await page.goto(url, wait_until="domcontentloaded")

            # Get Next.js JSON
            data = await page.evaluate("""
                () => {
                    let el = document.getElementById('__NEXT_DATA__');
                    return el ? el.innerText : null;
                }
            """)

            await browser.close()

        if not data:
            print("❌ Could not find __NEXT_DATA__")
            return []

        try:
            json_data = json.loads(data)
        except Exception as e:
            print("❌ JSON parse error:", e)
            return []

        # Try to find products inside JSON
        products = []

        def find_products(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if k.lower() in ["products", "items", "results"]:
                        if isinstance(v, list):
                            return v
                    res = find_products(v)
                    if res:
                        return res
            elif isinstance(obj, list):
                for item in obj:
                    res = find_products(item)
                    if res:
                        return res
            return None

        product_list = find_products(json_data)

        if not product_list:
            print("❌ No products found in JSON")
            return []

        for p in product_list[:limit]:
            name = p.get("name") or p.get("title") or "Unknown"
            price = p.get("price", {}).get("value") if isinstance(p.get("price"), dict) else p.get("price")
            link = p.get("url") or p.get("link") or ""
            image = p.get("image") or p.get("imageUrl") or ""

            products.append({
                "name": name,
                "price": price,
                "url": link,
                "image": image,
                "retailer": "H&M"
            })

        return products


# Test directly
if __name__ == "__main__":
    async def run():
        scraper = HMScraper(headless=False)
        res = await scraper.search("white t-shirt", 5)

        print("\nRESULTS:\n")
        for r in res:
            print(r)

    asyncio.run(run())