import asyncio
import uuid
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Import services
from app.services.gemini_service import GeminiService
from app.services.openai_service import OpenAIService
from app.services.groq_service import GroqService
from app.services.outfit_service import OutfitService

app = FastAPI(title="SÉVEN Backend")

logger = logging.getLogger("uvicorn")

# Initialize services
gemini = GeminiService()
openai_ai = OpenAIService()
groq_ai = GroqService()
outfit_ai = OutfitService(openai_ai, groq_ai)

# Request model
class StyleRequest(BaseModel):
    text: str


# Health check
@app.get("/")
def home():
    return {"message": "SÉVEN Backend Running 🚀"}


# Main styling endpoint
@app.post("/style")
async def style(request: StyleRequest):

    request_id = f"req_{uuid.uuid4().hex[:8]}"

    try:
        # 1️⃣ Parse intent with Gemini
        try:
            intent = await gemini.parse_intent(request.text)
        except Exception as e:
            logger.error(f"Gemini error: {e}")
            intent = {
                "top": "white t-shirt",
                "bottom": "blue jeans",
                "style": "casual",
                "occasion": "general",
                "fallback": True
            }

        # 2️⃣ Generate outfits with OpenAI + Groq in parallel
        try:
            openai_res, groq_res = await asyncio.gather(
                openai_ai.generate_outfit(request.text),
                groq_ai.generate_outfit(request.text)
            )
        except Exception as e:
            logger.error(f"AI generation error: {e}")
            openai_res = {"top": "white t-shirt", "bottom": "blue jeans"}
            groq_res = {"top": "black shirt", "bottom": "grey pants"}

        # 3️⃣ Combine results
        final = outfit_ai.combine(openai_res, groq_res)

        return {
            "request_id": request_id,
            "intent": intent,
            "top_bottom_only": True,
            "outfit": final
        }

    except Exception as e:
        logger.error(f"SÉVEN Engine Error [{request_id}]: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Styling Error")