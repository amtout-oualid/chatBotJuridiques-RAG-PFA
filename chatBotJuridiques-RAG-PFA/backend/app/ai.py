"""
ai.py — Clean wrapper for Google Generative AI (Gemini).

Provides `call_legal_ai(user_input) -> str` for legal AI assistance.

NOTE: No RAG logic is implemented here. The RAG pipeline (vector search,
embeddings, Qdrant) will be integrated inside this function later.
"""

import asyncio
import time
import json
from functools import partial

from google import genai
from google.genai import types

from app.config import get_settings
from app.logger import rag_logger

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

QUERY_REWRITER_PROMPT = """You are a highly advanced Legal AI Query Router and Translator for Moroccan Law.
Your absolute ONLY GOAL is to optimize the user's raw query for a Vector Database search (ChromaDB).
The Vector Database ONLY contains formal Arabic legal texts and tables.

INSTRUCTIONS:
1. Contextualize: Read the provided 'Chat History' to resolve any pronouns (e.g., "it", "this law") or missing context in the user's new query.
2. Translate & Formalize: Translate the raw query into extremely formal Moroccan Legal Arabic. Fix any typos or grammatical errors.
3. Decompose (If Complex): If the user's query asks multiple distinct questions (e.g., "What is the penalty for theft and what court handles it?"), you MUST split it into an array of smaller, standalone sub-queries.
4. If the query is simple, just return an array with 1 optimized Arabic query.
5. OUTPUT FORMAT: You MUST return strictly a JSON array of strings. Do NOT wrap your output in markdown blocks like ```json. Return ONLY the raw bracketed array.

### Chat History:
{history}

### Raw User Query:
{query}"""

FINAL_GENERATION_PROMPT = """أنت مساعد قانوني ذكي ومحلف متخصص في القانون المغربي.
تم تزويدك بسجل المحادثة الأخير وسياق قانوني مستخرج من قاعدة البيانات للإجابة على سؤال المستخدم.

CRITICAL RULES:
1. Primary Source: You MUST attempt to answer the user's query thoroughly and accurately using ONLY the provided 'Retrieved Context'.
2. Graceful Fallback: If the 'Retrieved Context' DOES NOT contain the exact answer to the user's question, you are ALLOWED to use your general pre-trained legal knowledge to answer.
3. Disclaimer Rule: IF AND ONLY IF you use your general knowledge (Fallback), you MUST append this exact disclaimer at the VERY END of your response in the language of the user (e.g., Arabic: "⚠️ ملاحظة: تم تقديم هذه الإجابة بناءً على المعرفة العامة للذكاء الاصطناعي لعدم توفر النص القانوني الدقيق في قاعدة البيانات الحالية. يرجى التحقق من دقة المعلومات.").
4. Do not mention the existence of the 'Retrieved Context' to the user (e.g., don't say "based on the provided text").

### سجل المحادثة (Chat History):
{history}

### السياق المستخرج (Retrieved Context):
{context}

### سؤال المستخدم (Original Query):
{query}

الإجابة:
"""

def _sync_generate(client: genai.Client, user_input: str, media_parts: list = None, bypass_system_prompt: bool = False) -> str:
    """Synchronous Gemini call — runs inside a thread pool with retry logic."""
    start_time = time.perf_counter()
    
    # Bypass system prompt if we are passing our own complex RAG prompt
    if bypass_system_prompt:
        parts = [types.Part.from_text(text=user_input)]
    else:
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

    rag_logger.debug("Generating content with Gemini API", extra={"media_parts_count": len(media_parts) if media_parts else 0})
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[types.Content(role="user", parts=parts)],
    )
    
    duration_ms = (time.perf_counter() - start_time) * 1000
    rag_logger.info("Gemini API generated content successfully", extra={"duration_ms": round(duration_ms, 2)})
    return response.text or "Désolé, je n'ai pas pu générer de réponse."

def _sync_rewrite_query(client: genai.Client, prompt: str) -> list[str]:
    """Synchronously asks Gemini to output a JSON array of sub-queries."""
    start_time = time.perf_counter()
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1
        )
    )
    duration_ms = (time.perf_counter() - start_time) * 1000
    
    raw_text = response.text.strip()
    if raw_text.startswith("```json"):
        raw_text = raw_text[7:-3].strip()
    elif raw_text.startswith("```"):
        raw_text = raw_text[3:-3].strip()
        
    try:
        sub_queries = json.loads(raw_text)
        if not isinstance(sub_queries, list):
            sub_queries = [raw_text]
        rag_logger.info("Query rewritten and decomposed successfully", extra={
            "sub_queries": sub_queries,
            "duration_ms": round(duration_ms, 2)
        })
        return sub_queries
    except Exception as e:
        rag_logger.error(f"Failed to parse rewrite JSON: {e}. Raw text: {raw_text}", exc_info=True)
        return []

# ─────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────
async def call_legal_ai(user_input: str, media_parts: list = None, bypass_system_prompt: bool = False) -> str:
    """
    Send a user prompt to Google Gemini and return the AI response.
    Accepts optional media_parts for multimodal capabilities.
    """
    client = _get_client()

    try:
        result = await asyncio.to_thread(_sync_generate, client, user_input, media_parts, bypass_system_prompt)
        return result

    except Exception as exc:
        rag_logger.error(f"Error communicating with Gemini AI: {exc}", exc_info=True)
        return f"Erreur lors de la communication avec l'IA : {str(exc)}"

async def rewrite_query_async(history: str, query: str) -> list[str]:
    """
    Translates and decomposes a complex user query into an array of formal Arabic sub-queries.
    """
    client = _get_client()
    prompt = QUERY_REWRITER_PROMPT.format(history=history, query=query)
    
    try:
        sub_queries = await asyncio.to_thread(_sync_rewrite_query, client, prompt)
        if not sub_queries:
            return [query] # Fallback to original
        return sub_queries
    except Exception as exc:
        rag_logger.error(f"Error during query rewriting: {exc}", exc_info=True)
        return [query] # Fallback to original on catastrophic failure
