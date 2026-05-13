"""
chat_service.py — CRUD for `sessions_ia` and `messages_ia`.

Implements the queries from queriesReference.sql §3 & §4.
"""

import uuid
from typing import List, Optional

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import call_legal_ai
from app.models import MessageIA, SessionIA
from app.schemas import ChatSessionCreate, ChatSessionUpdate, MessageCreate


# ─────────────────────────────────────────────────────────
# SESSIONS
# ─────────────────────────────────────────────────────────

async def create_session(
    db: AsyncSession,
    clerk_id: str,
    data: ChatSessionCreate,
) -> SessionIA:
    """
    Create a new AI chat session. Returns the new UUID.

    Maps to:
        INSERT INTO sessions_ia (utilisateur_id, titre)
        VALUES (:clerk_id, :titre) RETURNING id;
    """
    session = SessionIA(
        utilisateur_id=clerk_id,
        titre=data.titre or "Nouvelle Discussion",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_user_sessions(
    db: AsyncSession,
    clerk_id: str,
) -> List[SessionIA]:
    """
    Fetch all active sessions for the sidebar history.

    Maps to:
        SELECT id, titre, epingle, date_modif
        FROM sessions_ia
        WHERE utilisateur_id = :clerk_id AND is_deleted = FALSE
        ORDER BY epingle DESC, date_modif DESC;
    """
    result = await db.execute(
        select(SessionIA)
        .where(
            SessionIA.utilisateur_id == clerk_id,
            SessionIA.is_deleted == False,
        )
        .order_by(SessionIA.epingle.desc(), SessionIA.date_modif.desc())
    )
    return list(result.scalars().all())


async def get_session_by_id(
    db: AsyncSession,
    session_id: uuid.UUID,
    clerk_id: str,
) -> Optional[SessionIA]:
    """
    Fetch a single session, enforcing ownership via clerk_id.

    Maps to:
        SELECT * FROM sessions_ia WHERE id = :session_id AND is_deleted = FALSE;
    """
    result = await db.execute(
        select(SessionIA).where(
            SessionIA.id == session_id,
            SessionIA.utilisateur_id == clerk_id,
            SessionIA.is_deleted == False,
        )
    )
    return result.scalars().first()


async def get_session_messages(
    db: AsyncSession,
    session_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
) -> List[MessageIA]:
    """
    Fetch all messages for a session, ordered chronologically.

    Maps to:
        SELECT id, auteur, contenu, sources_rag, date_creation
        FROM messages_ia
        WHERE session_id = :session_id
        ORDER BY date_creation ASC
        LIMIT :limit OFFSET :offset;
    """
    result = await db.execute(
        select(MessageIA)
        .where(MessageIA.session_id == session_id)
        .order_by(MessageIA.date_creation.asc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def send_message(
    db: AsyncSession,
    session_id: uuid.UUID,
    clerk_id: str,
    data: MessageCreate,
) -> dict:
    """
    Send a user message, call the AI, and persist both messages.

    1. INSERT user message
    2. call_legal_ai() for the AI response
    3. INSERT AI message with sources
    4. Touch session date_modif via trigger

    Returns both messages as a dict.
    """
    # 1. Insert user message
    user_msg = MessageIA(
        session_id=session_id,
        auteur="user",
        contenu=data.contenu,
    )
    db.add(user_msg)
    await db.flush()  # get the ID without committing

    # 2. Call AI
    ai_response_text = await call_legal_ai(data.contenu)

    # 3. Insert AI message
    ai_msg = MessageIA(
        session_id=session_id,
        auteur="ia",
        contenu=ai_response_text,
        sources_rag=None,  # RAG sources will be added later
    )
    db.add(ai_msg)

    # 4. Touch session to trigger date_modif update
    await db.execute(
        update(SessionIA)
        .where(SessionIA.id == session_id)
        .values(titre=SessionIA.titre)  # no-op update to fire trigger
    )

    await db.commit()
    await db.refresh(user_msg)
    await db.refresh(ai_msg)

    return {"user_message": user_msg, "ai_message": ai_msg}


async def update_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    clerk_id: str,
    data: ChatSessionUpdate,
) -> Optional[SessionIA]:
    """
    Update session metadata (title / pin status).

    Maps to:
        UPDATE sessions_ia SET titre = :new_titre WHERE id = :session_id;
        UPDATE sessions_ia SET epingle = :pin_status WHERE id = :session_id;
    """
    session = await get_session_by_id(db, session_id, clerk_id)
    if not session:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)

    await db.commit()
    await db.refresh(session)
    return session


async def delete_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    clerk_id: str,
) -> bool:
    """
    Soft-delete a session (is_deleted = TRUE).

    Maps to:
        UPDATE sessions_ia SET is_deleted = TRUE WHERE id = :session_id;
    """
    session = await get_session_by_id(db, session_id, clerk_id)
    if not session:
        return False

    session.is_deleted = True
    await db.commit()
    return True
