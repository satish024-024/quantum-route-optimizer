/* ============================================
   OmniRoute AI — Stats Controller
   Stat card data, count-up animations, sparklines.
   ============================================ */

const Stats = (() => {
    const statsData = [
        {
            id: 'active-routes',
            label: 'Active Routes',
            value: 24,
            icon: 'route',
            color: 'blue',
            trend: '+12%',
            trendDir: 'up',
            period: 'vs last week',
            sparkline: [12, 15, 18, 14, 20, 22, 19, 24],
        },
        {
            id: 'vehicles-transit',
            label: 'Vehicles In Transit',
            value: 18,
            icon: 'truck',
            color: 'green',
            trend: '+8%',
            trendDir: 'up',
            period: 'vs last week',
            sparkline: [10, 12, 14, 16, 15, 13, 17, 18],
        },
        {
            id: 'avg-delivery',
            label: 'Avg Delivery Time',
            value: 42,
            suffix: ' min',
            icon: 'clock',
            color: 'orange',
            trend: '-5%',
            trendDir: 'up',
            period: 'vs last week',
            sparkline: [50, 48, 45, 47, 44, 46, 43, 42],
        },
        {
            id: 'opt-score',
            label: 'Optimization Score',
            value: 94.2,
            suffix: '%',
            icon: 'zap',
            color: 'purple',
            trend: '+2.1%',
            trendDir: 'up',
            period: 'vs last week',
            sparkline: [88, 89, 91, 90, 92, 91, 93, 94.2],
        },
    ];

    const iconSVGs = {
        route: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>`,
        truck: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,
        clock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        zap: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    };

    function init() {
        renderCards();
        animateCountUp();
        drawSparklines();
    }

    function renderCards() {
        const container = document.getElementById('stats-row');
        if (!container) return;

        container.innerHTML = statsData.map((stat, i) => `
      <div class="stat-card animate-fade-in-up stagger-${i + 1}" data-stat="${stat.id}">
        <div class="stat-card__header">
          <span class="stat-card__label">${stat.label}</span>
          <div class="stat-card__icon stat-card__icon--${stat.color}">
            ${iconSVGs[stat.icon]}
          </div>
        </div>
        <div class="stat-card__value" data-target="${stat.value}" data-suffix="${stat.suffix || ''}">0</div>
        <div class="stat-card__footer">
          <span class="stat-card__trend stat-card__trend--${stat.trendDir}">
            ${stat.trendDir === 'up' ? '↑' : '↓'} ${stat.trend}
          </span>
          <span class="stat-card__period">${stat.period}</span>
        </div>
        <canvas class="stat-card__sparkline" data-sparkline-idx="${i}"></canvas>
      </div>
    `).join('');
    }

    function animateCountUp() {
        const valueEls = document.querySelectorAll('.stat-card__value');

        valueEls.forEach(el => {
            const target = parseFloat(el.dataset.target);
            const suffix = el.dataset.suffix;
            const isDecimal = target % 1 !== 0;
            const duration = 1200;
            const startTime = performance.now();

            function step(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                /* Ease-out cubic */
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = eased * target;

                el.textContent = (isDecimal ? current.toFixed(1) : Math.round(current)) + suffix;

                if (progress < 1) {
                    requestAnimationFrame(step);
                }
            }

            /* Delay start to match stagger animation */
            setTimeout(() => requestAnimationFrame(step), 300);
        });
    }

    function drawSparklines() {
        const canvases = document.querySelectorAll('.stat-card__sparkline');

        canvases.forEach(canvas => {
            const idx = parseInt(canvas.dataset.sparklineIdx);
            const data = statsData[idx].sparkline;
            const color = getComputedStyle(document.querySelector(`.stat-card__icon--${statsData[idx].color}`)).color;

            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;

            canvas.width = canvas.offsetWidth * dpr;
            canvas.height = canvas.offsetHeight * dpr;
            ctx.scale(dpr, dpr);

            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            const padding = 2;
            const min = Math.min(...data) * 0.9;
            const max = Math.max(...data) * 1.05;

            const points = data.map((val, i) => ({
                x: padding + (i / (data.length - 1)) * (w - padding * 2),
                y: h - padding - ((val - min) / (max - min)) * (h - padding * 2),
            }));

            /* Gradient fill */
            const gradient = ctx.createLinearGradient(0, 0, 0, h);
            gradient.addColorStop(0, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
            gradient.addColorStop(1, 'transparent');

            /* Fill area */
            ctx.beginPath();
            ctx.moveTo(points[0].x, h);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(points[points.length - 1].x, h);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            /* Line */
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.lineJoin = 'round';
            ctx.stroke();
        });
    }

    return { init, statsData };
})();
