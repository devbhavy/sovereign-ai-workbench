from uuid import UUID
from app.services.agent_service import run_agent
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Conversation, File, Message


router = APIRouter(
    prefix="/api/conversations",
    tags=["Messages"],
)


class MessageRequest(BaseModel):
    content: str
    file_ids: list[UUID] = []


@router.post("/{conversation_id}/messages")
def create_message(
    conversation_id: UUID,
    request: MessageRequest,
    db: Session = Depends(get_db),
):
    # Check conversation
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

    # Check files
    files = []

    if request.file_ids:
        files = (
            db.query(File)
            .filter(File.id.in_(request.file_ids))
            .all()
        )

        if len(files) != len(request.file_ids):
            raise HTTPException(
                status_code=404,
                detail="One or more files not found",
            )

    # Save user message
    message = Message(
        conversation_id=conversation_id,
        role="user",
        content=request.content,
    )

    message.files = files

    db.add(message)
    db.commit()
    db.refresh(message)

    # Run agent
    result = run_agent(
        db=db,
        conversation_id=conversation_id,
        user_message=request.content,
        file_ids=request.file_ids,
    )

    return {
        "message_id": str(message.id),
        "run_id": str(result["run_id"]),
        "response": result["response"],
        "artifact_ids": [
            str(artifact_id)
            for artifact_id in result["artifact_ids"]
        ],
        "status": result["status"],
    }