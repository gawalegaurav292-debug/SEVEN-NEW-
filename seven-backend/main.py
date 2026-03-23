"""
main.py
SÉVEN FastAPI backend — entry point.
Run: uvicorn main:app --host 0.0.0.0 --port 10000
"""

import logging
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()  # must be before any google/env imports

from app.services.style_service import build_outfit, FALLBACK_OUTFIT

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("seven")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="SÉVEN Backend", version="2.0.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ────────────────────────────────────────────────────────────────────

class StyleRequest(BaseModel):
    request: str = Field(..., min_length=2, description="Outfit description")
    identity: str = Field(default="Men", description="Men or Women")
    budget: float = Field(default=200.0, ge=50.0, le=2000.0, description="Budget in USD")


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "SÉVEN Backend", "version": "2.0.0"}


@app.post("/style")
async def style(req: StyleRequest):
    """
    Generate a real outfit from H&M products.
    Falls back to curated outfit if scraper fails.
    """
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    logger.info(
        "[%s] POST /style — request=%r identity=%s budget=%.2f",
        request_id, req.request, req.identity, req.budget,
    )

    try:
        result = await build_outfit(
            request=req.request,
            identity=req.identity,
            budget=req.budget,
        )
        logger.info(
            "[%s] Scraped outfit returned — total=$%.2f items=%d",
            request_id, result["total"], len(result["outfit"]),
        )
        return result

    except Exception as exc:
        logger.error("[%s] build_outfit failed: %s — serving fallback", request_id, exc)
        return FALLBACK_OUTFIT
