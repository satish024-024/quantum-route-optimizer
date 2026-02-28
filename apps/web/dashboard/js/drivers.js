/* ============================================
   OmniRoute AI — Drivers Logic
   Reads entirely from Store.drivers
   ============================================ */

const Drivers = (() => {

    /* ── DOM Elements ── */
    let els = {};

    /* ── State ── */
    let currentFilter = 'all';

    function init() {
        els = {
            grid: document.getElementById('drivers-grid'),
            filters: document.querySelectorAll('[data-filter]'),
            btnAssign: document.getElementById('btn-assign-driver')
        };

        if (els.filters) {
            els.filters.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    els.filters.forEach(b => b.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    currentFilter = e.currentTarget.dataset.filter;
                    render();
                });
            });
        }

        if (els.btnAssign) {
            els.btnAssign.addEventListener('click', () => {
                const names = ['Arjun Mehra', 'Sanjay Dutt', 'Meera Iyer', 'Karan Johar', 'Sunita Rao'];
                const name = names[Math.floor(Math.random() * names.length)];
                const id = 'DRV-' + Math.floor(100 + Math.random() * 899);

                Store.addDriver({
                    id: id,
                    name: name,
                    status: 'Off Duty',
                    vehicleId: null,
                    rating: (4 + Math.random()).toFixed(1),
                    phone: '+91 98' + Math.floor(10000000 + Math.random() * 89999999)
                });

                render();
            });
        }

        /* Initial Load */
        Store.fetchDrivers().then(() => {
            render();
        });
    }

    /* ── Render Logic ── */
    function render() {
        if (!els.grid) return;

        const data = Store.drivers.list || [];
        updateFilterCounts(data);

        /* Apply filter */
        let filtered = data;
        if (currentFilter !== 'all') {
            filtered = data.filter(d => d.status.toLowerCase().replace(' ', '-') === currentFilter);
        }

        if (filtered.length === 0) {
            renderEmptyState();
        } else {
            renderGrid(filtered);
        }
    }

    function updateFilterCounts(data) {
        const counts = {
            all: data.length,
            driving: data.filter(d => d.status === 'Driving').length,
            'on-break': data.filter(d => d.status === 'On Break').length,
            'off-duty': data.filter(d => d.status === 'Off Duty').length
        };

        els.filters.forEach(btn => {
            const f = btn.dataset.filter;
            const countEl = btn.querySelector('.filter-btn__count');
            if (countEl) countEl.textContent = counts[f] || 0;
        });
    }

    function renderEmptyState() {
        els.grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                </div>
                <h3 class="empty-state__title">No drivers added yet</h3>
                <p class="empty-state__desc">Connect your backend API or assign a driver manually to start tracking their performance.</p>
                <button class="btn btn--primary" onclick="document.getElementById('btn-assign-driver').click()">Assign Driver</button>
            </div>
        `;
    }

    function renderGrid(data) {
        els.grid.innerHTML = data.map(driver => {
            const initials = driver.name.split(' ').map(n => n[0]).join('').toUpperCase();
            const statusClass = getStatusClass(driver.status);

            return `
                <div class="driver-card">
                    <div class="driver-card__header">
                        <div class="driver-profile">
                            <div class="driver-avatar">${initials}</div>
                            <div class="driver-info">
                                <span class="driver-name">${driver.name}</span>
                                <span class="driver-id">ID: ${driver.id}</span>
                            </div>
                        </div>
                        <span class="status-badge ${statusClass}">${driver.status}</span>
                    </div>

                    <div class="driver-stats">
                        <div class="stat-item">
                            <span class="stat-item__label">Vehicle Assigned</span>
                            <span class="stat-item__value" style="font-family: var(--font-mono); font-size: 11px;">
                                ${driver.vehicleId || 'Unassigned'}
                            </span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item__label">Rating</span>
                            <span class="stat-item__value">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                                ${driver.rating}
                            </span>
                        </div>
                    </div>

                    <div class="driver-actions">
                        <button class="btn btn--ghost" style="flex:1" onclick="alert('Message feature requires communication API')">Message</button>
                        <button class="btn btn--secondary" style="flex:1" onclick="alert('Viewing driver details...')">Details</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function getStatusClass(status) {
        switch (status) {
            case 'Driving': return 'status-badge--driving';
            case 'On Break': return 'status-badge--break';
            case 'Off Duty': return 'status-badge--off';
            default: return '';
        }
    }

    return { init };

})();
