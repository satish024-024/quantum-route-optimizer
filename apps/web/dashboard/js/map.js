/* ============================================
   OmniRoute AI — Map Renderer
   Real interactive map using Leaflet API.
   ============================================ */

const MapRenderer = (() => {
    let map = null;

    function init(elementId = 'map-canvas', onClick = null) {
        const mapEl = document.getElementById(elementId);
        if (!mapEl) return;

        // Clear any existing content in the div, just in case
        mapEl.innerHTML = '';

        // Initialize Leaflet Map
        map = L.map(elementId, {
            zoomControl: false,
            attributionControl: false
        }).setView([28.6139, 77.2090], 12); // Default to New Delhi, India

        // Register click listener
        if (onClick) {
            map.on('click', (e) => {
                onClick(e.latlng.lat, e.latlng.lng);
            });
        }

        // Attempt to get user's real location using IP Geolocation
        fetch('https://get.geojs.io/v1/ip/geo.json')
            .then(response => response.json())
            .then(data => {
                if (map && data.latitude && data.longitude) {
                    const lat = parseFloat(data.latitude);
                    const lng = parseFloat(data.longitude);
                    const city = data.city || 'Unknown City';
                    const region = data.region || 'Unknown Region';

                    map.setView([lat, lng], 13);

                    // Add a glowing pulsating marker for the user's real location
                    const userIcon = L.divIcon({
                        className: 'custom-user-marker',
                        html: `<div style="width: 16px; height: 16px; background: #2563EB; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px #2563EB;"></div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    });

                    L.marker([lat, lng], { icon: userIcon }).addTo(map)
                        .bindPopup(`<div style="color: #000; font-family: Inter, sans-serif;"><b>Real-Time Location</b><br>${city}, ${region}</div>`)
                        .openPopup();
                }
            })
            .catch(error => {
                console.warn("IP Geolocation failed. Using default India location.", error);
            });

        // Add Free Dark Theme Map Tiles (CARTO Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        // Optional: Custom attribution control in the corner to respect licenses
        L.control.attribution({ position: 'bottomright' }).addTo(map);

        // Wire up custom map buttons from index.html
        wireControls();

        // Activity Feed is empty initially.
        drawActivityFeed();
    }

    function wireControls() {
        // Zoom In
        const btnZoomIn = document.querySelector('button[aria-label="Zoom In"]');
        if (btnZoomIn) {
            btnZoomIn.addEventListener('click', () => {
                if (map) map.zoomIn();
            });
        }

        // Zoom Out
        const btnZoomOut = document.querySelector('button[aria-label="Zoom Out"]');
        if (btnZoomOut) {
            btnZoomOut.addEventListener('click', () => {
                if (map) map.zoomOut();
            });
        }

        // Fullscreen (pseudo)
        const btnFullscreen = document.querySelector('button[aria-label="Fullscreen"]');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', () => {
                const container = document.querySelector('.map-container');
                if (container) {
                    container.classList.toggle('fullscreen-mode');
                    setTimeout(() => {
                        if (map) map.invalidateSize();
                    }, 300);
                }
            });
        }
    }

    function drawActivityFeed() {
        const feed = document.getElementById('activity-feed');
        if (!feed) return;

        const events = []; // Empty state

        const list = feed.querySelector('.activity-feed__list');
        if (!list) return;

        if (events.length === 0) {
            list.innerHTML = `<div class="text-xs text-muted" style="padding: 12px; text-align: center;">No recent activity</div>`;
            return;
        }
    }

    let markers = [];

    function clearMarkers() {
        markers.forEach(m => map.removeLayer(m));
        markers = [];
    }

    function drawMarkers(stops) {
        if (!map) return;
        clearMarkers();

        stops.forEach((stop, i) => {
            if (stop.lat && stop.lng) {
                const isDepot = stop.type === 'depot';
                const marker = L.marker([stop.lat, stop.lng], {
                    icon: L.divIcon({
                        className: 'custom-stop-marker',
                        html: `<div style="width: 24px; height: 24px; background: ${isDepot ? '#F59E0B' : '#2563EB'}; border-radius: 50%; border: 2px solid white; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${isDepot ? 'D' : (i + 1)}</div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    })
                }).addTo(map)
                    .bindPopup(`<div style="color: #000;"><b>${stop.name}</b><br>${stop.address}</div>`);

                markers.push(marker);
            }
        });
    }

    function destroy() {
        if (map) {
            clearMarkers();
            map.remove();
            map = null;
        }
    }

    // Expose for external integration
    return { init, destroy, getMap: () => map, drawMarkers, clearMarkers };
})();
