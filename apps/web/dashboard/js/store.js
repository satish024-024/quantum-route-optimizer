/* ============================================
   OmniRoute AI — Central Data Store
   
   SINGLE SOURCE OF TRUTH for all page data.
   
   All pages read from this store. When you
   connect a real backend (FastAPI), replace
   the fetch methods below with actual API calls.
   
   ╔═══════════════════════════════════════════╗
   ║  HOW TO ADD REAL DATA:                    ║
   ║  1. Replace Store.fetch*() methods with   ║
   ║     actual fetch() calls to your API      ║
   ║  2. Data flows:                           ║
   ║     API → Store → Page renders            ║
   ║  3. No other file contains raw data       ║
   ╚═══════════════════════════════════════════╝
   ============================================ */

const Store = (() => {

    /* ─────────────────────────────────────────
       DASHBOARD DATA
       Used by: stats.js, map.js
       ───────────────────────────────────────── */
    const dashboard = {
        stats: {
            deliveries: { value: 0, change: 0 },
            activeRoutes: { value: 0, change: 0 },
            fleetOnline: { value: 0, total: 0 },
            avgDeliveryMin: { value: 0, change: 0 },
        },
        recentActivity: [],
        /* Array of { id, lat, lng, status } */
        vehiclePositions: [],
        /* Array of { id, points: [{x,y}], color } */
        activeRouteLines: [],
    };


    /* ─────────────────────────────────────────
       FLEET DATA
       Used by: fleet.js
       ───────────────────────────────────────── */
    const fleet = {
        /* Array of:
           { id, type, plate, driver, status,
             fuel, mileage, route, lastSeen }
           status: 'active'|'idle'|'maintenance'|'offline'
        */
        vehicles: [],
    };


    /* ─────────────────────────────────────────
       ANALYTICS DATA
       Used by: analytics.js
       ───────────────────────────────────────── */
    const analytics = {
        kpis: {
            totalDeliveries: { value: 0, change: '', direction: 'up' },
            onTimeRate: { value: 0, change: '', direction: 'up' },
            fuelCost: { value: '₹0', change: '', direction: 'up' },
            distanceKm: { value: 0, change: '', direction: 'up' },
        },
        /* 7 data points for weekly sparklines/charts */
        weeklyLabels: [],
        weeklyDeliveries: [],
        weeklyOnTimeRate: [],
        weeklyFuelCost: [],
        weeklyDistanceKm: [],
        /* Delivery breakdown { label, value, color } */
        deliveryBreakdown: [],
        /* Route performance { name, deliveries, onTime, distance, avgTime } */
        routePerformance: [],
        /* Fleet utilization metrics { label, value, max, color } */
        fleetUtilization: [],
    };


    /* ─────────────────────────────────────────
       OPTIMIZER DATA
       Used by: optimizer.js
       ───────────────────────────────────────── */
    const optimizer = {
        /* Array of { name, address } */
        stops: [],
        constraints: {
            maxTime: 480,
            maxDistance: 200,
            vehicleCapacity: 1000,
            useQuantum: false,
        },
        /* Populated after optimization runs */
        results: null,
    };


    /* ─────────────────────────────────────────
       DATA FETCH METHODS
  
       Replace these with real API calls, e.g.:
       
       async fetchDashboard() {
         const res = await fetch('/api/v1/dashboard');
         const data = await res.json();
         Object.assign(dashboard.stats, data.stats);
         dashboard.recentActivity = data.activity;
         return dashboard;
       }
       ───────────────────────────────────────── */

    async function fetchDashboard() {
        /* TODO: Replace with → fetch('/api/v1/dashboard') */
        return dashboard;
    }

    async function fetchFleet() {
        /* TODO: Replace with → fetch('/api/v1/fleet/vehicles') */
        return fleet;
    }

    async function fetchAnalytics(/* range = '7d' */) {
        /* TODO: Replace with → fetch(`/api/v1/analytics?range=${range}`) */
        return analytics;
    }

    async function fetchOptimizer() {
        /* TODO: Replace with → fetch('/api/v1/optimizer/state') */
        return optimizer;
    }


    /* ─────────────────────────────────────────
       MUTATION METHODS
       
       Use these to update the store from UI
       actions (adding stops, changing filters).
       In production, these would also POST to
       the API.
       ───────────────────────────────────────── */

    function addStop(name, address) {
        optimizer.stops.push({ name, address });
        /* TODO: POST /api/v1/optimizer/stops */
    }

    function removeStop(index) {
        optimizer.stops.splice(index, 1);
        /* TODO: DELETE /api/v1/optimizer/stops/:id */
    }

    function addVehicle(vehicle) {
        fleet.vehicles.push(vehicle);
        /* TODO: POST /api/v1/fleet/vehicles */
    }

    function updateConstraints(partial) {
        Object.assign(optimizer.constraints, partial);
    }


    /* ─────────────────────────────────────────
       PUBLIC API
       ───────────────────────────────────────── */
    return {
        /* Data access (read-only references) */
        dashboard,
        fleet,
        analytics,
        optimizer,

        /* Async fetchers */
        fetchDashboard,
        fetchFleet,
        fetchAnalytics,
        fetchOptimizer,

        /* Mutations */
        addStop,
        removeStop,
        addVehicle,
        updateConstraints,
    };

})();
