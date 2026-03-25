"""
style_service.py
Builds a 3-item outfit (TOP + BOTTOM + SHOES) using real H&M products.

Pipeline:
  1. Gemini parses request → 3 search queries
  2. HMScraper runs all 3 in parallel (asyncio.gather)
  3. Gemini generates per-item reasons + headline
  4. Returns structured response or raises so caller can fall back
"""

import asyncio
import json
import logging
from typing import Optional

from google import genai
from google.genai import types

from app.scraper.sites.hm_scraper import HMScraper

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Budget split  (TOP 40 % | BOTTOM 40 % | SHOES 20 %)
# ---------------------------------------------------------------------------
_SPLIT = {"TOP": 0.40, "BOTTOM": 0.40, "SHOES": 0.20}

# ---------------------------------------------------------------------------
# Static fallback (used when scraper + every retry fails)
# ---------------------------------------------------------------------------
FALLBACK_OUTFIT: dict = {
    "headline": "Clean lines. Confident presence. Always intentional.",
    "total": 84.97,
    "style": "minimalist",
    "occasion": "casual",
    "outfit": [
        {
            "category": "TOP",
            "brand": "H&M",
            "name": "White Cotton T-Shirt",
            "price": 9.99,
            "reason": "The foundation of every clean outfit.",
            "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80",
            "url": "https://www2.hm.com/en_us/productpage.0685816001.html",
        },
        {
            "category": "BOTTOM",
            "brand": "H&M",
            "name": "Blue Denim Jeans",
            "price": 39.99,
            "reason": "Classic denim grounded in proportion.",
            "image": "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=500&q=80",
            "url": "https://www2.hm.com/en_us/productpage.0999373001.html",
        },
        {
            "category": "SHOES",
            "brand": "H&M",
            "name": "White Canvas Sneakers",
            "price": 34.99,
            "reason": "White soles keep the palette tight.",
            "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
            "url": "https://www2.hm.com/en_us/productpage.0999380001.html",
        },
    ],
}

# ---------------------------------------------------------------------------
# Gemini helpers
# ---------------------------------------------------------------------------

def _gemini() -> genai.Client:
    return genai.Client()  # reads GEMINI_API_KEY from env


async def _parse_intent(request: str, identity: str, budget: float) -> dict:
    """Return { top_query, bottom_query, shoes_query, style, occasion }."""
    gender = identity.lower()
    prompt = (
        f'Parse this outfit request into H&M search queries.\n'
        f'Request: "{request}"\n'
        f'Gender: {identity} | Budget: ${budget}\n\n'
        f'Return ONLY valid JSON (no markdown):\n'
        f'{{\n'
        f'  "top_query": "2-4 word H&M query for top, include {gender}",\n'
        f'  "bottom_query": "2-4 word H&M query for bottom, include {gender}",\n'
        f'  "shoes_query": "2-4 word H&M query for shoes, include {gender}",\n'
        f'  "style": "one of: casual|formal|streetwear|minimalist|business|smart",\n'
        f'  "occasion": "one of: casual|work|date|party|weekend|everyday"\n'
        f'}}'
    )
    try:
        client = _gemini()
        resp = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
                max_output_tokens=300,
            ),
        )
        return json.loads(resp.text)
    except Exception as exc:
        logger.warning("Intent parse failed (%s) – using keyword fallback", exc)
        g = gender
        return {
            "top_query": f"{g} t-shirt",
            "bottom_query": f"{g} jeans",
            "shoes_query": f"{g} sneakers",
            "style": "casual",
            "occasion": "casual",
        }


async def _gen_reasons(
    request: str,
    top: dict,
    bottom: dict,
    shoes: dict,
    style: str,
    occasion: str,
) -> dict:
    """Return { headline, top_reason, bottom_reason, shoes_reason }."""
    prompt = (
        f'You are SÉVEN, a confident minimalist AI stylist.\n'
        f'User: "{request}" | Style: {style} | Occasion: {occasion}\n\n'
        f'Outfit:\n'
        f'- TOP:    {top["name"]} by {top["brand"]} (${top["price"]:.2f})\n'
        f'- BOTTOM: {bottom["name"]} by {bottom["brand"]} (${bottom["price"]:.2f})\n'
        f'- SHOES:  {shoes["name"]} by {shoes["brand"]} (${shoes["price"]:.2f})\n\n'
        f'Return ONLY valid JSON (no markdown):\n'
        f'{{\n'
        f'  "headline": "one confident sentence 8-12 words about the full outfit",\n'
        f'  "top_reason": "why this top works, 6-10 words, item-specific",\n'
        f'  "bottom_reason": "why this bottom works, 6-10 words, item-specific",\n'
        f'  "shoes_reason": "why these shoes complete it, 6-10 words"\n'
        f'}}'
    )
    try:
        client = _gemini()
        resp = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.4,
                max_output_tokens=300,
            ),
        )
        return json.loads(resp.text)
    except Exception as exc:
        logger.warning("Reason gen failed (%s) – using defaults", exc)
        return {
            "headline": "A clean, confident outfit built for the moment.",
            "top_reason": "Anchors the outfit with the right tone.",
            "bottom_reason": "Balanced silhouette, works with everything.",
            "shoes_reason": "Completes the look without competing.",
        }


# ---------------------------------------------------------------------------
# Main public function
# ---------------------------------------------------------------------------

async def build_outfit(request: str, identity: str, budget: float) -> dict:
    """
    Build a real 3-item outfit from H&M products.

    Raises ValueError if any category returns no products
    (caller must catch and serve FALLBACK_OUTFIT).
    """
    scraper = HMScraper()

    # 1. Intent → search queries
    intent = await _parse_intent(request, identity, budget)
    style: str = intent.get("style", "casual")
    occasion: str = intent.get("occasion", "casual")

    top_max = budget * _SPLIT["TOP"]
    bottom_max = budget * _SPLIT["BOTTOM"]
    shoes_max = budget * _SPLIT["SHOES"]

    # 2. Parallel scrape
    tops, bottoms, shoes_list = await asyncio.gather(
        scraper.search(
            query=intent["top_query"],
            category="TOP",
            max_price=top_max,
            limit=5,
        ),
        scraper.search(
            query=intent["bottom_query"],
            category="BOTTOM",
            max_price=bottom_max,
            limit=5,
        ),
        scraper.search(
            query=intent["shoes_query"],
            category="SHOES",
            max_price=shoes_max,
            limit=5,
        ),
    )

    missing = (
        (["TOP"] if not tops else [])
        + (["BOTTOM"] if not bottoms else [])
        + (["SHOES"] if not shoes_list else [])
    )
    if missing:
        raise ValueError(f"No products found for: {', '.join(missing)}")

    top = tops[0]
    bottom = bottoms[0]
    shoes = shoes_list[0]

    # 3. AI reasons
    reasons = await _gen_reasons(request, top, bottom, shoes, style, occasion)

    total = round(top["price"] + bottom["price"] + shoes["price"], 2)

    return {
        "headline": reasons["headline"],
        "total": total,
        "style": style,
        "occasion": occasion,
        "outfit": [
            {
                "category": "TOP",
                "brand": top["brand"],
                "name": top["name"],
                "price": top["price"],
                "reason": reasons["top_reason"],
                "image": top["image"],
                "url": top["url"],
            },
            {
                "category": "BOTTOM",
                "brand": bottom["brand"],
                "name": bottom["name"],
                "price": bottom["price"],
                "reason": reasons["bottom_reason"],
                "image": bottom["image"],
                "url": bottom["url"],
            },
            {
                "category": "SHOES",
                "brand": shoes["brand"],
                "name": shoes["name"],
                "price": shoes["price"],
                "reason": reasons["shoes_reason"],
                "image": shoes["image"],
                "url": shoes["url"],
            },
        ],
    }
