"""
hm_scraper.py
Fetches real H&M products.
Strategy: H&M public API → Playwright headless fallback.
Always returns: [{ name, brand, price, image, url, category }]
"""

import asyncio
import logging
import re
from typing import Optional

import requests

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Category inference
# ---------------------------------------------------------------------------

_CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "TOP": [
        "shirt", "tee", "t-shirt", "blouse", "top", "hoodie", "sweatshirt",
        "sweater", "pullover", "knitwear", "polo", "blazer", "coat",
        "cardigan", "vest", "crop", "tank", "camisole", "tunic", "jersey",
        "overshirt", "button",
    ],
    "BOTTOM": [
        "jeans", "pants", "trousers", "chinos", "shorts", "skirt", "leggings",
        "joggers", "culottes", "cargo", "wide-leg", "wide leg", "slim-fit",
        "slim fit", "denim", "culotte",
    ],
    "SHOES": [
        "sneakers", "shoes", "boots", "loafers", "sandals", "heels",
        "trainers", "mules", "flats", "pumps", "oxfords", "ankle boot",
        "chelsea", "slipper",
    ],
}


def _infer_category(name: str) -> str:
    n = name.lower()
    for cat, keywords in _CATEGORY_KEYWORDS.items():
        if any(kw in n for kw in keywords):
            return cat
    return "TOP"


def _parse_price(raw) -> float:
    if raw is None:
        return 0.0
    try:
        return float(re.sub(r"[^\d.]", "", str(raw)))
    except ValueError:
        return 0.0


def _fix_url(url: str, base: str) -> str:
    if not url:
        return ""
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("/"):
        return base + url
    return url


# ---------------------------------------------------------------------------
# Scraper
# ---------------------------------------------------------------------------

class HMScraper:
    _API = "https://api.hm.com/search-services/v1/en_us/search/articles"
    _BASE = "https://www2.hm.com"
    _UA = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
    _HEADERS = {
        "User-Agent": _UA,
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www2.hm.com/en_us/index.html",
    }

    # ------------------------------------------------------------------
    # API (fast path)
    # ------------------------------------------------------------------

    def _api(self, query: str, n: int) -> list[dict]:
        try:
            resp = requests.get(
                self._API,
                params={
                    "q": query,
                    "touchPoint": "DESKTOP",
                    "pageSource": "search",
                    "page": 0,
                    "pageSize": n,
                },
                headers=self._HEADERS,
                timeout=10,
            )
        except requests.exceptions.RequestException as exc:
            logger.warning("H&M API request error: %s", exc)
            return []

        if resp.status_code == 403:
            logger.warning("H&M API 403 – switching to Playwright")
            return []
        if not resp.ok:
            logger.warning("H&M API %s", resp.status_code)
            return []

        try:
            data = resp.json()
        except Exception:
            return []

        articles = data.get("articles") or data.get("results") or []
        products = []

        for item in articles:
            name = (item.get("name") or item.get("title") or "").strip()
            if not name:
                continue

            # price
            price_raw = (
                (item.get("price") or {}).get("value")
                or (item.get("price") or {}).get("formattedValue")
                or (
                    (item.get("defaultArticle") or {})
                    .get("price", {})
                    .get("value")
                )
            )

            # image
            imgs = item.get("images") or item.get("galleryImages") or []
            image = ""
            if imgs:
                f = imgs[0]
                image = (f.get("url") or f.get("src") or "") if isinstance(f, dict) else str(f)
            image = _fix_url(image, self._BASE)

            # url
            url = _fix_url(item.get("url") or item.get("link") or "", self._BASE)
            if not url:
                url = f"{self._BASE}/en_us/search-results.html?q={query}"

            products.append({
                "name": name,
                "brand": "H&M",
                "price": _parse_price(price_raw),
                "image": image,
                "url": url,
                "category": _infer_category(name),
            })

        return products

    # ------------------------------------------------------------------
    # Playwright fallback
    # ------------------------------------------------------------------

    async def _playwright(self, query: str, n: int) -> list[dict]:
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            logger.error("playwright not installed – no fallback available")
            return []

        search_url = f"{self._BASE}/en_us/search-results.html?q={query.replace(' ', '+')}"
        products = []

        try:
            async with async_playwright() as pw:
                browser = await pw.chromium.launch(headless=True)
                ctx = await browser.new_context(
                    user_agent=self._UA, locale="en-US"
                )
                page = await ctx.new_page()
                await page.goto(search_url, wait_until="domcontentloaded", timeout=25_000)
                await page.wait_for_timeout(3_500)

                cards = []
                for sel in [
                    "article.product-item",
                    "li.product-item",
                    "[class*='product-item']",
                    "[data-testid='product-item']",
                ]:
                    cards = await page.query_selector_all(sel)
                    if cards:
                        break

                for card in cards[:n]:
                    try:
                        ne = await card.query_selector(
                            "h2, h3, [class*='name'], [class*='title'], [class*='Name']"
                        )
                        name = (await ne.inner_text()).strip() if ne else ""

                        pe = await card.query_selector(
                            "[class*='price'], .price, [data-testid='price']"
                        )
                        price_raw = (await pe.inner_text()).strip() if pe else "0"

                        ie = await card.query_selector("img")
                        image = ""
                        if ie:
                            image = (
                                await ie.get_attribute("src")
                                or await ie.get_attribute("data-src")
                                or ""
                            )
                        image = _fix_url(image, self._BASE)

                        le = await card.query_selector("a")
                        href = _fix_url(
                            (await le.get_attribute("href") or "") if le else "",
                            self._BASE,
                        )

                        if name:
                            products.append({
                                "name": name,
                                "brand": "H&M",
                                "price": _parse_price(price_raw),
                                "image": image,
                                "url": href or search_url,
                                "category": _infer_category(name),
                            })
                    except Exception:
                        continue

                await browser.close()

        except Exception as exc:
            logger.error("Playwright failed: %s", exc)

        return products

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    async def search(
        self,
        query: str,
        category: Optional[str] = None,
        max_price: Optional[float] = None,
        limit: int = 5,
    ) -> list[dict]:
        """
        Search H&M products.

        Args:
            query:     Search term, e.g. "men white t-shirt"
            category:  Optional filter – "TOP" | "BOTTOM" | "SHOES"
            max_price: Optional price ceiling (USD)
            limit:     Max results returned

        Returns:
            List of { name, brand, price, image, url, category }
        """
        fetch = limit * 4  # over-fetch so filters still leave enough

        # enrich query with category hint
        enriched = query
        if category == "BOTTOM" and not any(
            w in query.lower() for w in ("jeans", "pants", "trouser", "skirt")
        ):
            enriched += " pants"
        elif category == "SHOES" and "shoe" not in query.lower():
            enriched += " shoes"

        products = self._api(enriched, fetch)

        if not products:
            products = await self._playwright(enriched, fetch)

        # filter by inferred category
        if category:
            products = [p for p in products if p["category"] == category]

        # drop zero-price only if there are priced alternatives
        priced = [p for p in products if p["price"] > 0]
        if priced:
            products = priced

        # apply price ceiling
        if max_price is not None:
            products = [p for p in products if p["price"] <= max_price]

        return products[:limit]
