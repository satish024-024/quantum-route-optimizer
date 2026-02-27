/* ============================================
   OmniRoute AI — Map Renderer
   Simulated fleet map with routes, vehicles,
   stops, and animated movement.
   ============================================ */

const MapRenderer = (() => {
    /* Route path data (normalized 0-1 coordinates) */
    const routes = [
        {
            id: 'route-alpha',
            color: '#2563EB',
            stops: [
                { x: 0.15, y: 0.35, label: 'Depot', type: 'depot' },
                { x: 0.28, y: 0.22, label: 'Stop 1', type: 'delivery' },
                { x: 0.42, y: 0.18, label: 'Stop 2', type: 'delivery' },
                { x: 0.55, y: 0.28, label: 'Stop 3', type: 'completed' },
                { x: 0.62, y: 0.42, label: 'Stop 4', type: 'delivery' },
                { x: 0.52, y: 0.55, label: 'Stop 5', type: 'delivery' },
            ],
        },
        {
            id: 'route-beta',
            color: '#8B5CF6',
            stops: [
                { x: 0.15, y: 0.35, label: 'Depot', type: 'depot' },
                { x: 0.22, y: 0.55, label: 'Stop 1', type: 'completed' },
                { x: 0.30, y: 0.70, label: 'Stop 2', type: 'completed' },
                { x: 0.45, y: 0.75, label: 'Stop 3', type: 'delivery' },
                { x: 0.58, y: 0.68, label: 'Stop 4', type: 'delivery' },
            ],
        },
        {
            id: 'route-gamma',
            color: '#22C55E',
            stops: [
                { x: 0.15, y: 0.35, label: 'Depot', type: 'depot' },
                { x: 0.35, y: 0.45, label: 'Stop 1', type: 'completed' },
                { x: 0.50, y: 0.40, label: 'Stop 2', type: 'completed' },
                { x: 0.68, y: 0.32, label: 'Stop 3', type: 'completed' },
                { x: 0.78, y: 0.25, label: 'Stop 4', type: 'delivery' },
                { x: 0.85, y: 0.38, label: 'Stop 5', type: 'delivery' },
                { x: 0.82, y: 0.52, label: 'Stop 6', type: 'delivery' },
            ],
        },
    ];

    const vehicles = [
        { id: 'TRK-001', routeIdx: 0, progress: 0.45, speed: 42 },
        { id: 'TRK-004', routeIdx: 1, progress: 0.62, speed: 38 },
        { id: 'TRK-007', routeIdx: 2, progress: 0.35, speed: 55 },
    ];

    let animFrame = null;
    let mapEl = null;

    function init() {
        mapEl = document.getElementById('map-canvas');
        if (!mapEl) return;

        drawRoadNetwork();
        drawRoutes();
        drawStops();
        drawVehicles();
        drawActivityFeed();
        startVehicleAnimation();
    }

    function drawRoadNetwork() {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:1;';

        const dpr = window.devicePixelRatio || 1;
        const w = mapEl.offsetWidth;
        const h = mapEl.offsetHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        /* === City Blocks (filled rectangles) === */
        ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
        const blocks = [
            [0.08, 0.08, 0.12, 0.10], [0.22, 0.06, 0.14, 0.12],
            [0.40, 0.08, 0.10, 0.08], [0.54, 0.05, 0.16, 0.10],
            [0.75, 0.07, 0.12, 0.14], [0.05, 0.25, 0.08, 0.12],
            [0.18, 0.22, 0.10, 0.14], [0.32, 0.20, 0.08, 0.10],
            [0.44, 0.24, 0.12, 0.08], [0.60, 0.18, 0.14, 0.12],
            [0.80, 0.24, 0.10, 0.10], [0.06, 0.45, 0.10, 0.12],
            [0.20, 0.42, 0.12, 0.10], [0.36, 0.38, 0.10, 0.14],
            [0.50, 0.44, 0.14, 0.10], [0.68, 0.40, 0.08, 0.12],
            [0.82, 0.42, 0.10, 0.08], [0.10, 0.65, 0.14, 0.10],
            [0.28, 0.60, 0.10, 0.12], [0.42, 0.62, 0.12, 0.10],
            [0.58, 0.56, 0.14, 0.14], [0.76, 0.58, 0.10, 0.10],
            [0.14, 0.80, 0.10, 0.08], [0.30, 0.78, 0.12, 0.10],
            [0.48, 0.76, 0.08, 0.10], [0.62, 0.74, 0.14, 0.12],
            [0.80, 0.72, 0.10, 0.14],
        ];
        blocks.forEach(([bx, by, bw, bh]) => {
            ctx.fillRect(bx * w, by * h, bw * w, bh * h);
        });

        /* === Major Highways === */
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        const highways = [
            [[0, 0.35], [0.15, 0.35], [0.40, 0.32], [0.65, 0.38], [1, 0.36]],
            [[0.50, 0], [0.48, 0.30], [0.52, 0.55], [0.50, 0.80], [0.48, 1]],
            [[0, 0.65], [0.30, 0.62], [0.60, 0.58], [0.85, 0.55], [1, 0.52]],
        ];
        highways.forEach(points => {
            ctx.beginPath();
            ctx.moveTo(points[0][0] * w, points[0][1] * h);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i][0] * w, points[i][1] * h);
            }
            ctx.stroke();
        });

        /* === Secondary Roads === */
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1.5;
        const secondaryRoads = [
            [[0.15, 0], [0.15, 1]], [[0.35, 0], [0.35, 1]],
            [[0.65, 0], [0.65, 1]], [[0.85, 0], [0.85, 1]],
            [[0, 0.15], [1, 0.15]], [[0, 0.50], [1, 0.50]],
            [[0, 0.80], [1, 0.80]],
        ];
        secondaryRoads.forEach(([from, to]) => {
            ctx.beginPath();
            ctx.moveTo(from[0] * w, from[1] * h);
            ctx.lineTo(to[0] * w, to[1] * h);
            ctx.stroke();
        });

        /* === Minor Streets (grid pattern) === */
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= 1; x += 0.05) {
            ctx.beginPath();
            ctx.moveTo(x * w, 0);
            ctx.lineTo(x * w, h);
            ctx.stroke();
        }
        for (let y = 0; y <= 1; y += 0.05) {
            ctx.beginPath();
            ctx.moveTo(0, y * h);
            ctx.lineTo(w, y * h);
            ctx.stroke();
        }

        /* === Area Labels === */
        ctx.font = '600 11px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.textAlign = 'center';
        ctx.fillText('INDUSTRIAL ZONE', 0.22 * w, 0.12 * h);
        ctx.fillText('DOWNTOWN', 0.52 * w, 0.30 * h);
        ctx.fillText('HARBOR DISTRICT', 0.78 * w, 0.20 * h);
        ctx.fillText('WAREHOUSE DISTRICT', 0.35 * w, 0.55 * h);
        ctx.fillText('RESIDENTIAL', 0.70 * w, 0.65 * h);
        ctx.fillText('MARKET AREA', 0.25 * w, 0.78 * h);

        /* === Water Body === */
        ctx.fillStyle = 'rgba(6, 182, 212, 0.04)';
        ctx.beginPath();
        ctx.moveTo(0.88 * w, 0.70 * h);
        ctx.quadraticCurveTo(0.95 * w, 0.75 * h, 1.0 * w, 0.72 * h);
        ctx.lineTo(1.0 * w, 1.0 * h);
        ctx.lineTo(0.82 * w, 1.0 * h);
        ctx.quadraticCurveTo(0.85 * w, 0.85 * h, 0.88 * w, 0.70 * h);
        ctx.fill();

        /* Waterfront line */
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0.88 * w, 0.70 * h);
        ctx.quadraticCurveTo(0.95 * w, 0.75 * h, 1.0 * w, 0.72 * h);
        ctx.stroke();

        mapEl.appendChild(canvas);
    }

    function drawRoutes() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;';

        /* SVG filter for route glow */
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'route-glow');
        filter.innerHTML = '<feGaussianBlur stdDeviation="0.8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>';
        defs.appendChild(filter);
        svg.appendChild(defs);

        routes.forEach(route => {
            const d = route.stops.map((s, i) => `${i === 0 ? 'M' : 'L'}${s.x * 100},${s.y * 100}`).join(' ');

            /* Wide glow layer */
            const glow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            glow.setAttribute('d', d);
            glow.setAttribute('fill', 'none');
            glow.setAttribute('stroke', route.color);
            glow.setAttribute('stroke-width', '1.8');
            glow.setAttribute('stroke-linecap', 'round');
            glow.setAttribute('stroke-linejoin', 'round');
            glow.setAttribute('opacity', '0.20');
            glow.setAttribute('filter', 'url(#route-glow)');
            svg.appendChild(glow);

            /* Main route line */
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', route.color);
            path.setAttribute('stroke-width', '0.5');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('opacity', '0.9');
            path.setAttribute('stroke-dasharray', '2 1');
            path.classList.add('route-path', 'route-path--active');
            svg.appendChild(path);
        });

        mapEl.appendChild(svg);
    }

    function drawStops() {
        routes.forEach(route => {
            route.stops.forEach((stop, i) => {
                const el = document.createElement('div');
                el.className = `stop-marker stop-marker--${stop.type} animate-scale-in stagger-${Math.min(i + 1, 6)}`;
                el.style.left = `${stop.x * 100}%`;
                el.style.top = `${stop.y * 100}%`;

                if (stop.type === 'depot') {
                    el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;
                } else {
                    el.textContent = i;
                }

                el.title = stop.label;
                mapEl.appendChild(el);
            });
        });
    }

    function drawVehicles() {
        vehicles.forEach(v => {
            const route = routes[v.routeIdx];
            const pos = getPositionOnRoute(route.stops, v.progress);

            const marker = document.createElement('div');
            marker.className = 'vehicle-marker animate-scale-in';
            marker.id = `vehicle-${v.id}`;
            marker.style.left = `${pos.x * 100}%`;
            marker.style.top = `${pos.y * 100}%`;
            marker.dataset.routeIdx = v.routeIdx;
            marker.dataset.progress = v.progress;

            marker.innerHTML = `
        <div class="vehicle-marker__dot" style="background:${route.color};box-shadow:0 0 8px ${route.color}40"></div>
        <div class="vehicle-marker__ring" style="border-color:${route.color}"></div>
        <span class="vehicle-marker__label">${v.id} • ${v.speed} km/h</span>
      `;

            mapEl.appendChild(marker);
        });
    }

    function startVehicleAnimation() {
        function tick() {
            vehicles.forEach(v => {
                v.progress += 0.0003 + Math.random() * 0.0002;
                if (v.progress > 0.95) v.progress = 0.05;

                const route = routes[v.routeIdx];
                const pos = getPositionOnRoute(route.stops, v.progress);
                const marker = document.getElementById(`vehicle-${v.id}`);

                if (marker) {
                    marker.style.left = `${pos.x * 100}%`;
                    marker.style.top = `${pos.y * 100}%`;
                    marker.dataset.progress = v.progress;
                }
            });

            animFrame = requestAnimationFrame(tick);
        }

        animFrame = requestAnimationFrame(tick);
    }

    function getPositionOnRoute(stops, progress) {
        const totalSegments = stops.length - 1;
        const segmentProgress = progress * totalSegments;
        const segmentIdx = Math.min(Math.floor(segmentProgress), totalSegments - 1);
        const t = segmentProgress - segmentIdx;

        const from = stops[segmentIdx];
        const to = stops[Math.min(segmentIdx + 1, stops.length - 1)];

        return {
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
        };
    }

    function drawActivityFeed() {
        const feed = document.getElementById('activity-feed');
        if (!feed) return;

        const events = [
            { text: 'TRK-007 completed Stop 3', type: 'success', time: '2 min ago' },
            { text: 'Route Alpha optimized (94.2%)', type: 'info', time: '5 min ago' },
            { text: 'TRK-004 deviated 320m', type: 'warning', time: '8 min ago' },
            { text: 'TRK-001 ETA updated: 14:32', type: 'info', time: '12 min ago' },
            { text: 'Route Gamma deployed', type: 'success', time: '15 min ago' },
        ];

        const list = feed.querySelector('.activity-feed__list');
        if (!list) return;

        list.innerHTML = events.map(e => `
      <div class="activity-item">
        <div class="activity-item__dot activity-item__dot--${e.type}"></div>
        <div class="activity-item__content">
          <div class="activity-item__text">${e.text}</div>
          <div class="activity-item__time">${e.time}</div>
        </div>
      </div>
    `).join('');
    }

    function destroy() {
        if (animFrame) cancelAnimationFrame(animFrame);
    }

    return { init, destroy };
})();
