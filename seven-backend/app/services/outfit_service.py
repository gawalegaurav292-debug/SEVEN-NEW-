import logging

logger = logging.getLogger(__name__)

class OutfitService:
    def __init__(self, openai_service, groq_service):
        self.openai = openai_service
        self.groq = groq_service

    def combine(self, openai_res, groq_res, intent=None):

        o_data = openai_res if isinstance(openai_res, dict) else {}
        g_data = groq_res if isinstance(groq_res, dict) else {}
        i_data = intent if isinstance(intent, dict) else {}

        top = (
            o_data.get("top") or
            g_data.get("top") or
            i_data.get("top") or
            "White Premium Tee"
        )

        bottom = (
            o_data.get("bottom") or
            g_data.get("bottom") or
            i_data.get("bottom") or
            "Black Tailored Chinos"
        )

        source = "fallback"
        if o_data.get("top") or o_data.get("bottom"):
            source = "openai"
        elif g_data.get("top") or g_data.get("bottom"):
            source = "groq"

        return {
            "top": str(top).strip().title(),
            "bottom": str(bottom).strip().title(),
            "meta": {"source": source}
        }