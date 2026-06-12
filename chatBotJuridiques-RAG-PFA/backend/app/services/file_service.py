"""
file_service.py — CRUD for `fichiers_utilisateurs`.

Implements the queries from queriesReference.sql §7.
Handles file uploads to local storage and metadata persistence.
"""

import os
import uuid
from typing import List, Optional

import aiofiles
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FichierUtilisateur
from app.schemas import FileResponse
from app.logger import app_logger

# Upload directory — relative to the backend root
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")


async def get_file_by_id(
    db: AsyncSession,
    file_id: uuid.UUID,
    clerk_id: str,
) -> Optional[FichierUtilisateur]:
    result = await db.execute(
        select(FichierUtilisateur).where(
            FichierUtilisateur.id == file_id,
            FichierUtilisateur.utilisateur_id == clerk_id,
        )
    )
    file_record = result.scalars().first()
    if file_record:
        app_logger.debug("Fetched file by ID", extra={"file_id": str(file_id), "user_id": clerk_id})
    else:
        app_logger.warning("File not found or unauthorized access attempt", extra={"file_id": str(file_id), "user_id": clerk_id})
    return file_record


async def read_file_context(
    file_record: FichierUtilisateur,
    max_chars: int = 100000,
) -> str:
    path = file_record.url_stockage
    name = file_record.nom_fichier

    app_logger.info("Reading file context for AI", extra={"file_id": str(file_record.id), "filename": name})

    if not os.path.exists(path):
        app_logger.error("Physical file not found on disk", extra={"path": path})
        return f"[Document joint: {name} — fichier introuvable]"

    ext = os.path.splitext(name)[1].lower()
    text_exts = {".txt", ".md", ".tex", ".csv", ".json", ".html", ".xml"}

    try:
        if ext in text_exts or ext == "":
            async with aiofiles.open(path, "r", encoding="utf-8", errors="replace") as f:
                content = await f.read(max_chars)
            return f"--- Document joint: {name} ---\n{content}"

        if ext == ".pdf":
            import fitz
            import asyncio
            
            def extract_pdf():
                doc = fitz.open(path)
                text = ""
                for page in doc:
                    text += page.get_text() + "\n"
                doc.close()
                return text[:max_chars]
                
            content = await asyncio.to_thread(extract_pdf)
            if content.strip():
                return f"--- Document joint: {name} ---\n{content}"
            else:
                app_logger.warning("Empty or scanned PDF detected (no text extracted)", extra={"file_id": str(file_record.id)})
                return f"[Document joint: {name} — document PDF vide ou scanné (sans OCR)]"

        async with aiofiles.open(path, "rb") as f:
            raw = await f.read(min(512_000, max_chars * 4))

        try:
            content = raw.decode("utf-8", errors="ignore")[:max_chars]
            if content.strip():
                return f"--- Document joint: {name} ---\n{content}"
        except Exception:
            pass

        app_logger.warning("Unsupported binary file format for text extraction", extra={"file_id": str(file_record.id), "ext": ext})
        return (
            f"[Document joint: {name} — format binaire ou image non supporté par l'extraction de texte. "
            f"Référencez ce document par son nom dans votre analyse.]"
        )
    except OSError as e:
        app_logger.error(f"OS Error while reading file context: {e}", exc_info=True)
        return f"[Document joint: {name} — erreur de lecture]"


async def get_multimodal_parts(file_record: FichierUtilisateur) -> list[dict]:
    path = file_record.url_stockage
    name = file_record.nom_fichier

    app_logger.info("Extracting multimodal parts from file", extra={"file_id": str(file_record.id), "filename": name})

    if not os.path.exists(path):
        app_logger.error("Physical file not found on disk", extra={"path": path})
        return [{"text": f"[Document joint: {name} — fichier introuvable]"}]

    ext = os.path.splitext(name)[1].lower()
    text_exts = {".txt", ".md", ".tex", ".csv", ".json", ".html", ".xml"}

    try:
        if ext in text_exts or ext == "":
            async with aiofiles.open(path, "r", encoding="utf-8", errors="replace") as f:
                content = await f.read(100000)
            return [{"text": f"--- Document joint: {name} ---\n{content}"}]

        mime_type = file_record.type_mime or "application/octet-stream"
        if ext == ".pdf":
            import fitz
            import asyncio
            
            def extract_pdf():
                doc = fitz.open(path)
                text = ""
                for page in doc:
                    text += page.get_text() + "\n"
                doc.close()
                return text[:100000]
                
            content = await asyncio.to_thread(extract_pdf)
            if content.strip():
                return [{"text": f"--- Document joint: {name} ---\n{content}"}]
            else:
                app_logger.warning("Empty or scanned PDF detected (no text extracted)", extra={"file_id": str(file_record.id)})
                return [{"text": f"[Document joint: {name} — document PDF vide ou scanné (sans OCR)]"}]
                
        elif ext in {".png", ".jpg", ".jpeg", ".webp", ".heic"}:
            mime_type = f"image/{ext[1:].replace('jpg', 'jpeg')}"
            async with aiofiles.open(path, "rb") as f:
                raw_bytes = await f.read(20_000_000)
            return [{"inline_data": {"mime_type": mime_type, "data": raw_bytes}}]
            
        else:
            app_logger.warning("Unsupported file format for AI processing", extra={"file_id": str(file_record.id), "ext": ext})
            return [{"text": f"[Document joint: {name} — format {ext} non supporté par l'IA]"}]

    except OSError as e:
        app_logger.error(f"OS Error while extracting multimodal parts: {e}", exc_info=True)
        return [{"text": f"[Document joint: {name} — erreur de lecture]"}]


async def get_user_files(
    db: AsyncSession,
    clerk_id: str,
) -> List[FichierUtilisateur]:
    result = await db.execute(
        select(FichierUtilisateur)
        .where(
            FichierUtilisateur.utilisateur_id == clerk_id,
            FichierUtilisateur.document_id.is_(None)
        )
        .order_by(FichierUtilisateur.date_creation.desc())
    )
    files = list(result.scalars().all())
    app_logger.debug("Fetched user files", extra={"user_id": clerk_id, "count": len(files)})
    return files


async def upload_file(
    db: AsyncSession,
    clerk_id: str,
    filename: str,
    content: bytes,
    content_type: Optional[str],
) -> FichierUtilisateur:
    user_dir = os.path.join(UPLOAD_DIR, clerk_id)
    os.makedirs(user_dir, exist_ok=True)

    unique_name = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(user_dir, unique_name)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    file_record = FichierUtilisateur(
        utilisateur_id=clerk_id,
        nom_fichier=filename,
        url_stockage=file_path,
        type_mime=content_type,
        taille_octets=len(content),
        indexe_rag=False,
    )
    db.add(file_record)
    await db.commit()
    await db.refresh(file_record)
    app_logger.info("Uploaded general file", extra={"user_id": clerk_id, "file_id": str(file_record.id), "filename": filename})
    return file_record


async def search_files(
    db: AsyncSession,
    clerk_id: str,
    query: str,
) -> List[FichierUtilisateur]:
    result = await db.execute(
        select(FichierUtilisateur)
        .where(
            FichierUtilisateur.utilisateur_id == clerk_id,
            FichierUtilisateur.document_id.is_(None),
            FichierUtilisateur.nom_fichier.ilike(f"%{query}%"),
        )
        .order_by(FichierUtilisateur.date_creation.desc())
    )
    files = list(result.scalars().all())
    app_logger.info("Searched user files", extra={"user_id": clerk_id, "query": query, "count": len(files)})
    return files


async def rename_file(
    db: AsyncSession,
    file_id: uuid.UUID,
    clerk_id: str,
    new_name: str,
) -> bool:
    result = await db.execute(
        select(FichierUtilisateur).where(
            FichierUtilisateur.id == file_id,
            FichierUtilisateur.utilisateur_id == clerk_id,
        )
    )
    file_record = result.scalars().first()
    if not file_record:
        app_logger.warning("File not found for renaming", extra={"file_id": str(file_id)})
        return False
        
    file_record.nom_fichier = new_name
    await db.commit()
    app_logger.info("Renamed file", extra={"file_id": str(file_id), "new_name": new_name})
    return True

async def delete_file(
    db: AsyncSession,
    file_id: uuid.UUID,
    clerk_id: str,
) -> bool:
    result = await db.execute(
        select(FichierUtilisateur).where(
            FichierUtilisateur.id == file_id,
            FichierUtilisateur.utilisateur_id == clerk_id,
        )
    )
    file_record = result.scalars().first()
    if not file_record:
        app_logger.warning("File not found for deletion", extra={"file_id": str(file_id)})
        return False

    if os.path.exists(file_record.url_stockage):
        os.remove(file_record.url_stockage)

    await db.delete(file_record)
    await db.commit()
    app_logger.info("Deleted file", extra={"file_id": str(file_id)})
    return True
