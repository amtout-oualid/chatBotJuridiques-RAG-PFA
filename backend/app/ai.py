"""
ai.py — Clean wrapper for Google Generative AI (Gemini).

Provides `call_legal_ai(user_input) -> str` for legal AI assistance.

NOTE: No RAG logic is implemented here. The RAG pipeline (vector search,
embeddings, Qdrant) will be integrated inside this function later.
"""

from google import genai

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


# ─────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────
async def call_legal_ai(user_input: str) -> str:
    """
    Send a user prompt to Google Gemini and return the AI response.

    Parameters
    ----------
    user_input : str
        The user's message / legal question.

    Returns
    -------
    str
        The AI-generated response text.

    Notes
    -----
    - This is the integration point for RAG. Later, you will prepend
      retrieved context chunks to `user_input` before calling the LLM.
    - The function is async-ready but the underlying SDK call is sync,
      so it runs in the default thread pool executor.
    """
    client = _get_client()

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                {"role": "user", "parts": [{"text": f"{SYSTEM_PROMPT}\n\n{user_input}"}]}
            ],
        )
        return response.text or "Désolé, je n'ai pas pu générer de réponse."

    except Exception as exc:
        # Log the error in production; return a user-friendly message
        return f"Erreur lors de la communication avec l'IA : {str(exc)}"
