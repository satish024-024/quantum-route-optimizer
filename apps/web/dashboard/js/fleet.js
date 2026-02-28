/* ============================================
   OmniRoute AI — Fleet Controller
   Reads from Store. Renders vehicle table,
   search, filters, sorting.
   ============================================ */

const Fleet = (() => {
  let currentFilter = 'all';
  let currentSort = { key: 'id', asc: true };
  let searchTerm = '';

  /* ── Init ── */
  function init() {
    renderSummary();
    bindToolbar();
    renderTable();
  }

  /* ── Summary Cards ── */
  function renderSummary() {
    const el = document.getElementById('fleet-summary');
    if (!el) return;

    const vehicles = Store.fleet.vehicles;
    const counts = {
      total: vehicles.length,
      active: vehicles.filter(v => v.status === 'active').length,
      idle: vehicles.filter(v => v.status === 'idle').length,
      maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    };

    el.innerHTML = `
      <div class="fleet-summary-card">
        <div class="fleet-summary-card__icon" style="background:var(--accent-muted);color:var(--accent);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
        </div>
        <div>
          <div class="fleet-summary-card__value">${counts.total}</div>
          <div class="fleet-summary-card__label">Total Vehicles</div>
        </div>
      </div>
      <div class="fleet-summary-card">
        <div class="fleet-summary-card__icon" style="background:var(--color-success-muted);color:var(--color-success);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div>
          <div class="fleet-summary-card__value">${counts.active}</div>
          <div class="fleet-summary-card__label">Active</div>
        </div>
      </div>
      <div class="fleet-summary-card">
        <div class="fleet-summary-card__icon" style="background:var(--color-warning-muted);color:var(--color-warning);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          <div class="fleet-summary-card__value">${counts.idle}</div>
          <div class="fleet-summary-card__label">Idle</div>
        </div>
      </div>
      <div class="fleet-summary-card">
        <div class="fleet-summary-card__icon" style="background:var(--color-error-muted);color:var(--color-error);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        </div>
        <div>
          <div class="fleet-summary-card__value">${counts.maintenance}</div>
          <div class="fleet-summary-card__label">Maintenance</div>
        </div>
      </div>
    `;

    /* Update filter pill counts */
    document.querySelectorAll('.fleet-filter').forEach(btn => {
      const f = btn.dataset.filter;
      const countEl = btn.querySelector('.fleet-filter__count');
      if (!countEl) return;
      if (f === 'all') countEl.textContent = counts.total;
      else if (f === 'active') countEl.textContent = counts.active;
      else if (f === 'idle') countEl.textContent = counts.idle;
      else if (f === 'maintenance') countEl.textContent = counts.maintenance;
      else if (f === 'offline') countEl.textContent = vehicles.filter(v => v.status === 'offline').length;
    });
  }

  /* ── Toolbar Bindings ── */
  function bindToolbar() {
    const searchInput = document.getElementById('fleet-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        searchTerm = searchInput.value.trim().toLowerCase();
        renderTable();
      });
    }

    document.querySelectorAll('.fleet-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        document.querySelectorAll('.fleet-filter').forEach(b => b.classList.toggle('active', b.dataset.filter === currentFilter));
        renderTable();
      });
    });

    const addBtn = document.getElementById('btn-add-vehicle');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const id = 'VH-' + Math.floor(1000 + Math.random() * 9000);
        const types = ['Heavy Truck', 'Medium Truck', 'Light Van'];
        const drivers = ['Ravi Kumar', 'Anita Singh', 'Suresh Raina', 'Priya Sharma'];
        const type = types[Math.floor(Math.random() * types.length)];

        Store.addVehicle({
          id: id,
          type: type,
          plate: 'DL ' + Math.floor(10 + Math.random() * 89) + ' AB ' + Math.floor(1000 + Math.random() * 8999),
          driver: drivers[Math.floor(Math.random() * drivers.length)],
          status: 'idle',
          fuel: 100,
          mileage: Math.floor(5000 + Math.random() * 20000),
          route: '—',
          lastSeen: 'Just now'
        });

        renderSummary();
        renderTable();
      });
    }
  }

  /* ── Table Rendering ── */
  function renderTable() {
    const tbody = document.getElementById('fleet-tbody');
    const info = document.getElementById('fleet-info');
    if (!tbody) return;

    const allVehicles = Store.fleet.vehicles;
    let data = [...allVehicles];

    /* Empty state */
    if (data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center;padding:48px;color:var(--text-muted);">
            No vehicles added yet. Click <strong>Add Vehicle</strong> to get started.
          </td>
        </tr>
      `;
      if (info) info.textContent = 'Showing 0 vehicles';
      return;
    }

    /* Filter */
    if (currentFilter !== 'all') {
      data = data.filter(v => v.status === currentFilter);
    }

    /* Search */
    if (searchTerm) {
      data = data.filter(v =>
        v.id.toLowerCase().includes(searchTerm) ||
        v.driver.toLowerCase().includes(searchTerm) ||
        v.type.toLowerCase().includes(searchTerm) ||
        v.plate.toLowerCase().includes(searchTerm) ||
        (v.route || '').toLowerCase().includes(searchTerm)
      );
    }

    /* Sort */
    data.sort((a, b) => {
      let va = a[currentSort.key];
      let vb = b[currentSort.key];
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return currentSort.asc ? -1 : 1;
      if (va > vb) return currentSort.asc ? 1 : -1;
      return 0;
    });

    /* Render rows */
    tbody.innerHTML = data.map(v => {
      const initials = v.driver.split(' ').map(n => n[0]).join('');
      const colors = { 'Heavy Truck': '#2563EB', 'Medium Truck': '#8B5CF6', 'Light Van': '#22C55E' };
      const bgColor = colors[v.type] || '#2563EB';
      const fuelColor = v.fuel > 60 ? 'var(--color-success)' : v.fuel > 30 ? 'var(--color-warning)' : 'var(--color-error)';

      return `
        <tr>
          <td>
            <div class="vehicle-cell">
              <div class="vehicle-cell__avatar" style="background:${bgColor};">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
              </div>
              <div>
                <div class="vehicle-cell__id">${sanitize(v.id)}</div>
                <div class="vehicle-cell__type">${sanitize(v.type)}</div>
              </div>
            </div>
          </td>
          <td>${sanitize(v.plate)}</td>
          <td>
            <div class="driver-cell">
              <div class="driver-cell__avatar">${sanitize(initials)}</div>
              ${sanitize(v.driver)}
            </div>
          </td>
          <td>
            <span class="status-badge status-badge--${v.status}">
              <span class="status-badge__dot"></span>
              ${v.status.charAt(0).toUpperCase() + v.status.slice(1)}
            </span>
          </td>
          <td>
            <div class="fuel-bar">
              <div class="fuel-bar__track">
                <div class="fuel-bar__fill" style="width:${v.fuel}%;background:${fuelColor};"></div>
              </div>
              <span class="fuel-bar__label">${v.fuel}%</span>
            </div>
          </td>
          <td class="font-mono text-xs">${(v.mileage || 0).toLocaleString()} km</td>
          <td>${sanitize(v.route || '—')}</td>
          <td class="text-xs text-muted">${sanitize(v.lastSeen || '—')}</td>
          <td>
            <div class="row-actions">
              <button class="row-action-btn" title="View Details" aria-label="View ${sanitize(v.id)} details">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="row-action-btn" title="Edit" aria-label="Edit ${sanitize(v.id)}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="row-action-btn" title="Track on Map" aria-label="Track ${sanitize(v.id)} on map">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (info) {
      info.textContent = `Showing ${data.length} of ${allVehicles.length} vehicles`;
    }
  }

  /* ── Sort ── */
  function sortBy(key) {
    if (currentSort.key === key) {
      currentSort.asc = !currentSort.asc;
    } else {
      currentSort.key = key;
      currentSort.asc = true;
    }

    document.querySelectorAll('.fleet-table th').forEach(th => {
      th.classList.toggle('sorted', th.dataset.sort === key);
      const icon = th.querySelector('.sort-icon');
      if (icon && th.dataset.sort === key) {
        icon.textContent = currentSort.asc ? '↑' : '↓';
      }
    });

    renderTable();
  }

  /* ── Sanitize ── */
  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init, sortBy };
})();
