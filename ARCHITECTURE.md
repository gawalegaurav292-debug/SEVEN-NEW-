# SÉVEN Architecture

## Flow

```
User Input → Intent Parsing → Outfit Generation → Product Retrieval → Matching → Output
```

## Components

**Frontend**
- React + Vite
- Single-page flow: identity → budget → request → verdict
- Calls Supabase Edge Function — no API keys exposed in browser

**AI Layer**
- Intent parsing via Gemini 2.0 Flash
- Extracts: colors, item types, formality level, occasion, style
- Generates per-item styling reasoning

**Matching Engine**
- Multi-factor scoring: color harmony, type match, formality alignment, budget fit
- Color harmony table for shoe selection
- Formality-aware (1 = very casual → 5 = formal)

**Product Layer**
- Supabase PostgreSQL — 34 real products across H&M, Zara, Uniqlo
- Categories: TOP, BOTTOM, SHOES
- Metadata per product: color, type, formality, occasion, style tags, gender

**Backend**
- Supabase Edge Function (`style`) — Deno runtime
- Handles: intent parsing, product matching, Gemini reasoning, request logging

## Output Format

```json
{
  "headline": "stylist note about the full outfit",
  "total": 84.97,
  "occasion": "casual",
  "style": "minimalist",
  "outfit": [
    { "category": "TOP",    "brand": "H&M",   "name": "...", "price": 9.99,  "reason": "...", "image": "...", "url": "..." },
    { "category": "BOTTOM", "brand": "Zara",  "name": "...", "price": 45.90, "reason": "...", "image": "...", "url": "..." },
    { "category": "SHOES",  "brand": "Uniqlo","name": "...", "price": 39.90, "reason": "...", "image": "...", "url": "..." }
  ]
}
```

## Goal

Fast, simple, decision-focused system. Not suggestions — decisions.
