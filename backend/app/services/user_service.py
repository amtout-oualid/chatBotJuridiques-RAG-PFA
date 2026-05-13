"""
user_service.py — CRUD operations for the `utilisateurs` table.

Implements the UPSERT and SELECT queries from queriesReference.sql §1.
"""

from typing import Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Utilisateur
from app.schemas import UserSettingsUpdate, UserSync


async def sync_user(
    db: AsyncSession,
    clerk_id: str,
    data: UserSync,
) -> Utilisateur:
    """
    UPSERT — Insert new user on first login OR update on Clerk change.

    Maps to:
        INSERT INTO utilisateurs (id, email, nom, prenom, role)
        VALUES (:clerk_id, :email, :nom, :prenom, :role)
        ON CONFLICT (id)
        DO UPDATE SET email = EXCLUDED.email, nom = EXCLUDED.nom, prenom = EXCLUDED.prenom;
    """
    query = text("""
        INSERT INTO utilisateurs (id, email, nom, prenom, role)
        VALUES (:clerk_id, :email, :nom, :prenom, :role)
        ON CONFLICT (id)
        DO UPDATE SET
            email = EXCLUDED.email,
            nom   = EXCLUDED.nom,
            prenom = EXCLUDED.prenom
        RETURNING id, email, nom, prenom, role, date_creation, date_modif
    """)
    result = await db.execute(
        query,
        {
            "clerk_id": clerk_id,
            "email": data.email,
            "nom": data.nom,
            "prenom": data.prenom,
            "role": data.role or "client",
        },
    )
    await db.commit()
    row = result.mappings().one()
    return Utilisateur(**row)


async def get_user_by_id(
    db: AsyncSession,
    clerk_id: str,
) -> Optional[Utilisateur]:
    """
    Fetch a single user by their Clerk ID.

    Maps to:
        SELECT * FROM utilisateurs WHERE id = :clerk_id;
    """
    result = await db.execute(
        select(Utilisateur).where(Utilisateur.id == clerk_id)
    )
    return result.scalars().first()


async def update_user_settings(
    db: AsyncSession,
    clerk_id: str,
    data: UserSettingsUpdate,
) -> Optional[Utilisateur]:
    """
    Partial update of user profile fields.
    Only non-None fields from the request body are applied.
    """
    user = await get_user_by_id(db, clerk_id)
    if not user:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user
