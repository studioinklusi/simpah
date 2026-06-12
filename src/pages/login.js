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
    <div class="auth-page-wrapper">
      <!-- Header Navbar -->
      <nav class="auth-navbar">
        <div class="auth-navbar-left">
          <div class="auth-navbar-left-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 2 20 2s-1.7 5.5-3.8 10.7A7 7 0 0 1 11 20z" fill="#ecfdf5" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <span class="logo-text">SIMPAH<span class="logo-dot">.</span></span>
        </div>
        <div class="auth-navbar-right">
          <a href="#" class="nav-link">Tentang Kami</a>
          <a href="#/register" class="nav-btn">Daftar</a>
        </div>
      </nav>

      <div class="auth-split-container">
        <!-- Left Column: Copywriting & Illustration -->
        <div class="reference-left-panel">
          <h2>Monitor Pengelolaan Sampah Jadi <span class="accent-text">Mudah & Akurat!</span></h2>
          <p class="desc">Masuk ke akun SIMPAH Anda untuk memantau data setoran sampah warga secara real-time, mengelola peta rute pengangkutan, serta melakukan audit kebersihan lingkungan.</p>
          
          <div class="reference-list">
            <div class="reference-list-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Dasbor Analitik & Laporan Interaktif Eksekutif</span>
            </div>
            <div class="reference-list-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Sistem Manajemen GIS & Rute Pengangkutan Optimasi</span>
            </div>
            <div class="reference-list-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Integrasi Peran Multi-level (Warga, Petugas, & Admin)</span>
            </div>
          </div>

          <div class="reference-illustration-wrapper">
            <div class="floating-illustration-card">
              <div class="illustration-glow"></div>
              <!-- Sustainability Illustration SVG for Login -->
              <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto;">
                <defs>
                  <linearGradient id="svgGradLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#34d399" />
                    <stop offset="100%" stop-color="#059669" />
                  </linearGradient>
                </defs>
                <rect width="400" height="300" rx="16" fill="#f8fafc" />
                
                <!-- Dashboard abstract vector -->
                <rect x="60" y="80" width="280" height="170" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
                <rect x="60" y="80" width="280" height="30" rx="8" fill="#f1f5f9" />
                <circle cx="80" cy="95" r="4" fill="#ef4444" />
                <circle cx="92" cy="95" r="4" fill="#eab308" />
                <circle cx="104" cy="95" r="4" fill="#22c55e" />
                
                <!-- Inside dashboard: chart and metrics -->
                <rect x="80" y="130" width="110" height="100" rx="6" fill="#f8fafc" stroke="#e2e8f0" />
                <rect x="95" y="145" width="80" height="8" rx="4" fill="#cbd5e1" />
                <rect x="95" y="160" width="50" height="12" rx="4" fill="url(#svgGradLogin)" />
                <circle cx="135" cy="200" r="20" fill="none" stroke="#e2e8f0" stroke-width="6" />
                <circle cx="135" cy="200" r="20" fill="none" stroke="#10b981" stroke-width="6" stroke-dasharray="80 100" />
                
                <!-- Bar chart on right inside dashboard -->
                <rect x="205" y="130" width="115" height="100" rx="6" fill="#f8fafc" stroke="#e2e8f0" />
                <rect x="220" y="210" width="12" height="10" rx="2" fill="#94a3b8" />
                <rect x="237" y="180" width="12" height="40" rx="2" fill="url(#svgGradLogin)" />
                <rect x="254" y="195" width="12" height="25" rx="2" fill="#34d399" />
                <rect x="271" y="170" width="12" height="50" rx="2" fill="url(#svgGradLogin)" />
                <rect x="288" y="190" width="12" height="30" rx="2" fill="#94a3b8" />
              </svg>
            </div>
            <div class="floating-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Monitoring Real-time!</span>
            </div>
          </div>
        </div>

        <!-- Right Column: Floating Form Card -->
        <div class="reference-right-panel">
          <div class="reference-card" id="loginCard">
            <div class="login-header">
              <h1>Masuk ke SIMPAH</h1>
              <p>Gunakan akun Anda untuk mengakses sistem monitoring.</p>
            </div>

            <!-- Error Banner (hidden by default) -->
            <div class="reference-card border-0 p-0 shadow-none" id="loginErrorBanner" style="display:none">
              <div class="login-error-banner">
                <span class="login-error-icon">${icons.alert}</span>
                <span class="login-error-text" id="loginErrorText"></span>
              </div>
            </div>

            <form id="loginForm" class="login-form">
              <div class="form-group">
                <label class="form-label">Email / Username</label>
                <div class="input-with-icon">
                  <span class="input-icon-left">${icons.user}</span>
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
                    placeholder="Masukkan password Anda" 
                    required autocomplete="current-password" />
                  <button type="button" class="input-icon-right-btn" id="togglePassword" tabindex="-1" title="Tampilkan password">
                    ${icons.eye}
                  </button>
                </div>
              </div>

              <button type="submit" class="reference-btn-primary" id="loginBtn">
                <span class="btn-text">Masuk Sekarang →</span>
                <span class="btn-loading" style="display:none">
                  <div class="spinner" style="margin:0 auto;width:20px;height:20px;border-width:2px"></div>
                </span>
              </button>
            </form>

            <div class="login-footer">
              Belum punya akun? <a href="#/register">Daftar di sini</a>
            </div>

            ${import.meta.env.VITE_DEMO_MODE === 'true' ? `
            <!-- Demo accounts section (hanya muncul saat VITE_DEMO_MODE=true) -->
            <div class="login-demo" style="margin-top: var(--space-6); border-top: 1px solid #e5e7eb; padding-top: var(--space-4)">
              <p style="font-size: var(--font-xs); color: #6b7280; font-weight: 600; margin-bottom: var(--space-3); text-align: left">Demo Akun (Klik untuk mengisi cepat):</p>
              <div class="demo-accounts">
                <button class="demo-account" data-user="warga1@simpah.dev" data-pass="warga123" style="grid-column: 1 / -1">
                  <span>${icons.user}</span> Warga (Demo Warga)
                </button>
                <button class="demo-account" data-user="petugas1@simpah.dev" data-pass="petugas123">
                  <span>${icons.truck}</span> P. Angkut
                </button>
                <button class="demo-account" data-user="koordinator1@simpah.dev" data-pass="koordinator123">
                  <span>${icons.checkCircle}</span> Koordinator
                </button>
                <button class="demo-account" data-user="operator1@simpah.dev" data-pass="operator123">
                  <span>${icons.clipboard}</span> Ops TPS
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
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Footer navbar -->
      <footer class="auth-footer">
        <div class="auth-footer-left">
          &copy; 2026 SIMPAH. Hak Cipta Dilindungi.
        </div>
        <div class="auth-footer-right">
          <a href="#">Syarat & Ketentuan</a>
          <a href="#">Kebijakan Privasi</a>
        </div>
      </footer>
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
