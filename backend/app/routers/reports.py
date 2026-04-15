import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.database import get_db
from app.models.user import User
from app.models.report import Report, ReportStatus
from app.schemas.report import ReportCreate, ReportUpdate, ReportOut
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def create_report(
    data: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new report draft."""
    report = Report(
        user_id=current_user.id,
        patient_name=data.patient_name,
        patient_id=data.patient_id,
        modality=data.modality.value,
        template_id=data.template_id,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return ReportOut.model_validate(report)


@router.get("", response_model=List[ReportOut])
async def list_reports(
    modality: str | None = Query(None),
    status: str | None = Query(None),
    search: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List reports for the current user (row-level security enforced).
    Supports filtering by modality, status, and text search.
    """
    query = select(Report).where(Report.user_id == current_user.id)

    if modality:
        query = query.where(Report.modality == modality.upper())
    if status:
        query = query.where(Report.status == status)
    if search:
        query = query.where(
            Report.patient_name.ilike(f"%{search}%") | Report.patient_id.ilike(f"%{search}%")
        )

    query = query.order_by(desc(Report.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    reports = result.scalars().all()
    return [ReportOut.model_validate(r) for r in reports]


@router.get("/{report_id}", response_model=ReportOut)
async def get_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single report by ID (row-level security enforced)."""
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == current_user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportOut.model_validate(report)


@router.patch("/{report_id}", response_model=ReportOut)
async def update_report(
    report_id: uuid.UUID,
    data: ReportUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update report content, patient info, or status."""
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == current_user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(report, field, value)

    return ReportOut.model_validate(report)


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a report (irreversible)."""
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == current_user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    await db.delete(report)
