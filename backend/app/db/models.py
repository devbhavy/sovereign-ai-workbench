import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


# ============================================================
# Conversation
# ============================================================

class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="New Conversation",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Relationships
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
    )

    artifacts: Mapped[list["Artifact"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
    )

    agent_runs: Mapped[list["AgentRun"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
    )


# ============================================================
# Message
# ============================================================

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "conversations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    # user / assistant
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    # Actual chat content
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    # Relationships
    conversation: Mapped["Conversation"] = relationship(
        back_populates="messages",
    )

    files: Mapped[list["File"]] = relationship(
        secondary="message_files",
        back_populates="messages",
    )


# ============================================================
# File
# ============================================================

class File(Base):
    __tablename__ = "files"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    stored_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    mime_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    # Path inside our local storage
    storage_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    size: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    # Relationships
    messages: Mapped[list["Message"]] = relationship(
        secondary="message_files",
        back_populates="files",
    )


# ============================================================
# Message ↔ File
# ============================================================

class MessageFile(Base):
    __tablename__ = "message_files"

    message_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "messages.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )

    file_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "files.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )


# ============================================================
# Artifact
# ============================================================

class Artifact(Base):
    __tablename__ = "artifacts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "conversations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    # Example: report.docx
    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # Example: docx / xlsx / pptx / py
    file_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    storage_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    # Relationships
    conversation: Mapped["Conversation"] = relationship(
        back_populates="artifacts",
    )


# ============================================================
# Agent Run
# ============================================================

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "conversations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    # --------------------------------------------------------
    # Overall agent input
    # --------------------------------------------------------
    #
    # Example:
    #
    # {
    #     "message": "Analyze this PDF",
    #     "file_ids": [
    #         "..."
    #     ]
    # }
    #
    input: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    # --------------------------------------------------------
    # Overall agent output
    # --------------------------------------------------------
    #
    # Example:
    #
    # {
    #     "response": "The equipment report shows...",
    #     "artifact_ids": [
    #         "..."
    #     ]
    # }
    #
    output: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    # running / completed / failed / cancelled
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="running",
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    # Relationships
    conversation: Mapped["Conversation"] = relationship(
        back_populates="agent_runs",
    )

    events: Mapped[list["AgentEvent"]] = relationship(
        back_populates="run",
        cascade="all, delete-orphan",
    )


# ============================================================
# Agent Event
# ============================================================

class AgentEvent(Base):
    __tablename__ = "agent_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "agent_runs.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    # Order of events inside a run
    sequence: Mapped[int] = mapped_column(
        nullable=False,
    )

    event_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    tool_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    
    input: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    output: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    # Relationships
    run: Mapped["AgentRun"] = relationship(
        back_populates="events",
    )