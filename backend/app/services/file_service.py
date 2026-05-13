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
