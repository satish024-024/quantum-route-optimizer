"""
OmniRoute AI — Optimize Endpoint

POST /api/v1/optimize → Run route optimization

Accepts frontend stop format, bridges to OR-Tools engine,
returns standardized result with savings comparison.
"""

import hashlib
import json
import math
import sys
import os
import time as _time

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.infrastructure.models import User
from app.schemas import ApiResponse, OptimizeRequest

# Add routing-engine to path
sys.path.insert(
    0,
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "routing-engine")),
)

router = APIRouter()


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Compute great-circle distance between two GPS points in km."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _naive_total_distance(stops: list) -> float:
    """Total distance of unoptimized order (for savings calculation)."""
    total = 0.0
    for i in range(len(stops) - 1):
        total += _haversine_km(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng)
    if stops:
        total += _haversine_km(stops[-1].lat, stops[-1].lng, stops[0].lat, stops[0].lng)
    return round(total, 2)


@router.post("", response_model=ApiResponse)
async def optimize_route(
    body: OptimizeRequest,
    user: User = Depends(get_current_user),
):
    """
    Optimize a route using OR-Tools classical solver.
    Depot is the first stop with type='depot', or index 0.
    Returns ordered stops, distance, duration, and savings vs naive ordering.
    """
    stops = body.stops

    # Try OR-Tools engine
    try:
        from engine.models import RoutingProblem, Stop as EngineStop, VehicleSpec
        from engine.selector import select_solver

        # Map frontend stops to engine format
        engine_stops = [
            EngineStop(
                id=str(i),
                lat=s.lat,
                lng=s.lng,
                demand_kg=s.load_kg,
                service_time_min=s.service_time_minutes,
            )
            for i, s in enumerate(stops)
        ]

        depot_idx = next(
            (i for i, s in enumerate(stops) if s.type == "depot"), 0
        )

        vehicle = VehicleSpec(
            id="v0",
            capacity_kg=body.constraints.vehicle_capacity_kg,
            max_distance_km=body.constraints.max_distance_km,
            max_stops=body.constraints.max_stops,
        )

        problem = RoutingProblem(
            stops=engine_stops,
            vehicles=[vehicle],
            depot_index=depot_idx,
        )

        solver = select_solver(problem)
        t0 = _time.monotonic()
        result = await solver.solve(problem)
        elapsed_ms = int((_time.monotonic() - t0) * 1000)

        if not result.success:
            raise ValueError(result.error or "Solver returned no result")

        m = result.metrics
        naive_dist = _naive_total_distance(stops)
        opt_dist = round(m.total_distance_km, 2)
        dist_saving = max(0, round((1 - opt_dist / naive_dist) * 100)) if naive_dist > 0 else 0

        # Build ordered stop list from solver output (first vehicle)
        ordered_raw = result.routes[0] if result.routes else []
        ordered_stops = [
            {
                "name": stops[int(o.stop_id)].name,
                "lat": o.lat,
                "lng": o.lng,
                "order": o.order,
                "arrival_eta_min": round(o.arrival_eta_min),
                "distance_from_prev_km": round(o.distance_from_prev_km, 2),
            }
            for o in ordered_raw
        ]

        input_hash = hashlib.sha256(
            json.dumps(
                [{"lat": s.lat, "lng": s.lng} for s in stops], sort_keys=True
            ).encode()
        ).hexdigest()[:16]

        return ApiResponse(
            data={
                "total_distance_km": opt_dist,
                "estimated_duration_minutes": int(m.total_duration_min),
                "solution_quality_score": round(m.quality_score / 100, 4),
                "solver_used": f"OR-Tools ({m.strategy})",
                "execution_time_ms": elapsed_ms,
                "ordered_stops": ordered_stops,
                "input_hash": input_hash,
                "savings": {
                    "distance": dist_saving,
                    "time": max(0, dist_saving - 3),
                    "fuel": max(0, dist_saving - 2),
                },
            }
        )

    except (ImportError, Exception) as exc:
        # Engine not installed or errored — return HTTP 503 with clear message
        if isinstance(exc, ImportError):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Routing engine not available. Install OR-Tools in the routing-engine service.",
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
