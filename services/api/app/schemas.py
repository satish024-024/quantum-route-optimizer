"""
OmniRoute AI — Pydantic Schemas

Request/response models for the API layer.
Separated by domain: auth, vehicles, routes, drivers, optimize.
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


# ─── Driver Schemas ───

class DriverCreate(BaseModel):
    """Create a driver user + profile in one call."""
    full_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: str | None = None
    license_number: str | None = None
    vehicle_id: UUID | None = None


class DriverOut(BaseModel):
    id: UUID          # DriverProfile.id
    user_id: UUID
    full_name: str
    email: str
    phone: str | None
    license_number: str | None
    rating: float
    trips_completed: int
    is_available: bool
    current_vehicle_id: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Optimize Schemas ───

class StopIn(BaseModel):
    name: str
    lat: float
    lng: float
    type: str = "stop"          # "depot" | "stop"
    service_time_minutes: int = 0
    load_kg: float = 0.0


class ConstraintsIn(BaseModel):
    max_distance_km: float = 500.0
    max_stops: int = 50
    vehicle_capacity_kg: float = 1000.0
    optimize_for: str = "distance"   # "distance" | "time" | "fuel"


class OptimizeRequest(BaseModel):
    stops: list[StopIn] = Field(min_length=2)
    constraints: ConstraintsIn = Field(default_factory=ConstraintsIn)
    mode: str = "classical"          # "classical" | "quantum"


class OptimizeResult(BaseModel):
    total_distance_km: float
    estimated_duration_minutes: int
    solution_quality_score: float
    solver_used: str
    execution_time_ms: int
    ordered_stops: list[dict]
    savings: dict | None = None
