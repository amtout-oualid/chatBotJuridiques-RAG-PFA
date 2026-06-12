"""
routers/files.py — My Database (DMS & RAG Context) routes.

Routes:
    GET    /files         — List all user files
    POST   /files/upload  — Upload a document
    GET    /files/search  — Semantic search (placeholder)
    DELETE /files/{id}    — Remove a file
"""

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas import (
    FileListResponse,
    FileResponse,
    FileSearchResponse,
    FileRename,
    MessageOut,
)
from app.services import file_service

router = APIRouter(prefix="/files", tags=["Files & DMS"])


@router.patch(
    "/{file_id}/rename",
    response_model=MessageOut,
    summary="Rename a file",
)
async def rename_file(
    file_id: uuid.UUID,
    data: FileRename,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageOut:
    renamed = await file_service.rename_file(db, file_id, clerk_id, data.nouveau_nom)
    if not renamed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or not owned by you.",
        )
    return MessageOut(message="File renamed successfully.")

@router.get(
    "",
    response_model=FileListResponse,
    summary="List all user files",
    description="Lists all files and folders in the user's private document management system.",
)
async def list_files(
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileListResponse:
    files = await file_service.get_user_files(db, clerk_id)
    return FileListResponse(files=files)


@router.post(
    "/upload",
    response_model=FileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a document",
    description="Uploads a PDF/document and initiates the vectorization process for RAG.",
)
async def upload_file(
    file: UploadFile = File(...),
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    content = await file.read()

    # Basic validation
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # Max 50 MB
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 50 MB limit.",
        )

    result = await file_service.upload_file(
        db=db,
        clerk_id=clerk_id,
        filename=file.filename or "unnamed_file",
        content=content,
        content_type=file.content_type,
    )
    return result


@router.get(
    "/search",
    response_model=FileSearchResponse,
    summary="Search files",
    description="Performs a semantic search across uploaded legal documents.",
)
async def search_files(
    q: str = Query(..., min_length=1, description="Search query"),
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileSearchResponse:
    results = await file_service.search_files(db, clerk_id, q)
    return FileSearchResponse(query=q, results=results)


@router.delete(
    "/{file_id}",
    response_model=MessageOut,
    summary="Delete a file",
    description="Removes a file from the database and the vector store.",
)
async def delete_file(
    file_id: uuid.UUID,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageOut:
    deleted = await file_service.delete_file(db, file_id, clerk_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or not owned by you.",
        )
    return MessageOut(message="File deleted successfully.")
