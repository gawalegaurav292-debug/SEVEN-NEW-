# Contributing to SÉVEN

## Focus

- Better outfit quality
- Better matching accuracy
- Simpler UX

## Rules

- Keep it simple
- No overengineering
- Improve output quality first

## Where to start

**Edge Function** (`supabase/functions/style/index.ts`)
The core AI pipeline lives here. Intent parsing, product scoring, Gemini reasoning.

**Product catalog**
Expand the catalog or improve metadata (color, type, formality tags) for better matching.

**Frontend** (`src/App.tsx`)
Improve the verdict screen, add animations, or reduce friction in the input flow.

## What not to do

- Do not add complexity without improving output quality
- Do not break the edge function fallback
- Do not expose API keys in the frontend
