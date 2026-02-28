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
       DRIVERS DATA
       ───────────────────────────────────────── */
    const drivers = {
        /* Array of:
           { id, name, status, vehicleId, rating, phone }
           status: 'Driving', 'On Break', 'Off Duty'
         */
        list: [],
    };

    /* ─────────────────────────────────────────
       TRACKING DATA
       ───────────────────────────────────────── */
    const tracking = {
        activeVehicleId: null,
        history: [], /* Array of { timestamp, lat, lng } */
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

    async function fetchDrivers() {
        /* TODO: Replace with → fetch('/api/v1/drivers') */
        return drivers;
    }

    async function fetchTracking(vehicleId) {
        /* TODO: Replace with → fetch('/api/v1/tracking/' + vehicleId) */
        if (vehicleId) tracking.activeVehicleId = vehicleId;
        return tracking;
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

    /* ─────────────────────────────────────────
       PERSISTENCE LOGIC
       Allows testing across page reloads before
       backend is fully integrated.
       ───────────────────────────────────────── */
    const STORAGE_KEY = 'omniroute_store';

    function save() {
        try {
            const data = { dashboard, fleet, drivers, tracking, analytics, optimizer };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) { }
    }

    function load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                Object.assign(dashboard, data.dashboard || {});
                Object.assign(fleet, data.fleet || {});
                Object.assign(drivers, data.drivers || {});
                Object.assign(tracking, data.tracking || {});
                Object.assign(analytics, data.analytics || {});
                Object.assign(optimizer, data.optimizer || {});
            }
        } catch (e) { }
    }

    /* Initialize store */
    load();

    function addStop(name, address, lat = null, lng = null) {
        optimizer.stops.push({ name, address, lat, lng });
        dashboard.stats.activeRoutes.value = optimizer.stops.length;
        save();
    }

    function addStopWithCoords(lat, lng) {
        const num = optimizer.stops.length + 1;
        const isFirst = optimizer.stops.length === 0;
        const name = isFirst ? 'Main Depot' : `Stop ${num}`;
        const address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        const type = isFirst ? 'depot' : 'stop';

        optimizer.stops.push({ name, address, lat, lng, type });
        dashboard.stats.activeRoutes.value = optimizer.stops.length;
        save();
    }

    function removeStop(index) {
        optimizer.stops.splice(index, 1);
        dashboard.stats.activeRoutes.value = optimizer.stops.length;
        save();
    }

    async function addVehicle(vehicle) {
        /* Optimistic update — add to local state immediately */
        fleet.vehicles.push(vehicle);
        dashboard.stats.fleetOnline.value = fleet.vehicles.filter(v => v.status === 'active' || v.status === 'idle').length;
        dashboard.stats.fleetOnline.total = fleet.vehicles.length;
        save();

        /* Sync to backend in the background (non-blocking) */
        if (typeof Api !== 'undefined') {
            Api.vehicles.create({
                vehicle_type: vehicle.type,
                plate_number: vehicle.plate,
                capacity_kg: vehicle.capacity_kg || 1000,
                status: 'available',
            }).then(result => {
                if (result.ok && result.data?.id) {
                    /* Update local record with the server-assigned ID */
                    const idx = fleet.vehicles.findIndex(v => v.plate === vehicle.plate);
                    if (idx !== -1) fleet.vehicles[idx]._id = result.data.id;
                    save();
                }
            }).catch(() => { /* offline — already saved locally */ });
        }
    }

    function updateConstraints(partial) {
        Object.assign(optimizer.constraints, partial);
        save();
    }

    function addDriver(driver) {
        drivers.list.push(driver);
        save();
    }


    /* ── API-backed Fetchers ──
       Try backend first. If offline, return local state. */

    async function fetchDashboard() {
        if (typeof Api !== 'undefined') {
            const result = await Api.health.check();
            if (result.ok) {
                /* Backend is alive — in future: fetch real stats */
                /* For now: return local state (real stats endpoint TBD in Phase 5) */
            }
        }
        return dashboard;
    }

    async function fetchFleet() {
        if (typeof Api !== 'undefined') {
            const result = await Api.vehicles.list();
            if (result.ok && Array.isArray(result.data)) {
                /* Map API response to local vehicle shape */
                const apiVehicles = result.data.map(v => ({
                    _id: v.id,
                    id: v.plate_number || v.id.slice(0, 8).toUpperCase(),
                    type: v.vehicle_type,
                    plate: v.plate_number,
                    driver: v.driver_name || 'Unassigned',
                    status: v.status === 'available' ? 'idle' : v.status,
                    fuel: v.fuel_percent || 100,
                    mileage: v.mileage_km || 0,
                    route: v.current_route || '—',
                    lastSeen: v.last_location_at ? new Date(v.last_location_at).toLocaleTimeString() : 'Unknown',
                }));

                if (apiVehicles.length > 0) {
                    fleet.vehicles = apiVehicles;
                    dashboard.stats.fleetOnline.value = apiVehicles.filter(v => v.status !== 'offline').length;
                    dashboard.stats.fleetOnline.total = apiVehicles.length;
                    save();
                }
            }
        }
        return fleet;
    }

    async function fetchDrivers() {
        if (typeof Api !== 'undefined') {
            const result = await Api.drivers.list();
            if (result.ok && Array.isArray(result.data)) {
                const apiDrivers = result.data.map(d => ({
                    _id: d.id,
                    id: d.user_id,
                    name: d.full_name,
                    status: d.is_available ? 'available' : 'driving',
                    rating: d.rating || 5.0,
                    phone: d.phone || '—',
                    trips: d.trips_completed || 0,
                    license: d.license_number || '—',
                }));

                if (apiDrivers.length > 0) {
                    drivers.list = apiDrivers;
                    save();
                }
            }
        }
        return drivers;
    }

    async function fetchTracking(vehicleId) {
        if (vehicleId) tracking.activeVehicleId = vehicleId;
        return tracking;
    }

    async function fetchAnalytics() {
        return analytics;
    }

    async function fetchOptimizer() {
        return optimizer;
    }



    /* ─────────────────────────────────────────
       PUBLIC API
       ───────────────────────────────────────── */
    return {
        /* Data access */
        dashboard,
        fleet,
        drivers,
        tracking,
        analytics,
        optimizer,

        /* Async fetchers — try API, fall back to local state */
        fetchDashboard,
        fetchFleet,
        fetchDrivers,
        fetchTracking,
        fetchAnalytics,
        fetchOptimizer,

        /* Mutations */
        addStop,
        addStopWithCoords,
        removeStop,
        addVehicle,
        addDriver,
        updateConstraints,
        save,
        clear: () => { localStorage.removeItem(STORAGE_KEY); location.reload(); }
    };

})();
