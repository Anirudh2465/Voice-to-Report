import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.report import Modality, ReportStatus


# ── Request Schemas ──────────────────────────────────────────────────────────

class ReportCreate(BaseModel):
    patient_name: str | None = None
    patient_id: str | None = None
    modality: Modality
    template_id: str | None = None


class ReportUpdate(BaseModel):
    patient_name: str | None = None
    patient_id: str | None = None
    report_content: dict | None = None
    status: ReportStatus | None = None


class TranscribeRequest(BaseModel):
    """Sent alongside the audio file upload."""
    modality: Modality
    report_id: uuid.UUID | None = None  # attach to existing draft


class CorrectRequest(BaseModel):
    raw_text: str
    modality: Modality
    report_id: uuid.UUID | None = None


class SuggestionsRequest(BaseModel):
    corrected_text: str
    modality: Modality
    report_content: dict | None = None


# ── Response Schemas ─────────────────────────────────────────────────────────

class TranscribeResponse(BaseModel):
    raw_transcription: str
    audio_duration_seconds: float
    audio_file_key: str


class CorrectResponse(BaseModel):
    corrected_transcription: str
    changes_summary: str | None = None


class SuggestionsResponse(BaseModel):
    suggestions: list[dict]  # [{section, suggestion, reason}]


class ReportOut(BaseModel):
    id: uuid.UUID
    patient_name: str | None
    patient_id: str | None
    modality: str
    status: str
    template_id: str | None
    raw_transcription: str | None
    corrected_transcription: str | None
    ai_suggestions: dict | None
    report_content: dict | None
    pdf_file_key: str | None
    docx_file_key: str | None
    is_synced: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExportRequest(BaseModel):
    report_id: uuid.UUID
    format: str  # "pdf" | "docx" | "txt"


class ExportResponse(BaseModel):
    download_url: str
    format: str
    file_key: str
