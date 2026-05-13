"""
lawyer_service.py — CRUD for `profils_avocats` (read-only from the public directory).

Implements the queries from queriesReference.sql §2.
"""

import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ProfilAvocat, Utilisateur


async def get_lawyers(
    db: AsyncSession,
    specialite: Optional[str] = None,
    region: Optional[str] = None,
) -> List[dict]:
    """
    Fetch a list of available lawyers, optionally filtered by specialty.

    Maps to:
        SELECT u.id, u.nom, u.prenom, p.specialite, p.bio, p.barreau
        FROM utilisateurs u
        JOIN profils_avocats p ON u.id = p.utilisateur_id
        WHERE p.disponible = TRUE
          AND p.specialite ILIKE :specialty_search;
    """
    query = (
        select(
            Utilisateur.id,
            Utilisateur.nom,
            Utilisateur.prenom,
            ProfilAvocat.specialite,
            ProfilAvocat.bio,
            ProfilAvocat.barreau,
        )
        .join(ProfilAvocat, Utilisateur.id == ProfilAvocat.utilisateur_id)
        .where(ProfilAvocat.disponible == True)
    )

    if specialite:
        query = query.where(ProfilAvocat.specialite.ilike(f"%{specialite}%"))
    if region:
        query = query.where(ProfilAvocat.barreau.ilike(f"%{region}%"))

    result = await db.execute(query)
    rows = result.mappings().all()
    return [dict(row) for row in rows]


async def get_lawyer_by_id(
    db: AsyncSession,
    lawyer_id: str,
) -> Optional[dict]:
    """
    Fetch full bio, contact details, and barreau for a specific lawyer.

    Maps to:
        SELECT * FROM profils_avocats WHERE utilisateur_id = :clerk_id;
    Combined with the utilisateur data for the full profile.
    """
    result = await db.execute(
        select(
            Utilisateur.id,
            Utilisateur.nom,
            Utilisateur.prenom,
            Utilisateur.email,
            ProfilAvocat.specialite,
            ProfilAvocat.bio,
            ProfilAvocat.telephone,
            ProfilAvocat.barreau,
            ProfilAvocat.disponible,
        )
        .join(ProfilAvocat, Utilisateur.id == ProfilAvocat.utilisateur_id)
        .where(Utilisateur.id == lawyer_id)
    )
    row = result.mappings().first()
    return dict(row) if row else None
