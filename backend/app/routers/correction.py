import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.report import Report
from app.schemas.report import CorrectRequest, CorrectResponse
from app.services.auth_service import get_current_user
from app.services import claude_service

router = APIRouter(prefix="/correct", tags=["AI Correction"])


@router.post("", response_model=CorrectResponse)
async def correct_transcription(
    data: CorrectRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Claude API Call #1 — Indian accent + medical terminology correction.

    Takes raw Whisper transcription and returns a corrected version
    tuned for the specified radiology modality.
    """
    try:
        result = await claude_service.correct_transcription(data.raw_text, data.modality.value)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude API error: {str(e)}")

    # Persist corrected text to report if report_id is provided
    if data.report_id:
        report_result = await db.execute(
            select(Report).where(Report.id == data.report_id, Report.user_id == current_user.id)
        )
        report = report_result.scalar_one_or_none()
        if report:
            report.corrected_transcription = result["corrected_transcription"]

    return CorrectResponse(**result)
