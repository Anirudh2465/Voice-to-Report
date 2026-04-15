import io
import tempfile
import os
from openai import AsyncOpenAI
from app.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)

# Supported audio formats by Whisper
SUPPORTED_FORMATS = {".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm", ".ogg"}


async def transcribe_audio(audio_bytes: bytes, filename: str, language: str = "en") -> dict:
    """
    Send audio bytes to OpenAI Whisper API and return transcription.

    Args:
        audio_bytes: Raw audio file content
        filename: Original filename (used to determine format)
        language: Language hint (default "en"; Whisper handles Indian accents well)

    Returns:
        dict with 'text' (transcription) and 'duration' (seconds)
    """
    ext = os.path.splitext(filename)[-1].lower()
    if ext not in SUPPORTED_FORMATS:
        raise ValueError(f"Unsupported audio format: {ext}. Supported: {SUPPORTED_FORMATS}")

    # Whisper API requires a file-like object with a name attribute
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename

    response = await client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language=language,
        response_format="verbose_json",  # includes duration
        timestamp_granularities=["segment"],
    )

    duration = getattr(response, "duration", 0.0)
    return {
        "text": response.text,
        "duration": float(duration),
    }
