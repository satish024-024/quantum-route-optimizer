/* ============================================
   OmniRoute AI — Optimizer Controller
   Wizard state machine, stop management,
   constraint logic, and result display.
   ============================================ */

const Optimizer = (() => {
    /* ── State ── */
    const STEPS = ['stops', 'constraints', 'optimize', 'preview', 'deploy'];
    let currentStep = 0;

    const stops = [
        { id: 1, name: 'Central Depot', address: '42 Industrial Ave, Zone A', lat: 0.15, lng: 0.35, type: 'depot' },
        { id: 2, name: 'TechPark Office', address: '128 Silicon Rd, Block C', lat: 0.28, lng: 0.22, type: 'delivery' },
        { id: 3, name: 'GreenMart Store', address: '55 Market St, Downtown', lat: 0.42, lng: 0.18, type: 'delivery' },
        { id: 4, name: 'Harbor Warehouse', address: '10 Dock Rd, Harbor', lat: 0.55, lng: 0.28, type: 'delivery' },
        { id: 5, name: 'City Hospital', address: '200 Health Blvd, Sector 7', lat: 0.62, lng: 0.42, type: 'delivery' },
        { id: 6, name: 'Residential Complex', address: '88 Oak Lane, Suburbs', lat: 0.52, lng: 0.55, type: 'delivery' },
        { id: 7, name: 'Sports Arena', address: '1 Stadium Way, East End', lat: 0.72, lng: 0.35, type: 'delivery' },
        { id: 8, name: 'Airport Cargo', address: '5 Runway Access Rd', lat: 0.82, lng: 0.48, type: 'delivery' },
    ];

    const constraints = {
        maxDistance: 120,
        maxTime: 180,
        vehicleCapacity: 2000,
        timeWindows: true,
        returnToDepot: true,
        avoidTolls: false,
    };

    const results = {
        totalDistance: 42.3,
        estimatedTime: 84,
        fuelCost: 18.40,
        solutionQuality: 94.2,
        solver: 'OR-Tools (Classical)',
        computeTime: 1.2,
        savings: { distance: 23, time: 18, fuel: 21 },
    };

    let nextStopId = 9;

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

        /* Clickable completed steps */
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
        const list = stops.map((stop, i) => `
      <div class="stop-entry" data-stop-id="${stop.id}">
        <div class="stop-entry__number ${stop.type === 'depot' ? 'stop-entry__number--depot' : ''}">
          ${stop.type === 'depot' ? icons.depot : (i + 1)}
        </div>
        <div class="stop-entry__details">
          <div class="stop-entry__name">${sanitize(stop.name)}</div>
          <div class="stop-entry__address">${sanitize(stop.address)}</div>
        </div>
        <div class="stop-entry__actions">
          ${stop.type !== 'depot' ? `
            <button class="stop-entry__action-btn" data-action="edit" data-id="${stop.id}" title="Edit stop" aria-label="Edit ${sanitize(stop.name)}">
              ${icons.edit}
            </button>
            <button class="stop-entry__action-btn stop-entry__action-btn--delete" data-action="delete" data-id="${stop.id}" title="Remove stop" aria-label="Remove ${sanitize(stop.name)}">
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
        ${stops.length} stops · Drag to reorder
      </p>
    `;
    }

    function bindStopActions() {
        /* Delete */
        document.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const idx = stops.findIndex(s => s.id === id);
                if (idx > -1) {
                    stops.splice(idx, 1);
                    renderWizardBody();
                }
            });
        });

        /* Add stop */
        const addBtn = document.getElementById('add-stop-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                stops.push({
                    id: nextStopId++,
                    name: `New Stop ${stops.length}`,
                    address: 'Click map to set location',
                    lat: 0.4 + Math.random() * 0.3,
                    lng: 0.3 + Math.random() * 0.3,
                    type: 'delivery',
                });
                renderWizardBody();
            });
        }
    }

    /* ── Constraints ── */
    function renderConstraints() {
        return `
      <div class="constraint-group">
        <span class="constraint-group__label">Vehicle Limits</span>
        <div class="constraint-row">
          <span class="constraint-row__label">Max Distance</span>
          <input class="constraint-input" type="number" data-key="maxDistance" value="${constraints.maxDistance}" aria-label="Maximum distance in km"> <span class="text-xs text-muted" style="margin-left:4px;">km</span>
        </div>
        <div class="constraint-row">
          <span class="constraint-row__label">Max Duration</span>
          <input class="constraint-input" type="number" data-key="maxTime" value="${constraints.maxTime}" aria-label="Maximum time in minutes"> <span class="text-xs text-muted" style="margin-left:4px;">min</span>
        </div>
        <div class="constraint-row">
          <span class="constraint-row__label">Cargo Capacity</span>
          <input class="constraint-input" type="number" data-key="vehicleCapacity" value="${constraints.vehicleCapacity}" aria-label="Vehicle capacity in kg"> <span class="text-xs text-muted" style="margin-left:4px;">kg</span>
        </div>
      </div>

      <div class="constraint-group">
        <span class="constraint-group__label">Routing Options</span>
        <div class="constraint-row">
          <span class="constraint-row__label">Time Windows</span>
          <label class="toggle" aria-label="Enable time windows">
            <input type="checkbox" data-key="timeWindows" ${constraints.timeWindows ? 'checked' : ''}>
            <span class="toggle__slider"></span>
          </label>
        </div>
        <div class="constraint-row">
          <span class="constraint-row__label">Return to Depot</span>
          <label class="toggle" aria-label="Return to depot">
            <input type="checkbox" data-key="returnToDepot" ${constraints.returnToDepot ? 'checked' : ''}>
            <span class="toggle__slider"></span>
          </label>
        </div>
        <div class="constraint-row">
          <span class="constraint-row__label">Avoid Tolls</span>
          <label class="toggle" aria-label="Avoid tolls">
            <input type="checkbox" data-key="avoidTolls" ${constraints.avoidTolls ? 'checked' : ''}>
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
                    constraints[key] = value;
                }
            });
        });

        document.querySelectorAll('.toggle input').forEach(cb => {
            cb.addEventListener('change', () => {
                const key = cb.dataset.key;
                if (key) constraints[key] = cb.checked;
            });
        });
    }

    /* ── Optimize View ── */
    function renderOptimizeView() {
        return `
      <div style="text-align:center;padding:var(--space-8) 0;">
        <div style="font-size:48px;margin-bottom:var(--space-4);">⚡</div>
        <h3 class="text-lg font-semibold" style="margin-bottom:var(--space-2);">Ready to Optimize</h3>
        <p class="text-sm text-secondary" style="margin-bottom:var(--space-6);">
          ${stops.length} stops · ${constraints.maxDistance} km limit · ${constraints.vehicleCapacity} kg capacity
        </p>
        <div style="display:flex;flex-direction:column;gap:var(--space-2);padding:0 var(--space-4);">
          <div class="solver-badge" style="justify-content:center;">
            <span class="solver-badge__dot"></span>
            OR-Tools Classical Solver
          </div>
          <p class="text-xs text-muted">
            Estimated compute: &lt; 2 seconds
          </p>
        </div>
      </div>
    `;
    }

    /* ── Preview View ── */
    function renderPreviewView() {
        return `
      <div style="padding:var(--space-2) 0;">
        <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-4);">
          <div class="results-panel__status-icon results-panel__status-icon--success">${icons.check}</div>
          <span class="text-base font-semibold">Route Optimized</span>
        </div>
        <p class="text-sm text-secondary" style="margin-bottom:var(--space-4);">
          Review the optimized route on the map. Drag stops to adjust.
        </p>

        <div class="comparison">
          <div class="comparison__title">Before → After</div>
          <div class="comparison__row">
            <span class="comparison__label">Distance</span>
            <div class="comparison__bar-track">
              <div class="comparison__bar-fill" style="width:77%;background:var(--accent);"></div>
            </div>
            <span class="comparison__value">-23%</span>
          </div>
          <div class="comparison__row">
            <span class="comparison__label">Time</span>
            <div class="comparison__bar-track">
              <div class="comparison__bar-fill" style="width:82%;background:var(--color-success);"></div>
            </div>
            <span class="comparison__value">-18%</span>
          </div>
          <div class="comparison__row">
            <span class="comparison__label">Fuel</span>
            <div class="comparison__bar-track">
              <div class="comparison__bar-fill" style="width:79%;background:var(--color-warning);"></div>
            </div>
            <span class="comparison__value">-21%</span>
          </div>
        </div>
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
        <div style="padding:var(--space-3);background:var(--bg-surface);border-radius:var(--radius-sm);border:1px solid var(--border-subtle);text-align:left;">
          <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);">
            <span class="text-xs text-muted">Driver</span>
            <span class="text-xs font-semibold">Alex Kumar (TRK-001)</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);">
            <span class="text-xs text-muted">Schedule</span>
            <span class="text-xs font-semibold">Tomorrow, 06:00 AM</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span class="text-xs text-muted">Notification</span>
            <span class="text-xs font-semibold">Push + SMS</span>
          </div>
        </div>
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

        footer.innerHTML = `
      ${!isFirst ? `<button class="btn btn--ghost" id="wizard-back">${icons.back} Back</button>` : '<div></div>'}
      <button class="btn btn--primary ${isOptimize ? 'btn--optimize' : ''}" id="wizard-next">
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

        if (currentStep < 2) {
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
        <span class="result-metric__value">${results.totalDistance} km</span>
      </div>
      <div class="result-metric">
        <span class="result-metric__label">Estimated Time</span>
        <span class="result-metric__value">${results.estimatedTime} min</span>
      </div>
      <div class="result-metric">
        <span class="result-metric__label">Fuel Cost</span>
        <span class="result-metric__value">$${results.fuelCost.toFixed(2)}</span>
      </div>
      <div class="result-metric">
        <span class="result-metric__label">Solution Quality</span>
        <span class="result-metric__value">${results.solutionQuality}%</span>
      </div>
      <div class="result-metric">
        <span class="result-metric__label">Solver</span>
        <div class="solver-badge">
          <span class="solver-badge__dot"></span>
          ${sanitize(results.solver)}
        </div>
      </div>
      <div class="result-metric">
        <span class="result-metric__label">Compute Time</span>
        <span class="result-metric__value">${results.computeTime}s</span>
      </div>

      <div class="comparison" style="margin-top:var(--space-5);">
        <div class="comparison__title">Savings vs Unoptimized</div>
        <div class="comparison__row">
          <span class="comparison__label">Distance</span>
          <div class="comparison__bar-track">
            <div class="comparison__bar-fill" style="width:${results.savings.distance}%;background:var(--accent);"></div>
          </div>
          <span class="comparison__value"><span class="improvement improvement--positive">↓ ${results.savings.distance}%</span></span>
        </div>
        <div class="comparison__row">
          <span class="comparison__label">Time</span>
          <div class="comparison__bar-track">
            <div class="comparison__bar-fill" style="width:${results.savings.time}%;background:var(--color-success);"></div>
          </div>
          <span class="comparison__value"><span class="improvement improvement--positive">↓ ${results.savings.time}%</span></span>
        </div>
        <div class="comparison__row">
          <span class="comparison__label">Fuel</span>
          <div class="comparison__bar-track">
            <div class="comparison__bar-fill" style="width:${results.savings.fuel}%;background:var(--color-warning);"></div>
          </div>
          <span class="comparison__value"><span class="improvement improvement--positive">↓ ${results.savings.fuel}%</span></span>
        </div>
      </div>
    `;
    }

    /* ── Simulate Optimization ── */
    function runOptimization() {
        const btn = document.getElementById('wizard-next');
        if (!btn) return;

        btn.classList.add('loading');

        setTimeout(() => {
            btn.classList.remove('loading');
            currentStep++;
            refresh();
        }, 1800);
    }

    /* ── Deploy ── */
    function deployRoute() {
        const btn = document.getElementById('wizard-next');
        if (!btn) return;
        btn.classList.add('loading');

        setTimeout(() => {
            btn.classList.remove('loading');
            btn.textContent = '✓ Deployed';
            btn.style.background = 'var(--color-success)';
            btn.style.pointerEvents = 'none';
        }, 1200);
    }

    /* ── Refresh All ── */
    function refresh() {
        renderStepper();
        renderWizardBody();
        renderFooter();
        renderResults();
    }

    /* ── Sanitize ── */
    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { init };
})();
