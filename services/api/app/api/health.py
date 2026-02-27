"""
OmniRoute AI — Health Check Endpoints

GET /health       → basic liveness
GET /health/ready → DB connectivity check
"""

from fastapi import APIRouter
from sqlalchemy import text

from app.infrastructure.database import engine

router = APIRouter()


@router.get("/health")
async def health():
    """Basic liveness probe."""
    return {"status": "ok"}


@router.get("/health/ready")
async def health_ready():
    """Readiness probe — checks DB connection."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        return {"status": "not_ready", "database": str(e)}
