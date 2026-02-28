"""Initial schema — all core tables

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-02-28

Tables created:
  organizations, workspaces, users, vehicles, locations,
  routes, route_stops, route_paths, optimization_jobs,
  driver_profiles, audit_logs

Extensions: postgis, uuid-ossp, pg_trgm
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Extensions ──────────────────────────────────────────────
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    # ── ENUMs ───────────────────────────────────────────────────
    op.execute("""
        CREATE TYPE user_role AS ENUM (
            'admin', 'operator', 'analyst', 'driver', 'responder', 'viewer'
        )
    """)
    op.execute("""
        CREATE TYPE user_status AS ENUM (
            'active', 'inactive', 'suspended', 'pending_verification'
        )
    """)
    op.execute("""
        CREATE TYPE vehicle_status AS ENUM (
            'available', 'in_transit', 'maintenance', 'offline'
        )
    """)
    op.execute("""
        CREATE TYPE route_status AS ENUM (
            'draft', 'optimizing', 'optimized', 'deployed',
            'in_progress', 'completed', 'cancelled'
        )
    """)
    op.execute("""
        CREATE TYPE optimization_mode AS ENUM ('classical', 'hybrid', 'quantum')
    """)
    op.execute("""
        CREATE TYPE location_type AS ENUM (
            'warehouse', 'farm', 'restaurant', 'hospital', 'checkpoint',
            'depot', 'customer', 'market', 'station', 'custom'
        )
    """)
    op.execute("""
        CREATE TYPE job_status AS ENUM (
            'pending', 'running', 'completed', 'failed', 'timeout', 'cancelled'
        )
    """)
    # solver_type reuses optimization_mode values but is a separate type
    op.execute("""
        CREATE TYPE solver_type AS ENUM ('classical', 'hybrid', 'quantum')
    """)

    # ── Organizations ────────────────────────────────────────────
    op.create_table(
        "organizations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("slug", sa.Text, unique=True, nullable=False),
        sa.Column("industry_default", sa.Text, nullable=False, server_default="logistics"),
        sa.Column("plan", sa.Text, nullable=False, server_default="free"),
        sa.Column("settings", JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── Workspaces ───────────────────────────────────────────────
    op.create_table(
        "workspaces",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("region", sa.Text, nullable=False),
        sa.Column("settings", JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("active_mode", sa.Text, nullable=False, server_default="logistics"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── Users ────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.Text, nullable=False),
        sa.Column("password_hash", sa.Text, nullable=False),
        sa.Column("full_name", sa.Text, nullable=False),
        sa.Column("role", sa.Text, nullable=False, server_default="viewer"),
        sa.Column("status", sa.Text, nullable=False, server_default="pending_verification"),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("workspace_id", "email", name="unique_email_per_workspace"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # ── Vehicles ─────────────────────────────────────────────────
    op.create_table(
        "vehicles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("vehicle_type", sa.Text, nullable=False),
        sa.Column("capacity_kg", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("capacity_volume_m3", sa.Float, nullable=True),
        sa.Column("plate_number", sa.Text, nullable=False),
        sa.Column("status", sa.Text, nullable=False, server_default="available"),
        sa.Column("last_location", sa.Text, nullable=True),   # WKT — PostGIS geography stored as text for Alembic compat
        sa.Column("last_location_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fuel_type", sa.Text, nullable=True),
        sa.Column("max_range_km", sa.Float, nullable=True),
        sa.Column("metadata", JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    # Convert last_location to proper PostGIS geography after table creation
    op.execute("""
        ALTER TABLE vehicles
        ALTER COLUMN last_location TYPE geography(POINT,4326)
        USING CASE WHEN last_location IS NULL THEN NULL
              ELSE ST_GeogFromText(last_location) END
    """)

    # ── Locations ────────────────────────────────────────────────
    op.create_table(
        "locations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("address", sa.Text, nullable=True),
        sa.Column("geo", sa.Text, nullable=False),            # Will be converted to geography below
        sa.Column("location_type", sa.Text, nullable=False, server_default="custom"),
        sa.Column("contact_info", JSONB, server_default=sa.text("'{}'::jsonb")),
        sa.Column("operating_hours", JSONB, server_default=sa.text("'{}'::jsonb")),
        sa.Column("metadata", JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute("""
        ALTER TABLE locations
        ALTER COLUMN geo TYPE geography(POINT,4326)
        USING ST_GeogFromText(geo)
    """)

    # ── Routes ───────────────────────────────────────────────────
    op.create_table(
        "routes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("vehicle_id", UUID(as_uuid=True), sa.ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.Text, nullable=True),
        sa.Column("optimization_mode", sa.Text, nullable=False, server_default="classical"),
        sa.Column("status", sa.Text, nullable=False, server_default="draft"),
        sa.Column("distance_km", sa.Float, nullable=True),
        sa.Column("estimated_duration_minutes", sa.Integer, nullable=True),
        sa.Column("actual_duration_minutes", sa.Integer, nullable=True),
        sa.Column("optimization_score", sa.Float, nullable=True),
        sa.Column("constraints", JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── Route Stops ──────────────────────────────────────────────
    op.create_table(
        "route_stops",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("route_id", UUID(as_uuid=True), sa.ForeignKey("routes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("location_id", UUID(as_uuid=True), sa.ForeignKey("locations.id"), nullable=False),
        sa.Column("stop_order", sa.Integer, nullable=False),
        sa.Column("arrival_eta", sa.DateTime(timezone=True), nullable=True),
        sa.Column("departure_eta", sa.DateTime(timezone=True), nullable=True),
        sa.Column("actual_arrival", sa.DateTime(timezone=True), nullable=True),
        sa.Column("service_time_minutes", sa.Integer, server_default=sa.text("0")),
        sa.Column("load_kg", sa.Float, server_default=sa.text("0")),
        sa.Column("completed", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.UniqueConstraint("route_id", "stop_order", name="unique_stop_order"),
    )

    # ── Route Paths ──────────────────────────────────────────────
    op.create_table(
        "route_paths",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("route_id", UUID(as_uuid=True), sa.ForeignKey("routes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("path", sa.Text, nullable=False),           # WKT LINESTRING — converted below
        sa.Column("segment_index", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("distance_km", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.execute("""
        ALTER TABLE route_paths
        ALTER COLUMN path TYPE geography(LINESTRING,4326)
        USING ST_GeogFromText(path)
    """)

    # ── Optimization Jobs ─────────────────────────────────────────
    op.create_table(
        "optimization_jobs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("route_id", UUID(as_uuid=True), sa.ForeignKey("routes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("solver_type", sa.Text, nullable=False),
        sa.Column("status", sa.Text, nullable=False, server_default="pending"),
        sa.Column("input_hash", sa.Text, nullable=False),
        sa.Column("input_data", JSONB, nullable=False),
        sa.Column("result_data", JSONB, nullable=True),
        sa.Column("solution_quality_score", sa.Float, nullable=True),
        sa.Column("execution_time_ms", sa.Integer, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("retry_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_optimization_jobs_input_hash", "optimization_jobs", ["input_hash"])

    # ── Driver Profiles ───────────────────────────────────────────
    op.create_table(
        "driver_profiles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("phone", sa.Text, nullable=True),
        sa.Column("license_number", sa.Text, nullable=True),
        sa.Column("license_expiry", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rating", sa.Float, nullable=False, server_default=sa.text("5.0")),
        sa.Column("trips_completed", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("is_available", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("current_vehicle_id", UUID(as_uuid=True), sa.ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True),
        sa.Column("metadata", JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── Audit Logs ────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("workspace_id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.Text, nullable=False),
        sa.Column("resource_type", sa.Text, nullable=False),
        sa.Column("resource_id", UUID(as_uuid=True), nullable=True),
        sa.Column("changes", JSONB, nullable=True),
        sa.Column("ip_address", INET, nullable=True),
        sa.Column("user_agent", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_audit_logs_workspace", "audit_logs", ["workspace_id", "created_at"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("driver_profiles")
    op.drop_table("optimization_jobs")
    op.drop_table("route_paths")
    op.drop_table("route_stops")
    op.drop_table("routes")
    op.drop_table("locations")
    op.drop_table("vehicles")
    op.drop_table("users")
    op.drop_table("workspaces")
    op.drop_table("organizations")

    op.execute("DROP TYPE IF EXISTS solver_type")
    op.execute("DROP TYPE IF EXISTS job_status")
    op.execute("DROP TYPE IF EXISTS location_type")
    op.execute("DROP TYPE IF EXISTS optimization_mode")
    op.execute("DROP TYPE IF EXISTS route_status")
    op.execute("DROP TYPE IF EXISTS vehicle_status")
    op.execute("DROP TYPE IF EXISTS user_status")
    op.execute("DROP TYPE IF EXISTS user_role")
