import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.report import Report, Modality
from app.schemas.report import TranscribeResponse
from app.services.auth_service import get_current_user
from app.services import whisper_service, storage_service

router = APIRouter(prefix="/transcribe", tags=["Transcription"])

MAX_AUDIO_SIZE_MB = 25
MAX_AUDIO_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024


@router.post("", response_model=TranscribeResponse)
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file (mp3, m4a, wav, webm, etc.)"),
    modality: Modality = Form(...),
    report_id: uuid.UUID | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload an audio recording and transcribe it via OpenAI Whisper.

    - Stores audio in Cloudflare R2
    - Returns the raw transcription text and duration
    - Optionally attaches to an existing report draft
    """
    # Validate file size
    audio_bytes = await audio.read()
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail=f"Audio file exceeds {MAX_AUDIO_SIZE_MB}MB limit")

    # Upload audio to R2
    audio_key = storage_service.upload_audio(audio_bytes, audio.filename or "recording.m4a")

    # Transcribe via Whisper
    try:
        result = await whisper_service.transcribe_audio(audio_bytes, audio.filename or "recording.m4a")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Whisper API error: {str(e)}")

    # Update or create report draft
    if report_id:
        report_result = await db.execute(
            select(Report).where(Report.id == report_id, Report.user_id == current_user.id)
        )
        report = report_result.scalar_one_or_none()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
    else:
        report = Report(
            user_id=current_user.id,
            modality=modality.value,
        )
        db.add(report)
        await db.flush()

    report.audio_file_key = audio_key
    report.audio_duration_seconds = result["duration"]
    report.raw_transcription = result["text"]

    return TranscribeResponse(
        raw_transcription=result["text"],
        audio_duration_seconds=result["duration"],
        audio_file_key=audio_key,
    )
