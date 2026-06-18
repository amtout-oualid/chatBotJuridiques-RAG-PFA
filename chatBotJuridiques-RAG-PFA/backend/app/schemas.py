"""
schemas.py — Pydantic v2 request / response models.

Organised by domain to match the route groups in Roots.txt.
Every schema uses `model_config = ConfigDict(from_attributes=True)`
so ORM objects can be serialised directly.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ═════════════════════════════════════════════════════════
# 1. AUTH & USERS
# ═════════════════════════════════════════════════════════

class UserSync(BaseModel):
    """POST /auth/sync — body sent from the React frontend after Clerk login."""
    email: str
    nom: Optional[str] = None
    prenom: Optional[str] = None
    role: Optional[str] = "client"


class UserResponse(BaseModel):
    """GET /users/me — full user profile returned to the frontend."""
    id: str
    email: str
    nom: Optional[str] = None
    prenom: Optional[str] = None
    role: str
    date_creation: datetime
    date_modif: datetime

    model_config = ConfigDict(from_attributes=True)


class UserSettingsUpdate(BaseModel):
    """PUT /users/settings — partial update of user preferences."""
    nom: Optional[str] = None
    prenom: Optional[str] = None
    role: Optional[str] = None


# ═════════════════════════════════════════════════════════
# 2. AI CHAT (Sessions & Messages)
# ═════════════════════════════════════════════════════════

class ChatSessionCreate(BaseModel):
    """POST /chats — create a new AI chat session."""
    titre: Optional[str] = "Nouvelle Discussion"


class ChatSessionUpdate(BaseModel):
    """PATCH /chats/{id} — rename or pin a session."""
    titre: Optional[str] = None
    epingle: Optional[bool] = None


class ChatSessionResponse(BaseModel):
    """Single session item for the sidebar list."""
    id: uuid.UUID
    titre: Optional[str] = None
    epingle: bool
    date_creation: datetime
    date_modif: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatSessionListResponse(BaseModel):
    """GET /chats — list wrapper."""
    sessions: List[ChatSessionResponse]


class MessageCreate(BaseModel):
    """POST /chats/{id}/messages — user sends a prompt."""
    contenu: str = Field(..., min_length=1, description="User message content")
    file_id: Optional[uuid.UUID] = Field(
        None,
        description="Optional uploaded file ID from /files to use as RAG context",
    )
    model: Optional[str] = Field("gemini", description="AI model to use (gemini or gpt)")


class MessageResponse(BaseModel):
    """Single message returned in the chat view."""
    id: uuid.UUID
    auteur: str
    contenu: str
    sources_rag: Optional[Any] = None
    date_creation: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatMessagesResponse(BaseModel):
    """GET /chats/{id} — all messages for a session."""
    session: ChatSessionResponse
    messages: List[MessageResponse]


# ═════════════════════════════════════════════════════════
# 3. FILES (DMS & RAG Context)
# ═════════════════════════════════════════════════════════

class FileResponse(BaseModel):
    """Single file item."""
    id: uuid.UUID
    nom_fichier: str
    type_mime: Optional[str] = None
    taille_octets: Optional[int] = None
    indexe_rag: bool
    date_creation: datetime

    model_config = ConfigDict(from_attributes=True)

class FileRename(BaseModel):
    nouveau_nom: str


class FileListResponse(BaseModel):
    """GET /files — list wrapper."""
    files: List[FileResponse]


class FileSearchResponse(BaseModel):
    """GET /files/search — search results."""
    query: str
    results: List[FileResponse]


# ═════════════════════════════════════════════════════════
# 4. EDITOR (Templates & Generated Documents)
# ═════════════════════════════════════════════════════════

class TemplateResponse(BaseModel):
    """Single template metadata for the gallery."""
    id: uuid.UUID
    nom: str
    description: Optional[str] = None
    categorie: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TemplateListResponse(BaseModel):
    """GET /editor/templates — list wrapper."""
    templates: List[TemplateResponse]


class DocumentCreate(BaseModel):
    """POST body to create a new generated document."""
    modele_id: Optional[uuid.UUID] = None
    titre: str
    latex_contenu: Optional[str] = ""


class DocumentUpdate(BaseModel):
    """PUT /editor/docs/{id} — auto-save / update."""
    titre: Optional[str] = None
    latex_contenu: Optional[str] = None
    statut: Optional[str] = None


class DocumentListItem(BaseModel):
    """Single document summary for the dashboard."""
    id: uuid.UUID
    titre: Optional[str] = None
    statut: str
    date_modif: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    """GET /editor/docs — list wrapper."""
    documents: List[DocumentListItem]


class DocumentDetailResponse(BaseModel):
    """Full document content for the editor."""
    id: uuid.UUID
    titre: Optional[str] = None
    latex_contenu: Optional[str] = None
    pdf_url: Optional[str] = None
    statut: str
    date_creation: datetime
    date_modif: datetime

    model_config = ConfigDict(from_attributes=True)


class CompileRequest(BaseModel):
    """POST /editor/compile — LaTeX source to compile."""
    latex_code: str
    document_id: Optional[uuid.UUID] = None


class CompileResponse(BaseModel):
    """Compilation result."""
    success: bool
    pdf_url: Optional[str] = None
    pdf_base64: Optional[str] = None
    errors: Optional[str] = None
    log_output: Optional[str] = None


class AISuggestRequest(BaseModel):
    """POST /editor/ai-suggest — code + user prompt."""
    latex_code: str
    prompt: str
    document_id: Optional[uuid.UUID] = None


class AISuggestResponse(BaseModel):
    """AI suggestion result."""
    suggested_code: str

class ProjectFileRename(BaseModel):
    nouveau_nom: str


# ═════════════════════════════════════════════════════════
# 5. LAWYERS (Professional Directory)
# ═════════════════════════════════════════════════════════

class LawyerListItem(BaseModel):
    """Single lawyer card for the directory."""
    id: str  # Clerk ID of the utilisateur
    nom: Optional[str] = None
    prenom: Optional[str] = None
    specialite: Optional[str] = None
    bio: Optional[str] = None
    barreau: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class LawyerListResponse(BaseModel):
    """GET /lawyers — list wrapper."""
    lawyers: List[LawyerListItem]


class LawyerDetailResponse(BaseModel):
    """GET /lawyers/{id} — full lawyer profile."""
    id: str
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: str
    specialite: Optional[str] = None
    bio: Optional[str] = None
    telephone: Optional[str] = None
    barreau: Optional[str] = None
    disponible: bool

    model_config = ConfigDict(from_attributes=True)


# ═════════════════════════════════════════════════════════
# GENERIC
# ═════════════════════════════════════════════════════════

class MessageOut(BaseModel):
    """Generic status message."""
    message: str
    detail: Optional[str] = None
