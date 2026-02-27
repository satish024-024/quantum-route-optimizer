# 🚀 OmniRoute AI

**Hybrid Quantum-AI Route Optimization Platform**

A multi-product routing platform that morphs into different industry solutions (logistics, emergency, agriculture, food delivery, smart city, driver assistant) through an Experience Engine — all powered by one backend.

---

## Project Structure

```
omniroute/
├── apps/
│   └── web/
│       └── dashboard/        # Frontend dashboard (HTML/CSS/JS)
├── services/
│   ├── api/                  # FastAPI backend (Python 3.13)
│   │   └── app/
│   │       ├── api/v1/       # Versioned endpoints (auth, vehicles, routes, optimize)
│   │       ├── infrastructure/ # DB engine + ORM models
│   │       ├── config.py     # Pydantic settings
│   │       ├── dependencies.py # DI (auth, DB session)
│   │       ├── schemas.py    # Request/response models
│   │       └── main.py       # App factory
│   └── routing-engine/       # OR-Tools route optimizer
│       └── engine/
│           ├── models.py     # Solver data models
│           ├── distance.py   # Haversine distance matrix
│           ├── base_solver.py # Solver interface (quantum-ready)
│           ├── classical_solver.py # OR-Tools VRP/CVRP solver
│           └── selector.py   # Auto-selects best solver
├── infrastructure/
│   └── docker-compose.dev.yml
├── .github/workflows/ci.yml
└── .env.example
```

---

## Quick Start

### 1. Prerequisites

| Tool       | Version   |
|------------|-----------|
| Python     | 3.13+     |
| Node.js    | 22.x LTS  |
| Docker     | 27+       |
| pnpm       | 9.x       |

### 2. Start Dev Infrastructure

```bash
cd infrastructure
docker compose -f docker-compose.dev.yml up -d
```

This spins up **PostgreSQL + PostGIS**, **Redis**, and **Kafka**.

### 3. Start Backend API

```bash
cd services/api
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### 4. Open Frontend Dashboard

Open `apps/web/dashboard/index.html` directly in your browser.

---

## API Endpoints

| Method | Endpoint              | Description          | Auth   |
|--------|-----------------------|----------------------|--------|
| GET    | `/health`             | Liveness check       | No     |
| GET    | `/health/ready`       | Readiness check      | No     |
| POST   | `/api/v1/auth/register` | Register user      | No     |
| POST   | `/api/v1/auth/login`  | Login, get JWT       | No     |
| GET    | `/api/v1/vehicles`    | List vehicles        | JWT    |
| POST   | `/api/v1/vehicles`    | Create vehicle       | JWT    |
| GET    | `/api/v1/vehicles/:id`| Get vehicle          | JWT    |
| DELETE | `/api/v1/vehicles/:id`| Soft-delete vehicle  | JWT    |
| GET    | `/api/v1/routes`      | List routes          | JWT    |
| POST   | `/api/v1/routes`      | Create route         | JWT    |
| GET    | `/api/v1/routes/:id`  | Get route            | JWT    |
| DELETE | `/api/v1/routes/:id`  | Soft-delete route    | JWT    |
| POST   | `/api/v1/optimize`    | Optimize route (OR-Tools) | No |

---

## Architecture

- **Frontend:** Vanilla HTML/CSS/JS dashboard with Leaflet maps (real OpenStreetMap tiles)
- **Backend:** FastAPI (async) with layered architecture
- **Routing Engine:** Google OR-Tools (VRP, CVRP with capacity constraints)
- **Database:** PostgreSQL 17 + PostGIS 3.5 (spatial data)
- **Cache:** Redis 7.4
- **Auth:** JWT (access + refresh tokens) with bcrypt password hashing
- **Multi-tenant:** Workspace-scoped data isolation

---

## License

Private — All rights reserved.