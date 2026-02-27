"""
OmniRoute AI — Distance Matrix Calculator

Computes distance between stops using the Haversine formula.
This gives straight-line (great-circle) distance in km.

For production, replace with a road-network API (OSRM, Valhalla).
"""

import math

from engine.models import Stop


EARTH_RADIUS_KM = 6371.0


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate the great-circle distance between two GPS coordinates in km."""
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlng / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return EARTH_RADIUS_KM * c


def build_distance_matrix(stops: list[Stop]) -> list[list[int]]:
    """
    Build a distance matrix for OR-Tools.

    Returns distances in METERS (integer) because OR-Tools
    requires integer cost values internally.
    """
    n = len(stops)
    matrix = [[0] * n for _ in range(n)]

    for i in range(n):
        for j in range(n):
            if i != j:
                dist_km = haversine(stops[i].lat, stops[i].lng, stops[j].lat, stops[j].lng)
                matrix[i][j] = int(dist_km * 1000)  # Convert km → meters

    return matrix


def build_time_matrix(stops: list[Stop], avg_speed_kmh: float = 40.0) -> list[list[int]]:
    """
    Build a travel time matrix.

    Returns times in SECONDS (integer) for OR-Tools compatibility.
    Uses average speed to estimate travel time from distance.
    """
    n = len(stops)
    matrix = [[0] * n for _ in range(n)]

    for i in range(n):
        for j in range(n):
            if i != j:
                dist_km = haversine(stops[i].lat, stops[i].lng, stops[j].lat, stops[j].lng)
                time_hours = dist_km / avg_speed_kmh
                matrix[i][j] = int(time_hours * 3600)  # Convert hours → seconds

    return matrix
