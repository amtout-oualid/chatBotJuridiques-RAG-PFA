"""
editor_service.py — CRUD for `modeles_juridiques` and `documents_generes`.

Implements the queries from queriesReference.sql §5 & §6.
Also handles LaTeX compilation and AI suggestions.
"""

import asyncio
import os
import tempfile
import uuid
from typing import List, Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import call_legal_ai
from app.models import DocumentGenere, ModeleJuridique


# ─────────────────────────────────────────────────────────
# TEMPLATES
# ─────────────────────────────────────────────────────────

async def get_templates(db: AsyncSession) -> List[ModeleJuridique]:
    """
    Fetch all active templates (metadata only).

    Maps to:
        SELECT id, nom, description, categorie
        FROM modeles_juridiques
        WHERE actif = TRUE
        ORDER BY categorie, nom;
    """
    result = await db.execute(
        select(ModeleJuridique)
        .where(ModeleJuridique.actif == True)
        .order_by(ModeleJuridique.categorie, ModeleJuridique.nom)
    )
    return list(result.scalars().all())


# ─────────────────────────────────────────────────────────
# DOCUMENTS
# ─────────────────────────────────────────────────────────

async def get_user_documents(
    db: AsyncSession,
    clerk_id: str,
) -> List[DocumentGenere]:
    """
    Fetch all active documents for a user (dashboard view).

    Maps to:
        SELECT id, titre, statut, date_modif
        FROM documents_generes
        WHERE utilisateur_id = :clerk_id AND is_deleted = FALSE
        ORDER BY date_modif DESC;
    """
    result = await db.execute(
        select(DocumentGenere)
        .where(
            DocumentGenere.utilisateur_id == clerk_id,
            DocumentGenere.is_deleted == False,
        )
        .order_by(DocumentGenere.date_modif.desc())
    )
    return list(result.scalars().all())


async def get_document_detail(
    db: AsyncSession,
    document_id: uuid.UUID,
    clerk_id: str,
) -> Optional[DocumentGenere]:
    """
    Fetch full document content for the LaTeX editor.

    Maps to:
        SELECT latex_contenu, pdf_url, statut
        FROM documents_generes
        WHERE id = :document_id AND is_deleted = FALSE;
    """
    result = await db.execute(
        select(DocumentGenere).where(
            DocumentGenere.id == document_id,
            DocumentGenere.utilisateur_id == clerk_id,
            DocumentGenere.is_deleted == False,
        )
    )
    return result.scalars().first()


async def create_document(
    db: AsyncSession,
    clerk_id: str,
    titre: str,
    latex_contenu: Optional[str] = "",
    modele_id: Optional[uuid.UUID] = None,
) -> DocumentGenere:
    """
    Create a new generated document.

    Maps to:
        INSERT INTO documents_generes (utilisateur_id, modele_id, titre, latex_contenu)
        VALUES (:clerk_id, :template_id, :titre, :latex_contenu)
        RETURNING id;
    """
    doc = DocumentGenere(
        utilisateur_id=clerk_id,
        modele_id=modele_id,
        titre=titre,
        latex_contenu=latex_contenu,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


async def update_document(
    db: AsyncSession,
    document_id: uuid.UUID,
    clerk_id: str,
    titre: Optional[str] = None,
    latex_contenu: Optional[str] = None,
    statut: Optional[str] = None,
) -> Optional[DocumentGenere]:
    """
    Auto-save / update document content.

    Maps to:
        UPDATE documents_generes
        SET latex_contenu = :new_content
        WHERE id = :document_id;
    """
    doc = await get_document_detail(db, document_id, clerk_id)
    if not doc:
        return None

    if titre is not None:
        doc.titre = titre
    if latex_contenu is not None:
        doc.latex_contenu = latex_contenu
    if statut is not None:
        doc.statut = statut

    await db.commit()
    await db.refresh(doc)
    return doc


async def delete_document(
    db: AsyncSession,
    document_id: uuid.UUID,
    clerk_id: str,
) -> bool:
    """
    Soft-delete a document (is_deleted = TRUE).

    Maps to:
        UPDATE documents_generes SET is_deleted = TRUE WHERE id = :document_id;
    """
    doc = await get_document_detail(db, document_id, clerk_id)
    if not doc:
        return False

    doc.is_deleted = True
    await db.commit()
    return True


# ─────────────────────────────────────────────────────────
# LATEX COMPILATION
# ─────────────────────────────────────────────────────────

async def compile_latex(latex_code: str) -> dict:
    """
    Compile LaTeX code to PDF using pdflatex.

    Returns {"success": bool, "pdf_url": str | None, "errors": str | None}.
    Falls back to a stub if pdflatex is not installed.
    """
    try:
        # Create a temporary directory for compilation
        with tempfile.TemporaryDirectory() as tmp_dir:
            tex_path = os.path.join(tmp_dir, "document.tex")
            pdf_path = os.path.join(tmp_dir, "document.pdf")

            # Write LaTeX source
            with open(tex_path, "w", encoding="utf-8") as f:
                f.write(latex_code)

            # Run pdflatex (non-interactive, halt on error)
            proc = await asyncio.create_subprocess_exec(
                "pdflatex",
                "-interaction=nonstopmode",
                "-output-directory", tmp_dir,
                tex_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30)

            if proc.returncode == 0 and os.path.exists(pdf_path):
                # In production, upload PDF to cloud storage and return URL
                return {
                    "success": True,
                    "pdf_url": f"/compiled/{os.path.basename(pdf_path)}",
                    "errors": None,
                }
            else:
                return {
                    "success": False,
                    "pdf_url": None,
                    "errors": stdout.decode("utf-8", errors="replace"),
                }
    except FileNotFoundError:
        return {
            "success": False,
            "pdf_url": None,
            "errors": "pdflatex is not installed on the server. Install TeX Live or MiKTeX.",
        }
    except asyncio.TimeoutError:
        return {
            "success": False,
            "pdf_url": None,
            "errors": "LaTeX compilation timed out after 30 seconds.",
        }


# ─────────────────────────────────────────────────────────
# AI SUGGESTIONS
# ─────────────────────────────────────────────────────────

async def ai_suggest(latex_code: str, prompt: str) -> str:
    """
    Send LaTeX code + user prompt to the AI and return the suggested code.

    Maps to POST /editor/ai-suggest.
    """
    combined_prompt = (
        f"Voici le code LaTeX actuel :\n```latex\n{latex_code}\n```\n\n"
        f"L'utilisateur demande : {prompt}\n\n"
        f"Retourne uniquement le code LaTeX modifié, sans explication supplémentaire."
    )
    return await call_legal_ai(combined_prompt)
