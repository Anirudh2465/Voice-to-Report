import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.report import Report
from app.schemas.report import SuggestionsRequest, SuggestionsResponse
from app.services.auth_service import get_current_user
from app.services import claude_service

router = APIRouter(prefix="/suggestions", tags=["AI Suggestions"])


@router.post("", response_model=SuggestionsResponse)
async def get_suggestions(
    data: SuggestionsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Claude API Call #2 — Modality-specific completeness suggestions.

    Analyzes the corrected report text and structured content to suggest
    missing sections or findings typical for the chosen modality.
    """
    try:
        suggestions = await claude_service.get_suggestions(
            data.corrected_text, data.modality.value, data.report_content
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude API error: {str(e)}")

    return SuggestionsResponse(suggestions=suggestions)
