// SIMPAH - Reset Password Page (Supabase Auth)
import { icons } from '../components/icons.js';
import { resetPassword, logout } from '../lib/auth.js';
import { showToast } from '../components/toast.js';

export function renderResetPassword() {
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
          <span class="logo-text">SIMPAH</span>
        </div>
        <div class="auth-navbar-right">
          <a href="#/portal/tentang" class="nav-link">Tentang Kami</a>
          <a href="#/login" class="nav-btn">Masuk</a>
        </div>
      </nav>

      <div class="auth-split-container">
        <!-- Left Column: Copywriting & Illustration -->
        <div class="reference-left-panel">
          <h2>Buat Kata Sandi Baru <span class="accent-text">SIMPAH Anda</span></h2>
          <p class="desc">Silakan buat kata sandi baru yang kuat untuk mengamankan kembali akun Anda. Kata sandi baru Anda harus unik agar akun tetap aman dari akses tidak sah.</p>
          
          <div class="reference-list">
            <div class="reference-list-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Kata Sandi Harus Memenuhi Kriteria Keamanan</span>
            </div>
            <div class="reference-list-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Pembaruan Kata Sandi Langsung & Instan</span>
            </div>
            <div class="reference-list-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Satu Langkah Menuju Akses Akun Kembali</span>
            </div>
          </div>

          <div class="reference-illustration-wrapper">
            <div class="floating-illustration-card">
              <div class="illustration-glow"></div>
              <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto;">
                <defs>
                  <linearGradient id="svgGradReset" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#34d399" />
                    <stop offset="100%" stop-color="#059669" />
                  </linearGradient>
                </defs>
                <rect width="400" height="300" rx="16" fill="#f8fafc" />
                <circle cx="200" cy="140" r="50" fill="url(#svgGradReset)" opacity="0.15" />
                <path d="M200 110v30m0 0a15 15 0 100 30 15 15 0 000-30z" stroke="url(#svgGradReset)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M175 110h50a25 25 0 00-50 0z" stroke="url(#svgGradReset)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div class="floating-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Perlindungan Akun SIMPAH</span>
            </div>
          </div>
        </div>

        <!-- Right Column: Floating Form Card -->
        <div class="reference-right-panel">
          <div class="reference-card" id="resetCard">
            <div class="login-header">
              <h1>Atur Ulang Kata Sandi</h1>
              <p>Masukkan kata sandi baru Anda di bawah ini.</p>
            </div>

            <!-- Error Banner (hidden by default) -->
            <div class="reference-card border-0 p-0 shadow-none" id="resetErrorBanner" style="display:none">
              <div class="login-error-banner">
                <span class="login-error-icon">${icons.alert}</span>
                <span class="login-error-text" id="resetErrorText"></span>
              </div>
            </div>

            <form id="resetForm" class="login-form">
              <div class="form-group">
                <label class="form-label">Password Baru</label>
                <div class="input-with-icon">
                  <span class="input-icon-left">${icons.shield}</span>
                  <input type="password" id="resetPassword" class="form-input form-input-lg has-icon-left has-icon-right" 
                    placeholder="Masukkan password baru" 
                    required autocomplete="new-password" autofocus />
                  <button type="button" class="input-icon-right-btn" id="toggleResetPassword" tabindex="-1" title="Tampilkan password">
                    ${icons.eye}
                  </button>
                </div>
              </div>

              <!-- Dynamic password criteria checker -->
              <div class="password-criteria-grid">
                <div class="password-criteria-item" id="resetCritLength">
                  ${icons.check} <span>Min. 6 karakter</span>
                </div>
                <div class="password-criteria-item" id="resetCritUppercase">
                  ${icons.check} <span>Huruf besar (A-Z)</span>
                </div>
                <div class="password-criteria-item" id="resetCritLowercase">
                  ${icons.check} <span>Huruf kecil (a-z)</span>
                </div>
                <div class="password-criteria-item" id="resetCritNumber">
                  ${icons.check} <span>Angka (0-9)</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Konfirmasi Password Baru</label>
                <div class="input-with-icon">
                  <span class="input-icon-left">${icons.shield}</span>
                  <input type="password" id="resetConfirmPassword" class="form-input form-input-lg has-icon-left has-icon-right" 
                    placeholder="Konfirmasi password baru" 
                    required autocomplete="new-password" />
                  <button type="button" class="input-icon-right-btn" id="toggleResetConfirmPassword" tabindex="-1" title="Tampilkan password">
                    ${icons.eye}
                  </button>
                </div>
              </div>

              <button type="submit" class="reference-btn-primary" id="resetBtn">
                <span class="btn-text">Simpan Password Baru →</span>
                <span class="btn-loading" style="display:none">
                  <div class="spinner" style="margin:0 auto;width:20px;height:20px;border-width:2px"></div>
                </span>
              </button>
            </form>
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

  const form = document.getElementById('resetForm');
  const passwordInput = document.getElementById('resetPassword');
  const confirmPasswordInput = document.getElementById('resetConfirmPassword');
  const togglePasswordBtn = document.getElementById('toggleResetPassword');
  const toggleConfirmPasswordBtn = document.getElementById('toggleResetConfirmPassword');
  const resetBtn = document.getElementById('resetBtn');
  const errorBanner = document.getElementById('resetErrorBanner');
  const errorText = document.getElementById('resetErrorText');
  const resetCard = document.getElementById('resetCard');

  // Toggle password visibility
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

  // Dynamic Password Criteria Checking
  passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    
    // Check length
    const critLength = document.getElementById('resetCritLength');
    if (val.length >= 6) {
      critLength.classList.add('met');
    } else {
      critLength.classList.remove('met');
    }

    // Check uppercase
    const critUppercase = document.getElementById('resetCritUppercase');
    if (/[A-Z]/.test(val)) {
      critUppercase.classList.add('met');
    } else {
      critUppercase.classList.remove('met');
    }

    // Check lowercase
    const critLowercase = document.getElementById('resetCritLowercase');
    if (/[a-z]/.test(val)) {
      critLowercase.classList.add('met');
    } else {
      critLowercase.classList.remove('met');
    }

    // Check number
    const critNumber = document.getElementById('resetCritNumber');
    if (/[0-9]/.test(val)) {
      critNumber.classList.add('met');
    } else {
      critNumber.classList.remove('met');
    }
  });

  form.addEventListener('submit', (e) => handleReset(e));

  async function handleReset(e) {
    e.preventDefault();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!password || !confirmPassword) {
      showError('Harap isi semua kolom password');
      return;
    }

    // Password criteria checks
    if (password.length < 6) {
      showError('Password harus minimal 6 karakter');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      showError('Password harus mengandung minimal satu huruf besar (A-Z)');
      return;
    }
    if (!/[a-z]/.test(password)) {
      showError('Password harus mengandung minimal satu huruf kecil (a-z)');
      return;
    }
    if (!/[0-9]/.test(password)) {
      showError('Password harus mengandung minimal satu angka (0-9)');
      return;
    }
    if (password !== confirmPassword) {
      showError('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    hideError();

    try {
      await resetPassword(password);
      showToast('Password baru berhasil disimpan! Silakan masuk kembali.', 'success');

      // Logout and redirect
      await logout();
    } catch (err) {
      console.error('[Reset] Error:', err);
      showError(err.message || 'Terjadi kesalahan saat memproses reset password');

      // Shake animation
      resetCard.classList.remove('shake');
      void resetCard.offsetWidth; // force reflow
      resetCard.classList.add('shake');

      setLoading(false);
    }
  }

  function setLoading(loading) {
    const btnText = resetBtn.querySelector('.btn-text');
    const btnLoading = resetBtn.querySelector('.btn-loading');
    
    resetBtn.disabled = loading;
    btnText.style.display = loading ? 'none' : '';
    btnLoading.style.display = loading ? '' : 'none';
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
}
