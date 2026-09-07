from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Conversation
from uuid import UUID

from app.db.models import Conversation, Message, Artifact

router = APIRouter(
    prefix="/api/conversations",
    tags=["Conversations"],
)


@router.post("")
def create_conversation(db: Session = Depends(get_db)):
    conversation = Conversation(
        title="New Conversation",
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return {
        "id": str(conversation.id),
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
    }

@router.get("")
def get_conversations(db: Session = Depends(get_db)):
    conversations = (
        db.query(Conversation)
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    return [
        {
            "id": str(conversation.id),
            "title": conversation.title,
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at,
        }
        for conversation in conversations
    ]


@router.get("/{conversation_id}")
def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    artifacts = (
        db.query(Artifact)
        .filter(Artifact.conversation_id == conversation_id)
        .order_by(Artifact.created_at.asc())
        .all()
    )

    return {
        "id": str(conversation.id),
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "messages": [
            {
                "id": str(message.id),
                "role": message.role,
                "content": message.content,
                "created_at": message.created_at,
                "file_ids": [
                    str(file.id)
                    for file in message.files
                ],
            }
            for message in messages
        ],
        "artifacts": [
            {
                "id": str(artifact.id),
                "filename": artifact.filename,
                "file_type": artifact.file_type,
                "created_at": artifact.created_at,
            }
            for artifact in artifacts
        ],
    }