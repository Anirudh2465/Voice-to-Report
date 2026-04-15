import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import String, Text, DateTime, ForeignKey, func, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Modality(str, Enum):
    USG = "USG"
    CT = "CT"
    MRI = "MRI"
    XRAY = "XRAY"


class ReportStatus(str, Enum):
    DRAFT = "draft"
    COMPLETED = "completed"
    EXPORTED = "exported"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Metadata
    patient_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    patient_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    modality: Mapped[str] = mapped_column(String(10), nullable=False)  # USG/CT/MRI/XRAY
    template_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=ReportStatus.DRAFT)

    # Audio
    audio_file_key: Mapped[str | None] = mapped_column(String(500), nullable=True)  # R2 key
    audio_duration_seconds: Mapped[float | None] = mapped_column(nullable=True)

    # Transcription pipeline
    raw_transcription: Mapped[str | None] = mapped_column(Text, nullable=True)
    corrected_transcription: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_suggestions: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Structured report content (JSON with section keys)
    report_content: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Export
    pdf_file_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    docx_file_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_synced: Mapped[bool] = mapped_column(Boolean, default=True)  # False = created offline

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user = relationship("User", backref="reports")

    def __repr__(self) -> str:
        return f"<Report id={self.id} modality={self.modality} status={self.status}>"
