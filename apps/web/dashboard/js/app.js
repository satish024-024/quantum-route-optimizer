/* ============================================
   OmniRoute AI — App Entry Point
   Initializes all modules on load.
   ============================================ */

const App = (() => {
    function init() {
        Sidebar.init();
        Stats.init();

        /* Small delay so DOM paint completes before heavy map render */
        requestAnimationFrame(() => {
            MapRenderer.init();
        });

        bindKeyboard();
        bindClock();
        bindSearch();
    }

    function bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            /* Ctrl/Cmd + K → focus search */
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const search = document.querySelector('.search-bar input');
                if (search) search.focus();
            }

            /* Escape → blur active element */
            if (e.key === 'Escape') {
                document.activeElement?.blur();
            }
        });
    }

    function bindClock() {
        const clockEl = document.getElementById('header-clock');
        if (!clockEl) return;

        function update() {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const mins = now.getMinutes().toString().padStart(2, '0');
            clockEl.textContent = `${hours}:${mins}`;
        }

        update();
        setInterval(update, 30000);
    }

    function bindSearch() {
        const input = document.querySelector('.search-bar input');
        if (!input) return;

        input.addEventListener('focus', () => {
            input.closest('.search-bar')?.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            input.closest('.search-bar')?.classList.remove('focused');
        });
    }

    /* Boot */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init };
})();
