"""
OmniRoute AI — Driver Endpoints

GET    /api/v1/drivers        → List drivers in workspace
POST   /api/v1/drivers        → Create driver (user + profile)
GET    /api/v1/drivers/{id}   → Get driver detail
PATCH  /api/v1/drivers/{id}   → Update availability / vehicle assignment
DELETE /api/v1/drivers/{id}   → Soft-delete driver profile
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.infrastructure.database import get_db
from app.infrastructure.models import DriverProfile, User, Workspace
from app.schemas import ApiResponse, DriverCreate, DriverOut

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Helpers ──────────────────────────────────────────────────────

def _profile_to_out(profile: DriverProfile) -> dict:
    """Serialize DriverProfile + linked User into DriverOut shape."""
    return {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "full_name": profile.user.full_name if profile.user else "Unknown",
        "email": profile.user.email if profile.user else "",
        "phone": profile.phone,
        "license_number": profile.license_number,
        "rating": profile.rating,
        "trips_completed": profile.trips_completed,
        "is_available": profile.is_available,
        "current_vehicle_id": str(profile.current_vehicle_id) if profile.current_vehicle_id else None,
        "created_at": profile.created_at.isoformat(),
    }


# ── Endpoints ─────────────────────────────────────────────────────

@router.get("", response_model=ApiResponse)
async def list_drivers(
    available_only: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all drivers in the user's workspace."""
    query = (
        select(DriverProfile)
        .where(
            DriverProfile.workspace_id == user.workspace_id,
            DriverProfile.deleted_at.is_(None),
        )
        .order_by(DriverProfile.created_at.desc())
    )
    if available_only:
        query = query.where(DriverProfile.is_available.is_(True))

    result = await db.execute(query)
    profiles = result.scalars().all()

    # Eager-load user data
    for p in profiles:
        await db.refresh(p, ["user"])

    return ApiResponse(data=[_profile_to_out(p) for p in profiles])


@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def create_driver(
    body: DriverCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a driver: makes a User (role=driver) + DriverProfile in one call.
    A random secure password is assigned; driver must reset via forgot-password flow.
    """
    # Check email uniqueness in this workspace
    existing = await db.execute(
        select(User).where(
            User.email == body.email,
            User.workspace_id == current_user.workspace_id,
            User.deleted_at.is_(None),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use in this workspace")

    # Create User with driver role
    import secrets
    temp_password = secrets.token_urlsafe(16)
    driver_user = User(
        workspace_id=current_user.workspace_id,
        email=body.email,
        password_hash=pwd_context.hash(temp_password),
        full_name=body.full_name,
        role="driver",
        status="active",
    )
    db.add(driver_user)
    await db.flush()  # get driver_user.id

    # Create DriverProfile
    profile = DriverProfile(
        user_id=driver_user.id,
        workspace_id=current_user.workspace_id,
        phone=body.phone,
        license_number=body.license_number,
        current_vehicle_id=body.vehicle_id,
    )
    db.add(profile)
    await db.flush()

    await db.refresh(profile, ["user"])
    return ApiResponse(data=_profile_to_out(profile))


@router.get("/{driver_id}", response_model=ApiResponse)
async def get_driver(
    driver_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get a single driver profile by ID."""
    result = await db.execute(
        select(DriverProfile).where(
            DriverProfile.id == driver_id,
            DriverProfile.workspace_id == user.workspace_id,
            DriverProfile.deleted_at.is_(None),
        )
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    await db.refresh(profile, ["user"])
    return ApiResponse(data=_profile_to_out(profile))


@router.patch("/{driver_id}", response_model=ApiResponse)
async def update_driver(
    driver_id: UUID,
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update driver availability or vehicle assignment."""
    result = await db.execute(
        select(DriverProfile).where(
            DriverProfile.id == driver_id,
            DriverProfile.workspace_id == user.workspace_id,
            DriverProfile.deleted_at.is_(None),
        )
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    # Only allow these fields to be patched
    allowed = {"is_available", "current_vehicle_id", "phone", "license_number"}
    for field in allowed:
        if field in body:
            setattr(profile, field, body[field])

    profile.updated_at = datetime.now(timezone.utc)
    await db.refresh(profile, ["user"])
    return ApiResponse(data=_profile_to_out(profile))


@router.delete("/{driver_id}", response_model=ApiResponse)
async def delete_driver(
    driver_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Soft-delete a driver profile."""
    result = await db.execute(
        select(DriverProfile).where(
            DriverProfile.id == driver_id,
            DriverProfile.workspace_id == user.workspace_id,
            DriverProfile.deleted_at.is_(None),
        )
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    profile.deleted_at = datetime.now(timezone.utc)
    return ApiResponse(data={"deleted": True, "id": str(driver_id)})
