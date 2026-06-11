// SIMPAH - Register Page (Sprint 2: Supabase Auth)
import { icons } from '../components/icons.js';
import { register as authRegister, getAuthProfile, getDefaultRoute } from '../lib/auth.js';
import { showToast } from '../components/toast.js';

export function renderRegister() {
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
        <div class="login-card" id="registerCard">
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
            <p>Pendaftaran Akun Baru (Warga)</p>
          </div>

          <!-- Error Banner (hidden by default) -->
          <div class="login-error-banner" id="registerErrorBanner" style="display:none">
            <span class="login-error-icon">${icons.alert}</span>
            <span class="login-error-text" id="registerErrorText"></span>
          </div>

          <!-- Success State Container (hidden by default) -->
          <div id="registerSuccessState" style="display:none; text-align:center; padding: var(--space-4) 0;">
            <div style="color:var(--primary-400); margin-bottom:var(--space-4);">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h3 style="color:#fff; font-size:var(--font-lg); font-weight:700; margin-bottom:var(--space-2)">Registrasi Berhasil!</h3>
            <p id="successMessage" style="color:var(--gray-300); font-size:var(--font-sm); margin-bottom:var(--space-6); line-height:1.5;"></p>
            <a href="#/login" class="btn btn-primary btn-block">
              Masuk Sekarang
            </a>
          </div>

          <form id="registerForm" class="login-form">
            <div class="form-group">
              <label class="form-label">Nama Lengkap</label>
              <div class="input-with-icon">
                <span class="input-icon-left">${icons.user}</span>
                <input type="text" id="regFullName" class="form-input form-input-lg has-icon-left" 
                  placeholder="Nama lengkap Anda" 
                  required autocomplete="name" autofocus />
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Username</label>
              <div class="input-with-icon">
                <span class="input-icon-left">${icons.users}</span>
                <input type="text" id="regUsername" class="form-input form-input-lg has-icon-left" 
                  placeholder="Username (hanya huruf, angka, & _)" 
                  required autocomplete="username" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Email</label>
              <div class="input-with-icon">
                <span class="input-icon-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input type="email" id="regEmail" class="form-input form-input-lg has-icon-left" 
                  placeholder="nama@email.com" 
                  required autocomplete="email" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-with-icon">
                <span class="input-icon-left">${icons.shield}</span>
                <input type="password" id="regPassword" class="form-input form-input-lg has-icon-left has-icon-right" 
                  placeholder="Minimal 6 karakter" 
                  required autocomplete="new-password" />
                <button type="button" class="input-icon-right-btn" id="toggleRegPassword" tabindex="-1" title="Tampilkan password">
                  ${icons.eye}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Konfirmasi Password</label>
              <div class="input-with-icon">
                <span class="input-icon-left">${icons.shield}</span>
                <input type="password" id="regConfirmPassword" class="form-input form-input-lg has-icon-left has-icon-right" 
                  placeholder="Ulangi password" 
                  required autocomplete="new-password" />
                <button type="button" class="input-icon-right-btn" id="toggleRegConfirmPassword" tabindex="-1" title="Tampilkan password">
                  ${icons.eye}
                </button>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg btn-block" id="registerBtn" style="margin-top: var(--space-4);">
              <span class="btn-text">Daftar</span>
              <span class="btn-loading" style="display:none">
                <div class="spinner" style="margin:0 auto;width:20px;height:20px;border-width:2px"></div>
              </span>
            </button>
          </form>

          <div class="login-footer" style="text-align:center; margin-top:var(--space-6); font-size:var(--font-sm); color:var(--gray-400)">
            Sudah memiliki akun? <a href="#/login" style="color:var(--primary-400); text-decoration:none; font-weight:600">Masuk</a>
          </div>
        </div>
      </div>
    </div>
    <style>
      .login-footer a:hover {
        text-decoration: underline !important;
      }
    </style>
  `;

  // ── DOM Elements ────────────────────────────────────────────────
  const form = document.getElementById('registerForm');
  const fullNameInput = document.getElementById('regFullName');
  const usernameInput = document.getElementById('regUsername');
  const emailInput = document.getElementById('regEmail');
  const passwordInput = document.getElementById('regPassword');
  const confirmPasswordInput = document.getElementById('regConfirmPassword');
  const registerBtn = document.getElementById('registerBtn');
  const togglePasswordBtn = document.getElementById('toggleRegPassword');
  const toggleConfirmPasswordBtn = document.getElementById('toggleRegConfirmPassword');
  const errorBanner = document.getElementById('registerErrorBanner');
  const errorText = document.getElementById('registerErrorText');
  const registerCard = document.getElementById('registerCard');
  const successState = document.getElementById('registerSuccessState');
  const successMessage = document.getElementById('successMessage');

  // ── Password Visibility Toggles ─────────────────────────────────
  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.innerHTML = isPassword ? icons.eyeOff || icons.eye : icons.eye;
  });

  toggleConfirmPasswordBtn.addEventListener('click', () => {
    const isPassword = confirmPasswordInput.type === 'password';
    confirmPasswordInput.type = isPassword ? 'text' : 'password';
    toggleConfirmPasswordBtn.innerHTML = isPassword ? icons.eyeOff || icons.eye : icons.eye;
  });

  // ── Form Submission ─────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const fullName = fullNameInput.value.trim();
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // 1. Validation Checks
    if (!fullName || !username || !email || !password || !confirmPassword) {
      showError('Semua kolom harus diisi');
      return;
    }

    // Username format check (alphanumeric and underscore)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      showError('Username hanya boleh berisi huruf, angka, dan garis bawah (_)');
      shakeCard();
      return;
    }

    // Password length check (minimum 6 characters for Supabase)
    if (password.length < 6) {
      showError('Password harus minimal 6 karakter');
      shakeCard();
      return;
    }

    // Password matching check
    if (password !== confirmPassword) {
      showError('Konfirmasi password tidak cocok');
      shakeCard();
      return;
    }

    // 2. Perform Register
    setLoading(true);

    try {
      const data = await authRegister(email, password, username, fullName);
      showToast('Registrasi berhasil!', 'success');

      // Check if user is active or needs confirmation
      // Supabase returns user object. If confirmation is active, user.identities might be empty or user.confirmed_at is null
      const isConfirmed = data.user?.email_confirmed_at || data.user?.confirmed_at;

      // Render success state
      form.style.display = 'none';
      document.querySelector('.login-footer').style.display = 'none';
      
      if (!isConfirmed && data.user?.confirmation_sent_at) {
        successMessage.textContent = 'Akun Anda telah berhasil didaftarkan. Silakan periksa email Anda (termasuk folder spam) untuk memverifikasi alamat email sebelum melakukan login.';
      } else {
        successMessage.textContent = 'Akun Anda telah berhasil terdaftar sebagai Warga SIMPAH. Anda sekarang dapat masuk menggunakan email dan password Anda.';
      }

      successState.style.display = 'block';

    } catch (err) {
      console.error('[Register] Error:', err);
      showError(err.message || 'Terjadi kesalahan saat pendaftaran');
      shakeCard();
      setLoading(false);
    }
  });

  // Helper Functions
  function setLoading(loading) {
    const btnText = registerBtn.querySelector('.btn-text');
    const btnLoading = registerBtn.querySelector('.btn-loading');
    
    registerBtn.disabled = loading;
    btnText.style.display = loading ? 'none' : '';
    btnLoading.style.display = loading ? '' : 'none';
    
    fullNameInput.disabled = loading;
    usernameInput.disabled = loading;
    emailInput.disabled = loading;
    passwordInput.disabled = loading;
    confirmPasswordInput.disabled = loading;
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
    registerCard.classList.remove('shake');
    void registerCard.offsetWidth; // force reflow
    registerCard.classList.add('shake');
  }
}
