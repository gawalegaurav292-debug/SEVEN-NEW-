from app.services.style_service import build_outfit

# Future imports (kept modular for next upgrades)
# from app.engine.matching_engine import match_outfit
# from app.ai.groq_engine import generate_creative_outfit
# from app.ai.openai_engine import enforce_structure

class Orchestrator:
    """
    Central pipeline for SÉVEN AI system
    Handles full flow from input → AI → products → final output
    """

    async def run(self, user_input: dict) -> dict:
        """
        Main execution pipeline
        """

        # STEP 1: Intent + base outfit (Gemini inside style_service)
        base_result = await build_outfit(user_input)

        # STEP 2: (Future) Enhance with creative engine (Groq)
        # creative_result = generate_creative_outfit(base_result)

        # STEP 3: (Future) Enforce strict schema (OpenAI)
        # structured_result = enforce_structure(creative_result)

        # STEP 4: (Future) Matching / scoring engine
        # final_result = match_outfit(structured_result)

        # CURRENT: return base result (safe, no break)
        return base_result
