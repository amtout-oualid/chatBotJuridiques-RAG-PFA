"""
gpt4o_extractor.py — Extraction du texte arabe depuis les images PDF via GPT-4o Vision
PAYANT : ~$0.01 par page (mode high detail)
"""
import base64
import time
from typing import List, Tuple
from PIL import Image
from openai import OpenAI

from app.config import settings
from app.core.ingestion.extractor import PDFExtractor
from app.core.ingestion.ocr_cache import get_cached_pages, save_to_cache
from app.logger import rag_logger

# Prompt système spécialisé pour les documents juridiques arabes
SYSTEM_PROMPT = """أنت محلل متخصص في استخراج النصوص من الوثائق القانونية المغربية والعربية.
مهمتك هي:
1. استخراج النص كاملاً وبشكل حرفي ومطابق تماماً من الصورة المقدمة لك، دون تفويت أي كلمة.
2. الحفاظ على بنية النص.
3. لا تترجم النص - أعده كما هو.
4. تجاهل الرؤوس والتذييلات المتكررة.
أعد النص المستخرج فقط، بدون تعليقات أو مقدمات.

CRITICAL INSTRUCTIONS:
1. You MUST extract the exact same text without missing anything.
2. Break the text into logical blocks and wrap EVERY block inside <chunk> and </chunk> tags.
3. The length of the text inside each <chunk> MUST BE STRICTLY LESS THAN 512 characters. If a logical block is longer, split it into multiple <chunk> tags.
4. For tables, extract them in Markdown format and wrap them like this: <table> <title>Table Name and Description</title> <content>| Column |... markdown table ...</content> </table>. Tables are exempt from the 512 character limit.
5. All text extracted must be inside either a <chunk> tag or a <table> tag. There should be NO loose text outside of these tags."""

USER_PROMPT = "استخرج كل النص الموجود في هذه الوثيقة القانونية."


class GPT4oExtractor:
    """
    Extrait le texte arabe des pages PDF en utilisant GPT-4o Vision.
    Chaque page est envoyée comme image encodée en base64.
    """

    def __init__(self):
        self._client = None  # Initialisé à la demande (lazy)
        self.pdf_extractor = PDFExtractor()

    @property
    def client(self):
        if self._client is None:
            if not settings.OPENAI_API_KEY:
                rag_logger.error("OPENAI_API_KEY missing for GPT-4o OCR extraction")
                raise ValueError(
                    "OPENAI_API_KEY non configurée. Ajoutez votre clé dans backend/.env "
                    "pour traiter les PDFs scannés. Les PDFs textuels fonctionnent sans clé."
                )
            self._client = OpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    def _encode_image_base64(self, img: Image.Image) -> str:
        import io
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode("utf-8")

    def extract_text_from_image(
        self, img: Image.Image, page_number: int
    ) -> str:
        start_time = time.perf_counter()
        rag_logger.debug("Starting GPT-4o Vision OCR on page", extra={"page_number": page_number})
        try:
            image_b64 = self._encode_image_base64(img)

            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_b64}",
                                    "detail": "high",  # high detail pour les documents juridiques
                                },
                            },
                            {"type": "text", "text": USER_PROMPT},
                        ],
                    },
                ],
                max_tokens=4096,
                temperature=0,  # 0 = déterministe, important pour l'extraction
            )

            extracted = response.choices[0].message.content or ""
            duration_ms = (time.perf_counter() - start_time) * 1000
            rag_logger.info("GPT-4o Vision OCR complete for page", extra={
                "page_number": page_number, 
                "chars_extracted": len(extracted),
                "duration_ms": round(duration_ms, 2)
            })
            return extracted.strip()

        except Exception as e:
            rag_logger.error(f"GPT-4o Vision OCR error on page {page_number}: {e}", exc_info=True)
            raise

    def extract_all_pages(
        self, pdf_path: str
    ) -> List[Tuple[int, str]]:
        cached = get_cached_pages(pdf_path)
        if cached is not None:
            rag_logger.info("Using cached OCR results for PDF", extra={"pdf_path": pdf_path, "pages": len(cached)})
            return cached

        start_time = time.perf_counter()
        rag_logger.info("Starting GPT-4o full document OCR extraction", extra={"pdf_path": pdf_path})

        page_images = self.pdf_extractor.convert_to_images(pdf_path)

        results: List[Tuple[int, str]] = []
        for page_num, img in page_images:
            try:
                text = self.extract_text_from_image(img, page_num)
                if text:  # On garde seulement les pages avec du contenu
                    results.append((page_num, text))
            except Exception as e:
                rag_logger.warning(f"Page {page_num} ignorée suite à erreur: {e}")
                continue

        duration_ms = (time.perf_counter() - start_time) * 1000
        rag_logger.info("GPT-4o full document OCR extraction complete", extra={
            "pdf_path": pdf_path,
            "pages_processed": len(results),
            "total_pages": len(page_images),
            "duration_ms": round(duration_ms, 2)
        })

        if results:
            save_to_cache(pdf_path, results)

        return results
