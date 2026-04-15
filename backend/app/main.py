from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.routers import auth, transcription, correction, suggestions, reports, templates, export


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on startup."""
    await init_db()
    yield


app = FastAPI(
    title="Voice-to-Report API",
    description="Radiology voice dictation assistant — transcribe, correct, format, and export reports.",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,           prefix="/api/v1")
app.include_router(transcription.router,  prefix="/api/v1")
app.include_router(correction.router,     prefix="/api/v1")
app.include_router(suggestions.router,    prefix="/api/v1")
app.include_router(reports.router,        prefix="/api/v1")
app.include_router(templates.router,      prefix="/api/v1")
app.include_router(export.router,         prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "Voice-to-Report API", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
