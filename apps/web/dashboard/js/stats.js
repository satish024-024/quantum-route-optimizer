/* ============================================
   OmniRoute AI — Stats Controller
   Reads from Store. Renders stat cards,
   count-up animations, sparklines.
   ============================================ */

const Stats = (() => {
    const iconSVGs = {
        route: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>`,
        truck: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,
        clock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        zap: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    };

    /* Card definitions — values come from Store at render time */
    function getCards() {
        const s = Store.dashboard.stats;
        return [
            {
                id: 'active-routes',
                label: 'Active Routes',
                value: s.activeRoutes.value,
                icon: 'route',
                color: 'blue',
                trend: s.activeRoutes.change ? `${s.activeRoutes.change > 0 ? '+' : ''}${s.activeRoutes.change}%` : '—',
                trendDir: s.activeRoutes.change >= 0 ? 'up' : 'down',
                period: 'vs last week',
            },
            {
                id: 'vehicles-transit',
                label: 'Vehicles In Transit',
                value: s.fleetOnline.value,
                icon: 'truck',
                color: 'green',
                trend: s.fleetOnline.total ? `${s.fleetOnline.value}/${s.fleetOnline.total}` : '—',
                trendDir: 'up',
                period: 'online now',
            },
            {
                id: 'avg-delivery',
                label: 'Avg Delivery Time',
                value: s.avgDeliveryMin.value,
                suffix: ' min',
                icon: 'clock',
                color: 'orange',
                trend: s.avgDeliveryMin.change ? `${s.avgDeliveryMin.change > 0 ? '+' : ''}${s.avgDeliveryMin.change}%` : '—',
                trendDir: s.avgDeliveryMin.change <= 0 ? 'up' : 'down',
                period: 'vs last week',
            },
            {
                id: 'deliveries',
                label: 'Total Deliveries',
                value: s.deliveries.value,
                icon: 'zap',
                color: 'purple',
                trend: s.deliveries.change ? `${s.deliveries.change > 0 ? '+' : ''}${s.deliveries.change}%` : '—',
                trendDir: s.deliveries.change >= 0 ? 'up' : 'down',
                period: 'this week',
            },
        ];
    }

    function init() {
        renderCards();
    }

    function renderCards() {
        const container = document.getElementById('stats-row');
        if (!container) return;

        const cards = getCards();
        const hasData = cards.some(c => c.value > 0);

        container.innerHTML = cards.map((stat, i) => `
      <div class="stat-card animate-fade-in-up stagger-${i + 1}" data-stat="${stat.id}">
        <div class="stat-card__header">
          <span class="stat-card__label">${stat.label}</span>
          <div class="stat-card__icon stat-card__icon--${stat.color}">
            ${iconSVGs[stat.icon]}
          </div>
        </div>
        <div class="stat-card__value" data-target="${stat.value}" data-suffix="${stat.suffix || ''}">${stat.value}${stat.suffix || ''}</div>
        <div class="stat-card__footer">
          <span class="stat-card__trend stat-card__trend--${stat.trendDir}">
            ${stat.trend}
          </span>
          <span class="stat-card__period">${stat.period}</span>
        </div>
        <canvas class="stat-card__sparkline" data-sparkline-idx="${i}"></canvas>
      </div>
    `).join('');

        /* Only animate count-up if there's actual data */
        if (hasData) {
            animateCountUp();
        }
    }

    function animateCountUp() {
        const valueEls = document.querySelectorAll('.stat-card__value');

        valueEls.forEach(el => {
            const target = parseFloat(el.dataset.target);
            if (target === 0) return; /* Don't animate zeros */

            const suffix = el.dataset.suffix;
            const isDecimal = target % 1 !== 0;
            const duration = 1200;
            const startTime = performance.now();

            function step(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = eased * target;
                el.textContent = (isDecimal ? current.toFixed(1) : Math.round(current)) + suffix;
                if (progress < 1) requestAnimationFrame(step);
            }

            setTimeout(() => requestAnimationFrame(step), 300);
        });
    }

    return { init };
})();
