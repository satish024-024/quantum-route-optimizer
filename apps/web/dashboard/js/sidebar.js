/* ============================================
   OmniRoute AI — Sidebar Controller
   Handles navigation state and sidebar toggle.
   ============================================ */

const Sidebar = (() => {
    let isCollapsed = false;

    function init() {
        bindNavItems();
        bindToggle();
    }

    function bindNavItems() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                /* Visual feedback ripple */
                createRipple(item);
            });
        });
    }

    function bindToggle() {
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            const shell = document.querySelector('.app-shell');

            if (isCollapsed) {
                shell.classList.add('sidebar-collapsed');
            } else {
                shell.classList.remove('sidebar-collapsed');
            }
        });
    }

    function createRipple(element) {
        const ripple = document.createElement('span');
        ripple.style.cssText = `
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: var(--accent-muted);
      opacity: 0.5;
      pointer-events: none;
    `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        requestAnimationFrame(() => {
            ripple.style.transition = 'opacity 400ms ease-out';
            ripple.style.opacity = '0';
        });

        setTimeout(() => ripple.remove(), 500);
    }

    return { init };
})();
