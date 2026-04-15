import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.report import Report, ReportStatus
from app.schemas.report import ExportRequest, ExportResponse
from app.services.auth_service import get_current_user
from app.services import export_service, storage_service

router = APIRouter(prefix="/export", tags=["Export"])

CONTENT_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain; charset=utf-8",
}


def _build_report_data(report: Report, user: User) -> dict:
    """Assemble all data needed for template rendering."""
    return {
        "patient_name": report.patient_name or "N/A",
        "patient_id": report.patient_id or "N/A",
        "modality": report.modality,
        "date": datetime.now().strftime("%d %B %Y"),
        "institution": user.institution or "Radiology Department",
        "radiologist_name": user.full_name,
        "designation": user.designation or "Radiologist",
        "referring_doctor": (report.report_content or {}).get("referring_doctor", "N/A"),
        "report_content": report.report_content or {
            "findings": report.corrected_transcription or "",
        },
    }


@router.post("", response_model=ExportResponse)
async def export_report(
    data: ExportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate and upload PDF, DOCX, or TXT export for a report.
    Returns a presigned download URL (valid 1 hour).
    """
    if data.format not in CONTENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {data.format}. Use pdf, docx, or txt.")

    result = await db.execute(
        select(Report).where(Report.id == data.report_id, Report.user_id == current_user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report_data = _build_report_data(report, current_user)

    try:
        if data.format == "pdf":
            file_bytes = export_service.generate_pdf(report.modality, report_data)
            filename = f"report_{report.id}.pdf"
            file_key = storage_service.upload_bytes(file_bytes, filename, CONTENT_TYPES["pdf"])
            report.pdf_file_key = file_key
        elif data.format == "docx":
            file_bytes = export_service.generate_docx(report_data)
            filename = f"report_{report.id}.docx"
            file_key = storage_service.upload_bytes(file_bytes, filename, CONTENT_TYPES["docx"])
            report.docx_file_key = file_key
        else:  # txt
            file_bytes = export_service.generate_txt(report_data)
            filename = f"report_{report.id}.txt"
            file_key = storage_service.upload_bytes(file_bytes, filename, CONTENT_TYPES["txt"], folder="exports/txt")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export generation failed: {str(e)}")

    report.status = ReportStatus.EXPORTED.value
    download_url = storage_service.get_presigned_url(file_key)

    return ExportResponse(
        download_url=download_url,
        format=data.format,
        file_key=file_key,
    )
