"""
OmniRoute AI — Route Endpoints

GET    /api/v1/routes      → List routes
POST   /api/v1/routes      → Create route
GET    /api/v1/routes/{id} → Get route detail
DELETE /api/v1/routes/{id} → Soft-delete route
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.infrastructure.database import get_db
from app.infrastructure.models import Route, User
from app.schemas import ApiResponse, RouteCreate, RouteOut

router = APIRouter()


@router.get("", response_model=ApiResponse)
async def list_routes(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all routes in the user's workspace."""
    result = await db.execute(
        select(Route)
        .where(Route.workspace_id == user.workspace_id, Route.deleted_at.is_(None))
        .order_by(Route.created_at.desc())
    )
    routes = result.scalars().all()
    return ApiResponse(data=[RouteOut.model_validate(r).model_dump() for r in routes])


@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def create_route(
    body: RouteCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new route in the user's workspace."""
    route = Route(
        workspace_id=user.workspace_id,
        name=body.name,
        vehicle_id=body.vehicle_id,
        created_by=user.id,
    )
    db.add(route)
    await db.flush()
    return ApiResponse(data=RouteOut.model_validate(route).model_dump())


@router.get("/{route_id}", response_model=ApiResponse)
async def get_route(
    route_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get a single route by ID."""
    result = await db.execute(
        select(Route).where(
            Route.id == route_id,
            Route.workspace_id == user.workspace_id,
            Route.deleted_at.is_(None),
        )
    )
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    return ApiResponse(data=RouteOut.model_validate(route).model_dump())


@router.delete("/{route_id}", response_model=ApiResponse)
async def delete_route(
    route_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Soft-delete a route."""
    result = await db.execute(
        select(Route).where(
            Route.id == route_id,
            Route.workspace_id == user.workspace_id,
            Route.deleted_at.is_(None),
        )
    )
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")

    route.deleted_at = datetime.now(timezone.utc)
    return ApiResponse(data={"deleted": True})
