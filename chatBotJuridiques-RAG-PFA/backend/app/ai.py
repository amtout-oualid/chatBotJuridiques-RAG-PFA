"""
ai.py — Clean wrapper for Google Generative AI (Gemini).

Provides `call_legal_ai(user_input) -> str` for legal AI assistance.

NOTE: No RAG logic is implemented here. The RAG pipeline (vector search,
embeddings, Qdrant) will be integrated inside this function later.
"""

import asyncio
from functools import partial

from google import genai
from google.genai import types

from app.config import get_settings

# ─────────────────────────────────────────────────────────
# Client initialisation (lazy singleton)
# ─────────────────────────────────────────────────────────
_client: genai.Client | None = None


def _get_client() -> genai.Client:
    """Lazily initialise the Gemini client with the API key from settings."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = genai.Client(api_key=settings.GOOGLE_API_KEY)
    return _client


# ─────────────────────────────────────────────────────────
# System prompt for legal context
# ─────────────────────────────────────────────────────────
SYSTEM_PROMPT = (
    "Tu es un assistant juridique intelligent spécialisé dans le droit marocain "
    "et le droit francophone. Tu réponds de manière précise, professionnelle et "
    "structurée aux questions juridiques des utilisateurs. Tu cites les articles "
    "de loi pertinents lorsque possible. Tu ne fournis pas de conseils médicaux, "
    "financiers ou autres hors du domaine juridique. Si tu n'es pas sûr d'une "
    "réponse, tu le précises clairement."
)


import time

def _sync_generate(client: genai.Client, user_input: str, media_parts: list = None) -> str:
    """Synchronous Gemini call — runs inside a thread pool with retry logic."""
    parts = [types.Part.from_text(text=f"{SYSTEM_PROMPT}\n\n{user_input}")]
    
    if media_parts:
        for m in media_parts:
            if "text" in m:
                parts.append(types.Part.from_text(text=m["text"]))
            elif "inline_data" in m:
                parts.append(
                    types.Part.from_bytes(
                        data=m["inline_data"]["data"],
                        mime_type=m["inline_data"]["mime_type"],
                    )
                )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[types.Content(role="user", parts=parts)],
    )
    return response.text or "Désolé, je n'ai pas pu générer de réponse."



# ─────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────
async def call_legal_ai(user_input: str, media_parts: list = None) -> str:
    """
    Send a user prompt to Google Gemini and return the AI response.
    Accepts optional media_parts for multimodal capabilities.
    """
    client = _get_client()

    try:
        result = await asyncio.to_thread(_sync_generate, client, user_input, media_parts)
        return result

    except Exception as exc:
        return f"Erreur lors de la communication avec l'IA : {str(exc)}"
