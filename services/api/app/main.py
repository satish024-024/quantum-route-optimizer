"""
OmniRoute AI — FastAPI Application Factory

Single entry point. Middleware, routers, and lifecycle
hooks are registered here.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.infrastructure.database import engine
from app.api.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.vehicles import router as vehicles_router
from app.api.v1.drivers import router as drivers_router
from app.api.v1.routes import router as routes_router
from app.api.v1.optimize import router as optimize_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    # Startup: verify DB connectivity
    async with engine.begin() as conn:
        await conn.execute(
            __import__("sqlalchemy").text("SELECT 1")
        )
    yield
    # Shutdown: dispose connection pool
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.api_version,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ──
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ──
    app.include_router(health_router, tags=["Health"])
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
    app.include_router(vehicles_router, prefix="/api/v1/vehicles", tags=["Vehicles"])
    app.include_router(drivers_router, prefix="/api/v1/drivers", tags=["Drivers"])
    app.include_router(routes_router, prefix="/api/v1/routes", tags=["Routes"])
    app.include_router(optimize_router, prefix="/api/v1/optimize", tags=["Optimize"])

    return app


app = create_app()
