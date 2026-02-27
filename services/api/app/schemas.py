"""
OmniRoute AI — Pydantic Schemas

Request/response models for the API layer.
Separated by domain: auth, vehicles, routes.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ─── Standardized API Response ───

class PaginationMeta(BaseModel):
    page: int = 1
    per_page: int = 20
    total: int = 0


class ResponseMeta(BaseModel):
    request_id: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    pagination: PaginationMeta | None = None


class ApiResponse(BaseModel):
    """Every endpoint returns this wrapper."""
    success: bool = True
    data: dict | list | None = None
    error: dict | None = None
    meta: ResponseMeta = Field(default_factory=ResponseMeta)


# ─── Auth Schemas ───

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=200)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


# ─── Vehicle Schemas ───

class VehicleCreate(BaseModel):
    vehicle_type: str
    plate_number: str
    capacity_kg: int = 0
    fuel_type: str | None = None
    max_range_km: float | None = None


class VehicleOut(BaseModel):
    id: UUID
    vehicle_type: str
    plate_number: str
    capacity_kg: int
    status: str
    fuel_type: str | None
    max_range_km: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Route Schemas ───

class RouteCreate(BaseModel):
    name: str | None = None
    vehicle_id: UUID | None = None


class RouteOut(BaseModel):
    id: UUID
    name: str | None
    status: str
    optimization_mode: str
    distance_km: float | None
    estimated_duration_minutes: int | None
    created_at: datetime

    model_config = {"from_attributes": True}
