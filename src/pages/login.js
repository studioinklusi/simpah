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
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" stroke="#10b981" stroke-width="2" fill="none" opacity="0.3"/>
                <path d="M20 44 L32 16 L44 44 Z" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linejoin="round"/>
                <circle cx="32" cy="28" r="4" fill="#10b981"/>
                <path d="M24 38 h16" stroke="#10b981" stroke-width="2" stroke-linecap="round"/>
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
    <style>
      .login-page { min-height:100vh; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; background:linear-gradient(135deg, #0a0f1a 0%, #0d1f2d 50%, #0a0f1a 100%); }
      .back-to-portal-link { position:absolute; top:var(--space-6); left:var(--space-6); z-index:10; display:flex; align-items:center; gap:var(--space-2); color:var(--gray-400); text-decoration:none; font-weight:500; font-size:var(--font-sm); transition:all var(--transition-fast); background:rgba(26,35,50,0.5); padding:var(--space-2) var(--space-4); border-radius:var(--radius-full); border:1px solid rgba(255,255,255,0.05); backdrop-filter:blur(10px); }
      .back-to-portal-link:hover { color:#fff; border-color:var(--primary-500); background:rgba(16,185,129,0.1); transform:translateY(-2px); }
      .login-bg { position:absolute; inset:0; overflow:hidden; }
      .login-bg-circle { position:absolute; border-radius:50%; }
      .login-bg-circle.c1 { width:400px; height:400px; background:radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%); top:-100px; right:-100px; animation: pulse 4s infinite; }
      .login-bg-circle.c2 { width:300px; height:300px; background:radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%); bottom:-50px; left:-50px; animation: pulse 5s infinite 1s; }
      .login-bg-circle.c3 { width:200px; height:200px; background:radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%); top:50%; left:50%; transform:translate(-50%,-50%); animation: pulse 6s infinite 2s; }
      .login-container { position:relative; width:100%; max-width:420px; padding:var(--space-4); z-index:1; }
      .login-card { background:rgba(26,35,50,0.9); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.08); border-radius:var(--radius-2xl); padding:var(--space-8); animation:scaleIn 0.4s ease; }
      .login-header { text-align:center; margin-bottom:var(--space-8); }
      .login-logo-icon { margin:0 auto var(--space-4); animation: pulse 3s infinite; }
      .login-header h1 { font-size:var(--font-3xl); font-weight:900; margin-bottom:var(--space-2); letter-spacing:0.08em; }
      .login-header p { color:var(--gray-400); font-size:var(--font-sm); }
      .login-form .form-input { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.1); color:#fff; }
      .login-form .form-input:focus { border-color:var(--primary-500); background:rgba(255,255,255,0.08); }
      .login-form .form-input::placeholder { color:var(--gray-500); }
      .login-form .form-label { color:var(--gray-300); }
      .login-divider { text-align:center; margin:var(--space-5) 0; position:relative; }
      .login-divider::before { content:''; position:absolute; top:50%; left:0; right:0; height:1px; background:rgba(255,255,255,0.1); }
      .login-divider span { position:relative; background:rgba(26,35,50,0.9); padding:0 var(--space-4); color:var(--gray-500); font-size:var(--font-sm); }
      .login-footer a:hover { text-decoration: underline !important; }
      .login-demo { margin-top:var(--space-6); text-align:center; }
      .login-demo > p { font-size:var(--font-xs); color:var(--gray-500); margin-bottom:var(--space-3); }
      .demo-accounts { display:grid; grid-template-columns:repeat(2,1fr); gap:var(--space-3); }
      .demo-account { padding:var(--space-3) var(--space-4); border-radius:var(--radius-md); border:1px solid rgba(255,255,255,0.08); color:var(--gray-400); font-size:var(--font-sm); font-weight:500; transition:all var(--transition-fast); display:flex; align-items:center; gap:var(--space-2); justify-content:center; cursor:pointer; background:transparent; }
      .demo-account:hover { border-color:var(--primary-500); color:var(--primary-400); background:rgba(16,185,129,0.08); }
      .demo-account.selected { border-color:var(--primary-500); color:var(--primary-400); background:rgba(16,185,129,0.15); box-shadow:0 0 0 1px var(--primary-500); }

      /* Error banner */
      .login-error-banner { display:flex; align-items:center; gap:var(--space-3); padding:var(--space-3) var(--space-4); background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); border-radius:var(--radius-md); margin-bottom:var(--space-4); animation:shakeX 0.4s ease; }
      .login-error-icon { color:#ef4444; flex-shrink:0; }
      .login-error-text { color:#fca5a5; font-size:var(--font-sm); }

      /* Input with icon */
      .input-with-icon { position:relative; }
      .input-icon-left { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--gray-500); pointer-events:none; display:flex; z-index:1; }
      .input-icon-left svg { width:18px; height:18px; }
      .has-icon-left { padding-left:40px !important; }
      .has-icon-right { padding-right:40px !important; }
      .input-icon-right-btn { position:absolute; right:4px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--gray-500); cursor:pointer; padding:8px; display:flex; transition:color 0.2s; z-index:1; }
      .input-icon-right-btn:hover { color:var(--gray-300); }
      .input-icon-right-btn svg { width:18px; height:18px; }

      /* Shake animation for errors */
      @keyframes shakeX {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
      }
      .shake { animation: shakeX 0.4s ease; }
    </style>
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
