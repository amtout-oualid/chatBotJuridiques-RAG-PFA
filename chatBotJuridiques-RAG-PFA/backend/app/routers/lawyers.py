"""
routers/lawyers.py — Professional Directory (Lawyers) routes.

Routes:
    GET /lawyers      — List lawyers filtered by specialty or region
    GET /lawyers/{id} — Full lawyer profile
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas import LawyerDetailResponse, LawyerListItem, LawyerListResponse
from app.services import lawyer_service

router = APIRouter(prefix="/lawyers", tags=["Lawyers Directory"])


@router.get(
    "",
    response_model=LawyerListResponse,
    summary="List lawyers",
    description="Fetches a list of lawyers filtered by specialty or region.",
)
async def list_lawyers(
    specialite: str | None = Query(None, description="Filter by specialty"),
    region: str | None = Query(None, description="Filter by barreau / region"),
    _clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LawyerListResponse:
    rows = await lawyer_service.get_lawyers(db, specialite=specialite, region=region)
    lawyers = [LawyerListItem(**row) for row in rows]
    return LawyerListResponse(lawyers=lawyers)


@router.get(
    "/{lawyer_id}",
    response_model=LawyerDetailResponse,
    summary="Get lawyer profile",
    description="Retrieves full bio, contact details, and barreau information for a specific lawyer.",
)
async def get_lawyer(
    lawyer_id: str,
    _clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LawyerDetailResponse:
    row = await lawyer_service.get_lawyer_by_id(db, lawyer_id)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lawyer not found.",
        )
    return LawyerDetailResponse(**row)
