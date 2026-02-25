import os
import json
from dotenv import load_dotenv
from openai import AsyncOpenAI  # <--- Use the Async version

load_dotenv()

class OpenAIService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY missing")

        # Use the AsyncOpenAI client
        self.client = AsyncOpenAI(api_key=api_key)

    async def generate_outfit(self, text: str):
        prompt = f"""
        Suggest ONLY top and bottom outfit.
        No shoes, bags, watches, accessories.

        Return JSON:
        {{
          "top": "...",
          "bottom": "..."
        }}

        Request: {text}
        """

        # We MUST 'await' this call now
        res = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        return json.loads(res.choices[0].message.content)