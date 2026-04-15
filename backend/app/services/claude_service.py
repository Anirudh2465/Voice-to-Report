import anthropic
from app.config import settings

client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

# ── Modality-specific medical terminology ─────────────────────────────────────
MODALITY_CONTEXT = {
    "USG": """
Ultrasound (USG) report terminology:
- Organs: liver, gallbladder, spleen, pancreas, kidneys, urinary bladder, uterus, ovaries, prostate
- Measurements: in cm, echogenicity (hypoechoic, hyperechoic, isoechoic, anechoic)
- Findings: calculi, polyp, cyst, IHBR (intrahepatic biliary radicles), EHBR (extrahepatic biliary radicles)
- Common terms: hepatomegaly, splenomegaly, ascites, hydroureteronephrosis, PCOD, fibroid
- Normal variants: mild fatty change, minimal free fluid
""",
    "CT": """
CT scan report terminology:
- Windows: lung window, bone window, mediastinal window, soft tissue window
- Findings: hypodense, hyperdense, isodense lesion; ground glass opacity (GGO); consolidation
- Contrast: pre-contrast, post-contrast, arterial phase, portal venous phase, delayed phase
- Structures: parenchyma, hilum, mediastinum, retroperitoneum, mesentery
- Common: HU (Hounsfield Units), enhancement pattern, lymphadenopathy, effusion
""",
    "MRI": """
MRI report terminology:
- Sequences: T1W, T2W, FLAIR, DWI, ADC, STIR, GRE, SWI, MRS
- Signal: T1 hypointense/hyperintense, T2 hypointense/hyperintense
- Enhancement: post-gadolinium, ring enhancement, homogeneous/heterogeneous
- Brain: sulci, gyri, cortex, white matter, basal ganglia, cerebellum, brainstem
- Spine: disc, vertebrae, cord, facet joints, neural foramina, ligamentum flavum
""",
    "XRAY": """
X-ray report terminology:
- Chest: cardiomegaly, consolidation, pleural effusion, pneumothorax, atelectasis
- Cardiac silhouette: CTR (cardiothoracic ratio), normal < 0.5
- Bones: fracture, lytic/sclerotic lesion, periosteal reaction, cortical breach
- Abdomen: air-fluid levels, free gas under diaphragm, bowel gas pattern
- Soft tissue: calcification, subcutaneous emphysema
""",
}

# ── Prompt 1: Indian Accent Correction ───────────────────────────────────────
def build_correction_prompt(raw_text: str, modality: str) -> str:
    modality_ctx = MODALITY_CONTEXT.get(modality, "")
    return f"""You are a medical transcription specialist with expertise in Indian radiology reporting.

Your task is to correct the following voice transcription from an Indian radiologist. The transcription 
was done by Whisper and may contain:
- Pronunciation-based errors common with Indian English accents (e.g., "wee" → "with", "zee" → "the")
- Medical term mishearing (e.g., "hepatomegali" → "hepatomegaly", "ecogenic" → "echogenic")
- Missing plurals or articles typical in Indian English speech patterns
- Run-on sentences that need punctuation

{modality_ctx}

RULES:
1. Correct ONLY transcription errors — do NOT change the radiologist's clinical findings or interpretation
2. Preserve all measurements exactly as spoken
3. Fix medical terminology spelling (use standard radiology terminology)
4. Add appropriate punctuation and sentence breaks
5. Return ONLY the corrected text, no commentary

Raw transcription:
{raw_text}

Corrected transcription:"""


# ── Prompt 2: Modality-Specific Suggestions ───────────────────────────────────
def build_suggestions_prompt(corrected_text: str, modality: str, report_content: dict | None) -> str:
    modality_ctx = MODALITY_CONTEXT.get(modality, "")
    content_str = str(report_content) if report_content else "Not yet structured"
    return f"""You are an expert radiologist reviewing a {modality} report for completeness.

{modality_ctx}

Current report text:
{corrected_text}

Current structured content:
{content_str}

Analyze this {modality} report and suggest ONLY missing or incomplete items that a thorough radiologist 
would include. For each suggestion:
- Identify the specific section it belongs to
- Explain what is missing and why it matters clinically
- Keep suggestions concise and actionable

Return a JSON array of suggestions:
[
  {{
    "section": "Findings",
    "suggestion": "Add measurement of the lesion in three dimensions",
    "reason": "Standard protocol for {modality} requires triplanar measurements"
  }}
]

Return ONLY valid JSON, no other text."""


# ── Claude API Calls ──────────────────────────────────────────────────────────
async def correct_transcription(raw_text: str, modality: str) -> dict:
    """
    Claude API Call #1: Accent + grammar correction.
    Returns corrected text and a brief summary of changes.
    """
    response = await client.messages.create(
        model=settings.claude_model,
        max_tokens=4096,
        messages=[
            {"role": "user", "content": build_correction_prompt(raw_text, modality)}
        ],
    )
    corrected = response.content[0].text.strip()
    return {
        "corrected_transcription": corrected,
        "changes_summary": f"Corrected {modality} transcription using Indian accent + medical terminology rules.",
    }


async def get_suggestions(corrected_text: str, modality: str, report_content: dict | None = None) -> list[dict]:
    """
    Claude API Call #2: Modality-specific completeness suggestions.
    Returns a list of suggestion dicts.
    """
    import json
    response = await client.messages.create(
        model=settings.claude_model,
        max_tokens=2048,
        messages=[
            {"role": "user", "content": build_suggestions_prompt(corrected_text, modality, report_content)}
        ],
    )
    raw = response.content[0].text.strip()
    try:
        suggestions = json.loads(raw)
        if not isinstance(suggestions, list):
            suggestions = []
    except json.JSONDecodeError:
        suggestions = []
    return suggestions
