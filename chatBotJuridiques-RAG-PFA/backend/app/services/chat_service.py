"""
chat_service.py — CRUD for `sessions_ia` and `messages_ia`.

Implements the queries from queriesReference.sql §3 & §4.
"""

import uuid
from typing import List, Optional

from sqlalchemy import or_, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import call_legal_ai
from app.models import MessageIA, SessionIA
from app.schemas import ChatSessionCreate, ChatSessionUpdate, MessageCreate
from app.services import file_service
from app.logger import app_logger


# ─────────────────────────────────────────────────────────
# SESSIONS
# ─────────────────────────────────────────────────────────

async def create_session(
    db: AsyncSession,
    clerk_id: str,
    data: ChatSessionCreate,
) -> SessionIA:
    session = SessionIA(
        utilisateur_id=clerk_id,
        titre=data.titre or "Nouvelle Discussion",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    app_logger.info("Created new chat session", extra={"session_id": str(session.id), "user_id": clerk_id})
    return session


async def get_user_sessions(
    db: AsyncSession,
    clerk_id: str,
) -> List[SessionIA]:
    result = await db.execute(
        select(SessionIA)
        .where(
            SessionIA.utilisateur_id == clerk_id,
            SessionIA.is_deleted == False,
        )
        .order_by(SessionIA.epingle.desc(), SessionIA.date_modif.desc())
    )
    sessions = list(result.scalars().all())
    app_logger.debug("Fetched user chat sessions", extra={"user_id": clerk_id, "count": len(sessions)})
    return sessions


async def search_sessions(
    db: AsyncSession,
    clerk_id: str,
    query: str,
) -> List[SessionIA]:
    pattern = f"%{query.strip()}%"
    result = await db.execute(
        select(SessionIA)
        .distinct()
        .outerjoin(MessageIA, MessageIA.session_id == SessionIA.id)
        .where(
            SessionIA.utilisateur_id == clerk_id,
            SessionIA.is_deleted == False,
            or_(
                SessionIA.titre.ilike(pattern),
                MessageIA.contenu.ilike(pattern),
            ),
        )
        .order_by(SessionIA.epingle.desc(), SessionIA.date_modif.desc())
    )
    sessions = list(result.scalars().all())
    app_logger.info("Searched user chat sessions", extra={"user_id": clerk_id, "query": query, "count": len(sessions)})
    return sessions


async def get_session_by_id(
    db: AsyncSession,
    session_id: uuid.UUID,
    clerk_id: str,
) -> Optional[SessionIA]:
    result = await db.execute(
        select(SessionIA).where(
            SessionIA.id == session_id,
            SessionIA.utilisateur_id == clerk_id,
            SessionIA.is_deleted == False,
        )
    )
    session = result.scalars().first()
    if session:
        app_logger.debug("Fetched chat session by ID", extra={"session_id": str(session_id), "user_id": clerk_id})
    else:
        app_logger.warning("Chat session not found or unauthorized access attempt", extra={"session_id": str(session_id), "user_id": clerk_id})
    return session


async def get_session_messages(
    db: AsyncSession,
    session_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
) -> List[MessageIA]:
    result = await db.execute(
        select(MessageIA)
        .where(MessageIA.session_id == session_id)
        .order_by(MessageIA.date_creation.asc())
        .limit(limit)
        .offset(offset)
    )
    messages = list(result.scalars().all())
    app_logger.debug("Fetched session messages", extra={"session_id": str(session_id), "count": len(messages)})
    return messages


async def send_message(
    db: AsyncSession,
    session_id: uuid.UUID,
    clerk_id: str,
    data: MessageCreate,
) -> dict:
    from app.core.retrieval.vector_store import vector_store
    from app.core.retrieval.reranker import reranker
    from app.ai import rewrite_query_async, FINAL_GENERATION_PROMPT

    app_logger.info("Sending message to chat session", extra={"session_id": str(session_id), "user_id": clerk_id, "has_file": bool(data.file_id)})
    
    # 0. Fetch Conversational Memory (Last 3 message pairs = 6 messages)
    # We fetch this BEFORE inserting the new user message
    past_msgs = await db.execute(
        select(MessageIA)
        .where(MessageIA.session_id == session_id)
        .order_by(MessageIA.date_creation.desc())
        .limit(6)
    )
    past_msgs = list(reversed(past_msgs.scalars().all()))
    
    history_lines = []
    for m in past_msgs:
        role = "User" if m.auteur == "user" else "AI"
        history_lines.append(f"{role}: {m.contenu}")
    history_str = "\n".join(history_lines) if history_lines else "لا يوجد سجل سابق."

    # 1. Insert user message
    user_msg = MessageIA(
        session_id=session_id,
        auteur="user",
        contenu=data.contenu,
    )
    db.add(user_msg)
    await db.flush()

    # 2. Build prompt (Routing Logic)
    sources_rag = None
    media_parts = None
    if data.file_id:
        # ROUTE 1: User Upload Bypass
        app_logger.info("Chat message using live file bypass (Path B)", extra={"file_id": str(data.file_id)})
        file_record = await file_service.get_file_by_id(db, data.file_id, clerk_id)
        if not file_record:
            app_logger.error("File not found or not owned by user during chat bypass", extra={"file_id": str(data.file_id), "user_id": clerk_id})
            raise ValueError("File not found or not owned by you.")
        
        media_parts = await file_service.get_multimodal_parts(file_record)
        prompt = (
            f"### سجل المحادثة (Chat History):\n{history_str}\n\n"
            f"Question utilisateur: {data.contenu}\n\n"
            f"(Note: Réponds en utilisant le document joint à ce message. "
            f"S'il s'agit d'une image ou d'un PDF, analyse son contenu visuel ou textuel.)"
        )
        sources_rag = {
            "file_id": str(file_record.id),
            "nom_fichier": file_record.nom_fichier,
        }
    else:
        # ROUTE 2: Advanced Static RAG Pipeline
        app_logger.info("Chat message using Advanced RAG pipeline (Path A)")
        
        # Step 1: Query Transformation & Decomposition
        sub_queries = await rewrite_query_async(history_str, data.contenu)
        
        # Step 2: Retrieval per sub-query (Optimized for CPU Latency)
        unique_chunks = {}
        for sq in sub_queries:
            # OPTIMIZATION: Reduced from 15 to 7 to prevent CPU bottleneck during Cross-Encoder reranking
            sq_chunks = vector_store.search(sq, top_k=7)
            # Rerank to top 3 instead of 5
            reranked = reranker.rerank(sq, sq_chunks, top_k=3)
            
            for c in reranked:
                # Use chunk id to deduplicate overlapping results
                chunk_id = c.get("id")
                if chunk_id not in unique_chunks:
                    unique_chunks[chunk_id] = c
                else:
                    # Keep the highest rerank score if duplicated
                    if c.get("rerank_score", 0) > unique_chunks[chunk_id].get("rerank_score", 0):
                        unique_chunks[chunk_id] = c
        
        # We simply collect all unique chunks from all sub-queries.
        # We DO NOT do a global sort/cutoff here because cross-encoder scores 
        # from different sub-queries are not directly comparable and we don't want to drop context.
        final_chunks = list(unique_chunks.values())
        
        # Format Context
        context_parts = []
        for i, chunk in enumerate(final_chunks, 1):
            meta = chunk.get("metadata", {})
            doc_name = meta.get("document_name", "Document")
            page = meta.get("page_number", "?")
            text = chunk.get("text", "")
            context_parts.append(f"[{i}] {doc_name} — صفحة {page}:\n{text}")
        
        rag_context = "\n\n---\n\n".join(context_parts)
        if not rag_context:
            rag_context = "لم يتم العثور على أي نصوص قانونية مطابقة في قاعدة البيانات."

        # Step 3: Final Generation with Graceful Fallback
        prompt = FINAL_GENERATION_PROMPT.format(
            history=history_str, 
            context=rag_context, 
            query=data.contenu
        )
        sources_rag = {
            "sub_queries": sub_queries,
            "unique_chunks_retrieved": len(final_chunks)
        }

    # Call Gemini or GPT
    ai_response_text = await call_legal_ai(
        prompt, 
        media_parts=media_parts, 
        bypass_system_prompt=True,
        model_choice=data.model
    )

    # 3. Insert AI message
    ai_msg = MessageIA(
        session_id=session_id,
        auteur="ia",
        contenu=ai_response_text,
        sources_rag=sources_rag,
    )
    db.add(ai_msg)

    # 4. Touch session
    await db.execute(
        update(SessionIA)
        .where(SessionIA.id == session_id)
        .values(titre=SessionIA.titre)
    )

    await db.commit()
    await db.refresh(user_msg)
    await db.refresh(ai_msg)

    app_logger.info("Message sent successfully and AI response received", extra={"session_id": str(session_id)})
    return {"user_message": user_msg, "ai_message": ai_msg}


async def update_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    clerk_id: str,
    data: ChatSessionUpdate,
) -> Optional[SessionIA]:
    session = await get_session_by_id(db, session_id, clerk_id)
    if not session:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)

    await db.commit()
    await db.refresh(session)
    app_logger.info("Updated chat session metadata", extra={"session_id": str(session_id), "fields": list(update_data.keys())})
    return session


async def delete_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    clerk_id: str,
) -> bool:
    session = await get_session_by_id(db, session_id, clerk_id)
    if not session:
        return False

    session.is_deleted = True
    await db.commit()
    app_logger.info("Soft-deleted chat session", extra={"session_id": str(session_id), "user_id": clerk_id})
    return True
