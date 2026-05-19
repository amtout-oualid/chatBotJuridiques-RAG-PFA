"""
routers/editor.py — LaTeX Editor (Document Generation) routes.

Routes:
    GET  /editor/templates    — List legal template skeletons
    POST /editor/compile      — Compile LaTeX → PDF
    GET  /editor/docs         — List user's saved documents
    PUT  /editor/docs/{id}    — Save / auto-save document changes
    POST /editor/ai-suggest   — Get AI-edited code suggestions
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas import (
    AISuggestRequest,
    AISuggestResponse,
    CompileRequest,
    CompileResponse,
    DocumentCreate,
    DocumentDetailResponse,
    DocumentListResponse,
    DocumentUpdate,
    MessageOut,
    TemplateListResponse,
    FileListResponse,
    FileResponse,
    ProjectFileRename,
)
from app.services import editor_service

router = APIRouter(prefix="/editor", tags=["LaTeX Editor"])


@router.get(
    "/templates",
    response_model=TemplateListResponse,
    summary="List legal templates",
    description="Fetches legal 'skeletons' (NDAs, contracts) from the library.",
)
async def list_templates(
    db: AsyncSession = Depends(get_db),
    _clerk_id: str = Depends(get_current_user),  # auth required but not used
) -> TemplateListResponse:
    templates = await editor_service.get_templates(db)
    return TemplateListResponse(templates=templates)


@router.post(
    "/compile",
    response_model=CompileResponse,
    summary="Compile LaTeX to PDF",
    description="Sends LaTeX code to the server to compile and return a PDF preview.",
)
async def compile_latex(
    data: CompileRequest,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CompileResponse:
    project_files = None
    if data.document_id:
        project_files = await editor_service.get_project_files(db, data.document_id, clerk_id)
    result = await editor_service.compile_latex(data.latex_code, project_files=project_files)
    return CompileResponse(**result)


@router.get(
    "/docs",
    response_model=DocumentListResponse,
    summary="List user documents",
    description="Retrieves all saved LaTeX documents created by the user.",
)
async def list_documents(
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentListResponse:
    docs = await editor_service.get_user_documents(db, clerk_id)
    return DocumentListResponse(documents=docs)


@router.post(
    "/docs",
    response_model=DocumentDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new document",
    description="Creates a new LaTeX document, optionally from a template.",
)
async def create_document(
    data: DocumentCreate,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentDetailResponse:
    doc = await editor_service.create_document(
        db=db,
        clerk_id=clerk_id,
        titre=data.titre,
        latex_contenu=data.latex_contenu,
        modele_id=data.modele_id,
    )
    return doc


@router.get(
    "/docs/{document_id}",
    response_model=DocumentDetailResponse,
    summary="Get document detail",
    description="Fetches full document content to load in the LaTeX editor.",
)
async def get_document(
    document_id: uuid.UUID,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentDetailResponse:
    doc = await editor_service.get_document_detail(db, document_id, clerk_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    return doc


@router.put(
    "/docs/{document_id}",
    response_model=DocumentDetailResponse,
    summary="Update / auto-save document",
    description="Saves changes to the LaTeX code (Auto-save feature).",
)
async def update_document(
    document_id: uuid.UUID,
    data: DocumentUpdate,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentDetailResponse:
    doc = await editor_service.update_document(
        db=db,
        document_id=document_id,
        clerk_id=clerk_id,
        titre=data.titre,
        latex_contenu=data.latex_contenu,
        statut=data.statut,
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    return doc


@router.post(
    "/ai-suggest",
    response_model=AISuggestResponse,
    summary="AI code suggestion",
    description="Sends code + prompt; returns AI-edited code diffs (Accept/Reject logic).",
)
async def ai_suggest(
    data: AISuggestRequest,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AISuggestResponse:
    project_files = None
    if data.document_id:
        project_files = await editor_service.get_project_files(db, data.document_id, clerk_id)
    suggested = await editor_service.ai_suggest(data.latex_code, data.prompt, project_files=project_files)
    return AISuggestResponse(suggested_code=suggested)


@router.delete(
    "/docs/{document_id}",
    response_model=MessageOut,
    summary="Delete a document",
    description="Soft deletes a generated LaTeX document.",
)
async def delete_document(
    document_id: uuid.UUID,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageOut:
    deleted = await editor_service.delete_document(db, document_id, clerk_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    return MessageOut(message="Document deleted successfully.")

# ─────────────────────────────────────────────────────────
# PROJECT ASSETS (FILES)
# ─────────────────────────────────────────────────────────

@router.get(
    "/docs/{document_id}/files",
    response_model=FileListResponse,
    summary="List project files",
)
async def list_project_files(
    document_id: uuid.UUID,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileListResponse:
    files = await editor_service.get_project_files(db, document_id, clerk_id)
    return FileListResponse(files=files)

@router.post(
    "/docs/{document_id}/files",
    response_model=FileResponse,
    summary="Upload project file",
)
async def upload_project_file(
    document_id: uuid.UUID,
    file: UploadFile = File(...),
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    content = await file.read()
    uploaded = await editor_service.upload_project_file(
        db, document_id, clerk_id, file.filename, content, file.content_type
    )
    return uploaded

@router.put(
    "/docs/{document_id}/files/{file_id}/rename",
    response_model=FileResponse,
    summary="Rename project file",
)
async def rename_project_file(
    document_id: uuid.UUID,
    file_id: uuid.UUID,
    data: ProjectFileRename,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    renamed = await editor_service.rename_project_file(db, document_id, clerk_id, file_id, data.nouveau_nom)
    if not renamed:
        raise HTTPException(status_code=404, detail="File not found")
    return renamed

@router.delete(
    "/docs/{document_id}/files/{file_id}",
    response_model=MessageOut,
    summary="Delete project file",
)
async def delete_project_file(
    document_id: uuid.UUID,
    file_id: uuid.UUID,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageOut:
    deleted = await editor_service.delete_project_file(db, document_id, clerk_id, file_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="File not found")
    return MessageOut(message="File deleted successfully")
