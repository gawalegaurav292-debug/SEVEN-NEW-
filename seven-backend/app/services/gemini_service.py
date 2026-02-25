import json
import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self):
        """
        Uses GEMINI_API_KEY automatically from environment.
        Make sure .env has GEMINI_API_KEY=xxxx
        """
        self.client = genai.Client()
        self.model_id = "gemini-2.5-flash"   # best free-speed model


    async def parse_intent(self, text: str) -> dict:
        """
        Extract clothing intent from user text.
        """

        prompt = f"""
        Extract clothing intent from this request:
        "{text}"

        Return ONLY JSON with keys:
        top, bottom, style, occasion

        Do NOT include shoes, bags, accessories.
        """

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema={
                "type": "OBJECT",
                "properties": {
                    "top": {"type": "STRING"},
                    "bottom": {"type": "STRING"},
                    "style": {"type": "STRING"},
                    "occasion": {"type": "STRING"}
                },
                "required": ["top", "bottom", "style", "occasion"]
            }
        )

        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=config
            )

            return json.loads(response.text)

        except Exception as e:
            logger.error(f"Gemini Error: {e}")

            # Safe fallback so app never crashes
            return {
                "top": "white t-shirt",
                "bottom": "blue jeans",
                "style": "casual",
                "occasion": "general",
                "fallback": True
            }