/* ============================================================
   OmniRoute AI — API Client
   
   Single module for ALL backend communication.
   
   Usage:
     const result = await Api.vehicles.list();
     const result = await Api.auth.login(email, password);
   
   - Reads base URL from localStorage (set via Settings page)
   - Automatically attaches JWT Bearer token
   - Returns { ok, data, error } — never throws
   - Falls back gracefully when backend is offline
   ============================================================ */

const Api = (() => {

    /* ── Config ── */
    /* Reads from the same key that settings.js writes to */
    const SETTINGS_KEY = 'omniroute_settings';
    const AUTH_KEY = 'omniroute_auth';

    function getBaseUrl() {
        try {
            const cfg = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
            return (cfg.api?.baseUrl || 'http://localhost:8000').replace(/\/$/, '');
        } catch {
            return 'http://localhost:8000';
        }
    }

    function getToken() {
        try {
            const auth = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
            return auth.access_token || null;
        } catch {
            return null;
        }
    }

    function saveAuth(data) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    }

    function clearAuth() {
        localStorage.removeItem(AUTH_KEY);
    }

    function isAuthenticated() {
        return !!getToken();
    }

    /* ── Core Fetch ── */
    async function request(method, path, body = null, requiresAuth = true) {
        const url = `${getBaseUrl()}${path}`;
        const headers = { 'Content-Type': 'application/json' };

        if (requiresAuth) {
            const token = getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }

        const options = { method, headers };
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        try {
            const res = await fetch(url, options);

            /* Handle 401 — token expired or invalid */
            if (res.status === 401) {
                clearAuth();
                /* Only redirect if we're not already on the login page */
                if (!window.location.pathname.endsWith('login.html')) {
                    window.location.href = 'login.html';
                }
                return { ok: false, data: null, error: 'Session expired. Please sign in again.' };
            }

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                const msg = json?.detail || json?.error?.message || `Request failed (${res.status})`;
                return { ok: false, data: null, error: msg };
            }

            /* Support both {data: ...} and raw response shapes */
            const data = json?.data !== undefined ? json.data : json;
            return { ok: true, data, error: null };

        } catch (err) {
            /* Network error — backend is offline */
            const isOffline = err instanceof TypeError && err.message.includes('fetch');
            return {
                ok: false,
                data: null,
                error: isOffline ? 'Backend offline — running in local mode.' : err.message,
                offline: true,
            };
        }
    }

    const get = (path, auth = true) => request('GET', path, null, auth);
    const post = (path, body, auth = true) => request('POST', path, body, auth);
    const put = (path, body, auth = true) => request('PUT', path, body, auth);
    const del = (path, auth = true) => request('DELETE', path, null, auth);


    /* ════════════════════════════════════════
       AUTH ENDPOINTS
       ════════════════════════════════════════ */
    const auth = {
        async login(email, password) {
            const result = await post('/api/v1/auth/login', { email, password }, false);
            if (result.ok && result.data?.access_token) {
                saveAuth(result.data);
            }
            return result;
        },

        async register(full_name, email, password) {
            const result = await post('/api/v1/auth/register', { full_name, email, password }, false);
            if (result.ok && result.data?.access_token) {
                saveAuth(result.data);
            }
            return result;
        },

        logout() {
            clearAuth();
            window.location.href = 'login.html';
        },

        isAuthenticated,
        getToken,
    };


    /* ════════════════════════════════════════
       VEHICLE ENDPOINTS
       ════════════════════════════════════════ */
    const vehicles = {
        list() { return get('/api/v1/vehicles'); },
        get(id) { return get(`/api/v1/vehicles/${id}`); },
        create(body) { return post('/api/v1/vehicles', body); },
        update(id, body) { return put(`/api/v1/vehicles/${id}`, body); },
        remove(id) { return del(`/api/v1/vehicles/${id}`); },
    };


    /* ════════════════════════════════════════
       DRIVER ENDPOINTS
       ════════════════════════════════════════ */
    const drivers = {
        list(availableOnly = false) {
            const qs = availableOnly ? '?available_only=true' : '';
            return get(`/api/v1/drivers${qs}`);
        },
        get(id) { return get(`/api/v1/drivers/${id}`); },
        create(body) { return post('/api/v1/drivers', body); },
        update(id, body) { return request('PATCH', `/api/v1/drivers/${id}`, body); },
        remove(id) { return del(`/api/v1/drivers/${id}`); },
    };


    /* ════════════════════════════════════════
       ROUTES ENDPOINTS
       ════════════════════════════════════════ */
    const routes = {
        list() { return get('/api/v1/routes'); },
        get(id) { return get(`/api/v1/routes/${id}`); },
        create(body) { return post('/api/v1/routes', body); },
        optimize(id) { return post(`/api/v1/routes/${id}/optimize`, {}); },
        remove(id) { return del(`/api/v1/routes/${id}`); },
    };


    /* ════════════════════════════════════════
       OPTIMIZE ENDPOINT
       ════════════════════════════════════════ */
    const optimize = {
        run(stops, constraints) {
            return post('/api/v1/optimize', { stops, constraints });
        },
    };


    /* ════════════════════════════════════════
       HEALTH ENDPOINT
       ════════════════════════════════════════ */
    const health = {
        async check() {
            return get('/health', false);
        },
        async ready() {
            return get('/health/ready', false);
        },
    };


    /* ── Public API ── */
    return {
        auth,
        vehicles,
        drivers,
        routes,
        optimize,
        health,
        /* expose for advanced use */
        request,
        getBaseUrl,
        isAuthenticated,
        saveAuth,
        clearAuth,
    };

})();
