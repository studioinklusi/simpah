// SIMPAH - Login Page
import { icons } from '../components/icons.js';
import { setCurrentUser } from '../utils/helpers.js';
import { getUserByUsername as dbGetUser } from '../db/store.js';
import { createAuditEntry } from '../utils/audit.js';
import { showToast } from '../components/toast.js';

export function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-page">
      <a href="#/portal" class="back-to-portal-link">
        ${icons.chevronLeft} Kembali ke Beranda
      </a>
      <div class="login-bg">
        <div class="login-bg-circle c1"></div>
        <div class="login-bg-circle c2"></div>
        <div class="login-bg-circle c3"></div>
      </div>
      <div class="login-container">
        <div class="login-card">
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
          <form id="loginForm" class="login-form">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" id="loginUsername" class="form-input form-input-lg" placeholder="Masukkan username" required autocomplete="username" />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="loginPassword" class="form-input form-input-lg" placeholder="Masukkan password" required autocomplete="current-password" />
            </div>
            <button type="submit" class="btn btn-primary btn-lg btn-block" id="loginBtn">
              Masuk
            </button>
          </form>
          <div class="login-divider"><span>atau</span></div>
          <a href="#/portal" class="btn btn-secondary btn-block">
            ${icons.globe} Kunjungi Portal Publik
          </a>
          <div class="login-demo">
            <p>Demo Akun:</p>
            <div class="demo-accounts">
              <button class="demo-account" data-user="warga1" data-pass="warga123" style="grid-column: 1 / -1">
                <span>${icons.users}</span> Warga
              </button>
              <button class="demo-account" data-user="petugas1" data-pass="petugas123">
                <span>${icons.truck}</span> P. Angkut
              </button>
              <button class="demo-account" data-user="koordinator1" data-pass="koordinator123">
                <span>${icons.checkCircle}</span> Koordinator
              </button>
              <button class="demo-account" data-user="operator1" data-pass="operator123">
                <span>${icons.clipboard}</span> Operator TPS
              </button>
              <button class="demo-account" data-user="kader1" data-pass="kader123">
                <span>${icons.home}</span> Kader
              </button>
              <button class="demo-account" data-user="eksekutif1" data-pass="eksekutif123">
                <span>${icons.chart}</span> Eksekutif
              </button>
              <button class="demo-account" data-user="admin1" data-pass="admin123">
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
      .login-demo { margin-top:var(--space-6); text-align:center; }
      .login-demo > p { font-size:var(--font-xs); color:var(--gray-500); margin-bottom:var(--space-3); }
      .demo-accounts { display:grid; grid-template-columns:repeat(2,1fr); gap:var(--space-3); }
      .demo-account { padding:var(--space-3) var(--space-4); border-radius:var(--radius-md); border:1px solid rgba(255,255,255,0.08); color:var(--gray-400); font-size:var(--font-sm); font-weight:500; transition:all var(--transition-fast); display:flex; align-items:center; gap:var(--space-2); justify-content:center; cursor:pointer; background:transparent; }
      .demo-account:hover { border-color:var(--primary-500); color:var(--primary-400); background:rgba(16,185,129,0.08); }
    </style>
  `;

  // Event handlers
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', handleLogin);

  document.querySelectorAll('.demo-account').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('loginUsername').value = btn.dataset.user;
      document.getElementById('loginPassword').value = btn.dataset.pass;
    });
  });
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!username || !password) {
    showToast('Harap isi username dan password', 'warning');
    return;
  }

  const btn = document.getElementById('loginBtn');
  btn.innerHTML = '<div class="spinner" style="margin:0 auto"></div>';
  btn.disabled = true;

  try {
    const user = await dbGetUser(username);
    if (!user || user.password !== password) {
      showToast('Username atau password salah', 'error');
      btn.innerHTML = 'Masuk';
      btn.disabled = false;
      return;
    }

    setCurrentUser(user);
    await createAuditEntry('users', user.id, 'login', user.id, { role: user.role, job_type: user.job_type || null });
    showToast(`Selamat datang, ${user.name}!`, 'success');

    // Navigate based on role
    setTimeout(() => {
      switch (user.role) {
        case 'eksekutif':
          window.location.hash = '#/dashboard/eksekutif';
          break;
        case 'admin':
          window.location.hash = '#/dashboard';
          break;
        case 'petugas':
        case 'warga':
        default:
          window.location.hash = '#/pwa/home';
      }
    }, 500);
  } catch (err) {
    showToast('Terjadi kesalahan', 'error');
    btn.innerHTML = 'Masuk';
    btn.disabled = false;
  }
}
