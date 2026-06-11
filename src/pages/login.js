// SIMPAH - Login Page (Sprint 2: Supabase Auth)
import { icons } from '../components/icons.js';
import { login as authLogin, getAuthProfile, getDefaultRoute } from '../lib/auth.js';
import { showToast } from '../components/toast.js';

export function renderLogin() {
  // If already logged in, redirect to default page
  const existingUser = getAuthProfile();
  if (existingUser) {
    window.location.hash = getDefaultRoute(existingUser.role);
    return;
  }

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-page">
      <div class="login-bg">
        <div class="login-bg-circle c1"></div>
        <div class="login-bg-circle c2"></div>
        <div class="login-bg-circle c3"></div>
      </div>
      <div class="login-container">
        <div class="login-card" id="loginCard">
          <div class="login-header">
            <div class="login-logo-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 2 20 2s-1.7 5.5-3.8 10.7A7 7 0 0 1 11 20z" fill="#ecfdf5" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <h1 class="gradient-text">SIMPAH</h1>
            <p>Sistem Informasi Monitoring Pengelolaan Sampah</p>
          </div>

          <!-- Error Banner (hidden by default) -->
          <div class="login-error-banner" id="loginErrorBanner" style="display:none">
            <span class="login-error-icon">${icons.alert}</span>
            <span class="login-error-text" id="loginErrorText"></span>
          </div>

          <form id="loginForm" class="login-form">
            <div class="form-group">
              <label class="form-label">Email / Username</label>
              <div class="input-with-icon">
                <span class="input-icon-left">${icons.users}</span>
                <input type="text" id="loginUsername" class="form-input form-input-lg has-icon-left" 
                  placeholder="contoh: admin1 atau admin1@simpah.dev" 
                  required autocomplete="username" autofocus />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-with-icon">
                <span class="input-icon-left">${icons.shield}</span>
                <input type="password" id="loginPassword" class="form-input form-input-lg has-icon-left has-icon-right" 
                  placeholder="Masukkan password" 
                  required autocomplete="current-password" />
                <button type="button" class="input-icon-right-btn" id="togglePassword" tabindex="-1" title="Tampilkan password">
                  ${icons.eye}
                </button>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-lg btn-block" id="loginBtn">
              <span class="btn-text">Masuk</span>
              <span class="btn-loading" style="display:none">
                <div class="spinner" style="margin:0 auto;width:20px;height:20px;border-width:2px"></div>
              </span>
            </button>
          </form>
          <div class="login-footer" style="text-align:center; margin-top:var(--space-6); font-size:var(--font-sm); color:var(--gray-400)">
            Belum memiliki akun? <a href="#/register" style="color:var(--primary-400); text-decoration:none; font-weight:600">Daftar Sekarang</a>
          </div>
          <div class="login-demo">
            <p>Demo Akun:</p>
            <div class="demo-accounts">
              <button class="demo-account" data-user="warga1@simpah.dev" data-pass="warga123" style="grid-column: 1 / -1">
                <span>${icons.users}</span> Warga
              </button>
              <button class="demo-account" data-user="petugas1@simpah.dev" data-pass="petugas123">
                <span>${icons.truck}</span> P. Angkut
              </button>
              <button class="demo-account" data-user="koordinator1@simpah.dev" data-pass="koordinator123">
                <span>${icons.checkCircle}</span> Koordinator
              </button>
              <button class="demo-account" data-user="operator1@simpah.dev" data-pass="operator123">
                <span>${icons.clipboard}</span> Operator TPS
              </button>
              <button class="demo-account" data-user="kader1@simpah.dev" data-pass="kader123">
                <span>${icons.home}</span> Kader
              </button>
              <button class="demo-account" data-user="eksekutif1@simpah.dev" data-pass="eksekutif123">
                <span>${icons.chart}</span> Eksekutif
              </button>
              <button class="demo-account" data-user="admin1@simpah.dev" data-pass="admin123">
                <span>${icons.shield}</span> Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ── Event Handlers ──────────────────────────────────────────────

  const form = document.getElementById('loginForm');
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  const loginBtn = document.getElementById('loginBtn');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const errorBanner = document.getElementById('loginErrorBanner');
  const errorText = document.getElementById('loginErrorText');
  const loginCard = document.getElementById('loginCard');

  // Login form submit
  form.addEventListener('submit', (e) => handleLogin(e));

  // Demo account buttons
  document.querySelectorAll('.demo-account').forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove previous selection
      document.querySelectorAll('.demo-account').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      usernameInput.value = btn.dataset.user;
      passwordInput.value = btn.dataset.pass;
      
      // Hide error if shown
      hideError();

      // Auto-focus submit button so user can just press Enter
      loginBtn.focus();
    });
  });

  // Toggle password visibility
  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.innerHTML = isPassword ? icons.eyeOff || icons.eye : icons.eye;
    togglePasswordBtn.title = isPassword ? 'Sembunyikan password' : 'Tampilkan password';
  });

  // Enter on password field → submit
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  });

  // ── Login Handler ─────────────────────────────────────────────

  async function handleLogin(e) {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showError('Harap isi email/username dan password');
      return;
    }

    setLoading(true);
    hideError();

    try {
      const { profile } = await authLogin(username, password);

      showToast(`Selamat datang, ${profile.full_name}!`, 'success');

      // Navigate based on role
      setTimeout(() => {
        window.location.hash = getDefaultRoute(profile.role);
      }, 400);
    } catch (err) {
      console.error('[Login] Error:', err);
      showError(err.message || 'Terjadi kesalahan saat login');

      // Shake animation
      loginCard.classList.remove('shake');
      void loginCard.offsetWidth; // force reflow
      loginCard.classList.add('shake');

      setLoading(false);
    }
  }

  function setLoading(loading) {
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');
    
    loginBtn.disabled = loading;
    btnText.style.display = loading ? 'none' : '';
    btnLoading.style.display = loading ? '' : 'none';
    usernameInput.disabled = loading;
    passwordInput.disabled = loading;
  }

  function showError(message) {
    errorText.textContent = message;
    errorBanner.style.display = 'flex';
  }

  function hideError() {
    errorBanner.style.display = 'none';
    errorText.textContent = '';
  }
}
