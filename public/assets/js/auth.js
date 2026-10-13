/* ============================================================
   AUTH — Login, Register, Logout
   ============================================================ */
console.log('[auth.js] loaded');

/* ---------------- HELPERS ---------------- */
function showAuthAlert(message, type = 'error') {
  const box = document.getElementById('authAlert');
  if (!box) { alert(message); return; }
  box.className = `alert alert-${type}`;
  box.textContent = message;
  box.classList.remove('hidden');
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ---------------- LOGIN ---------------- */
(function setupLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  console.log('[auth.js] login form found — attaching handler');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    e.stopPropagation();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    if (!email || !password) {
      return showAuthAlert('Email and password are required.', 'error');
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      console.log('[auth.js] login response:', res.status, data);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed.');
      }

      showAuthAlert('✓ Login successful. Redirecting...', 'success');

      const target = data.user.role === 'admin'
        ? '/dashboards/admin.html'
        : '/dashboards/volunteer.html';

      setTimeout(() => { window.location.href = target; }, 700);
    } catch (err) {
      console.error('[auth.js] login error:', err);
      showAuthAlert(err.message || 'Login failed.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
})();

/* ---------------- REGISTER ---------------- */
(function setupRegister() {
  const form = document.getElementById('registerForm');
  if (!form) return;
  console.log('[auth.js] register form found — attaching handler');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    e.stopPropagation();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    const payload = {
      full_name: document.getElementById('full_name')?.value.trim() || '',
      email: document.getElementById('email')?.value.trim() || '',
      password: document.getElementById('password')?.value || '',
      phone: document.getElementById('phone')?.value.trim() || '',
      city: document.getElementById('city')?.value.trim() || ''
    };

    if (!payload.full_name) return showAuthAlert('Please enter your full name.', 'error');
    if (!payload.email || !payload.email.includes('@')) return showAuthAlert('Please enter a valid email.', 'error');
    if (payload.password.length < 8) return showAuthAlert('Password must be at least 8 characters.', 'error');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log('[auth.js] register response:', res.status, data);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      showAuthAlert('✓ Account created! Redirecting to login...', 'success');
      setTimeout(() => { window.location.href = '/login.html'; }, 1200);
    } catch (err) {
      console.error('[auth.js] register error:', err);
      showAuthAlert(err.message || 'Registration failed.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
})();