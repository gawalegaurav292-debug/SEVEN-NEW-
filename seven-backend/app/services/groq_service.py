import os
import json
import logging
from groq import AsyncGroq  # <--- Use the Async version

logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY missing")

        # Initialize the non-blocking client
        self.client = AsyncGroq(api_key=api_key)

    async def generate_outfit(self, text: str) -> dict:
        prompt = f"""
        Suggest ONLY top and bottom outfit. No accessories.
        Return ONLY valid JSON.
        
        Request: {text}
        
        Example JSON:
        {{
          "top": "Vintage wash denim jacket",
          "bottom": "Black slim-fit chinos"
        }}
        """

        try:
            # We 'await' the response so the server stays responsive
            res = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile", # The current 2026 performance leader
                messages=[{"role": "user", "content": prompt}],
                # Note: Groq also supports JSON mode for structured data
                response_format={"type": "json_object"}
            )

            # Parse the string into a real dictionary
            return json.loads(res.choices[0].message.content)
            
        except Exception as e:
            logger.error(f"Groq Service Error: {e}")
            return {
                "top": "Minimalist white tee",
                "bottom": "Dark indigo jeans",
                "error": "fallback_applied"
            }