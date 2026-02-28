"""
OmniRoute AI — SQLAlchemy ORM Models

All tables defined per BACKEND_STRUCTURE.md schema.
Multi-tenant, PostGIS-enabled, soft-delete ready.
"""

import enum
from datetime import datetime

from geoalchemy2 import Geography
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """Declarative base for all models."""
    pass


# ─────────────────────────────────────
# ENUMs
# ─────────────────────────────────────

class UserRole(str, enum.Enum):
    admin = "admin"
    operator = "operator"
    analyst = "analyst"
    driver = "driver"
    responder = "responder"
    viewer = "viewer"


class UserStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"
    pending_verification = "pending_verification"


class VehicleStatus(str, enum.Enum):
    available = "available"
    in_transit = "in_transit"
    maintenance = "maintenance"
    offline = "offline"


class RouteStatus(str, enum.Enum):
    draft = "draft"
    optimizing = "optimizing"
    optimized = "optimized"
    deployed = "deployed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class OptimizationMode(str, enum.Enum):
    classical = "classical"
    hybrid = "hybrid"
    quantum = "quantum"


class LocationType(str, enum.Enum):
    warehouse = "warehouse"
    farm = "farm"
    restaurant = "restaurant"
    hospital = "hospital"
    checkpoint = "checkpoint"
    depot = "depot"
    customer = "customer"
    market = "market"
    station = "station"
    custom = "custom"


class JobStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
    timeout = "timeout"
    cancelled = "cancelled"


class IncidentSeverity(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class IncidentStatus(str, enum.Enum):
    reported = "reported"
    dispatched = "dispatched"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


# ─────────────────────────────────────
# MODELS
# ─────────────────────────────────────

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name = Column(Text, nullable=False)
    slug = Column(Text, unique=True, nullable=False)
    industry_default = Column(Text, nullable=False, server_default="logistics")
    plan = Column(Text, nullable=False, server_default="free")
    settings = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    workspaces = relationship("Workspace", back_populates="organization", cascade="all, delete-orphan")


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    region = Column(Text, nullable=False)
    settings = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    active_mode = Column(Text, nullable=False, server_default="logistics")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization", back_populates="workspaces")
    users = relationship("User", back_populates="workspace", cascade="all, delete-orphan")
    vehicles = relationship("Vehicle", back_populates="workspace", cascade="all, delete-orphan")
    locations = relationship("Location", back_populates="workspace", cascade="all, delete-orphan")
    routes = relationship("Route", back_populates="workspace", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("workspace_id", "email", name="unique_email_per_workspace"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    email = Column(Text, nullable=False)
    password_hash = Column(Text, nullable=False)
    full_name = Column(Text, nullable=False)
    role = Column(Enum(UserRole, name="user_role", create_type=True), nullable=False, server_default="viewer")
    status = Column(
        Enum(UserStatus, name="user_status", create_type=True),
        nullable=False,
        server_default="pending_verification",
    )
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    workspace = relationship("Workspace", back_populates="users")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    vehicle_type = Column(Text, nullable=False)
    capacity_kg = Column(Integer, nullable=False, server_default=text("0"))
    capacity_volume_m3 = Column(Float, nullable=True)
    plate_number = Column(Text, nullable=False)
    status = Column(
        Enum(VehicleStatus, name="vehicle_status", create_type=True),
        nullable=False,
        server_default="available",
    )
    last_location = Column(Geography("POINT", srid=4326), nullable=True)
    last_location_at = Column(DateTime(timezone=True), nullable=True)
    fuel_type = Column(Text, nullable=True)
    max_range_km = Column(Float, nullable=True)
    metadata_ = Column("metadata", JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    workspace = relationship("Workspace", back_populates="vehicles")


class Location(Base):
    __tablename__ = "locations"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    address = Column(Text, nullable=True)
    geo = Column(Geography("POINT", srid=4326), nullable=False)
    location_type = Column(
        Enum(LocationType, name="location_type", create_type=True),
        nullable=False,
        server_default="custom",
    )
    contact_info = Column(JSONB, server_default=text("'{}'::jsonb"))
    operating_hours = Column(JSONB, server_default=text("'{}'::jsonb"))
    metadata_ = Column("metadata", JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    workspace = relationship("Workspace", back_populates="locations")


class Route(Base):
    __tablename__ = "routes"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    name = Column(Text, nullable=True)
    optimization_mode = Column(
        Enum(OptimizationMode, name="optimization_mode", create_type=True),
        nullable=False,
        server_default="classical",
    )
    status = Column(
        Enum(RouteStatus, name="route_status", create_type=True),
        nullable=False,
        server_default="draft",
    )
    distance_km = Column(Float, nullable=True)
    estimated_duration_minutes = Column(Integer, nullable=True)
    actual_duration_minutes = Column(Integer, nullable=True)
    optimization_score = Column(Float, nullable=True)
    constraints = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    workspace = relationship("Workspace", back_populates="routes")
    stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan")
    paths = relationship("RoutePath", back_populates="route", cascade="all, delete-orphan")


class RouteStop(Base):
    __tablename__ = "route_stops"
    __table_args__ = (
        UniqueConstraint("route_id", "stop_order", name="unique_stop_order"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    stop_order = Column(Integer, nullable=False)
    arrival_eta = Column(DateTime(timezone=True), nullable=True)
    departure_eta = Column(DateTime(timezone=True), nullable=True)
    actual_arrival = Column(DateTime(timezone=True), nullable=True)
    service_time_minutes = Column(Integer, server_default=text("0"))
    load_kg = Column(Float, server_default=text("0"))
    completed = Column(Boolean, nullable=False, server_default=text("false"))
    completed_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    route = relationship("Route", back_populates="stops")


class RoutePath(Base):
    __tablename__ = "route_paths"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    path = Column(Geography("LINESTRING", srid=4326), nullable=False)
    segment_index = Column(Integer, nullable=False, server_default=text("0"))
    distance_km = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))

    route = relationship("Route", back_populates="paths")


class OptimizationJob(Base):
    __tablename__ = "optimization_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="SET NULL"), nullable=True)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    solver_type = Column(Enum(OptimizationMode, name="solver_type", create_type=True), nullable=False)
    status = Column(Enum(JobStatus, name="job_status", create_type=True), nullable=False, server_default="pending")
    input_hash = Column(Text, nullable=False)
    input_data = Column(JSONB, nullable=False)
    result_data = Column(JSONB, nullable=True)
    solution_quality_score = Column(Float, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, nullable=False, server_default=text("0"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    workspace_id = Column(UUID(as_uuid=True), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    action = Column(Text, nullable=False)
    resource_type = Column(Text, nullable=False)
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    changes = Column(JSONB, nullable=True)
    ip_address = Column(INET, nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))


class DriverProfile(Base):
    """Extended profile for users with role=driver."""
    __tablename__ = "driver_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    phone = Column(Text, nullable=True)
    license_number = Column(Text, nullable=True)
    license_expiry = Column(DateTime(timezone=True), nullable=True)
    rating = Column(Float, nullable=False, server_default=text("5.0"))
    trips_completed = Column(Integer, nullable=False, server_default=text("0"))
    is_available = Column(Boolean, nullable=False, server_default=text("true"))
    current_vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    metadata_ = Column("metadata", JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    vehicle = relationship("Vehicle", foreign_keys=[current_vehicle_id])
