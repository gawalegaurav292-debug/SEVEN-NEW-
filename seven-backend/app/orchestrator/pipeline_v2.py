from app.services.style_service import build_outfit
from app.engine.matcher import MatchingEngine

class Orchestrator:
    def __init__(self, gemini_client=None, groq_client=None, openai_client=None):
        self.gemini = gemini_client
        self.groq = groq_client
        self.openai = openai_client
        self.matcher = MatchingEngine()

    async def run(self, user_input: dict):
        intent = await self.parse_intent(user_input)
        creative = await self.generate_outfits(intent)
        structured = await self.structure_output(creative)

        raw_result = await build_outfit(structured)
        products = raw_result.get("products") or raw_result.get("items") or []

        if products:
            best = self.matcher.select_best(products, intent)
            if best:
                return {
                    "primary_look": best.get("primary_look"),
                    "total_price": best.get("total_price"),
                    "confidence": best.get("confidence"),
                    "reasoning": structured.get("reasoning", "Optimized SÉVEN decision")
                }

        return raw_result

    async def parse_intent(self, user_input):
        if self.gemini:
            try:
                return await self.gemini.parse(user_input)
            except Exception:
                pass
        return user_input

    async def generate_outfits(self, intent):
        if self.groq:
            try:
                return await self.groq.generate(intent)
            except Exception:
                pass
        return intent

    async def structure_output(self, data):
        if self.openai:
            try:
                return await self.openai.structure(data)
            except Exception:
                pass
        return data
