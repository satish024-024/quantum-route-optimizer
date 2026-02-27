# 📄 BUILD_PRD.md

**Product:** OmniRoute AI
**Type:** Execution Product Requirements Document
**Goal:** Step-by-step instructions to build a production-ready Hybrid Quantum-AI Routing Platform.
**Last Updated:** 2026-02-27

---

# 0. How To Use This Document

This is NOT reading material. It is an **execution checklist**.

**Rules:**

1. Do NOT jump phases — each phase unlocks the next.
2. Every phase has measurable **exit criteria** — do not proceed until met.
3. Mark each step ✅ when complete, ⏳ when in-progress, ❌ when blocked.
4. Log all architectural decisions in the **Decision Log** (Section 8).

**Development Order:**

```
Foundation → Backend Core → Core Solver → Frontend System → Logistics Mode (hardcoded) → Experience Engine Extraction → Experience ↔ Routing Binding → Realtime + Mobile → Production Hardening → Launch
```

> **Quantum integration is POST-MVP.** Ship with classical optimization first.

---

# 1. PRODUCT OBJECTIVE

Build a platform that:

- ✅ Optimizes routes using AI + Quantum algorithms (QAOA/VQE hybrid)
- ✅ Morphs into multiple industry products via Experience Engine
- ✅ Runs as web + mobile (PWA + Capacitor)
- ✅ Supports logistics, emergency, agriculture, smart city, delivery, driver use cases
- ✅ Deploys via containerized microservices (Kubernetes-ready)

---

# 2. MVP vs. FULL PRODUCT SCOPE

> **Critical decision:** Build the MVP first. Do NOT attempt all 6 modes simultaneously.
> **Quantum is NOT an MVP requirement.** Ship with classical optimization. Add quantum as a performance enhancement post-launch.

## MVP (Weeks 1–12) — Ship This First

| Feature | Included |
| --- | --- |
| Logistics Mode (hardcoded first, then extracted) | ✅ |
| Classical route optimization (OR-Tools) | ✅ |
| Fleet management + live tracking | ✅ |
| Web dashboard | ✅ |
| JWT authentication + RBAC | ✅ |
| Experience Engine (extracted from working logistics) | ✅ |
| CI/CD pipeline | ✅ |
| Docker Compose deployment | ✅ |

## Post-MVP (Weeks 13–20)

| Feature | Phase |
| --- | --- |
| Quantum Integration (simulator) | v1.1 |
| Emergency Mode | v1.1 |
| Agriculture Mode | v1.1 |
| Food Delivery Mode | v1.2 |
| Smart City Mode | v1.2 |
| Driver Assistant Mobile | v1.2 |
| IBM Quantum Cloud integration | v1.2 |
| Kubernetes migration | v1.3 |
| Multi-tenant billing | v1.3 |

---

# 3. SUCCESS METRICS (Measurable)

## MVP Metrics

| Metric | Target | How to Measure |
| --- | --- | --- |
| Route optimization latency (classical) | < 2 seconds | API response time via Prometheus histogram |
| Mode switch time | < 500ms | Frontend performance marks (Performance API) |
| Live tracking update frequency | Every 5 seconds | WebSocket heartbeat monitoring |
| Map render time | < 300ms | Lighthouse / Web Vitals LCP metric |
| API p99 latency | < 200ms | Prometheus percentile tracking |
| Uptime SLA | 99.5% | Uptime monitoring (Grafana alerts) |
| Test coverage | > 80% backend, > 70% frontend | CI/CD coverage reports |

## Post-MVP Quantum Metrics

| Metric | Target | How to Measure |
| --- | --- | --- |
| Quantum job completion | < 60s on simulator | Job duration in optimization_jobs table |
| **Solution quality vs. classical** | **≥ 5% improvement on 20+ stop routes** | Compare objective function values (distance + time + fuel) of quantum vs. classical solutions on same input |
| Quantum fallback rate | < 10% of jobs | Count of fallback events / total quantum jobs |

> **Why quality over speed?** Quantum's value is finding *better* routes, not faster ones. If quantum doesn't produce measurably better solutions than OR-Tools, it adds no value.

**If MVP metrics fail → product incomplete.**

---

# 4. COST ESTIMATION

| Item | Monthly Cost (Estimate) | Notes |
| --- | --- | --- |
| Cloud Compute (single VM / Docker Compose) | $20–$80 | Hetzner CX32 or DigitalOcean Droplet |
| PostgreSQL (managed) | $15–$50 | Supabase free tier for dev |
| Redis (managed) | $0–$30 | Upstash free tier for dev |
| Mapbox API | $0–$200 | Free tier: 50k loads/month |
| Domain + SSL | $15/year | Cloudflare free SSL |
| Monitoring (Grafana Cloud) | $0 | Free tier sufficient for MVP |
| **Total MVP (Dev)** | **~$20–$60/month** | |
| **Total MVP (Production)** | **~$80–$200/month** | Single VM + managed DB |
| **Total Scale (K8s, post-MVP)** | **~$300–$800/month** | When traffic justifies it |

---

# 5. PHASE OVERVIEW

| Phase | Name | Duration | Dependencies | Team |
| --- | --- | --- | --- | --- |
| 1 | Foundation Setup | Week 1 | None | DevOps + Backend |
| 2 | Backend Core | Week 2–3 | Phase 1 | Backend Lead |
| 3 | Core Solver Engine | Week 4–5 | Phase 2 | AI Engineer |
| 4 | Frontend System | Week 4–6 | Phase 2 (API) | Frontend Lead |
| 5 | Logistics Mode (Hardcoded) | Week 6–8 | Phase 3 + 4 | Full Team |
| 6 | Experience Engine Extraction | Week 8–9 | Phase 5 (validated) | Frontend Lead |
| 6A | Experience ↔ Routing Binding | Week 9–10 | Phase 3 + 6 | Backend + Frontend |
| 7 | Realtime + Mobile | Week 9–11 | Phase 5 | Frontend + Backend |
| 8 | Production Hardening | Week 11–13 | Phase 6A + 7 | DevOps |
| 9 | Launch Build | Week 13–14 | Phase 8 | Full Team |

> **Note:** Phases 3 & 4 run in PARALLEL. Phase 7 overlaps with 6/6A.
> **Quantum is POST-MVP** — see Phase Q below.

### Solo Developer Timeline

> If building solo, the parallel phases execute sequentially. Realistic timeline:
> **MVP: 20–24 weeks** (not 14). This is normal for a platform of this complexity.
> Prioritize: Foundation → Backend → Solver → Frontend → Logistics → Ship.

```mermaid
gantt
    title OmniRoute AI Development Timeline
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section Foundation
    Phase 1 - Foundation Setup          :p1, 2026-03-01, 7d

    section Backend
    Phase 2 - Backend Core              :p2, after p1, 14d
    Phase 3 - Core Solver Engine        :p3, after p2, 14d

    section Frontend
    Phase 4 - Frontend System           :p4, after p2, 21d

    section Product
    Phase 5 - Logistics Mode (hardcoded):p5, after p3, 21d
    Phase 6 - Experience Engine Extract :p6, after p5, 10d
    Phase 6A - Routing ↔ Experience Bind:p6a, after p6, 7d

    section Realtime
    Phase 7 - Realtime + Mobile         :p7, after p5, 14d

    section Production
    Phase 8 - Hardening                 :p8, after p7, 21d
    Phase 9 - Launch (Docker Compose)   :p9, after p8, 10d

    section Post-MVP
    Phase Q - Quantum Integration       :pq, after p9, 21d
```

---

# 🚧 PHASE 1 — FOUNDATION SETUP

## Goal

Create stable, reproducible development environment with CI/CD from Day 1.

> **Deployment target for MVP: Docker Compose + single VM + reverse proxy (Caddy/Nginx).**
> Kubernetes is a scaling milestone, not a launch requirement.

---

### Step 1.1 — Repository Setup

Create monorepo:

```
omniroute/
 ├── apps/
 │   ├── web/              # Next.js 15 frontend
 │   └── mobile/           # Capacitor wrapper
 ├── services/
 │   ├── api/              # FastAPI core API
 │   ├── routing-engine/   # OR-Tools + optimization
 │   ├── quantum-optimizer/ # Qiskit quantum service
 │   └── realtime/         # WebSocket + tracking
 ├── packages/
 │   ├── ui/               # Shared component library
 │   ├── config/           # Shared configs (ESLint, TSConfig)
 │   └── types/            # Shared TypeScript types
 ├── infrastructure/
 │   ├── docker/           # Dockerfiles per service
 │   ├── docker-compose.yml # Production deployment (MVP)
 │   ├── k8s/              # Kubernetes manifests (post-MVP scaling)
 │   └── caddy/            # Reverse proxy config
 ├── docs/                 # This documentation
 └── .github/
     └── workflows/        # CI/CD pipelines
```

Initialize:

```bash
git init
pnpm init
npx turbo init
```

---

### Step 1.2 — Install Base Stack

Install **exact versions** (see TECH_STACK.md for full list):

| Tool | Version | Verification |
| --- | --- | --- |
| Node.js | 22.x LTS | `node -v` |
| Python | 3.13.x | `python --version` |
| Docker | 27+ | `docker --version` |
| PostgreSQL | 17 | `psql --version` |
| pnpm | 9.x | `pnpm --version` |

---

### Step 1.3 — Dev Containers

Create `docker-compose.dev.yml`:

**Services:**

| Service | Image | Port |
| --- | --- | --- |
| postgres | postgis/postgis:17-3.5 | 5432 |
| redis | redis:7.4-alpine | 6379 |
| kafka | confluentinc/cp-kafka:7.7 | 9092 |
| zookeeper | confluentinc/cp-zookeeper:7.7 | 2181 |

---

### Step 1.4 — CI/CD Pipeline (Day 1 Requirement)

Create `.github/workflows/ci.yml`:

```yaml
# Triggers: push to main, pull requests
# Jobs:
#   1. lint (ESLint + Prettier + Ruff)
#   2. type-check (TypeScript + Pyright)
#   3. test-backend (pytest)
#   4. test-frontend (Jest + Playwright)
#   5. build (Docker images)
#   6. deploy-preview (staging on PR)
```

---

### Step 1.5 — Environment Configuration

Create `.env.example` with all required variables:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/omniroute
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=generate-with-openssl
JWT_ALGORITHM=HS256
JWT_EXPIRY_MINUTES=30

# Maps
MAPBOX_ACCESS_TOKEN=pk.xxx

# Quantum
IBM_QUANTUM_TOKEN=optional-for-dev
QUANTUM_BACKEND=aer_simulator

# Kafka
KAFKA_BROKER=localhost:9092
```

---

✅ **Exit Criteria:**

- [ ] `docker compose up` starts all services
- [ ] CI pipeline passes on clean commit
- [ ] All environment variables documented
- [ ] README.md with setup instructions

---

# 🚧 PHASE 2 — BACKEND CORE

## Goal

Create universal mobility data model with multi-tenant isolation.

---

### Step 2.1 — Database Schema

**Migration tool:** Alembic (not raw SQL)

```bash
alembic init migrations
alembic revision --autogenerate -m "initial_schema"
```

Implement core tables (see BACKEND_STRUCTURE.md for full schema):

1. `organizations` — multi-tenant root
2. `workspaces` — tenant isolation boundary
3. `users` — with role ENUM
4. `vehicles` — with PostGIS location
5. `routes` + `route_stops` + `route_paths` — optimized routing storage
6. `locations` — universal geo points
7. `optimization_jobs` — tracks solver runs
8. `audit_logs` — every mutation logged

Enable spatial extensions:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

### Step 2.2 — FastAPI Service

Create `services/api/` with layered architecture:

```
services/api/
 ├── app/
 │   ├── main.py              # FastAPI app factory
 │   ├── config.py            # Pydantic Settings
 │   ├── dependencies.py      # DI container
 │   ├── middleware/
 │   │   ├── auth.py          # JWT verification
 │   │   ├── tenant.py        # Workspace context injection
 │   │   ├── rate_limit.py    # Per-tenant rate limiting
 │   │   └── cors.py
 │   ├── domain/              # Business logic (no framework deps)
 │   │   ├── routes/
 │   │   ├── vehicles/
 │   │   └── users/
 │   ├── api/                 # HTTP layer
 │   │   ├── v1/
 │   │   │   ├── auth.py
 │   │   │   ├── vehicles.py
 │   │   │   ├── routes.py
 │   │   │   └── tracking.py
 │   │   └── health.py
 │   ├── infrastructure/      # DB, Redis, Kafka adapters
 │   └── schemas/             # Pydantic request/response models
 ├── tests/
 ├── alembic/
 └── pyproject.toml
```

---

### Step 2.3 — Standardized API Response Format

All endpoints return:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO-8601",
    "pagination": { "page": 1, "per_page": 20, "total": 100 }
  }
}
```

Error format:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Route with ID xyz not found",
    "details": {}
  }
}
```

---

### Step 2.4 — Authentication & Authorization

Implement:

- JWT access tokens (15 min) + refresh tokens (7 days)
- Role-based middleware: `admin | operator | analyst | driver | responder | viewer`
- Workspace-scoped permissions (user can only see their workspace data)
- Password hashing: `bcrypt` via `passlib`

---

### Step 2.5 — Health Checks

```
GET /health          → basic liveness
GET /health/ready    → DB + Redis + Kafka connectivity
GET /health/startup  → migration status
```

---

✅ **Exit Criteria:**

- [ ] User can register, login, and receive JWT tokens
- [ ] CRUD operations work for vehicles and routes
- [ ] Workspace isolation verified (user A cannot see user B's data)
- [ ] Alembic migrations run cleanly up and down
- [ ] All endpoints return standardized response format
- [ ] Health endpoints return 200

---

# 🚧 PHASE 3 — CORE SOLVER ENGINE

## Goal

Working classical optimizer with clean solver interface. **No mode logic.** No experience binding. Pure optimization.

> This phase builds the solver as an independent service. Experience-specific weights are bound in Phase 6A.

---

### Step 3.1 — OR-Tools Integration

Create `services/routing-engine/`:

Implement:

- **Vehicle Routing Problem (VRP)** solver
- **Capacitated VRP (CVRP)** with vehicle load constraints
- **VRPTW** (VRP with Time Windows)
- Distance matrix computation (Haversine + road network fallback)
- Constraint system: max distance, max stops, time windows, vehicle capacity

---

### Step 3.2 — Optimization Selector (Classical-Only for MVP)

```python
def select_solver(problem: RoutingProblem) -> Solver:
    # MVP: classical only. Quantum solvers added in Phase Q (post-MVP).
    if problem.stop_count < 50:
        return ClassicalSolver(engine="or-tools", strategy="first_solution")
    else:
        return ClassicalSolver(engine="or-tools", strategy="guided_local_search")
    # POST-MVP: quantum branch added here via config
```

> The selector is designed with a clean `Solver` interface so quantum can be plugged in later without changing calling code.

---

### Step 3.3 — Route Storage

Save optimized results:

- Optimized path as PostGIS `LineString`
- Per-stop ETA timestamps
- Total distance (km) and estimated duration (minutes)
- Optimization metadata (solver used, execution time, solution quality score)
- Input hash for cache lookup

---

### Step 3.4 — Solver Interface (Quantum-Ready)

Define abstract interface that both classical and quantum solvers implement:

```python
class BaseSolver(Protocol):
    async def solve(self, problem: QUBOProblem) -> SolverResult: ...
    async def validate(self, result: SolverResult) -> bool: ...
    def get_metrics(self) -> SolverMetrics: ...
```

---

✅ **Exit Criteria:**

- [ ] Route with 10 stops optimized in < 2 seconds
- [ ] Route with 50 stops optimized in < 10 seconds
- [ ] Optimized route visible via API with PostGIS geometry
- [ ] Solver metrics logged (execution time, solution quality)
- [ ] Solver interface supports drop-in quantum replacement

---

# 🚧 PHASE 4 — FRONTEND SYSTEM

## Goal

Stable UI foundation with design system and map integration.

---

### Step 4.1 — Next.js App

Create `apps/web/`:

```bash
npx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir
```

Key dependencies:

- React 19 + Next.js 15
- TailwindCSS 4.x
- Zustand (client state)
- TanStack Query (server state)
- React Hook Form + Zod (forms)
- Mapbox GL JS (maps)

---

### Step 4.2 — Layout Shell

Build the Application Shell using Server Components where possible:

```
┌─ Top Navigation Bar (64px) ────────────────────────┐
│  Logo | Mode Indicator | Search | Notifications | Profile  │
├────────────────────────────────────────────────────┤
│ Sidebar  │         Main Canvas           │ AI Panel │
│ (280px)  │    (map + content area)       │ (360px)  │
│          │                               │          │
│ Dynamic  │                               │ Context  │
│ nav from │                               │ aware    │
│ experience│                              │ assistant│
└──────────┴───────────────────────────────┴──────────┘
```

---

### Step 4.3 — Map Integration

Use Mapbox GL JS via `react-map-gl`:

Display layers (z-index order):

1. Base map (streets/satellite toggle)
2. Route paths (animated LineString)
3. Stop markers (numbered, color-coded)
4. Vehicle positions (real-time, animated movement)
5. Cluster layers (for dense data)
6. Alert overlays (incidents, deviations)
7. UI controls (zoom, style, fullscreen)

---

### Step 4.4 — Design System Implementation

Build `packages/ui/` with:

- CSS custom properties from design tokens (see FRONTEND_GUIDELINES.md)
- Core components: Button, Card, Table, Input, Modal, Toast, Badge
- Compound components: DataTable, MapContainer, StatsCard
- All components: TypeScript strict, `forwardRef`, accessible, tested

---

✅ **Exit Criteria:**

- [ ] Map renders with route data from backend API
- [ ] Layout shell responsive at all breakpoints (sm → 2xl)
- [ ] Design system components in Storybook
- [ ] Lighthouse performance score > 90
- [ ] Keyboard navigation works across all components

---

# 🚧 PHASE 5 — LOGISTICS MODE (HARDCODED)

## Goal

Build a **fully working logistics product** — hardcoded, no abstraction layer.

> ⚠️ **Do NOT build the Experience Engine yet.** Build logistics as a concrete product first.
> Validate UX + routing integration before extracting abstractions.
> This prevents designing abstractions for problems users never have.

See EXPERIENCE_ENGINE.md for the eventual target architecture.

---

### Step 5.1 — Logistics Dashboard

Build directly in `apps/web/`:

- Fleet map with live vehicle positions
- Active deliveries counter + stats cards
- Route efficiency score
- Alert feed
- Quick actions: Create Route, Assign Driver

---

### Step 5.2 — Route Creation Workflow

Implement the full route lifecycle:

```
Add Stops → Set Constraints → Optimize (OR-Tools) → Preview on Map → Deploy to Driver
```

---

### Step 5.3 — Fleet Management Pages

- Vehicle list (filterable by status, type)
- Driver profiles (assignment, availability)
- Maintenance log tracking

---

### Step 5.4 — Connect Frontend ↔ Routing Engine

Wire up the route optimizer to the UI:

- Call `POST /routes/{id}/optimize`
- Display optimization result on map
- Show solver metrics (time, quality score)

---

✅ **Exit Criteria:**

- [ ] User can create, optimize, deploy, and monitor a route end-to-end
- [ ] Fleet dashboard shows real data from backend
- [ ] Route planner wizard works with OR-Tools optimization
- [ ] UX validated (usable without confusion)
- [ ] Logistics product works as standalone SaaS

---

# 🚧 PHASE 6 — EXPERIENCE ENGINE EXTRACTION

## Goal

Extract the working logistics code into the Experience Engine abstraction.

> Now that logistics works as a concrete product, generalize it.
> This is the correct sequence: **concrete → abstract**, not abstract → concrete.

---

### Step 6.1 — Extract Experience Package Structure

Refactor logistics-specific code into:

```
/experiences/
   logistics/
     ├── config.json        # Mode definition (extracted from hardcoded config)
     ├── navigation.ts      # Sidebar items (extracted from hardcoded nav)
     ├── dictionary.json    # Terminology mapping
     ├── dashboards/        # Mode-specific widgets (moved from apps/web)
     ├── workflows/         # Step definitions
     ├── components/        # Mode-specific components (moved)
     └── permissions.ts     # Role-based feature access
```

---

### Step 6.2 — Build Core Engine Infrastructure

- Component Registry (dynamic loading)
- Config Loader + JSON Schema validation
- Navigation Generator (sidebar from config)
- Terminology Layer

---

### Step 6.3 — Verify Logistics Still Works via Engine

The refactored logistics mode must produce **identical UX** to the hardcoded version.

---

### Step 6.4 — Create Emergency Mode Skeleton

Build a minimal emergency mode to validate the engine generalizes:

- Different layout, different sidebar, different accent color
- Most pages are placeholder/skeleton
- Validates: mode switching, state isolation, terminology layer

---

✅ **Exit Criteria:**

- [ ] Logistics mode works identically through Experience Engine
- [ ] Selecting "Emergency" loads different UI (skeleton OK)
- [ ] Mode switch completes in < 500ms
- [ ] Invalid config.json rejected at build time
- [ ] No regression in logistics functionality

---

# 🚧 PHASE 6A — EXPERIENCE ↔ ROUTING BINDING

## Goal

Bind optimization profiles to experiences. This resolves the dependency between Experience Engine and Routing Engine.

> This phase exists because routing behavior depends on experience-defined weights (α, β, γ),
> but both must be independently testable. This binding layer is the integration contract.

---

### Step 6A.1 — Define Optimization Profile Contract

```typescript
interface OptimizationProfile {
  name: string;
  weights: { distance: number; time: number; fuel: number };
  constraints: Record<string, unknown>;
  solver: { preferQuantum: boolean; timeoutMs: number; fallback: string };
}
```

---

### Step 6A.2 — Wire Experience Config → Solver

When a route is optimized, the API:

1. Reads `active_mode` from workspace
2. Loads the mode's `optimizationProfile`
3. Passes weights to the solver
4. Solver adjusts objective function accordingly

---

### Step 6A.3 — Integration Test

Verify: same stops, different mode → different route (because weights differ).

---

✅ **Exit Criteria:**

- [ ] Logistics mode optimizes for cost/distance
- [ ] Emergency mode (skeleton) optimizes for speed
- [ ] Same input stops produce different routes in different modes
- [ ] Optimization profile is read from experience config, not hardcoded

---

# 🚧 POST-MVP — INDUSTRY MODE EXPANSION

> These modes are built AFTER MVP launch, using the Experience Engine infrastructure validated in Phase 6.

## Emergency Mode (v1.1)

**Features:**

- Incident dashboard with severity color-coding
- Incident creation flow: Create → Severity → Resource allocation → Route → Dispatch
- Priority routing (overrides normal traffic weights, bound via Phase 6A)
- Evacuation route planner
- Hospital/responder proximity analysis

---

## Agriculture Mode (v1.1)

**Features:**

- Farm location management
- Crop pickup scheduling with weather overlay
- Mandi (market) routing optimization
- Batch transport planning

---

# 🚧 PHASE Q — QUANTUM INTEGRATION (POST-MVP)

> ⚠️ **This phase executes AFTER MVP launch.** Do not start before classical routing is stable in production.
>
> 90% of routing failures are caused by bad constraints modeling, distance matrix issues, and data quality — NOT solver type.
> Prove classical routing works first. Then add quantum as a performance enhancement.

## Goal

Add hybrid quantum-classical optimization as a measurable improvement over classical solutions.

**Success criteria: quantum solutions must be ≥ 5% better than classical on the same input (objective function value).**

---

### Step Q.1 — Quantum Service

Create `services/quantum-optimizer/`:

```
services/quantum-optimizer/
 ├── app/
 │   ├── main.py
 │   ├── encoders/
 │   │   ├── qubo_builder.py     # Route → QUBO matrix
 │   │   └── constraint_encoder.py
 │   ├── solvers/
 │   │   ├── qaoa_solver.py      # Primary solver
 │   │   ├── vqe_solver.py       # Secondary solver
 │   │   └── simulator.py        # Local Qiskit Aer
 │   ├── pipeline/
 │   │   ├── hybrid_pipeline.py  # Classical ↔ Quantum orchestration
 │   │   └── decomposer.py      # Hierarchical problem splitting
 │   └── api/
 │       └── routes.py
 ├── tests/
 └── pyproject.toml
```

---

### Step Q.2 — QUBO Builder

Convert routing problem → QUBO matrix:

```
Stops → Binary Variables (x_ij = vehicle i visits stop j)
Distance → Cost Function (minimize total distance)
Constraints → Penalty Terms (each stop visited exactly once, vehicle capacity)
```

**Objective function:**

```
Minimize: α·distance + β·fuel + γ·delay + λ·constraint_penalties
```

Where α, β, γ, λ are **read from the Experience Engine optimization profile** (bound in Phase 6A).

---

### Step Q.3 — QAOA Solver

Using `qiskit 2.x` + `qiskit-algorithms`:

- QAOA with p=1 to p=5 layers (configurable)
- Classical optimizer: COBYLA (default) or SPSA
- Fallback: if quantum solver fails or exceeds timeout → OR-Tools

---

### Step Q.4 — Hybrid Pipeline

```
1. Classical preprocess (cluster stops, build distance matrix)
2. Encode as QUBO
3. Quantum solve (QAOA on simulator or IBM Quantum)
4. Decode binary solution → route
5. Classical validation (feasibility check)
6. Compare solution quality vs. classical baseline
7. If quantum ≥ 5% better → use quantum solution
8. If quantum worse or infeasible → use classical
9. Cache result (Redis, TTL: 6 hours)
10. Log comparison metrics for analysis
```

---

### Step Q.5 — A/B Comparison Infrastructure

For every quantum-eligible route:

```
1. Run classical solver (always)
2. Run quantum solver (async)
3. Compare: quantum_objective vs classical_objective
4. Log: {input_hash, classical_score, quantum_score, improvement_pct}
5. Use better solution
```

This provides hard data on whether quantum adds value.

---

### Step Q.6 — Hierarchical Optimization (Scale Strategy)

For >60 stops:

```
1. Cluster stops geographically (k-means)
2. Solve inter-cluster routing (quantum / classical)
3. Solve intra-cluster routing (classical)
4. Combine solutions
```

---

✅ **Exit Criteria:**

- [ ] Quantum job executes on simulator via API
- [ ] 20-stop route solved by QAOA in < 60 seconds
- [ ] **Quantum solution quality ≥ 5% better than classical on test dataset**
- [ ] Fallback to classical works transparently on quantum failure
- [ ] A/B comparison data logged for analysis
- [ ] Job status trackable via `GET /quantum/job/{id}`
- [ ] Results cached and reused for identical inputs

---

# 🚧 PHASE 7 — REALTIME + MOBILE

---

### Step 7.1 — Live Tracking

- Driver app sends GPS every 5 seconds
- Backend processes via WebSocket → stores in `live_vehicle_positions`
- Dashboard subscribers receive real-time position updates
- Route deviation detection: if vehicle > 500m from planned route → alert

### Data Lifecycle (Critical — prevents DB collapse)

`live_vehicle_positions` generates **~43M rows/day** at 500 updates/sec.

```
Raw data → partitioned by day
  → retain raw: 7 days
  → aggregate to hourly summaries: retain 90 days
  → archive daily summaries to S3: retain 1 year
  → delete raw partitions older than 7 days (automated cron/pg_partman)
```

**Without this policy, PostgreSQL will degrade within weeks.**

---

### Step 7.2 — Dynamic Serving

Detect context and serve appropriate experience:

| Condition | Experience |
| --- | --- |
| Role = driver + mobile device | Driver mobile experience |
| Role = admin/operator + desktop | Full dashboard |
| Role = analyst | Analytics-focused view |

---

### Step 7.3 — PWA + Capacitor

1. Configure `next-pwa` for service worker + offline support
2. Add `manifest.json` with app metadata
3. Wrap in Capacitor for native app store distribution
4. Implement offline queue for driver GPS updates (sync when online)

---

✅ **Exit Criteria:**

- [ ] Driver sees real-time navigation on mobile
- [ ] Admin dashboard shows live vehicle positions
- [ ] Route deviation alerts fire within 10 seconds
- [ ] PWA installable and works offline (driver mode)

---

# 🚧 PHASE 8 — PRODUCTION HARDENING

---

### Infrastructure

- [ ] Redis caching for hot paths (routes, experience configs)
- [ ] Retry logic with exponential backoff on all external calls
- [ ] Rate limiting: 100 req/min per user, 1000 req/min per workspace
- [ ] live_vehicle_positions data retention policy active (7-day raw, 90-day aggregate)
- [ ] Database connection pooling (PgBouncer) configured

### Monitoring Stack

- Prometheus: metrics collection
- Grafana: dashboards and alerting
- OpenTelemetry: distributed tracing
- Loki: centralized logging
- PagerDuty/Opsgenie: on-call alerting

### Load Testing

Target:

```
100 concurrent users
50 route optimizations / minute
500 GPS updates / second
```

Tool: k6 or Locust

---

✅ **Exit Criteria:**

- [ ] System stable under load test targets
- [ ] All services have health checks
- [ ] Alert rules configured for error rate, latency, resource usage
- [ ] Runbook documented for common failure scenarios

---

# 🚧 PHASE 9 — LAUNCH BUILD

---

### Deploy via Docker Compose + Single VM

> **MVP deployment is Docker Compose + Caddy reverse proxy on a single VM.**
> Kubernetes is a post-MVP scaling milestone when traffic justifies the operational complexity.

**MVP Stack:**

| Service | Container | Resources |
| --- | --- | --- |
| API Service | FastAPI + Uvicorn | 512Mi RAM |
| Routing Engine | OR-Tools worker | 1Gi RAM |
| Realtime Service | WebSocket handler | 256Mi RAM |
| PostgreSQL + PostGIS | Managed or container | 1Gi RAM |
| Redis | Container | 256Mi RAM |
| Caddy | Reverse proxy + auto TLS | 128Mi RAM |
| Frontend | Next.js static export → CDN | Edge-deployed |

**Total VM requirement: ~4GB RAM, 2 vCPU ($20–40/month on Hetzner)**

### Kubernetes Migration Criteria (Post-MVP)

Migrate to K8s when ANY of these thresholds are hit:

- > 500 concurrent users
- > 100 route optimizations / minute
- > 3 services need independent scaling
- Team grows to > 3 backend engineers

### Security Checklist

- [ ] TLS 1.3 everywhere
- [ ] CORS locked to known origins
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (CSP headers)
- [ ] Secrets in HashiCorp Vault or K8s Secrets
- [ ] Rate limiting active
- [ ] Audit logging active

### Pre-Launch

- [ ] Database backups configured (daily)
- [ ] Disaster recovery plan documented
- [ ] Rollback procedure tested
- [ ] Performance baseline recorded

---

✅ **Exit Criteria:**

- [ ] Public URL live and accessible
- [ ] SSL certificate valid
- [ ] Monitoring dashboards active
- [ ] First external user can complete the full route optimization flow

---

# 6. TEAM ROLE SPLIT

| Role | Responsibility | Primary Phases |
| --- | --- | --- |
| Backend Lead | APIs, DB schema, authentication, data layer | 2, 3, 6A, 7 |
| Frontend Lead | UI, Experience Engine, design system | 4, 5, 6 |
| AI/Quantum Engineer | Optimization algorithms, QUBO encoding, Qiskit | 3, Q |
| DevOps Engineer | CI/CD, Docker, monitoring, security | 1, 8, 9 |
| Product Owner | Prioritization, user stories, acceptance criteria | All |

> **Solo developer?** Realistic timeline: **20–24 weeks** (not 14).
> Follow the same phase order. Phases 3 & 4 are parallel — you'll alternate between them.
> Skip Quantum (Phase Q) entirely until MVP is live with real users.

---

# 7. DEVELOPMENT RULES

1. **No feature without schema** — design DB tables before writing code
2. **No UI without API** — backend endpoint must exist before frontend consumes it
3. **No optimization without metrics** — every solver must log execution time + quality
4. **Quantum always has fallback** — OR-Tools must solve any problem quantum can
5. **No merge without tests** — CI must pass before PR merge
6. **No deploy without health checks** — every service exposes `/health`
7. **Migrations are versioned** — Alembic for schema changes, never raw SQL in production

---

# 8. DECISION LOG

| Date | Decision | Rationale | Alternatives Considered |
| --- | --- | --- | --- |
| 2026-02-27 | React 19 + Next.js 15 | Server Components, Actions API, React Compiler | React 18 (stable but older) |
| 2026-02-27 | FastAPI over Django | Async-native, Pydantic integration, performance | Django REST, Express.js |
| 2026-02-27 | Qiskit 2.x | Latest SDK, improved performance | PennyLane, Cirq |
| 2026-02-27 | PostgreSQL + PostGIS | Spatial queries native, proven at scale | MongoDB + GeoJSON |
| 2026-02-27 | Monorepo (Turborepo) | Shared types/config, atomic changes | Polyrepo |
| 2026-02-27 | **REST-first API** | Simpler to build, debug, and test for MVP | GraphQL (deferred as aggregation layer) |
| 2026-02-27 | **Docker Compose for MVP** | Minimal ops overhead for small team | Kubernetes (deferred to scaling milestone) |
| 2026-02-27 | **Quantum post-MVP** | Classical routing must be proven first | Quantum in MVP (premature complexity) |
| 2026-02-27 | **Experience Engine as extraction** | Validate single product before abstracting | Build abstraction first (over-design risk) |

---

# 9. RISKS & MITIGATION

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Quantum adds no measurable value over classical | High | High | A/B comparison infrastructure; ≥5% improvement threshold; defer if no improvement |
| Experience Engine over-designed for unused patterns | Medium | High | Extract from working logistics (not speculative design); validate with 2nd mode before generalizing further |
| Live tracking data explosion (43M rows/day) | High | Critical | Hourly partitioning; 7-day raw retention; automated archival pipeline; monitor table size |
| Map rendering performance degrades | Medium | Medium | deck.gl for large datasets; clustering; viewport-based loading |
| Multi-tenant data leak | Low | Critical | Row-level security; integration tests for isolation; security audit |
| Scope creep on industry modes | High | High | Strict MVP definition; post-MVP features tracked separately |
| Solo dev timeline underestimated | High | Medium | Acknowledge 20-24 week solo timeline; cut scope, not quality |

---

# 10. FINAL PRODUCT CHECKLIST

Before launch:

- [ ] Logistics mode fully operational end-to-end
- [ ] Route optimization completes in < 2 seconds (classical OR-Tools)
- [ ] Live tracking stable with < 10s position update latency
- [ ] Data retention policy active for live_vehicle_positions
- [ ] Mobile PWA installable and usable
- [ ] Mode morphing works (logistics via Experience Engine ↔ emergency skeleton)
- [ ] CI/CD pipeline green
- [ ] Monitoring dashboards active
- [ ] Security checklist complete
- [ ] Load test passed
- [ ] Deployed via Docker Compose (K8s not required for launch)

> **Quantum is NOT on this checklist.** It ships in v1.1 after production data validates routing works.

---

# ✅ RESULT

Following this PRD produces:

👉 A **production-grade hybrid quantum-classical mobility platform** — built with a realistic MVP-first approach, measurable success criteria, and production safety nets.

Not a demo. Not a notebook. A deployable product.
