import uuid
import boto3
from botocore.client import Config
from app.config import settings

# Cloudflare R2 uses an S3-compatible API
s3_client = boto3.client(
    "s3",
    endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
    aws_access_key_id=settings.r2_access_key_id,
    aws_secret_access_key=settings.r2_secret_access_key,
    config=Config(signature_version="s3v4"),
    region_name="auto",
)

BUCKET = settings.r2_bucket_name


def _generate_key(folder: str, filename: str) -> str:
    """Generate a namespaced storage key."""
    unique = uuid.uuid4().hex[:8]
    return f"{folder}/{unique}_{filename}"


def upload_audio(audio_bytes: bytes, filename: str) -> str:
    """Upload audio file to R2 and return the storage key."""
    key = _generate_key("audio", filename)
    s3_client.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=audio_bytes,
        ContentType="audio/mpeg",
    )
    return key


def upload_bytes(data: bytes, filename: str, content_type: str, folder: str = "exports") -> str:
    """Upload any bytes (e.g., PDF/DOCX) to R2 and return the storage key."""
    key = _generate_key(folder, filename)
    s3_client.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=data,
        ContentType=content_type,
    )
    return key


def get_presigned_url(key: str, expires_in: int = 3600) -> str:
    """Generate a presigned URL for temporary download access."""
    return s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET, "Key": key},
        ExpiresIn=expires_in,
    )


def delete_object(key: str) -> None:
    """Delete an object from R2."""
    s3_client.delete_object(Bucket=BUCKET, Key=key)
