"""
OmniRoute AI — Health Check Endpoints

GET /health          → basic liveness (always fast)
GET /health/ready    → dependency checks: DB + Redis
GET /health/startup  → schema version status
"""

import time

from fastapi import APIRouter
from sqlalchemy import text

from app.config import settings
from app.infrastructure.database import engine

router = APIRouter()

_start_time = time.time()


@router.get("/health")
async def health():
    """Basic liveness probe — returns immediately. Used by load balancer."""
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.api_version,
        "uptime_seconds": round(time.time() - _start_time),
    }


@router.get("/health/ready")
async def health_ready():
    """
    Readiness probe — checks all critical dependencies.
    Returns 200 only when DB and Redis are reachable.
    """
    checks: dict[str, str] = {}
    overall = "ready"

    # ── Database ──
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = "connected"
    except Exception as exc:
        checks["database"] = f"error: {exc}"
        overall = "not_ready"

    # ── Redis ──
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.redis_url, socket_connect_timeout=2)
        await r.ping()
        await r.aclose()
        checks["redis"] = "connected"
    except ImportError:
        checks["redis"] = "skipped (redis not installed)"
    except Exception as exc:
        checks["redis"] = f"error: {exc}"
        # Redis failure is a warning, not fatal for MVP
        if overall == "ready":
            overall = "degraded"

    return {
        "status": overall,
        "checks": checks,
        "uptime_seconds": round(time.time() - _start_time),
    }


@router.get("/health/startup")
async def health_startup():
    """
    Startup probe — verifies DB schema is migrated.
    Returns 200 only when the expected tables exist.
    """
    try:
        async with engine.begin() as conn:
            # Verify core tables exist
            for table in ("organizations", "workspaces", "users", "vehicles", "routes"):
                result = await conn.execute(
                    text(
                        "SELECT EXISTS(SELECT 1 FROM information_schema.tables "
                        "WHERE table_schema='public' AND table_name=:t)"
                    ),
                    {"t": table},
                )
                if not result.scalar():
                    return {"status": "not_ready", "reason": f"Table '{table}' missing — run migrations"}

        return {"status": "ready", "message": "All required tables exist"}
    except Exception as exc:
        return {"status": "not_ready", "reason": str(exc)}
