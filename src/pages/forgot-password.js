// SIMPAH - Forgot Password Page (Supabase Auth)
import { icons } from '../components/icons.js';
import { sendResetPasswordEmail, verifyRecoveryOtp, getAuthProfile, getDefaultRoute } from '../lib/auth.js';
import { showToast } from '../components/toast.js';

export function renderForgotPassword() {
  // If already logged in, redirect to default page
  const existingUser = getAuthProfile();
  if (existingUser) {
    window.location.hash = getDefaultRoute(existingUser.role);
    return;
  }

  let currentStep = 1; // 1: Email, 2: OTP
  let userEmail = '';

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
          <a href="#/portal/tentang" class="nav-link">Tentang Kami</a>
          <a href="#/login" class="nav-btn">Masuk</a>
        </div>
      </nav>

      <div class="auth-split-container">
        <!-- Left Column: Copywriting & Illustration -->
        <div class="reference-left-panel">
          <h2>Atur Ulang Kata Sandi <span class="accent-text">SIMPAH Anda</span></h2>
          <p class="desc">Jangan khawatir jika Anda lupa kata sandi. Cukup masukkan alamat email terdaftar Anda, dan kami akan mengirimkan kode verifikasi aman untuk membuat kata sandi baru.</p>
          
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
              <h1 id="forgotTitle">Lupa Kata Sandi?</h1>
              <p id="forgotDesc">Masukkan email terdaftar untuk menerima kode verifikasi atur ulang kata sandi.</p>
            </div>

            <!-- Error Banner (hidden by default) -->
            <div class="reference-card border-0 p-0 shadow-none" id="forgotErrorBanner" style="display:none">
              <div class="login-error-banner">
                <span class="login-error-icon">${icons.alert}</span>
                <span class="login-error-text" id="forgotErrorText"></span>
              </div>
            </div>

            <form id="forgotForm" class="login-form">
              <!-- Step 1: Email Input -->
              <div class="form-group" id="emailGroup">
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

              <!-- Step 2: OTP Input (Hidden by default) -->
              <div class="form-group" id="otpGroup" style="display:none">
                <label class="form-label">Kode Verifikasi (OTP)</label>
                <div class="input-with-icon">
                  <span class="input-icon-left">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input type="text" id="forgotOtp" class="form-input form-input-lg has-icon-left" 
                    placeholder="Masukkan kode verifikasi" 
                    pattern="[0-9]*" inputmode="numeric" />
                </div>
              </div>

              <button type="submit" class="reference-btn-primary" id="forgotBtn">
                <span class="btn-text" id="forgotBtnText">Kirim Kode Verifikasi →</span>
                <span class="btn-loading" style="display:none">
                  <div class="spinner" style="margin:0 auto;width:20px;height:20px;border-width:2px"></div>
                </span>
              </button>
            </form>

            <div class="login-footer" id="forgotFooter">
              Ingat kata sandi Anda? <a href="#/login">Masuk sekarang</a>
            </div>

             <div class="login-footer" id="otpBackLink" style="display:none; margin-top: var(--space-4); text-align: center;">
              <button type="button" id="btnBackToEmail" style="color: var(--gray-500); font-weight: 500; text-decoration: none; background: none; border: none; padding: 0; font: inherit; cursor: pointer;">← Kembali masukkan email</button>
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
  const otpInput = document.getElementById('forgotOtp');
  const forgotBtn = document.getElementById('forgotBtn');
  const forgotBtnText = document.getElementById('forgotBtnText');
  const errorBanner = document.getElementById('forgotErrorBanner');
  const errorText = document.getElementById('forgotErrorText');
  const forgotCard = document.getElementById('forgotCard');
  
  const emailGroup = document.getElementById('emailGroup');
  const otpGroup = document.getElementById('otpGroup');
  const otpBackLink = document.getElementById('otpBackLink');
  const btnBackToEmail = document.getElementById('btnBackToEmail');
  
  const forgotTitle = document.getElementById('forgotTitle');
  const forgotDesc = document.getElementById('forgotDesc');
  const forgotFooter = document.getElementById('forgotFooter');

  form.addEventListener('submit', (e) => handleForgot(e));
  btnBackToEmail.addEventListener('click', () => handleBackToEmail());

  async function handleForgot(e) {
    e.preventDefault();
    hideError();

    if (currentStep === 1) {
      // Step 1: Send OTP
      userEmail = emailInput.value.trim();
      if (!userEmail) {
        showError('Harap isi alamat email Anda');
        return;
      }

      setLoading(true);

      try {
        await sendResetPasswordEmail(userEmail);
        showToast('Kode verifikasi telah dikirim ke email Anda!', 'success');

        // Transition to Step 2
        currentStep = 2;
        emailGroup.style.display = 'none';
        otpGroup.style.display = 'block';
        otpBackLink.style.display = 'block';
        forgotFooter.style.display = 'none';

        forgotTitle.textContent = 'Verifikasi Kode OTP';
        forgotDesc.textContent = `Masukkan kode verifikasi yang dikirim ke email ${userEmail}.`;
        forgotBtnText.textContent = 'Verifikasi Kode OTP →';

        otpInput.value = '';
        otpInput.required = true;
        otpInput.focus();

        setLoading(false);
      } catch (err) {
        console.error('[Forgot Stage 1] Error:', err);
        showError(err.message || 'Gagal mengirim kode verifikasi');
        shakeCard();
        setLoading(false);
      }
    } else {
      // Step 2: Verify OTP
      const otpCode = otpInput.value.trim();
      if (!otpCode) {
        showError('Harap masukkan kode verifikasi Anda');
        return;
      }
      if (otpCode.length < 6) {
        showError('Kode verifikasi harus minimal 6 digit');
        return;
      }

      setLoading(true);

      try {
        await verifyRecoveryOtp(userEmail, otpCode);
        showToast('Kode verifikasi berhasil! Silakan atur sandi baru.', 'success');

        // Navigate to reset password page
        setTimeout(() => {
          window.location.hash = '#/reset-password';
        }, 500);
      } catch (err) {
        console.error('[Forgot Stage 2] Error:', err);
        showError(err.message || 'Kode verifikasi salah atau kedaluwarsa');
        shakeCard();
        setLoading(false);
      }
    }
  }

  function handleBackToEmail() {
    currentStep = 1;
    emailGroup.style.display = 'block';
    otpGroup.style.display = 'none';
    otpBackLink.style.display = 'none';
    forgotFooter.style.display = 'block';

    forgotTitle.textContent = 'Lupa Kata Sandi?';
    forgotDesc.textContent = 'Masukkan email terdaftar untuk menerima kode verifikasi atur ulang kata sandi.';
    forgotBtnText.textContent = 'Kirim Kode Verifikasi →';

    otpInput.required = false;
    emailInput.focus();
    hideError();
  }

  function setLoading(loading) {
    const btnTextElement = forgotBtn.querySelector('.btn-text');
    const btnLoading = forgotBtn.querySelector('.btn-loading');
    
    forgotBtn.disabled = loading;
    btnTextElement.style.display = loading ? 'none' : '';
    btnLoading.style.display = loading ? '' : 'none';
    emailInput.disabled = loading;
    otpInput.disabled = loading;
  }

  function showError(message) {
    errorText.textContent = message;
    errorBanner.style.display = 'flex';
  }

  function hideError() {
    errorBanner.style.display = 'none';
    errorText.textContent = '';
  }

  function shakeCard() {
    forgotCard.classList.remove('shake');
    void forgotCard.offsetWidth; // force reflow
    forgotCard.classList.add('shake');
  }
}
