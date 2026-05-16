"""
routers/chats.py — AI Chat (Legal Assistant) routes.

Routes:
    GET    /chats              — List all chat sessions
    GET    /chats/search       — Search sessions by title or message content
    POST   /chats              — Create a new chat session
    GET    /chats/{id}         — Get all messages for a session
    POST   /chats/{id}/messages — Send a prompt, get AI response
    PATCH  /chats/{id}         — Update session metadata
    DELETE /chats/{id}         — Soft-delete a session
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas import (
    ChatMessagesResponse,
    ChatSessionCreate,
    ChatSessionListResponse,
    ChatSessionResponse,
    ChatSessionUpdate,
    MessageCreate,
    MessageOut,
    MessageResponse,
)
from app.services import chat_service

router = APIRouter(prefix="/chats", tags=["AI Chat"])


@router.get(
    "",
    response_model=ChatSessionListResponse,
    summary="List all chat sessions",
    description="Retrieves all chat session history for the sidebar list.",
)
async def list_sessions(
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatSessionListResponse:
    sessions = await chat_service.get_user_sessions(db, clerk_id)
    return ChatSessionListResponse(sessions=sessions)


@router.get(
    "/search",
    response_model=ChatSessionListResponse,
    summary="Search chat sessions",
    description=(
        "Returns sessions whose title or any message content matches the query "
        "(case-insensitive)."
    ),
)
async def search_sessions(
    query: str = Query(..., min_length=1, description="Search keyword"),
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatSessionListResponse:
    sessions = await chat_service.search_sessions(db, clerk_id, query)
    return ChatSessionListResponse(sessions=sessions)


@router.post(
    "",
    response_model=ChatSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new chat session",
    description="Creates a new chat session.",
)
async def create_session(
    data: ChatSessionCreate,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatSessionResponse:
    session = await chat_service.create_session(db, clerk_id, data)
    return session


@router.get(
    "/{session_id}",
    response_model=ChatMessagesResponse,
    summary="Get session messages",
    description="Fetches all messages for a specific session.",
)
async def get_session_messages(
    session_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatMessagesResponse:
    # Verify session ownership
    session = await chat_service.get_session_by_id(db, session_id, clerk_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    messages = await chat_service.get_session_messages(db, session_id, limit, offset)
    return ChatMessagesResponse(session=session, messages=messages)


@router.post(
    "/{session_id}/messages",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Send a message",
    description="Sends a user prompt and triggers the RAG pipeline for an AI response.",
)
async def send_message(
    session_id: uuid.UUID,
    data: MessageCreate,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify session ownership
    session = await chat_service.get_session_by_id(db, session_id, clerk_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    try:
        result = await chat_service.send_message(db, session_id, clerk_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    return {
        "user_message": MessageResponse.model_validate(result["user_message"]),
        "ai_message": MessageResponse.model_validate(result["ai_message"]),
    }


@router.patch(
    "/{session_id}",
    response_model=ChatSessionResponse,
    summary="Update session metadata",
    description="Updates chat session metadata (e.g., renaming the title or pinning).",
)
async def update_session(
    session_id: uuid.UUID,
    data: ChatSessionUpdate,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatSessionResponse:
    session = await chat_service.update_session(db, session_id, clerk_id, data)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
    return session


@router.delete(
    "/{session_id}",
    response_model=MessageOut,
    summary="Soft-delete a session",
    description="Soft deletes a chat session.",
)
async def delete_session(
    session_id: uuid.UUID,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageOut:
    deleted = await chat_service.delete_session(db, session_id, clerk_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
    return MessageOut(message="Session deleted successfully.")
