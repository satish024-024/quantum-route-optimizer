"""
OmniRoute AI — Solver Data Models

Pydantic models for routing problems, solutions, and metrics.
Shared across all solver implementations (classical + quantum).
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class SolverType(str, Enum):
    classical = "classical"
    hybrid = "hybrid"
    quantum = "quantum"


class Stop(BaseModel):
    """A single stop/location in a routing problem."""
    id: str
    lat: float
    lng: float
    demand_kg: float = 0.0
    service_time_min: int = 0
    time_window_start: str | None = None  # ISO time e.g. "09:00"
    time_window_end: str | None = None    # ISO time e.g. "17:00"


class VehicleSpec(BaseModel):
    """Vehicle constraints for the optimizer."""
    id: str
    capacity_kg: float = 1000.0
    max_distance_km: float = 500.0
    max_stops: int = 50
    cost_per_km: float = 8.0  # INR per km


class RoutingProblem(BaseModel):
    """Input to any solver — describes what needs to be optimized."""
    stops: list[Stop]
    vehicles: list[VehicleSpec] = Field(default_factory=lambda: [VehicleSpec(id="default")])
    depot_index: int = 0  # Index of the starting/ending point in stops[]

    @property
    def stop_count(self) -> int:
        return len(self.stops)


class OptimizedStop(BaseModel):
    """A stop in the optimized route with ordering and ETA."""
    stop_id: str
    order: int
    lat: float
    lng: float
    arrival_eta_min: float = 0.0
    distance_from_prev_km: float = 0.0


class SolverMetrics(BaseModel):
    """Performance metrics from a solver run."""
    solver_type: SolverType
    strategy: str
    execution_time_ms: int = 0
    total_distance_km: float = 0.0
    total_duration_min: float = 0.0
    stops_optimized: int = 0
    quality_score: float = 0.0  # 0-100


class SolverResult(BaseModel):
    """Output from any solver."""
    success: bool = True
    routes: list[list[OptimizedStop]] = Field(default_factory=list)  # One list per vehicle
    metrics: SolverMetrics | None = None
    error: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
