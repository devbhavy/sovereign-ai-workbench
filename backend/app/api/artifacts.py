import os
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Artifact


router = APIRouter(
    prefix="/api/artifacts",
    tags=["Artifacts"],
)


@router.get("/{artifact_id}/download")
def download_artifact(
    artifact_id: UUID,
    db: Session = Depends(get_db),
):
    artifact = (
        db.query(Artifact)
        .filter(Artifact.id == artifact_id)
        .first()
    )

    if not artifact:
        raise HTTPException(
            status_code=404,
            detail="Artifact not found",
        )

    if not os.path.exists(artifact.storage_path):
        raise HTTPException(
            status_code=404,
            detail="Artifact file not found on disk",
        )

    return FileResponse(
        path=artifact.storage_path,
        filename=artifact.filename,
        media_type="application/octet-stream",
    )