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

from fastapi import APIRouter, Depends, HTTPException, status
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
    TemplateListResponse,
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
    _clerk_id: str = Depends(get_current_user),
) -> CompileResponse:
    result = await editor_service.compile_latex(data.latex_code)
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
    _clerk_id: str = Depends(get_current_user),
) -> AISuggestResponse:
    suggested = await editor_service.ai_suggest(data.latex_code, data.prompt)
    return AISuggestResponse(suggested_code=suggested)
