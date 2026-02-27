"""
OmniRoute AI — Solver Selector

Picks the right solver based on problem size and configuration.
MVP: Classical only. Quantum plugs in post-MVP.
"""

from engine.classical_solver import ClassicalSolver
from engine.models import RoutingProblem


def select_solver(problem: RoutingProblem) -> ClassicalSolver:
    """
    Select the best solver for a given problem.

    Rules (MVP — classical only):
      - < 50 stops → fast 'first_solution' strategy
      - ≥ 50 stops → 'guided_local_search' for better quality

    Post-MVP: Add quantum branch here via config flag.
    """
    if problem.stop_count < 50:
        return ClassicalSolver(strategy="first_solution")
    else:
        return ClassicalSolver(strategy="guided_local_search")
