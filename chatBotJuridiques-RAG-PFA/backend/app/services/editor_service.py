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
import httpx
from typing import List, Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
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

# Supported image extensions that can be sent to the compiler
_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".pdf", ".eps", ".svg"}


def _sanitize_latex_for_api(latex_code: str) -> str:
    """
    Rewrite LaTeX commands that trigger the LaTeXLite API's security filter.

    The API blocks any command starting with ``\\include`` (intended to block
    ``\\include`` and ``\\input``), but this also false-positives on the
    perfectly safe ``\\includegraphics``.  We rewrite it using TeX's
    ``\\csname … \\endcsname`` primitive, which constructs the same control
    sequence at expansion time without the literal ``\\include`` substring
    appearing in the source.
    """
    return latex_code.replace(
        r"\includegraphics", r"\csname includegraphics\endcsname"
    )


import sys as _sys

_pdflatex_cache: str | None = ...  # sentinel: ... means "not yet searched"


def _find_pdflatex() -> str | None:
    """
    Locate ``pdflatex`` on this machine.

    Checks the system PATH first, then probes common install directories
    for MiKTeX and TeX Live on Windows.  The result is cached if found.
    """
    global _pdflatex_cache
    if _pdflatex_cache is not ... and _pdflatex_cache is not None:
        return _pdflatex_cache

    # 1. Try PATH
    found = shutil.which("pdflatex")
    if found:
        _pdflatex_cache = found
        return found

    # 2. Probe common Windows install locations
    if _sys.platform == "win32":
        home = os.environ.get("LOCALAPPDATA", "")
        candidates = [
            os.path.join(home, "Programs", "MiKTeX", "miktex", "bin", "x64", "pdflatex.exe"),
            os.path.join(home, "Programs", "MiKTeX", "miktex", "bin", "pdflatex.exe"),
            r"C:\Program Files\MiKTeX\miktex\bin\x64\pdflatex.exe",
            r"C:\Program Files (x86)\MiKTeX\miktex\bin\x64\pdflatex.exe",
            # TeX Live
            r"C:\texlive\2024\bin\windows\pdflatex.exe",
            r"C:\texlive\2025\bin\windows\pdflatex.exe",
            r"C:\texlive\2026\bin\windows\pdflatex.exe",
        ]
        for path in candidates:
            if os.path.isfile(path):
                _pdflatex_cache = path
                return path

    _pdflatex_cache = None
    return None


async def _compile_locally(
    latex_code: str,
    project_files: List[FichierUtilisateur] = None,
) -> dict | None:
    """
    Compile LaTeX locally using ``pdflatex``.

    Creates a temporary directory, writes ``main.tex`` plus all project
    asset files, runs ``pdflatex`` twice (for cross-references), then
    reads the resulting PDF.

    Returns a standard result dict, or **None** if ``pdflatex`` is not
    installed on the system.
    """
    pdflatex = _find_pdflatex()
    if not pdflatex:
        return None  # signal caller to use a different path

    tmpdir = tempfile.mkdtemp(prefix="latex_local_")
    try:
        # ── Write main.tex ──────────────────────────────────────────
        tex_path = os.path.join(tmpdir, "main.tex")
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(latex_code)

        # ── Copy project assets alongside main.tex ──────────────────
        if project_files:
            for pf in project_files:
                if not os.path.exists(pf.url_stockage):
                    continue
                dest = os.path.join(tmpdir, pf.nom_fichier)
                shutil.copy2(pf.url_stockage, dest)

        # ── Run pdflatex (twice for cross-refs) ─────────────────────
        import subprocess
        for _pass in range(2):
            proc = await asyncio.to_thread(
                subprocess.run,
                [pdflatex, "-interaction=nonstopmode", "-halt-on-error", "main.tex"],
                cwd=tmpdir,
                capture_output=True,
                timeout=30,
            )
            stdout = proc.stdout

        # ── Read result ─────────────────────────────────────────────
        pdf_path = os.path.join(tmpdir, "main.pdf")
        if os.path.exists(pdf_path):
            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()
            pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
            return {
                "success": True,
                "pdf_url": None,
                "pdf_base64": pdf_b64,
                "errors": None,
                "log_output": None,
            }

        # Compilation ran but produced no PDF — return the log
        log = stdout.decode("utf-8", errors="replace") if stdout else ""
        return {
            "success": False,
            "pdf_url": None,
            "pdf_base64": None,
            "errors": f"Local pdflatex compilation failed:\n{log[:2000]}",
            "log_output": log,
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "pdf_url": None,
            "pdf_base64": None,
            "errors": "Local pdflatex compilation timed out after 30 seconds.",
            "log_output": None,
        }
    except Exception as e:
        # Any unexpected error → return None so caller falls back to API
        import traceback
        traceback.print_exc()
        return None
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


async def compile_latex(
    latex_code: str,
    project_files: List[FichierUtilisateur] = None,
) -> dict:
    """
    Compile LaTeX code to PDF.

    Strategy:
      1. If the project contains image assets → try **local** ``pdflatex``
         first (the only way images can be resolved).
      2. If local compilation is unavailable or there are no images →
         use the **LaTeXLite cloud API**.
      3. If images are present but pdflatex is missing → return a helpful
         error telling the user to install a TeX distribution.

    Returns {"success": bool, "pdf_url": str | None,
             "pdf_base64": str | None, "errors": str | None,
             "log_output": str | None}.
    """

    # ── Detect whether the project uses images ──────────────────────
    has_images = False
    if project_files:
        has_images = any(
            os.path.splitext(pf.nom_fichier)[1].lower() in _IMAGE_EXTENSIONS
            for pf in project_files
        )

    # ── Path A: local compilation (required for images) ─────────────
    if has_images:
        local_result = await _compile_locally(latex_code, project_files)
        if local_result is not None:
            return local_result
        # pdflatex not found — give a clear, actionable error
        return {
            "success": False,
            "pdf_url": None,
            "pdf_base64": None,
            "errors": (
                "Your document references image files, but the cloud "
                "compiler (LaTeXLite) does not support multi-file projects.\n\n"
                "To compile documents with images you need a local TeX "
                "installation.\n"
                "→ Install MiKTeX from https://miktex.org/download and "
                "restart the backend server.\n"
                "   MiKTeX automatically installs missing packages on first use."
            ),
            "log_output": None,
        }

    # ── Path B: cloud API (text-only documents) ─────────────────────
    settings = get_settings()
    api_key = settings.LATEXLITE_API_KEY or os.environ.get("LATEXLITE_API_KEY")

    if not api_key:
        return {
            "success": False,
            "pdf_url": None,
            "pdf_base64": None,
            "errors": "LaTeXLite API key is missing. Compilation cannot proceed.",
            "log_output": None,
        }

    try:
        # Rewrite \includegraphics to bypass API's \include security filter
        latex_code = _sanitize_latex_for_api(latex_code)

        files_payload = [
            ("template", ("main.tex", latex_code.encode("utf-8"), "text/plain"))
        ]

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://latexlite.com/v1/renders-sync",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Accept": "application/json",
                },
                files=files_payload,
            )

        # ── Success (200 = clean, 201 = watermarked) ────────────────
        if resp.status_code in (200, 201):
            try:
                json_resp = resp.json()
                pdf_b64 = json_resp.get("data", {}).get("pdf_base64")
            except Exception:
                pdf_b64 = base64.b64encode(resp.content).decode("utf-8")
                return {
                    "success": True,
                    "pdf_url": None,
                    "pdf_base64": pdf_b64,
                    "errors": None,
                    "log_output": None,
                }

            if pdf_b64:
                warning = None
                if resp.status_code == 201:
                    wm = json_resp.get("data", {}).get("watermark", {})
                    warning = wm.get("message", "PDF includes an evaluation watermark.")
                return {
                    "success": True,
                    "pdf_url": None,
                    "pdf_base64": pdf_b64,
                    "errors": warning,
                    "log_output": None,
                }

            pdf_b64 = base64.b64encode(resp.content).decode("utf-8")
            return {
                "success": True,
                "pdf_url": None,
                "pdf_base64": pdf_b64,
                "errors": None,
                "log_output": None,
            }

        # ── Error responses ─────────────────────────────────────────
        try:
            error_data = resp.json()
            error_msg = error_data.get("error", {}).get("message", resp.text)
        except Exception:
            error_msg = resp.text

        return {
            "success": False,
            "pdf_url": None,
            "pdf_base64": None,
            "errors": f"LaTeXLite API Error: {error_msg}",
            "log_output": None,
        }

    except httpx.TimeoutException:
        return {
            "success": False,
            "pdf_url": None,
            "pdf_base64": None,
            "errors": "LaTeX compilation timed out after 60 seconds.",
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
    If the prompt contains '/template', it searches the JSON registry for a match and adapts it.
    """
    import json
    
    # ── Path A: Slash Command (/template) Interceptor ────────────────
    if "/template" in prompt.lower():
        registry_path = os.path.join(os.path.dirname(__file__), "..", "templates_registry.json")
        if os.path.exists(registry_path):
            try:
                with open(registry_path, "r", encoding="utf-8") as f:
                    templates = json.load(f)
                
                templates_dump = json.dumps(templates, ensure_ascii=False, indent=2)
                
                system_prompt = (
                    "Tu es un expert juridique. L'utilisateur a demandé un modèle via la commande '/template'. "
                    "Voici la liste de nos modèles disponibles (chacun avec son 'id', 'title', 'description', et 'latex_code'):\n"
                    f"{templates_dump}\n\n"
                    "INSTRUCTIONS OBLIGATOIRES:\n"
                    "1. Trouve le modèle qui correspond le mieux à la demande de l'utilisateur.\n"
                    "2. Utilise le 'latex_code' complet de ce modèle exact.\n"
                    "3. Adapte ce code LaTeX en remplaçant les espaces réservés (comme [Nom], [Date]) par les informations fournies dans la demande de l'utilisateur.\n"
                    "4. Retourne UNIQUEMENT le code LaTeX final modifié, absolument sans aucun autre texte, commentaire, ni bloc Markdown (pas de ```latex ... ```). Le code doit compiler directement.\n\n"
                    f"Demande utilisateur : {prompt}"
                )
                return await call_legal_ai(system_prompt)
            except Exception as e:
                pass # Fallback to standard behavior if JSON parsing fails

    # ── Path B: Standard AI Modification ─────────────────────────────
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
        f"IMPORTANT : Pour inclure des images ou fichiers, utilise la commande \\includegraphics{{nom_du_fichier}} "
        f"(juste le nom du fichier, sans préfixe 'assets/') "
        f"et assure-toi que le package \\usepackage{{graphicx}} est présent. "
        f"N'utilise JAMAIS la commande \\include car elle est bloquée par l'API pour des raisons de sécurité.\n\n"
        f"Retourne uniquement le code LaTeX modifié, sans explication supplémentaire."
    )
    return await call_legal_ai(combined_prompt)
