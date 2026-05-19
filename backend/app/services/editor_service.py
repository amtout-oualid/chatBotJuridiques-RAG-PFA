"""
editor_service.py — CRUD for `modeles_juridiques` and `documents_generes`.

Implements the queries from queriesReference.sql §5 & §6.
Also handles LaTeX compilation and AI suggestions.
"""

import asyncio
import base64
import os
import shutil
import tempfile
import uuid
import aiofiles
from typing import List, Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import call_legal_ai
from app.models import DocumentGenere, ModeleJuridique, FichierUtilisateur

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

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
# PROJECT FILES
# ─────────────────────────────────────────────────────────

async def get_project_files(db: AsyncSession, document_id: uuid.UUID, clerk_id: str) -> List[FichierUtilisateur]:
    result = await db.execute(
        select(FichierUtilisateur).where(
            FichierUtilisateur.document_id == document_id,
            FichierUtilisateur.utilisateur_id == clerk_id
        ).order_by(FichierUtilisateur.date_creation.asc())
    )
    return list(result.scalars().all())

async def upload_project_file(
    db: AsyncSession,
    document_id: uuid.UUID,
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
        document_id=document_id,
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

async def rename_project_file(
    db: AsyncSession, document_id: uuid.UUID, clerk_id: str, file_id: uuid.UUID, new_name: str
) -> Optional[FichierUtilisateur]:
    result = await db.execute(
        select(FichierUtilisateur).where(
            FichierUtilisateur.id == file_id,
            FichierUtilisateur.document_id == document_id,
            FichierUtilisateur.utilisateur_id == clerk_id,
        )
    )
    file_record = result.scalars().first()
    if not file_record:
        return None
    file_record.nom_fichier = new_name
    await db.commit()
    await db.refresh(file_record)
    return file_record

async def delete_project_file(
    db: AsyncSession, document_id: uuid.UUID, clerk_id: str, file_id: uuid.UUID
) -> bool:
    result = await db.execute(
        select(FichierUtilisateur).where(
            FichierUtilisateur.id == file_id,
            FichierUtilisateur.document_id == document_id,
            FichierUtilisateur.utilisateur_id == clerk_id,
        )
    )
    file_record = result.scalars().first()
    if not file_record:
        return False
    if os.path.exists(file_record.url_stockage):
        os.remove(file_record.url_stockage)
    await db.delete(file_record)
    await db.commit()
    return True

# ─────────────────────────────────────────────────────────
# LATEX COMPILATION
# ─────────────────────────────────────────────────────────

async def compile_latex(latex_code: str, project_files: List[FichierUtilisateur] = None) -> dict:
    """
    Compile LaTeX code to PDF using pdflatex.

    Returns {"success": bool, "pdf_url": str | None, "pdf_base64": str | None, "errors": str | None, "log_output": str | None}.
    """
    try:
        with tempfile.TemporaryDirectory() as tmp_dir:
            # Copy project files into temporary directory
            if project_files:
                for pf in project_files:
                    if os.path.exists(pf.url_stockage):
                        dest_path = os.path.join(tmp_dir, pf.nom_fichier)
                        shutil.copy2(pf.url_stockage, dest_path)
                        
            tex_path = os.path.join(tmp_dir, "document.tex")
            pdf_path = os.path.join(tmp_dir, "document.pdf")
            log_path = os.path.join(tmp_dir, "document.log")

            # Write LaTeX source
            with open(tex_path, "w", encoding="utf-8") as f:
                f.write(latex_code)

            # Debug: Print the system PATH to the FastAPI terminal
            print(f"--- DEBUG: System PATH ---\n{os.environ.get('PATH')}\n--------------------------")

            # Allow for an absolute path to pdflatex if it's not in the PATH.
            # You can change this to your actual pdflatex.exe path (e.g., r"C:\Program Files\MiKTeX\miktex\bin\x64\pdflatex.exe")
            pdflatex_bin = shutil.which("pdflatex") or os.environ.get("PDFLATEX_PATH", r"C:\Users\pc\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe")

            # Run pdflatex (non-interactive, halt on error)
            proc = await asyncio.create_subprocess_exec(
                pdflatex_bin,
                "-interaction=nonstopmode",
                "-output-directory", tmp_dir,
                tex_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=20)
            except asyncio.TimeoutError:
                try:
                    proc.kill()
                except Exception:
                    pass
                return {
                    "success": False,
                    "pdf_url": None,
                    "pdf_base64": None,
                    "errors": "LaTeX compilation timed out after 20 seconds. The process was terminated.",
                    "log_output": None,
                }
            
            log_output = ""
            clean_errors = ""
            if os.path.exists(log_path):
                with open(log_path, "r", encoding="utf-8", errors="replace") as lf:
                    log_output = lf.read()
                    error_lines = [line.strip() for line in log_output.splitlines() if line.startswith("!")]
                    if error_lines:
                        clean_errors = "\n".join(error_lines)

            if proc.returncode == 0 and os.path.exists(pdf_path):
                with open(pdf_path, "rb") as pdf_file:
                    pdf_base64 = base64.b64encode(pdf_file.read()).decode("utf-8")
                return {
                    "success": True,
                    "pdf_url": None,
                    "pdf_base64": pdf_base64,
                    "errors": None,
                    "log_output": log_output,
                }
            else:
                error_msg = clean_errors if clean_errors else stdout.decode("utf-8", errors="replace")
                return {
                    "success": False,
                    "pdf_url": None,
                    "pdf_base64": None,
                    "errors": error_msg,
                    "log_output": log_output,
                }
    except FileNotFoundError:
        return {
            "success": False,
            "pdf_url": None,
            "pdf_base64": None,
            "errors": "pdflatex is not installed on the server. Install TeX Live or MiKTeX.",
            "log_output": None,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "pdf_url": None,
            "pdf_base64": None,
            "errors": f"Unexpected backend error during compilation: {repr(e)}",
            "log_output": None,
        }


# ─────────────────────────────────────────────────────────
# AI SUGGESTIONS
# ─────────────────────────────────────────────────────────

async def ai_suggest(latex_code: str, prompt: str, project_files: List[FichierUtilisateur] = None) -> str:
    """
    Send LaTeX code + user prompt + project files to the AI and return the suggested code.
    """
    files_context = ""
    if project_files:
        for pf in project_files:
            ext = os.path.splitext(pf.nom_fichier)[1].lower()
            if ext in {".txt", ".md", ".tex", ".csv", ".json", ".html", ".xml"}:
                try:
                    with open(pf.url_stockage, "r", encoding="utf-8", errors="replace") as f:
                        content = f.read(15000)
                        files_context += f"--- Fichier du projet: {pf.nom_fichier} ---\n{content}\n"
                except Exception:
                    pass

    combined_prompt = (
        f"Voici le code LaTeX actuel :\n```latex\n{latex_code}\n```\n\n"
    )
    if files_context:
        combined_prompt += f"Fichiers supplémentaires du projet:\n{files_context}\n\n"
    
    combined_prompt += (
        f"L'utilisateur demande : {prompt}\n\n"
        f"Retourne uniquement le code LaTeX modifié, sans explication supplémentaire."
    )
    return await call_legal_ai(combined_prompt)
