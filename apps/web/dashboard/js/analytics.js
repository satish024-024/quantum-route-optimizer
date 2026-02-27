/* ============================================
   OmniRoute AI — Analytics Controller
   Reads from Store. Canvas charts, KPIs,
   route performance.
   ============================================ */

const Analytics = (() => {
    const dpr = window.devicePixelRatio || 1;

    /* ── Init ── */
    function init() {
        renderKPIs();
        renderDeliveriesChart();
        renderBreakdownDonut();
        renderRouteTable();
        renderUtilization();
        bindTimeRange();
    }

    /* ── KPI Cards ── */
    function renderKPIs() {
        const k = Store.analytics.kpis;

        const kpis = [
            { id: 'kpi-deliveries', label: 'Total Deliveries', value: String(k.totalDeliveries.value), unit: 'this week', change: k.totalDeliveries.change, direction: k.totalDeliveries.direction, data: Store.analytics.weeklyDeliveries },
            { id: 'kpi-ontime', label: 'On-Time Rate', value: String(k.onTimeRate.value), unit: '%', change: k.onTimeRate.change, direction: k.onTimeRate.direction, data: Store.analytics.weeklyOnTimeRate },
            { id: 'kpi-fuel', label: 'Fuel Cost', value: k.fuelCost.value, unit: 'this week', change: k.fuelCost.change, direction: k.fuelCost.direction, data: Store.analytics.weeklyFuelCost },
            { id: 'kpi-distance', label: 'Distance Covered', value: String(k.distanceKm.value), unit: 'km', change: k.distanceKm.change, direction: k.distanceKm.direction, data: Store.analytics.weeklyDistanceKm },
        ];

        const row = document.getElementById('kpi-row');
        if (!row) return;

        row.innerHTML = kpis.map(ki => `
      <div class="kpi-card">
        <div class="kpi-card__label">${sanitize(ki.label)}</div>
        <div class="kpi-card__row">
          <span class="kpi-card__value">${sanitize(ki.value)}</span>
          <span class="kpi-card__unit">${sanitize(ki.unit)}</span>
          ${ki.change ? `<span class="kpi-card__change kpi-card__change--${ki.direction}">${ki.direction === 'up' ? '↑' : '↓'} ${sanitize(ki.change)}</span>` : ''}
        </div>
        <div class="kpi-card__sparkline"><canvas id="${ki.id}-spark"></canvas></div>
      </div>
    `).join('');

        /* Draw sparklines only if data exists */
        kpis.forEach(ki => {
            if (ki.data && ki.data.length > 1) {
                const canvas = document.getElementById(`${ki.id}-spark`);
                if (canvas) drawSparkline(canvas, ki.data, ki.direction === 'up' ? '#22C55E' : '#EF4444');
            }
        });
    }

    /* ── Sparkline ── */
    function drawSparkline(canvas, data, color) {
        const w = canvas.parentElement.offsetWidth;
        const h = 32;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const min = Math.min(...data) * 0.9;
        const max = Math.max(...data) * 1.05;
        const stepX = w / (data.length - 1);

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, color.replace(')', ', 0.15)').replace('rgb', 'rgba'));
        grad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(0, h);
        data.forEach((v, i) => {
            const x = i * stepX;
            const y = h - ((v - min) / (max - min)) * (h - 4);
            ctx.lineTo(x, y);
        });
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        data.forEach((v, i) => {
            const x = i * stepX;
            const y = h - ((v - min) / (max - min)) * (h - 4);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.stroke();

        const lastX = (data.length - 1) * stepX;
        const lastY = h - ((data[data.length - 1] - min) / (max - min)) * (h - 4);
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    /* ── Deliveries Line Chart ── */
    function renderDeliveriesChart() {
        const canvas = document.getElementById('chart-deliveries');
        if (!canvas) return;

        const data = Store.analytics.weeklyDeliveries;
        const labels = Store.analytics.weeklyLabels;

        /* Empty state */
        if (!data || data.length === 0) {
            renderEmptyChart(canvas, 'No delivery data yet');
            return;
        }

        const wrap = canvas.parentElement;
        const w = wrap.offsetWidth;
        const h = wrap.offsetHeight || 220;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const pad = { top: 10, right: 16, bottom: 30, left: 40 };
        const cw = w - pad.left - pad.right;
        const ch = h - pad.top - pad.bottom;

        const onTimeData = Store.analytics.weeklyOnTimeRate;
        const data2 = onTimeData.length ? onTimeData.map((v, i) => Math.round(data[i] * v / 100)) : [];

        const allValues = [...data, ...data2];
        const maxVal = Math.max(...allValues) * 1.15;
        const minVal = 0;

        /* Y axis grid */
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = '11px "JetBrains Mono", monospace';

        for (let i = 0; i <= 4; i++) {
            const val = Math.round(minVal + (maxVal - minVal) * (i / 4));
            const y = pad.top + ch - (i / 4) * ch;
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(w - pad.right, y);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillText(val.toString(), pad.left - 8, y);
        }

        /* X axis labels */
        if (labels.length) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            labels.forEach((label, i) => {
                const x = pad.left + (i / (labels.length - 1)) * cw;
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillText(label, x, h - pad.bottom + 10);
            });
        }

        function drawLine(dataset, color, lineWidth) {
            const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
            grad.addColorStop(0, color.replace(')', ', 0.12)').replace('rgb', 'rgba'));
            grad.addColorStop(1, 'transparent');

            ctx.beginPath();
            ctx.moveTo(pad.left, pad.top + ch);
            dataset.forEach((v, i) => {
                const x = pad.left + (i / (dataset.length - 1)) * cw;
                const y = pad.top + ch - ((v - minVal) / (maxVal - minVal)) * ch;
                ctx.lineTo(x, y);
            });
            ctx.lineTo(pad.left + cw, pad.top + ch);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.beginPath();
            dataset.forEach((v, i) => {
                const x = pad.left + (i / (dataset.length - 1)) * cw;
                const y = pad.top + ch - ((v - minVal) / (maxVal - minVal)) * ch;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.stroke();

            dataset.forEach((v, i) => {
                const x = pad.left + (i / (dataset.length - 1)) * cw;
                const y = pad.top + ch - ((v - minVal) / (maxVal - minVal)) * ch;
                ctx.beginPath();
                ctx.arc(x, y, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = '#0F1729';
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        }

        drawLine(data, '#2563EB', 2.5);
        if (data2.length) drawLine(data2, '#22C55E', 2);
    }

    /* ── Donut Chart ── */
    function renderBreakdownDonut() {
        const canvas = document.getElementById('chart-breakdown');
        if (!canvas) return;

        const breakdown = Store.analytics.deliveryBreakdown;

        /* Empty state */
        if (!breakdown || breakdown.length === 0) {
            renderEmptyChart(canvas, 'No data');
            const center = document.querySelector('.donut-center__value');
            if (center) center.textContent = '0';
            return;
        }

        const wrap = canvas.parentElement;
        const size = Math.min(wrap.offsetWidth, wrap.offsetHeight || 220);
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const cx = size / 2;
        const cy = size / 2;
        const outerR = size / 2 - 8;
        const innerR = outerR * 0.62;
        const total = breakdown.reduce((s, d) => s + d.value, 0);

        let startAngle = -Math.PI / 2;

        breakdown.forEach(segment => {
            const sweep = (segment.value / total) * Math.PI * 2;
            const endAngle = startAngle + sweep;

            ctx.beginPath();
            ctx.arc(cx, cy, outerR, startAngle, endAngle);
            ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, outerR, endAngle - 0.01, endAngle + 0.01);
            ctx.arc(cx, cy, innerR, endAngle + 0.01, endAngle - 0.01, true);
            ctx.closePath();
            ctx.fillStyle = '#0F1729';
            ctx.fill();

            startAngle = endAngle;
        });

        /* Update center and legend */
        const center = document.querySelector('.donut-center__value');
        if (center) center.textContent = total.toString();

        const legendEl = document.getElementById('donut-legend');
        if (legendEl) {
            legendEl.innerHTML = breakdown.map(d => `
        <div class="chart-legend-item">
          <span class="chart-legend-item__dot" style="background:${d.color};"></span>
          ${sanitize(d.label)} <strong style="margin-left:4px;color:var(--text-primary);">${d.value}</strong>
        </div>
      `).join('');
        }
    }

    /* ── Route Performance Table ── */
    function renderRouteTable() {
        const tbody = document.getElementById('routes-tbody');
        if (!tbody) return;

        const routes = Store.analytics.routePerformance;

        if (!routes || routes.length === 0) {
            tbody.innerHTML = `
        <tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted);">No route data yet</td></tr>
      `;
            return;
        }

        const maxDeliveries = Math.max(...routes.map(r => r.deliveries));
        const colors = ['#2563EB', '#8B5CF6', '#22C55E', '#F59E0B', '#06B6D4'];

        tbody.innerHTML = routes.map((r, i) => `
      <tr>
        <td class="route-name">${sanitize(r.name)}</td>
        <td class="font-mono">${r.deliveries}</td>
        <td>
          <div class="route-bar">
            <div class="route-bar__track">
              <div class="route-bar__fill" style="width:${(r.deliveries / maxDeliveries * 100).toFixed(0)}%;background:${colors[i % colors.length]};"></div>
            </div>
            <span class="route-bar__pct">${r.onTime}%</span>
          </div>
        </td>
        <td class="font-mono text-xs">${r.distance} km</td>
        <td class="font-mono text-xs">${r.avgTime} min</td>
      </tr>
    `).join('');
    }

    /* ── Fleet Utilization Bars ── */
    function renderUtilization() {
        const el = document.getElementById('utilization-bars');
        if (!el) return;

        const metrics = Store.analytics.fleetUtilization;

        if (!metrics || metrics.length === 0) {
            el.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:24px;">No utilization data yet</p>';
            return;
        }

        el.innerHTML = metrics.map(m => `
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span class="text-sm text-secondary">${sanitize(m.label)}</span>
          <span class="text-sm font-mono text-primary">${sanitize(String(m.value))}</span>
        </div>
        <div style="height:6px;background:var(--bg-primary);border-radius:99px;overflow:hidden;">
          <div style="width:${m.pct || 0}%;height:100%;background:${m.color};border-radius:99px;"></div>
        </div>
      </div>
    `).join('');
    }

    /* ── Empty Chart Placeholder ── */
    function renderEmptyChart(canvas, message) {
        const wrap = canvas.parentElement;
        const w = wrap.offsetWidth;
        const h = wrap.offsetHeight || 220;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(message, w / 2, h / 2);
    }

    /* ── Time Range ── */
    function bindTimeRange() {
        document.querySelectorAll('.time-range__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.time-range__btn').forEach(b => b.classList.toggle('active', b === btn));
                /* TODO: Call Store.fetchAnalytics(btn.textContent.trim()) → re-render */
            });
        });
    }

    /* ── Sanitize ── */
    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { init };
})();
