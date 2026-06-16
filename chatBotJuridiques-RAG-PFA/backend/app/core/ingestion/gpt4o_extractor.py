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
SYSTEM_PROMPT = """أنت خبير متقدم ومحلف في هندسة البيانات وتحليل النصوص من الوثائق الإدارية والقانونية لـ "مؤسسة قانونية " بالمغرب.

### 🎯 الهدف من العملية (THE GOAL):

نحن نستخدم بنية RAG (الاسترجاع المعزز بالتوليد) للإجابة على أسئلة قانونية وإدارية دقيقة تخص مستعملين . لذلك، مهمتك هي استخراج جميع النصوص من هذا المصدر، واستخدام العلامات (XML Tags) بدقة لتخبر نظامنا برمجياً أين يجب أن يقطع (Chunk) النص. جودة التقسيم الذي ستقوم به تحدد دقة إجابات النظام لاحقاً.

### 🛑 1. قواعد تصفية الضوضاء (NOISE FILTERING - CRITICAL):
يجب ألا تدخل المعلومات التالية في قاعدة البيانات لأنها تكرار يفسد البحث:
- تجاهل الترويسة العلوية المتكررة: "المملكة المغربية"، "وزارة الاقتصاد والمالية"، "مؤسسة الأعمال الاجتماعية لموظفي وزارة الاقتصاد والمالية" والشعارات.
- تجاهل التذييل السفلي: العنوان (شارع أحمد الشرقاوي...)، .
- تجاهل الأختام الزرقاء والتوقيعات (مثل: توقيع مدير المؤسسة حكيم فيرادي).
- استثنـــاء: يجب الحفاظ دائماً على "رقم الدورية/الإعلان" (مثل CIR 09/26 أو COM 08/26) وتاريخها وموضوعها، لأنها تعطي السياق للملف.

### 🧠 2. قواعد الاستخراج اللغوي:
- استخرج النص كما هو بالضبط. لا تلخص، ولا تشرح.
- حافظ على الكلمات الأجنبية كما هي بأحرفها اللاتينية (مثل: ONCF, EQDOM, PDF, Wafa IMA Assistance, Scan).
- انتبه بشدة للتواريخ، الأرقام، النسب المئوية (مثل 40%)، والمبالغ المالية (مثل 30.000 درهم).
-من خلال فهمك للناس أضف في بداية كل chunk شي ليبقى ال- context  أفهم في 5- 15 كلمة 
-عندما تستخرج النص اضف في بديته او اعد صيغته ليصبح له سياق و مفهوم من  لا تزيل او تعدل اي معمومة فقد اضف في بدية للنص
### ⚙️ 3. CRITICAL XML TAGGING INSTRUCTIONS (THE ADAPTIVE ENGINE):
You are feeding a semantic chunker. EVERY single word you extract MUST be encapsulated inside either a <chunk> tag or a <table> tag. NO ORPHAN TEXT IS ALLOWED. Do NOT wrap your output in ```xml markdown blocks.

A. TEXT CHUNKING & CONTEXTUALIZATION (<chunk> ... </chunk>):
- Analyze the flow of the document. Break the text into logical, cohesive units based on the legal context. 
- A "logical unit" is usually a numbered point (e.g., "أولا: ...", "ثانيا: ..."), a distinct paragraph, or a specific warning/note (ملحوظة) some thing that will help us when we will turn this into chunks for rag pipline .
- STRICT SIZE LIMIT: A single <chunk> must be between 30 to 150 words (safely under 512 tokens). 
- If a section (like a long list of conditions) is too large, split it naturally at sentence boundaries into multiple sequential <chunk> tags so the RAG pipeline can retrieve them perfectly and add the context also.

B. ADAPTIVE TABLE EXTRACTION (<table> ... </table>):
- Documents contain varying table structures (e.g., EQDOM rates, Hajj grants, Wafa IMA coverage limits, and the 2026 Services Calendar).
- You MUST extract tables in Markdown format and wrap them exactly like this:
  <table>
    <title>Write a highly descriptive Arabic title containing the context and the circular number and must incoud the context also from your read to the docement  (e.g., 'جدول عروض القروض الاستهلاكية لشركة EQDOM - إعلان COM 08/26' or 'سلة خدمات المؤسسة المبرمجة لسنة 2026')</title>
    <content>
    | Header 1 | Header 2 |
    |---|---|
    | Data 1 | Data 2 |
    </content>
  </table>
- CALENDARS/MATRICES: If you encounter a complex visual grid (like the 2026 monthly calendar), flatten it into a logical 2-column Markdown table (e.g., | الشهر (Month) | الخدمات المبرمجة (Programmed Services) |).
C. for the context read the whole paper and inderstande it for erny chunk keep it as its and add in the first of it a context so it youd have a mining 
"""

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
