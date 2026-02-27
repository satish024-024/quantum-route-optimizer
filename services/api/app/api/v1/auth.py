"""
OmniRoute AI — Auth Endpoints

POST /api/v1/auth/register  → Create new user
POST /api/v1/auth/login     → Get JWT tokens
POST /api/v1/auth/refresh   → Refresh access token
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.infrastructure.database import get_db
from app.infrastructure.models import Organization, User, Workspace
from app.schemas import ApiResponse, LoginRequest, RegisterRequest, TokenResponse

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _create_token(user_id: str, expires_delta: timedelta) -> str:
    """Create a signed JWT token."""
    expires = datetime.now(timezone.utc) + expires_delta
    payload = {"sub": user_id, "exp": expires}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


@router.post("/register", response_model=ApiResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user. Auto-creates an org + workspace for first-time users."""

    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == body.email, User.deleted_at.is_(None)))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # Create default org + workspace for this user
    org = Organization(name=f"{body.full_name}'s Organization", slug=body.email.split("@")[0])
    db.add(org)
    await db.flush()

    workspace = Workspace(organization_id=org.id, name="Default Workspace", region="in-south-1")
    db.add(workspace)
    await db.flush()

    # Create user
    user = User(
        workspace_id=workspace.id,
        email=body.email,
        password_hash=pwd_context.hash(body.password),
        full_name=body.full_name,
        role="admin",
        status="active",
    )
    db.add(user)
    await db.flush()

    # Generate tokens
    access_token = _create_token(str(user.id), timedelta(minutes=settings.jwt_access_expiry_minutes))
    refresh_token = _create_token(str(user.id), timedelta(days=settings.jwt_refresh_expiry_days))

    return ApiResponse(
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.jwt_access_expiry_minutes * 60,
        ).model_dump()
    )


@router.post("/login", response_model=ApiResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and return JWT tokens."""

    result = await db.execute(select(User).where(User.email == body.email, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()

    if not user or not pwd_context.verify(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)

    access_token = _create_token(str(user.id), timedelta(minutes=settings.jwt_access_expiry_minutes))
    refresh_token = _create_token(str(user.id), timedelta(days=settings.jwt_refresh_expiry_days))

    return ApiResponse(
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.jwt_access_expiry_minutes * 60,
        ).model_dump()
    )
