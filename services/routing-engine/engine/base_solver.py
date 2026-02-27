"""
OmniRoute AI — Base Solver Interface (Quantum-Ready)

All solvers (classical, hybrid, quantum) must implement this protocol.
This allows drop-in replacement of solver backends.
"""

from typing import Protocol

from engine.models import RoutingProblem, SolverMetrics, SolverResult


class BaseSolver(Protocol):
    """Interface that every solver must implement."""

    async def solve(self, problem: RoutingProblem) -> SolverResult:
        """Solve a routing problem and return optimized routes."""
        ...

    async def validate(self, result: SolverResult) -> bool:
        """Validate that a solution is feasible."""
        ...

    def get_metrics(self) -> SolverMetrics:
        """Return performance metrics from the last solve."""
        ...
