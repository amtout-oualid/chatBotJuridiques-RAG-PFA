"""
routers/auth.py — Authentication & User Management routes.

Routes:
    POST /auth/sync       — Sync Clerk metadata to PostgreSQL
    GET  /users/me        — Get current user profile
    PUT  /users/settings  — Update user preferences
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas import MessageOut, UserResponse, UserSettingsUpdate, UserSync
from app.services import user_service

router = APIRouter(tags=["Authentication & Users"])


@router.post(
    "/auth/sync",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Sync Clerk user to database",
    description="Syncs Clerk metadata (names, email) to the PostgreSQL database after login.",
)
async def sync_user(
    data: UserSync,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    user = await user_service.sync_user(db, clerk_id, data)
    return user


@router.get(
    "/users/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Retrieves current user profile, role (Client/Avocat), and preferences.",
)
async def get_me(
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    user = await user_service.get_user_by_id(db, clerk_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Call POST /auth/sync first.",
        )
    return user


@router.put(
    "/users/settings",
    response_model=UserResponse,
    summary="Update user settings",
    description="Updates user preferences (e.g., name, role).",
)
async def update_settings(
    data: UserSettingsUpdate,
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    user = await user_service.update_user_settings(db, clerk_id, data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return user
