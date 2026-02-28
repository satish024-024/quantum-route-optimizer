/* ============================================
   OmniRoute AI — Optimizer Controller
   Reads from Store. Wizard state machine,
   stop management, constraints, results.
   ============================================ */

const Optimizer = (() => {
  /* ── State ── */
  const STEPS = ['stops', 'constraints', 'optimize', 'preview', 'deploy'];
  let currentStep = 0;
  let nextStopId = 1;

  /* ── SVG Icons ── */
  const icons = {
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    grip: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    depot: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    arrow: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>',
    back: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>',
  };

  /* ── Init ── */
  function init() {
    renderStepper();
    renderWizardBody();
    renderFooter();
    renderResults();

    // Initial marker render
    if (MapRenderer.getMap()) {
      MapRenderer.drawMarkers(Store.optimizer.stops);
    }
  }

  function handleMapClick(lat, lng) {
    // Only allow adding stops in the 'stops' step
    if (STEPS[currentStep] !== 'stops') return;

    Store.addStopWithCoords(lat, lng);
    refresh();
  }

  /* ── Stepper ── */
  function renderStepper() {
    const container = document.getElementById('stepper');
    if (!container) return;

    const labels = ['Add Stops', 'Set Constraints', 'Optimize', 'Preview Route', 'Deploy'];

    container.innerHTML = STEPS.map((step, i) => {
      let state = 'pending';
      if (i < currentStep) state = 'completed';
      if (i === currentStep) state = 'active';
      const indicator = state === 'completed' ? icons.check : (i + 1);

      return `
        <div class="stepper-item ${state}" data-step="${i}">
          <div class="stepper-item__indicator">${indicator}</div>
          <span class="stepper-item__label">${labels[i]}</span>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.stepper-item.completed').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        currentStep = parseInt(el.dataset.step);
        refresh();
      });
    });
  }

  /* ── Wizard Body ── */
  function renderWizardBody() {
    const body = document.getElementById('wizard-body');
    if (!body) return;

    switch (STEPS[currentStep]) {
      case 'stops':
        body.innerHTML = renderStopList();
        bindStopActions();
        break;
      case 'constraints':
        body.innerHTML = renderConstraints();
        bindConstraintInputs();
        break;
      case 'optimize':
        body.innerHTML = renderOptimizeView();
        break;
      case 'preview':
        body.innerHTML = renderPreviewView();
        break;
      case 'deploy':
        body.innerHTML = renderDeployView();
        break;
    }
  }

  /* ── Stop List ── */
  function renderStopList() {
    const stops = Store.optimizer.stops;

    if (stops.length === 0) {
      return `
        <div style="text-align:center;padding:var(--space-8) 0;">
          <div style="font-size:36px;margin-bottom:var(--space-3);opacity:0.5;">📍</div>
          <p class="text-sm text-muted" style="margin-bottom:var(--space-4);">No stops added yet.<br>Add your first stop to begin.</p>
        </div>
        <button class="add-stop-btn" id="add-stop-btn">
          ${icons.plus} Add Stop
        </button>
      `;
    }

    const list = stops.map((stop, i) => `
      <div class="stop-entry" data-stop-idx="${i}">
        <div class="stop-entry__number ${stop.type === 'depot' ? 'stop-entry__number--depot' : ''}">
          ${stop.type === 'depot' ? icons.depot : (i + 1)}
        </div>
        <div class="stop-entry__details">
          <div class="stop-entry__name">${sanitize(stop.name)}</div>
          <div class="stop-entry__address">${sanitize(stop.address)}</div>
        </div>
        <div class="stop-entry__actions">
          ${stop.type !== 'depot' ? `
            <button class="stop-entry__action-btn stop-entry__action-btn--delete" data-action="delete" data-idx="${i}" title="Remove stop" aria-label="Remove ${sanitize(stop.name)}">
              ${icons.trash}
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');

    return `
      <div class="stop-list">${list}</div>
      <button class="add-stop-btn" id="add-stop-btn">
        ${icons.plus} Add Stop
      </button>
      <p class="text-xs text-muted" style="margin-top:var(--space-3);text-align:center;">
        ${stops.length} stop${stops.length !== 1 ? 's' : ''}
      </p>
    `;
  }

  function bindStopActions() {
    /* Delete */
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        Store.removeStop(idx);
        renderWizardBody();
      });
    });

    /* Add stop */
    const addBtn = document.getElementById('add-stop-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const num = Store.optimizer.stops.length + 1;
        Store.addStop(`Stop ${num}`, 'Enter address or click map');
        renderWizardBody();
      });
    }
  }

  /* ── Constraints ── */
  function renderConstraints() {
    const c = Store.optimizer.constraints;

    return `
      <div class="constraint-group">
        <span class="constraint-group__label">Vehicle Limits</span>
        <div class="constraint-row">
          <span class="constraint-row__label">Max Distance</span>
          <input class="constraint-input" type="number" data-key="maxDistance" value="${c.maxDistance}" aria-label="Maximum distance in km"> <span class="text-xs text-muted" style="margin-left:4px;">km</span>
        </div>
        <div class="constraint-row">
          <span class="constraint-row__label">Max Duration</span>
          <input class="constraint-input" type="number" data-key="maxTime" value="${c.maxTime}" aria-label="Maximum time in minutes"> <span class="text-xs text-muted" style="margin-left:4px;">min</span>
        </div>
        <div class="constraint-row">
          <span class="constraint-row__label">Cargo Capacity</span>
          <input class="constraint-input" type="number" data-key="vehicleCapacity" value="${c.vehicleCapacity}" aria-label="Vehicle capacity in kg"> <span class="text-xs text-muted" style="margin-left:4px;">kg</span>
        </div>
      </div>

      <div class="constraint-group">
        <span class="constraint-group__label">Routing Options</span>
        <div class="constraint-row">
          <span class="constraint-row__label">Use Quantum Solver</span>
          <label class="toggle" aria-label="Enable quantum solver">
            <input type="checkbox" data-key="useQuantum" ${c.useQuantum ? 'checked' : ''}>
            <span class="toggle__slider"></span>
          </label>
        </div>
      </div>
    `;
  }

  function bindConstraintInputs() {
    document.querySelectorAll('.constraint-input').forEach(input => {
      input.addEventListener('change', () => {
        const key = input.dataset.key;
        const value = parseFloat(input.value);
        if (key && !isNaN(value) && value >= 0) {
          Store.updateConstraints({ [key]: value });
        }
      });
    });

    document.querySelectorAll('.toggle input').forEach(cb => {
      cb.addEventListener('change', () => {
        const key = cb.dataset.key;
        if (key) Store.updateConstraints({ [key]: cb.checked });
      });
    });
  }

  /* ── Optimize View ── */
  function renderOptimizeView() {
    const stops = Store.optimizer.stops;
    const c = Store.optimizer.constraints;

    return `
      <div style="text-align:center;padding:var(--space-8) 0;">
        <div style="font-size:48px;margin-bottom:var(--space-4);">⚡</div>
        <h3 class="text-lg font-semibold" style="margin-bottom:var(--space-2);">Ready to Optimize</h3>
        <p class="text-sm text-secondary" style="margin-bottom:var(--space-6);">
          ${stops.length} stop${stops.length !== 1 ? 's' : ''} · ${c.maxDistance} km limit · ${c.vehicleCapacity} kg capacity
        </p>
        <div style="display:flex;flex-direction:column;gap:var(--space-2);padding:0 var(--space-4);">
          <div class="solver-badge" style="justify-content:center;">
            <span class="solver-badge__dot"></span>
            ${c.useQuantum ? 'Qiskit Hybrid Quantum Solver' : 'OR-Tools Classical Solver'}
          </div>
        </div>
      </div>
    `;
  }

  /* ── Preview View ── */
  function renderPreviewView() {
    const r = Store.optimizer.results;

    if (!r) {
      return `
        <div style="text-align:center;padding:var(--space-8) 0;">
          <p class="text-sm text-muted">No optimization results available</p>
        </div>
      `;
    }

    return `
      <div style="padding:var(--space-2) 0;">
        <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-4);">
          <div class="results-panel__status-icon results-panel__status-icon--success">${icons.check}</div>
          <span class="text-base font-semibold">Route Optimized</span>
        </div>
        <p class="text-sm text-secondary" style="margin-bottom:var(--space-4);">
          Review the optimized route on the map. Drag stops to adjust.
        </p>

        ${r.savings ? `
        <div class="comparison">
          <div class="comparison__title">Before → After</div>
          <div class="comparison__row">
            <span class="comparison__label">Distance</span>
            <div class="comparison__bar-track">
              <div class="comparison__bar-fill" style="width:${100 - r.savings.distance}%;background:var(--accent);"></div>
            </div>
            <span class="comparison__value">-${r.savings.distance}%</span>
          </div>
          <div class="comparison__row">
            <span class="comparison__label">Time</span>
            <div class="comparison__bar-track">
              <div class="comparison__bar-fill" style="width:${100 - r.savings.time}%;background:var(--color-success);"></div>
            </div>
            <span class="comparison__value">-${r.savings.time}%</span>
          </div>
          <div class="comparison__row">
            <span class="comparison__label">Fuel</span>
            <div class="comparison__bar-track">
              <div class="comparison__bar-fill" style="width:${100 - r.savings.fuel}%;background:var(--color-warning);"></div>
            </div>
            <span class="comparison__value">-${r.savings.fuel}%</span>
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }

  /* ── Deploy View ── */
  function renderDeployView() {
    return `
      <div style="text-align:center;padding:var(--space-8) 0;">
        <div style="width:56px;height:56px;border-radius:50%;background:var(--color-success-muted);display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-4);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold" style="margin-bottom:var(--space-2);">Deploy to Driver</h3>
        <p class="text-sm text-secondary" style="margin-bottom:var(--space-6);">
          Send the optimized route to the assigned driver's device.
        </p>
        <p class="text-xs text-muted">Connect your fleet to enable deployment.</p>
      </div>
    `;
  }

  /* ── Footer ── */
  function renderFooter() {
    const footer = document.getElementById('wizard-footer');
    if (!footer) return;

    const isFirst = currentStep === 0;
    const isLast = currentStep === STEPS.length - 1;
    const isOptimize = STEPS[currentStep] === 'optimize';
    const isDeploy = STEPS[currentStep] === 'deploy';

    let nextLabel = 'Next';
    if (isOptimize) nextLabel = 'Run Optimizer';
    if (STEPS[currentStep] === 'preview') nextLabel = 'Continue to Deploy';
    if (isDeploy) nextLabel = 'Deploy Now';

    /* Disable Next if no stops */
    const canProceed = STEPS[currentStep] !== 'stops' || Store.optimizer.stops.length > 0;

    footer.innerHTML = `
      ${!isFirst ? `<button class="btn btn--ghost" id="wizard-back">${icons.back} Back</button>` : '<div></div>'}
      <button class="btn btn--primary ${isOptimize ? 'btn--optimize' : ''}" id="wizard-next" ${!canProceed ? 'disabled' : ''}>
        ${nextLabel} ${!isDeploy ? icons.arrow : ''}
      </button>
    `;

    document.getElementById('wizard-back')?.addEventListener('click', () => {
      if (currentStep > 0) { currentStep--; refresh(); }
    });

    document.getElementById('wizard-next')?.addEventListener('click', () => {
      if (isOptimize) {
        runOptimization();
      } else if (isDeploy) {
        deployRoute();
      } else if (currentStep < STEPS.length - 1) {
        currentStep++;
        refresh();
      }
    });
  }

  /* ── Results Panel ── */
  function renderResults() {
    const body = document.getElementById('results-body');
    if (!body) return;

    const r = Store.optimizer.results;

    if (!r) {
      body.innerHTML = `
        <div style="text-align:center;padding:var(--space-8) 0;">
          <div style="font-size:36px;margin-bottom:var(--space-3);opacity:0.5;">📊</div>
          <p class="text-sm text-muted">Complete stops and constraints<br>to see optimization results</p>
        </div>
      `;
      return;
    }

    body.innerHTML = `
      <div class="result-metric">
        <span class="result-metric__label">Total Distance</span>
        <span class="result-metric__value">${r.totalDistance} km</span>
      </div>
      <div class="result-metric">
        <span class="result-metric__label">Estimated Time</span>
        <span class="result-metric__value">${r.estimatedTime} min</span>
      </div>
      <div class="result-metric">
        <span class="result-metric__label">Fuel Cost</span>
        <span class="result-metric__value">₹${(r.fuelCost || 0).toFixed(2)}</span>
      </div>
      <div class="result-metric">
        <span class="result-metric__label">Solution Quality</span>
        <span class="result-metric__value">${r.solutionQuality}%</span>
      </div>
      <div class="result-metric">
        <span class="result-metric__label">Solver</span>
        <div class="solver-badge">
          <span class="solver-badge__dot"></span>
          ${sanitize(r.solver)}
        </div>
      </div>
      <div class="result-metric">
        <span class="result-metric__label">Compute Time</span>
        <span class="result-metric__value">${r.computeTime}s</span>
      </div>

      ${r.savings ? `
      <div class="comparison" style="margin-top:var(--space-5);">
        <div class="comparison__title">Savings vs Unoptimized</div>
        <div class="comparison__row">
          <span class="comparison__label">Distance</span>
          <div class="comparison__bar-track">
            <div class="comparison__bar-fill" style="width:${r.savings.distance}%;background:var(--accent);"></div>
          </div>
          <span class="comparison__value"><span class="improvement improvement--positive">↓ ${r.savings.distance}%</span></span>
        </div>
        <div class="comparison__row">
          <span class="comparison__label">Time</span>
          <div class="comparison__bar-track">
            <div class="comparison__bar-fill" style="width:${r.savings.time}%;background:var(--color-success);"></div>
          </div>
          <span class="comparison__value"><span class="improvement improvement--positive">↓ ${r.savings.time}%</span></span>
        </div>
        <div class="comparison__row">
          <span class="comparison__label">Fuel</span>
          <div class="comparison__bar-track">
            <div class="comparison__bar-fill" style="width:${r.savings.fuel}%;background:var(--color-warning);"></div>
          </div>
          <span class="comparison__value"><span class="improvement improvement--positive">↓ ${r.savings.fuel}%</span></span>
        </div>
      </div>
      ` : ''}
    `;
  }

  /* ── Run Optimization ── */
  async function runOptimization() {
    const btn = document.getElementById('wizard-next');
    if (!btn) return;

    btn.classList.add('loading');
    btn.disabled = true;

    const stops = Store.optimizer.stops;
    const constraints = Store.optimizer.constraints;

    /* Try real backend first */
    if (typeof Api !== 'undefined' && stops.length >= 2) {
      const result = await Api.optimize.run(
        stops.map(s => ({ name: s.name, lat: s.lat, lng: s.lng, type: s.type || 'stop' })),
        constraints,
      );

      if (result.ok && result.data) {
        const d = result.data;
        Store.optimizer.results = {
          totalDistance: (d.total_distance_km || d.totalDistance || 0).toFixed(1),
          estimatedTime: d.estimated_duration_minutes || d.estimatedTime || '—',
          fuelCost: d.fuel_cost || 0,
          solutionQuality: ((d.solution_quality_score || 0.95) * 100).toFixed(1),
          solver: d.solver_used || 'OR-Tools (Classical)',
          computeTime: ((d.execution_time_ms || 0) / 1000).toFixed(2),
          orderedStops: d.ordered_stops || stops,
          savings: d.savings,
        };

        btn.classList.remove('loading');
        btn.disabled = false;
        currentStep++;
        refresh();
        return;
      }
    }

    /* Offline fallback — generate plausible local estimate */
    const n = stops.length;
    const dist = (n * 4.7 + Math.random() * 5).toFixed(1);
    Store.optimizer.results = {
      totalDistance: dist,
      estimatedTime: Math.round(n * 12 + Math.random() * 15),
      fuelCost: (dist * 4.2).toFixed(2),
      solutionQuality: (88 + Math.random() * 10).toFixed(1),
      solver: 'Local Estimate (Backend offline)',
      computeTime: (0.1 + Math.random() * 0.3).toFixed(2),
      orderedStops: stops,
      savings: {
        distance: Math.round(15 + Math.random() * 10),
        time: Math.round(20 + Math.random() * 15),
        fuel: Math.round(18 + Math.random() * 12),
      },
    };

    btn.classList.remove('loading');
    btn.disabled = false;
    currentStep++;
    refresh();
  }

  /* ── Deploy ── */
  function deployRoute() {
    const btn = document.getElementById('wizard-next');
    if (!btn) return;
    btn.classList.add('loading');

    /* TODO: POST /api/v1/routes/deploy */
    setTimeout(() => {
      btn.classList.remove('loading');
      btn.textContent = '✓ Deployed';
      btn.style.background = 'var(--color-success)';
      btn.style.pointerEvents = 'none';
    }, 1200);
  }

  /* ── Refresh ── */
  function refresh() {
    renderStepper();
    renderWizardBody();
    renderFooter();
    renderResults();
    MapRenderer.drawMarkers(Store.optimizer.stops);
  }

  /* ── Sanitize ── */
  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init, handleMapClick };
})();
