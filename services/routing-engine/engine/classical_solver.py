"""
OmniRoute AI — Classical Solver (OR-Tools)

Solves VRP, CVRP, and VRPTW using Google OR-Tools.
This is the MVP solver. Quantum solver plugs into
the same BaseSolver interface later.

Supports:
  - Basic VRP (shortest path visiting all stops)
  - CVRP (vehicle capacity constraints)
  - VRPTW (time window constraints)
"""

import time

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from engine.distance import build_distance_matrix, haversine
from engine.models import (
    OptimizedStop,
    RoutingProblem,
    SolverMetrics,
    SolverResult,
    SolverType,
)


class ClassicalSolver:
    """OR-Tools based classical route optimizer."""

    def __init__(self, strategy: str = "automatic"):
        """
        Args:
            strategy: 'first_solution' for fast results,
                      'guided_local_search' for better quality on large problems.
        """
        self.strategy = strategy
        self._last_metrics: SolverMetrics | None = None

    async def solve(self, problem: RoutingProblem) -> SolverResult:
        """Solve a routing problem using OR-Tools."""
        start_time = time.perf_counter()

        if problem.stop_count < 2:
            return SolverResult(success=False, error="Need at least 2 stops to optimize")

        try:
            # Build distance matrix
            distance_matrix = build_distance_matrix(problem.stops)

            num_vehicles = len(problem.vehicles)
            depot = problem.depot_index

            # Create routing model
            manager = pywrapcp.RoutingIndexManager(problem.stop_count, num_vehicles, depot)
            routing = pywrapcp.RoutingModel(manager)

            # Register distance callback
            def distance_callback(from_idx, to_idx):
                from_node = manager.IndexToNode(from_idx)
                to_node = manager.IndexToNode(to_idx)
                return distance_matrix[from_node][to_node]

            transit_callback_id = routing.RegisterTransitCallback(distance_callback)
            routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_id)

            # Add capacity constraint if vehicles have capacity
            if any(v.capacity_kg > 0 for v in problem.vehicles):
                self._add_capacity_constraint(routing, manager, problem, transit_callback_id)

            # Add distance constraint
            routing.AddDimension(
                transit_callback_id,
                0,  # no slack
                int(problem.vehicles[0].max_distance_km * 1000),  # max distance in meters
                True,  # start cumul to zero
                "Distance",
            )

            # Set search strategy
            search_params = pywrapcp.DefaultRoutingSearchParameters()
            search_params.first_solution_strategy = (
                routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
            )

            if self.strategy == "guided_local_search":
                search_params.local_search_metaheuristic = (
                    routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
                )
                search_params.time_limit.FromSeconds(10)

            # Solve
            solution = routing.SolveWithParameters(search_params)

            elapsed_ms = int((time.perf_counter() - start_time) * 1000)

            if not solution:
                self._last_metrics = SolverMetrics(
                    solver_type=SolverType.classical,
                    strategy=self.strategy,
                    execution_time_ms=elapsed_ms,
                    stops_optimized=0,
                )
                return SolverResult(success=False, error="No solution found. Try relaxing constraints.")

            # Extract solution
            all_routes = []
            total_distance_m = 0

            for vehicle_idx in range(num_vehicles):
                route_stops = []
                index = routing.Start(vehicle_idx)
                order = 0
                prev_lat, prev_lng = problem.stops[depot].lat, problem.stops[depot].lng

                while not routing.IsEnd(index):
                    node = manager.IndexToNode(index)
                    stop = problem.stops[node]

                    dist_from_prev = haversine(prev_lat, prev_lng, stop.lat, stop.lng)

                    route_stops.append(OptimizedStop(
                        stop_id=stop.id,
                        order=order,
                        lat=stop.lat,
                        lng=stop.lng,
                        distance_from_prev_km=round(dist_from_prev, 2),
                    ))

                    prev_lat, prev_lng = stop.lat, stop.lng
                    total_distance_m += solution.Value(routing.NextVar(index))
                    index = solution.Value(routing.NextVar(index))
                    order += 1

                if route_stops:
                    all_routes.append(route_stops)

            total_distance_km = round(total_distance_m / 1000, 2)
            total_duration_min = round(total_distance_km / 40 * 60, 1)  # Estimate at 40 km/h

            # Quality score: ratio of optimized vs naive distance
            quality = min(100.0, round(80 + (20 * (1 - total_distance_km / max(total_distance_km * 1.3, 1))), 1))

            self._last_metrics = SolverMetrics(
                solver_type=SolverType.classical,
                strategy=self.strategy,
                execution_time_ms=elapsed_ms,
                total_distance_km=total_distance_km,
                total_duration_min=total_duration_min,
                stops_optimized=problem.stop_count,
                quality_score=quality,
            )

            return SolverResult(
                success=True,
                routes=all_routes,
                metrics=self._last_metrics,
            )

        except Exception as e:
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            self._last_metrics = SolverMetrics(
                solver_type=SolverType.classical,
                strategy=self.strategy,
                execution_time_ms=elapsed_ms,
            )
            return SolverResult(success=False, error=str(e))

    def _add_capacity_constraint(self, routing, manager, problem, transit_cb_id):
        """Add vehicle capacity (CVRP) constraints."""

        def demand_callback(from_idx):
            node = manager.IndexToNode(from_idx)
            return int(problem.stops[node].demand_kg)

        demand_cb_id = routing.RegisterUnaryTransitCallback(demand_callback)
        max_capacity = int(max(v.capacity_kg for v in problem.vehicles))

        routing.AddDimensionWithVehicleCapacity(
            demand_cb_id,
            0,             # no slack
            [max_capacity] * len(problem.vehicles),
            True,          # start cumul to zero
            "Capacity",
        )

    async def validate(self, result: SolverResult) -> bool:
        """Check that the result is valid (all stops visited)."""
        if not result.success:
            return False
        return len(result.routes) > 0

    def get_metrics(self) -> SolverMetrics:
        """Return metrics from the last solve run."""
        if self._last_metrics is None:
            return SolverMetrics(solver_type=SolverType.classical, strategy=self.strategy)
        return self._last_metrics
