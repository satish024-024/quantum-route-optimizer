"""
OmniRoute AI — Application Configuration

Reads from environment variables (.env file supported).
All settings are validated at startup via Pydantic.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide configuration. Loaded once at startup."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Application ──
    app_name: str = "OmniRoute AI"
    debug: bool = False
    api_version: str = "v1"

    # ── Database ──
    database_url: str = "postgresql+asyncpg://omniroute:omnipass@localhost:5432/omniroute"
    db_pool_size: int = 10
    db_max_overflow: int = 20

    # ── Redis ──
    redis_url: str = "redis://localhost:6379"

    # ── Auth / JWT ──
    jwt_secret: str = "super-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_expiry_minutes: int = 15
    jwt_refresh_expiry_days: int = 7

    # ── CORS ──
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # ── Rate Limiting ──
    rate_limit_per_minute: int = 60


settings = Settings()
