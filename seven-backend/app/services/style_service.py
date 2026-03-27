"""
style_service.py
Builds a 3-item outfit (TOP + BOTTOM + SHOES) using:
  1. intent parsing (Gemini if available, otherwise heuristics)
  2. HMScraper — fetches real H&M products in parallel
  3. optional Gemini reasons/headline generation
Falls back to a curated static outfit if anything fails.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from typing import Any, Dict, Optional

from app.scraper.hm_scraper import HMScraper

logger = logging.getLogger(__name__)

try:
    from google import genai  # type: ignore
except Exception:  # pragma: no cover
    genai = None

# ── Budget allocation ─────────────────────────────────────────────────────────
BUDGET_SPLIT = {"TOP": 0.40, "BOTTOM": 0.40, "SHOES": 0.20}

# ── Static fallback ───────────────────────────────────────────────────────────
FALLBACK_OUTFIT: Dict[str, Any] = {
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


# ── Intent parsing ────────────────────────────────────────────────────────────

def _heuristic_intent(request: str, identity: str) -> Dict[str, str]:
    text = request.lower()
    occasion = "casual"
    if any(k in text for k in ["office", "work", "meeting", "professional"]):
        occasion = "office"
    elif any(k in text for k in ["date", "dinner", "party", "night"]):
        occasion = "date night"
    elif any(k in text for k in ["gym", "sport", "running"]):
        occasion = "athleisure"

    style = "minimalist"
    if any(k in text for k in ["street", "cargo", "oversized", "hoodie"]):
        style = "streetwear"
    elif any(k in text for k in ["clean", "simple", "minimal", "plain"]):
        style = "minimalist"
    elif any(k in text for k in ["smart", "formal", "blazer"]):
        style = "smart"

    gender = identity.lower().strip()
    gender_hint = "men" if gender.startswith("men") else "women"

    return {
        "style": style,
        "occasion": occasion,
        "top_query": f"{gender_hint} {request} top shirt tee",
        "bottom_query": f"{gender_hint} {request} jeans pants",
        "shoes_query": f"{gender_hint} {request} shoes sneakers",
    }


async def _gemini_json(prompt: str) -> Optional[Dict[str, Any]]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or genai is None:
        return None

    try:
        client = genai.Client(api_key=api_key)
        resp = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
            contents=prompt,
        )
        text = getattr(resp, "text", "") or ""
        match = re.search(r"\{.*\}", text, re.S)
        if not match:
            return None
        return json.loads(match.group(0))
    except Exception as exc:  # pragma: no cover
        logger.warning("Gemini call failed: %s", exc)
        return None


async def _parse_intent(request: str, identity: str) -> Dict[str, str]:
    prompt = f"""
You are a fashion assistant.
Return ONLY valid JSON with these keys:
style, occasion, top_query, bottom_query, shoes_query

User request: {request}
Identity: {identity}
""".strip()
    data = await _gemini_json(prompt)
    if isinstance(data, dict) and all(k in data for k in ["style", "occasion", "top_query", "bottom_query", "shoes_query"]):
        return {
            "style": str(data["style"]),
            "occasion": str(data["occasion"]),
            "top_query": str(data["top_query"]),
            "bottom_query": str(data["bottom_query"]),
            "shoes_query": str(data["shoes_query"]),
        }
    return _heuristic_intent(request, identity)


async def _generate_reasons(
    request: str,
    top: Dict[str, Any],
    bottom: Dict[str, Any],
    shoes: Dict[str, Any],
    style: str,
    occasion: str,
) -> Dict[str, str]:
    prompt = f"""
You are writing concise fashion styling copy.
Return ONLY valid JSON with keys: headline, top_reason, bottom_reason, shoes_reason.

User request: {request}
Style: {style}
Occasion: {occasion}
Top: {top['name']} (${top['price']})
Bottom: {bottom['name']} (${bottom['price']})
Shoes: {shoes['name']} (${shoes['price']})
""".strip()
    data = await _gemini_json(prompt)
    if isinstance(data, dict):
        return {
            "headline": str(data.get("headline") or "Built for the brief."),
            "top_reason": str(data.get("top_reason") or "Clean and versatile."),
            "bottom_reason": str(data.get("bottom_reason") or "Balances the silhouette."),
            "shoes_reason": str(data.get("shoes_reason") or "Finishes the look.") ,
        }

    return {
        "headline": "Built for the brief.",
        "top_reason": f"Chosen to match the request: {request}.",
        "bottom_reason": "Balanced to anchor the fit.",
        "shoes_reason": "Chosen to complete the outfit cleanly.",
    }


async def build_outfit(request: str, identity: str, budget: float) -> Dict[str, Any]:
    """Main orchestration function used by FastAPI /style."""
    scraper = HMScraper()
    intent = await _parse_intent(request, identity)

    top_max = round(budget * BUDGET_SPLIT["TOP"], 2)
    bottom_max = round(budget * BUDGET_SPLIT["BOTTOM"], 2)
    shoes_max = round(budget * BUDGET_SPLIT["SHOES"], 2)

    top_results, bottom_results, shoes_results = await asyncio.gather(
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

    missing = []
    if not top_results:
        missing.append("TOP")
    if not bottom_results:
        missing.append("BOTTOM")
    if not shoes_results:
        missing.append("SHOES")

    if missing:
        raise ValueError(f"No products found for: {', '.join(missing)}")

    top = top_results[0]
    bottom = bottom_results[0]
    shoes = shoes_results[0]

    reasons = await _generate_reasons(request, top, bottom, shoes, intent["style"], intent["occasion"])
    total = round(float(top["price"]) + float(bottom["price"]) + float(shoes["price"]), 2)

    return {
        "headline": reasons["headline"],
        "total": total,
        "style": intent["style"],
        "occasion": intent["occasion"],
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
