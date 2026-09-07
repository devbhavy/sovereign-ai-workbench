import os
import uuid

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import File as FileModel


router = APIRouter(
    prefix="/api/files",
    tags=["Files"],
)


PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)

UPLOAD_DIR = os.path.join(PROJECT_ROOT, "storage", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_file(
    uploaded_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    file_id = uuid.uuid4()

    original_filename = uploaded_file.filename or "unnamed_file"
    extension = os.path.splitext(original_filename)[1]
    stored_filename = f"{file_id}{extension}"

    storage_path = os.path.join(
        UPLOAD_DIR,
        stored_filename,
    )

    content = await uploaded_file.read()

    with open(storage_path, "wb") as f:
        f.write(content)

    file_record = FileModel(
        id=file_id,
        original_filename=original_filename,
        stored_filename=stored_filename,
        mime_type=uploaded_file.content_type,
        storage_path=storage_path,
        size=len(content),
    )

    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    return {
        "id": str(file_record.id),
        "original_filename": file_record.original_filename,
        "mime_type": file_record.mime_type,
        "size": file_record.size,
    }