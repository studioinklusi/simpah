// SIMPAH - Forgot Password Page (Supabase Auth)
import { icons } from '../components/icons.js';
import { sendResetPasswordEmail, getAuthProfile, getDefaultRoute } from '../lib/auth.js';
import { showToast } from '../components/toast.js';

export function renderForgotPassword() {
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
          <a href="#/login" class="nav-btn">Masuk</a>
        </div>
      </nav>

      <div class="auth-split-container">
        <!-- Left Column: Copywriting & Illustration -->
        <div class="reference-left-panel">
          <h2>Atur Ulang Kata Sandi <span class="accent-text">SIMPAH Anda</span></h2>
          <p class="desc">Jangan khawatir jika Anda lupa kata sandi. Cukup masukkan alamat email terdaftar Anda, dan kami akan mengirimkan tautan aman untuk membuat kata sandi baru.</p>
          
          <div class="reference-list">
            <div class="reference-list-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Proses Pemulihan Cepat & Terenkripsi Aman</span>
            </div>
            <div class="reference-list-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Verifikasi Berbasis Email Resmi Layanan</span>
            </div>
            <div class="reference-list-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Akses Instan ke Akun Setelah Pengubahan</span>
            </div>
          </div>

          <div class="reference-illustration-wrapper">
            <div class="floating-illustration-card">
              <div class="illustration-glow"></div>
              <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto;">
                <defs>
                  <linearGradient id="svgGradForgot" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#34d399" />
                    <stop offset="100%" stop-color="#059669" />
                  </linearGradient>
                </defs>
                <rect width="400" height="300" rx="16" fill="#f8fafc" />
                <circle cx="200" cy="140" r="50" fill="url(#svgGradForgot)" opacity="0.15" />
                <path d="M200 110v30m0 0a15 15 0 100 30 15 15 0 000-30z" stroke="url(#svgGradForgot)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M175 110h50a25 25 0 00-50 0z" stroke="url(#svgGradForgot)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div class="floating-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Keamanan Akun Terjaga</span>
            </div>
          </div>
        </div>

        <!-- Right Column: Floating Form Card -->
        <div class="reference-right-panel">
          <div class="reference-card" id="forgotCard">
            <div class="login-header">
              <h1>Lupa Kata Sandi?</h1>
              <p>Masukkan email terdaftar untuk menerima tautan atur ulang kata sandi.</p>
            </div>

            <!-- Error Banner (hidden by default) -->
            <div class="reference-card border-0 p-0 shadow-none" id="forgotErrorBanner" style="display:none">
              <div class="login-error-banner">
                <span class="login-error-icon">${icons.alert}</span>
                <span class="login-error-text" id="forgotErrorText"></span>
              </div>
            </div>

            <!-- Success State (hidden by default) -->
            <div id="forgotSuccessState" style="display:none; text-align:center; padding: var(--space-4) 0;">
              <div style="color:#059669; margin-bottom:var(--space-4);">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3 style="color:#111827; font-size:var(--font-lg); font-weight:700; margin-bottom:var(--space-2)">Email Terkirim!</h3>
              <p style="color:#4b5563; font-size:var(--font-sm); margin-bottom:var(--space-6); line-height:1.5;">
                Tautan pengaturan ulang kata sandi telah dikirim ke alamat email Anda. Harap periksa folder kotak masuk atau spam Anda.
              </p>
              <a href="#/login" class="reference-btn-primary" style="margin-top:0">
                Kembali ke Login
              </a>
            </div>

            <form id="forgotForm" class="login-form">
              <div class="form-group">
                <label class="form-label">Alamat Email</label>
                <div class="input-with-icon">
                  <span class="input-icon-left">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  <input type="email" id="forgotEmail" class="form-input form-input-lg has-icon-left" 
                    placeholder="contoh: admin1@simpah.dev" 
                    required autocomplete="email" autofocus />
                </div>
              </div>

              <button type="submit" class="reference-btn-primary" id="forgotBtn">
                <span class="btn-text">Kirim Link Reset →</span>
                <span class="btn-loading" style="display:none">
                  <div class="spinner" style="margin:0 auto;width:20px;height:20px;border-width:2px"></div>
                </span>
              </button>
            </form>

            <div class="login-footer" id="forgotFooter">
              Ingat kata sandi Anda? <a href="#/login">Masuk sekarang</a>
            </div>
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

  const form = document.getElementById('forgotForm');
  const emailInput = document.getElementById('forgotEmail');
  const forgotBtn = document.getElementById('forgotBtn');
  const errorBanner = document.getElementById('forgotErrorBanner');
  const errorText = document.getElementById('forgotErrorText');
  const forgotCard = document.getElementById('forgotCard');
  const successState = document.getElementById('forgotSuccessState');
  const forgotFooter = document.getElementById('forgotFooter');

  form.addEventListener('submit', (e) => handleForgot(e));

  async function handleForgot(e) {
    e.preventDefault();
    const email = emailInput.value.trim();

    if (!email) {
      showError('Harap isi alamat email Anda');
      return;
    }

    setLoading(true);
    hideError();

    try {
      await sendResetPasswordEmail(email);
      showToast('Email reset password berhasil dikirim!', 'success');

      // Show success view, hide form and footer
      form.style.display = 'none';
      forgotFooter.style.display = 'none';
      successState.style.display = 'block';
    } catch (err) {
      console.error('[Forgot] Error:', err);
      showError(err.message || 'Terjadi kesalahan saat memproses permintaan');

      // Shake animation
      forgotCard.classList.remove('shake');
      void forgotCard.offsetWidth; // force reflow
      forgotCard.classList.add('shake');

      setLoading(false);
    }
  }

  function setLoading(loading) {
    const btnText = forgotBtn.querySelector('.btn-text');
    const btnLoading = forgotBtn.querySelector('.btn-loading');
    
    forgotBtn.disabled = loading;
    btnText.style.display = loading ? 'none' : '';
    btnLoading.style.display = loading ? '' : 'none';
    emailInput.disabled = loading;
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
