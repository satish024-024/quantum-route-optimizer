"""
OmniRoute AI — Vehicle Endpoints

GET    /api/v1/vehicles      → List vehicles
POST   /api/v1/vehicles      → Create vehicle
GET    /api/v1/vehicles/{id} → Get vehicle detail
DELETE /api/v1/vehicles/{id} → Soft-delete vehicle
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.infrastructure.database import get_db
from app.infrastructure.models import User, Vehicle
from app.schemas import ApiResponse, VehicleCreate, VehicleOut

router = APIRouter()


@router.get("", response_model=ApiResponse)
async def list_vehicles(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all vehicles in the user's workspace."""
    result = await db.execute(
        select(Vehicle)
        .where(Vehicle.workspace_id == user.workspace_id, Vehicle.deleted_at.is_(None))
        .order_by(Vehicle.created_at.desc())
    )
    vehicles = result.scalars().all()
    return ApiResponse(data=[VehicleOut.model_validate(v).model_dump() for v in vehicles])


@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    body: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new vehicle in the user's workspace."""
    vehicle = Vehicle(
        workspace_id=user.workspace_id,
        vehicle_type=body.vehicle_type,
        plate_number=body.plate_number,
        capacity_kg=body.capacity_kg,
        fuel_type=body.fuel_type,
        max_range_km=body.max_range_km,
    )
    db.add(vehicle)
    await db.flush()
    return ApiResponse(data=VehicleOut.model_validate(vehicle).model_dump())


@router.get("/{vehicle_id}", response_model=ApiResponse)
async def get_vehicle(
    vehicle_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get a single vehicle by ID."""
    result = await db.execute(
        select(Vehicle).where(
            Vehicle.id == vehicle_id,
            Vehicle.workspace_id == user.workspace_id,
            Vehicle.deleted_at.is_(None),
        )
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return ApiResponse(data=VehicleOut.model_validate(vehicle).model_dump())


@router.delete("/{vehicle_id}", response_model=ApiResponse)
async def delete_vehicle(
    vehicle_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Soft-delete a vehicle."""
    result = await db.execute(
        select(Vehicle).where(
            Vehicle.id == vehicle_id,
            Vehicle.workspace_id == user.workspace_id,
            Vehicle.deleted_at.is_(None),
        )
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    vehicle.deleted_at = datetime.now(timezone.utc)
    return ApiResponse(data={"deleted": True})
