/* ============================================
   OmniRoute AI — Live Tracking Logic
   Depends on: store.js, map.js
   ============================================ */

const Tracking = (() => {

    /* ── DOM Elements ── */
    let els = {};

    /* ── State ── */
    let vehiclesData = [];

    function init() {
        els = {
            list: document.getElementById('tracking-list'),
            overlay: document.getElementById('tracking-overlay'),
            mapCanvas: document.getElementById('tracking-map-canvas'),
            overlayName: document.getElementById('overlay-name'),
            overlayPlate: document.getElementById('overlay-plate'),
            overlaySpeed: document.getElementById('overlay-speed'),
            overlayStatus: document.getElementById('overlay-status')
        };

        /* Attempt to boot map Engine if it exists */
        if (typeof MapRenderer !== 'undefined' && els.mapCanvas) {
            MapRenderer.init(els.mapCanvas.id);
        }

        /* Fetch real fleet data */
        Store.fetchFleet().then(fleet => {
            vehiclesData = fleet.vehicles || [];
            renderList();
        });
    }

    /* ── Render Logic ── */
    function renderList() {
        if (!els.list) return;

        if (vehiclesData.length === 0) {
            els.list.innerHTML = `
                <div class="tracking-empty-list">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 8px auto; display: block; opacity: 0.5;">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <p>No active vehicles in system.</p>
                </div>
            `;
            return;
        }

        els.list.innerHTML = vehiclesData.map(v => {
            const isActive = v.status === 'active';
            const statusClass = isActive ? 'status--active' : '';

            return `
                <div class="tracking-item" data-id="${v.id}" onclick="Tracking.selectVehicle('${v.id}')">
                    <div class="tracking-item__info">
                        <span class="tracking-item__name">${v.id}</span>
                        <span class="tracking-item__plate">${v.plate}</span>
                    </div>
                    <div class="tracking-item__status ${statusClass}"></div>
                </div>
            `;
        }).join('');
    }

    /* ── Interaction Logic ── */
    function selectVehicle(id) {
        // Remove active class from all
        document.querySelectorAll('.tracking-item').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.id === id) el.classList.add('active');
        });

        const v = vehiclesData.find(v => v.id === id);
        if (!v) return;

        // Show overlay
        if (els.overlay) {
            els.overlayName.textContent = v.id;
            els.overlayPlate.textContent = v.plate;
            els.overlaySpeed.textContent = v.status === 'active' ? '45 km/h' : '0 km/h';
            els.overlayStatus.textContent = v.status.toUpperCase();

            // Set dynamic color based on status
            els.overlayStatus.style.color = v.status === 'active' ? 'var(--color-success)' : 'var(--text-muted)';

            els.overlay.classList.add('active');
        }

        // Draw pin on MapEngine assuming 0-0 center for now
        if (typeof MapEngine !== 'undefined') {
            MapEngine.clearCanvas();
            MapEngine.drawPoint(0, 0, '#ffffff'); // Center abstract point
        }

        /* Update internal store state */
        Store.fetchTracking(id).then(t => {
            console.log("Tracking updated for: ", t.activeVehicleId);
        });
    }

    return { init, selectVehicle };

})();
