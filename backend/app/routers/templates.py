import json
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter(prefix="/templates", tags=["Templates"])

# Standard templates metadata
TEMPLATE_DIR = Path(__file__).parent.parent.parent.parent / "templates"
STANDARD_DIR = TEMPLATE_DIR / "standard"
SCHEMA_FILE = TEMPLATE_DIR / "schema" / "report_schema.json"


class TemplateInfo(BaseModel):
    id: str
    name: str
    modality: str
    is_custom: bool = False
    sections: List[str]


STANDARD_TEMPLATES = [
    TemplateInfo(id="usg-standard", name="Standard USG Report", modality="USG",
                 sections=["clinical_history", "technique", "findings", "impression"]),
    TemplateInfo(id="ct-standard", name="Standard CT Report", modality="CT",
                 sections=["clinical_history", "technique", "findings", "impression", "recommendations"]),
    TemplateInfo(id="mri-standard", name="Standard MRI Report", modality="MRI",
                 sections=["clinical_history", "technique", "findings", "impression", "recommendations"]),
    TemplateInfo(id="xray-standard", name="Standard X-Ray Report", modality="XRAY",
                 sections=["clinical_history", "findings", "impression"]),
]


@router.get("", response_model=List[TemplateInfo])
async def list_templates(current_user: User = Depends(get_current_user)):
    """List all available standard and custom templates."""
    return STANDARD_TEMPLATES


@router.get("/{template_id}", response_model=TemplateInfo)
async def get_template(template_id: str, current_user: User = Depends(get_current_user)):
    """Get details for a specific template."""
    tmpl = next((t for t in STANDARD_TEMPLATES if t.id == template_id), None)
    if not tmpl:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
    return tmpl
