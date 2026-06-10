"""
models.py — SQLAlchemy ORM models for all 9 PostgreSQL tables.

Every table name, column name, constraint, and default matches
the definitive schema in UML_DB_Roots/DB/creatTables.sql exactly.

Note: The trigger function `update_modified_column()` and RLS policies
must be applied directly in PostgreSQL via psql / pgAdmin — SQLAlchemy
cannot create trigger functions declaratively.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    BigInteger,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


# ─────────────────────────────────────────────────────────
# 1. UTILISATEURS (Users)
# ─────────────────────────────────────────────────────────
class Utilisateur(Base):
    __tablename__ = "utilisateurs"

    id = Column(String(255), primary_key=True)  # Clerk ID
    email = Column(String(255), unique=True, nullable=False)
    nom = Column(String(100))
    prenom = Column(String(100))
    role = Column(
        String(50),
        server_default="client",
        nullable=False,
    )
    date_creation = Column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )
    date_modif = Column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )

    __table_args__ = (
        CheckConstraint(
            "role IN ('client', 'avocat', 'admin')",
            name="ck_utilisateurs_role",
        ),
    )

    # ── relationships ────────────────────────────────────
    profil_avocat = relationship(
        "ProfilAvocat",
        back_populates="utilisateur",
        uselist=False,
        cascade="all, delete-orphan",
    )
    sessions_ia = relationship(
        "SessionIA",
        back_populates="utilisateur",
        cascade="all, delete-orphan",
    )
    documents_generes = relationship(
        "DocumentGenere",
        back_populates="utilisateur",
        cascade="all, delete-orphan",
    )
    fichiers = relationship(
        "FichierUtilisateur",
        back_populates="utilisateur",
        cascade="all, delete-orphan",
    )
    conversations_client = relationship(
        "ConversationDirecte",
        back_populates="client",
        foreign_keys="ConversationDirecte.client_id",
        cascade="all, delete-orphan",
    )
    conversations_avocat = relationship(
        "ConversationDirecte",
        back_populates="avocat",
        foreign_keys="ConversationDirecte.avocat_id",
        cascade="all, delete-orphan",
    )
    messages_directs_envoyes = relationship(
        "MessageDirect",
        back_populates="expediteur",
        cascade="all, delete-orphan",
    )


# ─────────────────────────────────────────────────────────
# 2. PROFILS_AVOCATS (Lawyer Profiles)
# ─────────────────────────────────────────────────────────
class ProfilAvocat(Base):
    __tablename__ = "profils_avocats"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    utilisateur_id = Column(
        String(255),
        ForeignKey("utilisateurs.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    specialite = Column(String(255))
    bio = Column(Text)
    telephone = Column(String(50))
    barreau = Column(String(255))
    disponible = Column(Boolean, server_default="true")
    date_creation = Column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )

    # ── relationships ────────────────────────────────────
    utilisateur = relationship("Utilisateur", back_populates="profil_avocat")


# ─────────────────────────────────────────────────────────
# 3. SESSIONS_IA (AI Chat Sessions)
# ─────────────────────────────────────────────────────────
class SessionIA(Base):
    __tablename__ = "sessions_ia"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    utilisateur_id = Column(
        String(255),
        ForeignKey("utilisateurs.id", ondelete="CASCADE"),
        nullable=False,
    )
    titre = Column(String(255), server_default="Nouvelle Discussion")
    epingle = Column(Boolean, server_default="false")
    is_deleted = Column(Boolean, server_default="false")
    date_creation = Column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )
    date_modif = Column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )

    # ── relationships ────────────────────────────────────
    utilisateur = relationship("Utilisateur", back_populates="sessions_ia")
    messages = relationship(
        "MessageIA",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="MessageIA.date_creation.asc()",
    )


# ─────────────────────────────────────────────────────────
# 4. MESSAGES_IA (AI Messages)
# ─────────────────────────────────────────────────────────
class MessageIA(Base):
    __tablename__ = "messages_ia"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sessions_ia.id", ondelete="CASCADE"),
        nullable=False,
    )
    auteur = Column(String(50), nullable=False)
    contenu = Column(Text, nullable=False)
    sources_rag = Column(JSONB, nullable=True)
    date_creation = Column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )

    __table_args__ = (
        CheckConstraint(
            "auteur IN ('user', 'ia')",
            name="ck_messages_ia_auteur",
        ),
    )

    # ── relationships ────────────────────────────────────
    session = relationship("SessionIA", back_populates="messages")


# ─────────────────────────────────────────────────────────
# 5. MODELES_JURIDIQUES (Legal Templates)
# ─────────────────────────────────────────────────────────
class ModeleJuridique(Base):
    __tablename__ = "modeles_juridiques"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    nom = Column(String(255), nullable=False)
    description = Column(Text)
    latex_squelette = Column(Text, nullable=False)
    categorie = Column(String(100))
    actif = Column(Boolean, server_default="true")
    date_creation = Column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )

    # ── relationships ────────────────────────────────────
    documents = relationship(
        "DocumentGenere",
        back_populates="modele",
    )


# ─────────────────────────────────────────────────────────
# 6. DOCUMENTS_GENERES (Generated Documents)
# ─────────────────────────────────────────────────────────
class DocumentGenere(Base):
    __tablename__ = "documents_generes"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    utilisateur_id = Column(
        String(255),
        ForeignKey("utilisateurs.id", ondelete="CASCADE"),
        nullable=False,
    )
    modele_id = Column(
        UUID(as_uuid=True),
        ForeignKey("modeles_juridiques.id", ondelete="SET NULL"),
        nullable=True,
    )
    titre = Column(String(255))
    latex_contenu = Column(Text)
    pdf_url = Column(Text)
    statut = Column(
        String(50),
        server_default="brouillon",
    )
    is_deleted = Column(Boolean, server_default="false")
    date_creation = Column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )
    date_modif = Column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )

    __table_args__ = (
        CheckConstraint(
            "statut IN ('brouillon', 'finalise')",
            name="ck_documents_generes_statut",
        ),
    )

    # ── relationships ────────────────────────────────────
    utilisateur = relationship("Utilisateur", back_populates="documents_generes")
    modele = relationship("ModeleJuridique", back_populates="documents")
    fichiers = relationship("FichierUtilisateur", back_populates="document", cascade="all, delete-orphan")


# ─────────────────────────────────────────────────────────
# 7. FICHIERS_UTILISATEURS (Uploaded Files)
# ─────────────────────────────────────────────────────────
class FichierUtilisateur(Base):
    __tablename__ = "fichiers_utilisateurs"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    utilisateur_id = Column(
        String(255),
        ForeignKey("utilisateurs.id", ondelete="CASCADE"),
        nullable=False,
    )
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents_generes.id", ondelete="CASCADE"),
        nullable=True,
    )
    nom_fichier = Column(String(255), nullable=False)
    url_stockage = Column(Text, nullable=False)
    type_mime = Column(String(100))
    taille_octets = Column(BigInteger)
    indexe_rag = Column(Boolean, server_default="false")
    qdrant_point_id = Column(UUID(as_uuid=True), nullable=True)
    date_creation = Column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )

    # ── relationships ────────────────────────────────────
    utilisateur = relationship("Utilisateur", back_populates="fichiers")
    document = relationship("DocumentGenere", back_populates="fichiers")


# ─────────────────────────────────────────────────────────
# 8. CONVERSATIONS_DIRECTES (Direct Lawyer-Client Chat)
# ─────────────────────────────────────────────────────────
class ConversationDirecte(Base):
    __tablename__ = "conversations_directes"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    client_id = Column(
        String(255),
        ForeignKey("utilisateurs.id", ondelete="CASCADE"),
        nullable=False,
    )
    avocat_id = Column(
        String(255),
        ForeignKey("utilisateurs.id", ondelete="CASCADE"),
        nullable=False,
    )
    statut = Column(
        String(50),
        server_default="active",
    )
    date_creation = Column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )
    derniere_activite = Column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )

    __table_args__ = (
        CheckConstraint(
            "statut IN ('active', 'fermee')",
            name="ck_conversations_directes_statut",
        ),
        Index("idx_conv_client", "client_id"),
        Index("idx_conv_avocat", "avocat_id"),
    )

    # ── relationships ────────────────────────────────────
    client = relationship(
        "Utilisateur",
        back_populates="conversations_client",
        foreign_keys=[client_id],
    )
    avocat = relationship(
        "Utilisateur",
        back_populates="conversations_avocat",
        foreign_keys=[avocat_id],
    )
    messages = relationship(
        "MessageDirect",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="MessageDirect.date_creation.asc()",
    )


# ─────────────────────────────────────────────────────────
# 9. MESSAGES_DIRECTS (Direct Messages)
# ─────────────────────────────────────────────────────────
class MessageDirect(Base):
    __tablename__ = "messages_directs"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conversations_directes.id", ondelete="CASCADE"),
        nullable=False,
    )
    expediteur_id = Column(
        String(255),
        ForeignKey("utilisateurs.id", ondelete="CASCADE"),
        nullable=False,
    )
    contenu = Column(Text, nullable=False)
    lu = Column(Boolean, server_default="false")
    date_creation = Column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )

    __table_args__ = (
        Index("idx_msg_direct_conv", "conversation_id"),
    )

    # ── relationships ────────────────────────────────────
    conversation = relationship("ConversationDirecte", back_populates="messages")
    expediteur = relationship("Utilisateur", back_populates="messages_directs_envoyes")
