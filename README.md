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
│   └── api/                  # FastAPI backend (Python 3.13)
│       └── app/
│           ├── api/          # HTTP endpoints
│           │   ├── health.py # Liveness & readiness probes
│           │   └── v1/       # Versioned API
│           │       ├── auth.py
│           │       ├── vehicles.py
│           │       └── routes.py
│           ├── infrastructure/
│           │   ├── database.py  # Async SQLAlchemy engine
│           │   └── models.py    # ORM models (all tables)
│           ├── config.py     # Pydantic settings
│           ├── dependencies.py  # DI (auth, DB session)
│           ├── schemas.py    # Request/response models
│           └── main.py       # App factory
├── infrastructure/
│   └── docker-compose.dev.yml  # Dev containers (Postgres, Redis, Kafka)
├── .github/workflows/
│   └── ci.yml                # CI/CD pipeline
├── .env.example              # Environment template
└── docs/                     # Architecture documents
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

---

## Architecture

- **Frontend:** Vanilla HTML/CSS/JS dashboard with Leaflet maps (real OpenStreetMap tiles)
- **Backend:** FastAPI (async) with layered architecture
- **Database:** PostgreSQL 17 + PostGIS 3.5 (spatial data)
- **Cache:** Redis 7.4
- **Auth:** JWT (access + refresh tokens) with bcrypt password hashing
- **Multi-tenant:** Workspace-scoped data isolation

---

## License

Private — All rights reserved.