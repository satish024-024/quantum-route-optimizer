"""
OmniRoute AI — Optimize Endpoint

POST /api/v1/optimize → Run route optimization

Accepts a list of stops, returns optimized route order,
total distance, estimated time, and solver metrics.
"""

import hashlib
import json
import sys
import os

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

# Add routing-engine to path so we can import it
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "routing-engine"))

from engine.models import RoutingProblem, Stop, VehicleSpec
from engine.selector import select_solver

router = APIRouter()


class OptimizeRequest(BaseModel):
    """Request body for route optimization."""
    stops: list[Stop] = Field(min_length=2)
    vehicles: list[VehicleSpec] = Field(default_factory=lambda: [VehicleSpec(id="default")])
    depot_index: int = 0


@router.post("")
async def optimize_route(body: OptimizeRequest):
    """
    Optimize a route using the classical OR-Tools solver.

    Accepts GPS coordinates, returns optimized stop order
    with distances, ETAs, and performance metrics.
    """
    problem = RoutingProblem(
        stops=body.stops,
        vehicles=body.vehicles,
        depot_index=body.depot_index,
    )

    # Select best solver for this problem size
    solver = select_solver(problem)

    # Run optimization
    result = await solver.solve(problem)

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=result.error or "Optimization failed",
        )

    # Build input hash for caching
    input_hash = hashlib.sha256(
        json.dumps([s.model_dump() for s in body.stops], sort_keys=True).encode()
    ).hexdigest()[:16]

    return {
        "success": True,
        "data": {
            "routes": [[stop.model_dump() for stop in route] for route in result.routes],
            "metrics": result.metrics.model_dump() if result.metrics else None,
            "input_hash": input_hash,
        },
    }
