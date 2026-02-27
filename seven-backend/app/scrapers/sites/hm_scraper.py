import asyncio
import json
import requests
from playwright.async_api import async_playwright


class HMScraper:
    SEARCH_API = "https://api.hm.com/search-services/v1/en_us/search/articles"
    BASE_URL = "https://www2.hm.com"

    # ---------- METHOD 1: DIRECT API ----------
    def search_api(self, query="white t-shirt", limit=5):
        print("🔎 Trying H&M API...")

        params = {
            "q": query,
            "touchPoint": "DESKTOP",
            "pageSource": "search"
        }

        headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json"
        }

        try:
            res = requests.get(self.SEARCH_API, params=params, headers=headers)
            data = res.json()
        except Exception as e:
            print("❌ API error:", e)
            return []

        articles = data.get("articles") or data.get("results") or []
        products = []

        for item in articles[:limit]:
            products.append({
                "name": item.get("name"),
                "price": item.get("price", {}).get("formattedValue"),
                "url": self.BASE_URL + item.get("url", ""),
                "image": (item.get("images") or [{}])[0].get("url"),
                "retailer": "H&M"
            })

        return products


    # ---------- METHOD 2: PLAYWRIGHT ----------
    async def search_playwright(self, query="white t-shirt", limit=5):
        print("🌐 Trying Playwright scraping...")

        url = f"{self.BASE_URL}/search-results.html?q={query.replace(' ', '+')}"

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            page = await browser.new_page()

            await page.goto(url)
            await page.wait_for_timeout(5000)

            items = page.locator('article, li')

            results = []
            count = await items.count()

            for i in range(min(limit, count)):
                card = items.nth(i)

                try:
                    name = await card.locator("h2, h3").inner_text()
                except:
                    name = "Unknown"

                try:
                    price = await card.locator("span").inner_text()
                except:
                    price = ""

                try:
                    link = await card.locator("a").get_attribute("href")
                    link = self.BASE_URL + link if link and link.startswith("/") else link
                except:
                    link = ""

                try:
                    image = await card.locator("img").get_attribute("src")
                except:
                    image = ""

                results.append({
                    "name": name,
                    "price": price,
                    "url": link,
                    "image": image,
                    "retailer": "H&M"
                })

            await browser.close()
            return results


    # ---------- MAIN FUNCTION ----------
    async def search(self, query="white t-shirt", limit=5):

        # Try API first
        api_results = self.search_api(query, limit)

        if api_results:
            print("✅ Got products from API")
            return api_results

        print("⚠️ API failed → Using Playwright")

        return await self.search_playwright(query, limit)