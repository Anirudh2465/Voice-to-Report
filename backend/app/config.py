from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "Voice-to-Report"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-me-in-production"

    # JWT
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 30

    # Database
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/voice_to_report"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # AI APIs
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-5"

    # Cloudflare R2
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "voice-to-report"
    r2_public_url: str = ""

    # CORS
    allowed_origins: str = "http://localhost:8081"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
