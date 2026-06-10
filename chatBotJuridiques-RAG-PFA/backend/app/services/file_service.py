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

# Upload directory — relative to the backend root
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")


async def get_file_by_id(
    db: AsyncSession,
    file_id: uuid.UUID,
    clerk_id: str,
) -> Optional[FichierUtilisateur]:
    """Fetch a single file owned by the user."""
    result = await db.execute(
        select(FichierUtilisateur).where(
            FichierUtilisateur.id == file_id,
            FichierUtilisateur.utilisateur_id == clerk_id,
        )
    )
    return result.scalars().first()


async def read_file_context(
    file_record: FichierUtilisateur,
    max_chars: int = 100000, # Increased for Gemini 2.5 Flash context window
) -> str:
    """Read text content from an uploaded file for AI context."""
    path = file_record.url_stockage
    name = file_record.nom_fichier

    if not os.path.exists(path):
        return f"[Document joint: {name} — fichier introuvable]"

    ext = os.path.splitext(name)[1].lower()
    text_exts = {".txt", ".md", ".tex", ".csv", ".json", ".html", ".xml"}

    try:
        if ext in text_exts or ext == "":
            async with aiofiles.open(path, "r", encoding="utf-8", errors="replace") as f:
                content = await f.read(max_chars)
            return f"--- Document joint: {name} ---\n{content}"

        if ext == ".pdf":
            import fitz # PyMuPDF
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
                return f"[Document joint: {name} — document PDF vide ou scanné (sans OCR)]"

        # Fallback for other binary files
        async with aiofiles.open(path, "rb") as f:
            raw = await f.read(min(512_000, max_chars * 4))

        try:
            content = raw.decode("utf-8", errors="ignore")[:max_chars]
            if content.strip():
                return f"--- Document joint: {name} ---\n{content}"
        except Exception:
            pass

        return (
            f"[Document joint: {name} — format binaire ou image non supporté par l'extraction de texte. "
            f"Référencez ce document par son nom dans votre analyse.]"
        )
    except OSError:
        return f"[Document joint: {name} — erreur de lecture]"


async def get_multimodal_parts(file_record: FichierUtilisateur) -> list[dict]:
    """Read a file and return it as a list of parts suitable for Gemini."""
    path = file_record.url_stockage
    name = file_record.nom_fichier

    if not os.path.exists(path):
        return [{"text": f"[Document joint: {name} — fichier introuvable]"}]

    ext = os.path.splitext(name)[1].lower()
    text_exts = {".txt", ".md", ".tex", ".csv", ".json", ".html", ".xml"}

    try:
        # 1. Text-based files
        if ext in text_exts or ext == "":
            async with aiofiles.open(path, "r", encoding="utf-8", errors="replace") as f:
                content = await f.read(100000)
            return [{"text": f"--- Document joint: {name} ---\n{content}"}]

        # 2. Multimodal files (PDF, Images)
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
                return [{"text": f"[Document joint: {name} — document PDF vide ou scanné (sans OCR)]"}]
                
        elif ext in {".png", ".jpg", ".jpeg", ".webp", ".heic"}:
            mime_type = f"image/{ext[1:].replace('jpg', 'jpeg')}"
            async with aiofiles.open(path, "rb") as f:
                raw_bytes = await f.read(20_000_000)
            return [{"inline_data": {"mime_type": mime_type, "data": raw_bytes}}]
            
        else:
            return [{"text": f"[Document joint: {name} — format {ext} non supporté par l'IA]"}]

    except OSError:
        return [{"text": f"[Document joint: {name} — erreur de lecture]"}]


async def get_user_files(
    db: AsyncSession,
    clerk_id: str,
) -> List[FichierUtilisateur]:
    """
    Fetch all files uploaded by a user.

    Maps to:
        SELECT id, nom_fichier, indexe_rag, date_creation
        FROM fichiers_utilisateurs
        WHERE utilisateur_id = :clerk_id
        ORDER BY date_creation DESC;
    """
    result = await db.execute(
        select(FichierUtilisateur)
        .where(FichierUtilisateur.utilisateur_id == clerk_id)
        .order_by(FichierUtilisateur.date_creation.desc())
    )
    return list(result.scalars().all())


async def upload_file(
    db: AsyncSession,
    clerk_id: str,
    filename: str,
    content: bytes,
    content_type: Optional[str],
) -> FichierUtilisateur:
    """
    Save a file to disk and log metadata in the database.

    Maps to:
        INSERT INTO fichiers_utilisateurs
            (utilisateur_id, nom_fichier, url_stockage, type_mime, taille_octets)
        VALUES (:clerk_id, :nom_fichier, :url_stockage, :type_mime, :taille_octets)
        RETURNING id;
    """
    # Ensure upload directory exists (per-user subdirectory)
    user_dir = os.path.join(UPLOAD_DIR, clerk_id)
    os.makedirs(user_dir, exist_ok=True)

    # Generate unique filename to prevent collisions
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(user_dir, unique_name)

    # Write file to disk asynchronously
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Persist metadata
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
    return file_record


async def search_files(
    db: AsyncSession,
    clerk_id: str,
    query: str,
) -> List[FichierUtilisateur]:
    """
    Search user files by filename (ILIKE).

    Note: This is a placeholder for full semantic search.
    RAG-based vector search will be implemented separately.
    """
    result = await db.execute(
        select(FichierUtilisateur)
        .where(
            FichierUtilisateur.utilisateur_id == clerk_id,
            FichierUtilisateur.nom_fichier.ilike(f"%{query}%"),
        )
        .order_by(FichierUtilisateur.date_creation.desc())
    )
    return list(result.scalars().all())


async def delete_file(
    db: AsyncSession,
    file_id: uuid.UUID,
    clerk_id: str,
) -> bool:
    """
    Remove a file from the database and delete from disk.

    Maps to:
        DELETE FROM fichiers_utilisateurs WHERE id = :file_id;
    """
    # Fetch with ownership check
    result = await db.execute(
        select(FichierUtilisateur).where(
            FichierUtilisateur.id == file_id,
            FichierUtilisateur.utilisateur_id == clerk_id,
        )
    )
    file_record = result.scalars().first()
    if not file_record:
        return False

    # Delete physical file (if it exists)
    if os.path.exists(file_record.url_stockage):
        os.remove(file_record.url_stockage)

    await db.delete(file_record)
    await db.commit()
    return True
