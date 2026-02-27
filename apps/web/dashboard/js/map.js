/* ============================================
   OmniRoute AI — Map Renderer
   Real interactive map using Leaflet API.
   ============================================ */

const MapRenderer = (() => {
    let map = null;

    function init() {
        const mapEl = document.getElementById('map-canvas');
        if (!mapEl) return;

        // Clear any existing content in the div, just in case
        mapEl.innerHTML = '';

        // Initialize Leaflet Map
        // We set zoomControl to false so we can wire up custom buttons if needed,
        // but default zoom control is also fine. Let's disable defaults to match the custom UI.
        map = L.map('map-canvas', {
            zoomControl: false,
            attributionControl: false
        }).setView([28.6139, 77.2090], 12); // Default to New Delhi, India

        // Attempt to get user's real location using IP Geolocation (works perfectly on file:/// protocol without permission popups)
        fetch('https://get.geojs.io/v1/ip/geo.json')
            .then(response => response.json())
            .then(data => {
                if (map && data.latitude && data.longitude) {
                    const lat = parseFloat(data.latitude);
                    const lng = parseFloat(data.longitude);
                    map.setView([lat, lng], 13);

                    // Add a glowing pulsating marker for the user's real location
                    const userIcon = L.divIcon({
                        className: 'custom-user-marker',
                        html: `<div style="width: 16px; height: 16px; background: #2563EB; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px #2563EB;"></div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    });

                    L.marker([lat, lng], { icon: userIcon }).addTo(map)
                        .bindPopup(`<div style="color: #000; font-family: Inter, sans-serif;"><b>Real-Time Location</b><br>${data.city}, ${data.region}</div>`)
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

    function destroy() {
        if (map) {
            map.remove();
            map = null;
        }
    }

    // Expose for external integration
    return { init, destroy, getMap: () => map };
})();
