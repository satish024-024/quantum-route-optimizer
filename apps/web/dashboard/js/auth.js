/* ============================================
   OmniRoute AI — Auth Controller
   Login, Register, Forgot Password logic
   with client-side validation.
   ============================================ */

const Auth = (() => {
    let currentView = 'login';

    /* ── SVG Icons ── */
    const icons = {
        mail: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
        lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
        user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        eye: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
        eyeOff: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>',
        check: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>',
        arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>',
    };

    /* ── Validation Rules ── */
    const validators = {
        email(value) {
            if (!value) return 'Email is required';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email';
            return '';
        },
        password(value) {
            if (!value) return 'Password is required';
            if (value.length < 8) return 'Must be at least 8 characters';
            return '';
        },
        name(value) {
            if (!value) return 'Full name is required';
            if (value.length < 2) return 'Name is too short';
            return '';
        },
        confirmPassword(value, password) {
            if (!value) return 'Confirm your password';
            if (value !== password) return 'Passwords do not match';
            return '';
        },
    };

    /* ── Password Strength ── */
    function getPasswordStrength(pwd) {
        if (!pwd) return { score: 0, label: '' };
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score <= 2) return { score, label: 'Weak', cls: 'weak' };
        if (score <= 3) return { score, label: 'Fair', cls: 'fair' };
        return { score, label: 'Strong', cls: 'strong' };
    }

    /* ── Init ── */
    function init() {
        bindTabs();
        bindForms();
        bindPasswordToggles();
        bindForgotLink();
        showView('login');
    }

    /* ── Tab Switching ── */
    function bindTabs() {
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const view = tab.dataset.view;
                if (view) showView(view);
            });
        });
    }

    function showView(view) {
        currentView = view;

        /* Update tabs */
        document.querySelectorAll('.auth-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.view === view);
        });

        /* Show/hide form views */
        document.querySelectorAll('.auth-form-view').forEach(v => {
            v.classList.toggle('active', v.id === `view-${view}`);
        });

        /* Update header text */
        const header = document.getElementById('auth-header');
        if (!header) return;

        const headings = {
            login: { title: 'Welcome back', sub: 'Don\'t have an account? <a data-view="register">Sign up</a>' },
            register: { title: 'Create account', sub: 'Already have an account? <a data-view="login">Sign in</a>' },
            forgot: { title: 'Reset password', sub: 'Remember your password? <a data-view="login">Sign in</a>' },
        };

        const h = headings[view];
        header.querySelector('.auth-form-header__title').textContent = h.title;
        header.querySelector('.auth-form-header__subtitle').innerHTML = h.sub;

        /* Bind the new header links */
        header.querySelectorAll('[data-view]').forEach(a => {
            a.addEventListener('click', () => showView(a.dataset.view));
        });
    }

    /* ── Form Submission ── */
    function bindForms() {
        /* Login */
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleLogin(loginForm);
            });
        }

        /* Register */
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleRegister(registerForm);
            });

            /* Password strength meter */
            const pwdInput = registerForm.querySelector('[name="password"]');
            if (pwdInput) {
                pwdInput.addEventListener('input', () => {
                    updateStrengthMeter(pwdInput.value);
                });
            }
        }

        /* Forgot */
        const forgotForm = document.getElementById('forgot-form');
        if (forgotForm) {
            forgotForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleForgot(forgotForm);
            });
        }
    }

    /* ── Login Handler ── */
    function handleLogin(form) {
        clearErrors(form);
        const email = form.querySelector('[name="email"]').value.trim();
        const password = form.querySelector('[name="password"]').value;

        let valid = true;
        const emailErr = validators.email(email);
        const pwdErr = validators.password(password);

        if (emailErr) { showFieldError(form, 'email', emailErr); valid = false; }
        if (pwdErr) { showFieldError(form, 'password', pwdErr); valid = false; }

        if (!valid) return;

        const btn = form.querySelector('.auth-submit');
        simulateSubmit(btn, () => {
            /* Redirect to dashboard on success */
            window.location.href = 'index.html';
        });
    }

    /* ── Register Handler ── */
    function handleRegister(form) {
        clearErrors(form);
        const name = form.querySelector('[name="name"]').value.trim();
        const email = form.querySelector('[name="email"]').value.trim();
        const password = form.querySelector('[name="password"]').value;
        const confirm = form.querySelector('[name="confirm-password"]').value;

        let valid = true;
        const nameErr = validators.name(name);
        const emailErr = validators.email(email);
        const pwdErr = validators.password(password);
        const confirmErr = validators.confirmPassword(confirm, password);

        if (nameErr) { showFieldError(form, 'name', nameErr); valid = false; }
        if (emailErr) { showFieldError(form, 'email', emailErr); valid = false; }
        if (pwdErr) { showFieldError(form, 'password', pwdErr); valid = false; }
        if (confirmErr) { showFieldError(form, 'confirm-password', confirmErr); valid = false; }

        if (!valid) return;

        const btn = form.querySelector('.auth-submit');
        simulateSubmit(btn, () => {
            showSuccessState('Account created! Redirecting to dashboard...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        });
    }

    /* ── Forgot Password Handler ── */
    function handleForgot(form) {
        clearErrors(form);
        const email = form.querySelector('[name="email"]').value.trim();

        const emailErr = validators.email(email);
        if (emailErr) { showFieldError(form, 'email', emailErr); return; }

        const btn = form.querySelector('.auth-submit');
        simulateSubmit(btn, () => {
            showSuccessState('Password reset link sent to your email.');
        });
    }

    /* ── UI Helpers ── */
    function showFieldError(form, fieldName, message) {
        const input = form.querySelector(`[name="${fieldName}"]`);
        const errorEl = form.querySelector(`[data-error="${fieldName}"]`);
        if (input) input.classList.add('error');
        if (errorEl) errorEl.textContent = message;
    }

    function clearErrors(form) {
        form.querySelectorAll('.form-input').forEach(i => i.classList.remove('error'));
        form.querySelectorAll('.form-error').forEach(e => e.textContent = '');
    }

    function simulateSubmit(btn, onSuccess) {
        if (!btn) return;
        btn.classList.add('loading');
        btn.disabled = true;

        setTimeout(() => {
            btn.classList.remove('loading');
            btn.disabled = false;
            onSuccess();
        }, 1500);
    }

    function showSuccessState(message) {
        const container = document.querySelector('.auth-form-view.active');
        if (!container) return;

        container.innerHTML = `
      <div class="auth-success">
        <div class="auth-success__icon">${icons.check}</div>
        <h3 class="auth-success__title">Success!</h3>
        <p class="auth-success__text">${sanitize(message)}</p>
      </div>
    `;
    }

    function updateStrengthMeter(pwd) {
        const { score, label, cls } = getPasswordStrength(pwd);
        const bars = document.querySelectorAll('.password-strength__bar');
        const labelEl = document.querySelector('.password-strength__label');

        bars.forEach((bar, i) => {
            bar.className = 'password-strength__bar';
            if (i < score && cls) {
                bar.classList.add(`filled-${cls}`);
            }
        });

        if (labelEl) {
            labelEl.textContent = pwd ? label : '';
            labelEl.style.color = cls === 'weak' ? 'var(--color-error)'
                : cls === 'fair' ? 'var(--color-warning)'
                    : cls === 'strong' ? 'var(--color-success)' : '';
        }
    }

    /* ── Password Visibility Toggle ── */
    function bindPasswordToggles() {
        document.querySelectorAll('.form-input-wrapper__toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const input = toggle.parentElement.querySelector('input');
                if (!input) return;

                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                toggle.innerHTML = isPassword ? icons.eyeOff : icons.eye;
                toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
            });
        });
    }

    /* ── Forgot Password Link ── */
    function bindForgotLink() {
        const link = document.getElementById('forgot-link');
        if (link) {
            link.addEventListener('click', () => showView('forgot'));
        }
    }

    /* ── Sanitize ── */
    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { init };
})();
