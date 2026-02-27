/* ============================================
   OmniRoute AI — Settings Controller
   Profile, preferences, API config.
   Persists to localStorage.
   ============================================ */

const Settings = (() => {
    const STORAGE_KEY = 'omniroute_settings';

    /* Default settings — no fake data */
    const defaults = {
        profile: {
            name: '',
            email: '',
            role: 'Admin',
        },
        appearance: {
            theme: 'dark',
        },
        notifications: {
            deliveryAlerts: true,
            routeUpdates: true,
            maintenanceReminders: true,
            emailReports: false,
        },
        api: {
            baseUrl: '',
            apiKey: '',
        },
    };

    let current = {};

    /* ── Init ── */
    function init() {
        load();
        renderProfile();
        renderAppearance();
        renderNotifications();
        renderApiConfig();
        bindSaveButtons();
        bindNavigation();
    }

    /* ── Load from localStorage ── */
    function load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            current = stored ? JSON.parse(stored) : {};
        } catch (e) {
            current = {};
        }
        /* Merge with defaults for any missing keys */
        current = deepMerge(defaults, current);
    }

    /* ── Save to localStorage ── */
    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        } catch (e) {
            /* localStorage might be full or disabled */
        }
    }

    /* ── Deep merge helper ── */
    function deepMerge(target, source) {
        const output = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = deepMerge(target[key] || {}, source[key]);
            } else {
                output[key] = source[key];
            }
        }
        return output;
    }

    /* ── Profile Section ── */
    function renderProfile() {
        const el = document.getElementById('section-profile');
        if (!el) return;

        const p = current.profile;
        const initials = p.name
            ? p.name.split(' ').map(n => n[0]).join('').toUpperCase()
            : '?';

        el.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${sanitize(initials)}</div>
        <div class="profile-header__info">
          <span class="profile-header__name">${sanitize(p.name || 'Not configured')}</span>
          <span class="profile-header__role">${sanitize(p.role)}</span>
        </div>
      </div>
      <div class="settings-field">
        <label class="settings-field__label" for="settings-name">Full Name</label>
        <input class="settings-input" id="settings-name" type="text" value="${sanitize(p.name)}" placeholder="Enter your name" autocomplete="name">
      </div>
      <div class="settings-field">
        <label class="settings-field__label" for="settings-email">Email Address</label>
        <input class="settings-input" id="settings-email" type="email" value="${sanitize(p.email)}" placeholder="admin@company.com" autocomplete="email">
      </div>
      <div class="settings-field">
        <label class="settings-field__label" for="settings-role">Role</label>
        <input class="settings-input" id="settings-role" type="text" value="${sanitize(p.role)}" readonly>
        <span class="settings-field__hint">Role is managed by your organization admin</span>
      </div>
      <div class="settings-save-bar">
        <button class="btn btn--primary" data-save="profile">Save Profile</button>
      </div>
    `;
    }

    /* ── Appearance Section ── */
    function renderAppearance() {
        const el = document.getElementById('section-appearance');
        if (!el) return;

        el.innerHTML = `
      <div class="settings-row">
        <div class="settings-row__left">
          <span class="settings-row__label">Theme</span>
          <span class="settings-row__desc">Dark mode is optimized for fleet monitoring</span>
        </div>
        <select class="settings-input" id="settings-theme" style="width:140px;">
          <option value="dark" ${current.appearance.theme === 'dark' ? 'selected' : ''}>Dark</option>
          <option value="light" ${current.appearance.theme === 'light' ? 'selected' : ''}>Light</option>
          <option value="system" ${current.appearance.theme === 'system' ? 'selected' : ''}>System</option>
        </select>
      </div>
    `;

        document.getElementById('settings-theme')?.addEventListener('change', (e) => {
            current.appearance.theme = e.target.value;
            save();
        });
    }

    /* ── Notifications Section ── */
    function renderNotifications() {
        const el = document.getElementById('section-notifications');
        if (!el) return;

        const notifs = [
            { key: 'deliveryAlerts', label: 'Delivery Alerts', desc: 'Get notified when deliveries are completed or delayed' },
            { key: 'routeUpdates', label: 'Route Updates', desc: 'Notifications when routes are optimized or modified' },
            { key: 'maintenanceReminders', label: 'Maintenance Reminders', desc: 'Vehicle service and inspection reminders' },
            { key: 'emailReports', label: 'Email Reports', desc: 'Weekly summary reports sent to your email' },
        ];

        el.innerHTML = notifs.map(n => `
      <div class="settings-row">
        <div class="settings-row__left">
          <span class="settings-row__label">${n.label}</span>
          <span class="settings-row__desc">${n.desc}</span>
        </div>
        <label class="toggle" aria-label="${n.label}">
          <input type="checkbox" data-notif-key="${n.key}" ${current.notifications[n.key] ? 'checked' : ''}>
          <span class="toggle__slider"></span>
        </label>
      </div>
    `).join('');

        el.querySelectorAll('[data-notif-key]').forEach(cb => {
            cb.addEventListener('change', () => {
                current.notifications[cb.dataset.notifKey] = cb.checked;
                save();
            });
        });
    }

    /* ── API Configuration Section ── */
    function renderApiConfig() {
        const el = document.getElementById('section-api');
        if (!el) return;

        const api = current.api;
        const isConnected = api.baseUrl && api.apiKey;

        el.innerHTML = `
      <div style="margin-bottom:var(--space-4);">
        <span class="connection-status connection-status--${isConnected ? 'connected' : 'disconnected'}">
          <span class="connection-status__dot"></span>
          ${isConnected ? 'Connected' : 'Not Connected'}
        </span>
      </div>
      <div class="settings-field">
        <label class="settings-field__label" for="settings-api-url">API Base URL</label>
        <input class="settings-input settings-input--mono" id="settings-api-url" type="url" value="${sanitize(api.baseUrl)}" placeholder="https://api.omniroute.ai/v1">
        <span class="settings-field__hint">Your FastAPI backend URL</span>
      </div>
      <div class="settings-field">
        <label class="settings-field__label" for="settings-api-key">API Key</label>
        <input class="settings-input settings-input--mono" id="settings-api-key" type="password" value="${sanitize(api.apiKey)}" placeholder="Enter your API key">
        <span class="settings-field__hint">Used for authentication with the backend</span>
      </div>
      <div class="settings-save-bar">
        <button class="btn btn--ghost" id="test-connection">Test Connection</button>
        <button class="btn btn--primary" data-save="api">Save API Config</button>
      </div>
    `;

        document.getElementById('test-connection')?.addEventListener('click', async () => {
            const btn = document.getElementById('test-connection');
            const url = document.getElementById('settings-api-url')?.value.trim();

            if (!url) {
                btn.textContent = '⚠ Enter URL first';
                setTimeout(() => { btn.textContent = 'Test Connection'; }, 2000);
                return;
            }

            btn.textContent = 'Testing...';
            btn.disabled = true;

            try {
                const res = await fetch(url + '/health', {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000),
                });

                if (res.ok) {
                    btn.textContent = '✓ Connected';
                    btn.style.color = 'var(--color-success)';
                } else {
                    btn.textContent = '✗ Failed (' + res.status + ')';
                    btn.style.color = 'var(--color-error)';
                }
            } catch (e) {
                btn.textContent = '✗ Unreachable';
                btn.style.color = 'var(--color-error)';
            }

            btn.disabled = false;
            setTimeout(() => {
                btn.textContent = 'Test Connection';
                btn.style.color = '';
            }, 3000);
        });
    }

    /* ── Save Buttons ── */
    function bindSaveButtons() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-save]');
            if (!btn) return;

            const section = btn.dataset.save;

            if (section === 'profile') {
                const name = document.getElementById('settings-name')?.value.trim() || '';
                const email = document.getElementById('settings-email')?.value.trim() || '';

                /* Basic email validation */
                if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    btn.textContent = '⚠ Invalid email';
                    setTimeout(() => { btn.textContent = 'Save Profile'; }, 2000);
                    return;
                }

                current.profile.name = name;
                current.profile.email = email;
                save();

                /* Update header avatar if exists */
                const avatar = document.querySelector('.avatar');
                if (avatar && name) {
                    avatar.textContent = name.split(' ').map(n => n[0]).join('').toUpperCase();
                    avatar.title = name + ' · ' + current.profile.role;
                }

                renderProfile();
                btn.textContent = '✓ Saved';
                setTimeout(() => { btn.textContent = 'Save Profile'; }, 2000);
            }

            if (section === 'api') {
                const url = document.getElementById('settings-api-url')?.value.trim() || '';
                const key = document.getElementById('settings-api-key')?.value.trim() || '';

                current.api.baseUrl = url;
                current.api.apiKey = key;
                save();

                renderApiConfig();
                const newBtn = document.querySelector('[data-save="api"]');
                if (newBtn) {
                    newBtn.textContent = '✓ Saved';
                    setTimeout(() => { newBtn.textContent = 'Save API Config'; }, 2000);
                }
            }
        });
    }

    /* ── Section Navigation ── */
    function bindNavigation() {
        document.querySelectorAll('.settings-nav__item').forEach(item => {
            item.addEventListener('click', () => {
                const target = item.dataset.section;
                if (!target) return;

                document.querySelectorAll('.settings-nav__item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                document.querySelectorAll('.settings-section').forEach(s => {
                    s.style.display = s.id === 'section-' + target ? '' : 'none';
                });
            });
        });
    }

    /* ── Sanitize ── */
    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    return { init };
})();
