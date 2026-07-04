// SIMPAH - Register Page (Sprint 2: Supabase Auth)
import { icons } from '../components/icons.js';
import { register as authRegister, getAuthProfile, getDefaultRoute } from '../lib/auth.js';
import { getAllMasterWilayah, validateInvitationCode } from '../db/store.js';
import { wireSearchableSelect } from '../utils/searchable-select.js';

export async function renderRegister() {
  // If already logged in, redirect to default page
  const existingUser = getAuthProfile();
  if (existingUser) {
    window.location.hash = getDefaultRoute(existingUser.role);
    return;
  }

  // Load master wilayah data for Kecamatan/Desa dropdowns
  let masterWilayah = [];
  try {
    masterWilayah = await getAllMasterWilayah();
  } catch (err) {
    console.warn('[Register] Failed to load master wilayah:', err);
  }
  const kecamatanList = [...new Set(masterWilayah.map(w => w.kecamatan))].sort();

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
        <h2>Belajar Pemilahan Sampah Jadi <span class="accent-text">Mudah & Praktis!</span></h2>
        <p class="desc">Daftarkan akun Anda hari ini untuk mengakses modul edukasi interaktif, mencatatkan setoran sampah terpilah secara real-time, dan mengumpulkan poin kontribusi hijau.</p>
        
        <div class="reference-list">
          <div class="reference-list-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Pencatatan Sampah Terpilah & Real-time</span>
          </div>
          <div class="reference-list-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Modul Edukasi Interaktif & Kuis Lingkungan</span>
          </div>
          <div class="reference-list-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Sertifikat Kontribusi & Penukaran Poin Warga</span>
          </div>
        </div>

        <div class="reference-illustration-wrapper">
          <div class="floating-illustration-card">
            <div class="illustration-glow"></div>
            <!-- Sustainability Illustration SVG -->
            <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto;">
              <defs>
                <linearGradient id="svgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#34d399" />
                  <stop offset="100%" stop-color="#059669" />
                </linearGradient>
              </defs>
              <rect width="400" height="300" rx="16" fill="#f8fafc" />
              <!-- Recycling Bin abstract vector -->
              <rect x="150" y="140" width="100" height="120" rx="16" fill="url(#svgGrad)" />
              <path d="M170 140 L160 90 H240 L230 140 Z" fill="#047857" opacity="0.8" />
              <!-- Recycle Arrows symbol inside bin -->
              <path d="M190 200 C190 185 200 180 210 180 M210 180 L205 175 M210 180 L205 185" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M210 200 C210 215 200 220 190 220 M190 220 L195 225 M190 220 L195 215" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              <!-- Growing Leaf from bin -->
              <path d="M200 90 Q200 50 220 40 Q225 60 200 90" fill="#34d399" />
              <path d="M200 90 Q200 60 180 50 Q175 70 200 90" fill="#10b981" />
              <circle cx="270" cy="80" r="15" fill="#38bdf8" opacity="0.2" />
              <circle cx="120" cy="190" r="10" fill="#fbbf24" opacity="0.2" />
            </svg>
          </div>
          <div class="floating-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Bumi Bersih!</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Floating Form Card -->
      <div class="reference-right-panel">
        <div class="reference-card" id="registerCard">
          <div class="login-header">
            <h1>Daftar Akun Baru</h1>
            <p>Mulai perjalanan kontribusi hijau Anda hari ini.</p>
          </div>

          <!-- Error Banner (hidden by default) -->
          <div class="reference-card border-0 p-0 shadow-none" id="registerErrorBanner" style="display:none">
            <div class="login-error-banner">
              <span class="login-error-icon">${icons.alert}</span>
              <span class="login-error-text" id="registerErrorText"></span>
            </div>
          </div>

          <!-- Success State Container (hidden by default) -->
          <div id="registerSuccessState" style="display:none; text-align:center; padding: var(--space-4) 0;">
            <div style="color:#059669; margin-bottom:var(--space-4);">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h3 style="color:#111827; font-size:var(--font-lg); font-weight:700; margin-bottom:var(--space-2)">Registrasi Berhasil!</h3>
            <p id="successMessage" style="color:#4b5563; font-size:var(--font-sm); margin-bottom:var(--space-6); line-height:1.5;"></p>
            <a href="#/login" class="reference-btn-primary" style="margin-top:0">
              Masuk Sekarang
            </a>
          </div>

          <form id="registerForm" class="login-form">
            <div class="form-group" style="margin-bottom: var(--space-4);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-1)">
                <label class="form-label" style="margin-bottom:0">Kode Undangan (Opsional)</label>
                <span style="font-size:var(--font-xs); color:var(--text-muted)">Khusus Petugas & Eksekutif</span>
              </div>
              <div class="input-with-icon">
                <span class="input-icon-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input type="text" id="regInvitationCode" class="form-input form-input-lg has-icon-left" 
                  placeholder="Masukkan kode (jika ada)" 
                  autocomplete="off" style="text-transform: uppercase;" />
              </div>
              <div id="invitationFeedback" style="display:none; font-size:var(--font-xs); margin-top:var(--space-1); align-items:center; gap:4px">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nama Lengkap</label>
              <div class="input-with-icon">
                <span class="input-icon-left">${icons.user}</span>
                <input type="text" id="regFullName" class="form-input form-input-lg has-icon-left" 
                  placeholder="Masukkan nama lengkap Anda" 
                  required autocomplete="name" autofocus />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Kecamatan</label>
              <div class="custom-select-container" id="regKecSelectContainer">
                <div class="custom-select-wrapper">
                  <input type="text" id="regKecamatan" class="form-input form-input-lg" placeholder="Ketik/Pilih Kecamatan (Opsional)..." autocomplete="off" style="border: 1px solid var(--border-color);" />
                  <span class="custom-select-arrow">▼</span>
                </div>
                <div class="custom-select-dropdown" id="regKecDropdown" style="display:none;"></div>
                <div id="regKecFeedback" style="color:#ef4444; font-size:var(--font-xs); margin-top:4px; display:none; font-weight:600;">⚠️ Kecamatan tidak ditemukan</div>
              </div>
            </div>

            <div class="form-group" id="regDesaGroup" style="display:none">
              <label class="form-label">Desa / Kelurahan</label>
              <div class="custom-select-container" id="regDesaSelectContainer">
                <div class="custom-select-wrapper">
                  <input type="text" id="regDesaInput" class="form-input form-input-lg" placeholder="Ketik/Pilih Desa..." autocomplete="off" style="border: 1px solid var(--border-color);" />
                  <span class="custom-select-arrow">▼</span>
                </div>
                <div class="custom-select-dropdown" id="regDesaDropdown" style="display:none;"></div>
                <input type="hidden" id="regDesa" />
                <div id="regDesaFeedback" style="color:#ef4444; font-size:var(--font-xs); margin-top:4px; display:none; font-weight:600;">⚠️ Desa tidak ditemukan di kecamatan terpilih</div>
                <div id="desaFromCodeBadge" style="display:none; font-size:var(--font-xs); margin-top:var(--space-1); color:#059669; align-items:center; gap:4px"></div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Username</label>
              <div class="input-with-icon">
                <span class="input-icon-left">${icons.users}</span>
                <input type="text" id="regUsername" class="form-input form-input-lg has-icon-left" 
                  placeholder="Masukkan username baru" 
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
                  placeholder="Masukkan password baru" 
                  required autocomplete="new-password" />
                <button type="button" class="input-icon-right-btn" id="toggleRegPassword" tabindex="-1" title="Tampilkan password">
                  ${icons.eye}
                </button>
              </div>
              
              <!-- Dynamic password criteria checker -->
              <div class="password-criteria-grid">
                <div class="password-criteria-item" id="critLength">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Min. 6 karakter</span>
                </div>
                <div class="password-criteria-item" id="critUppercase">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Huruf besar (A-Z)</span>
                </div>
                <div class="password-criteria-item" id="critLowercase">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Huruf kecil (a-z)</span>
                </div>
                <div class="password-criteria-item" id="critNumber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Angka (0-9)</span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Konfirmasi Password</label>
              <div class="input-with-icon">
                <span class="input-icon-left">${icons.shield}</span>
                <input type="password" id="regConfirmPassword" class="form-input form-input-lg has-icon-left has-icon-right" 
                  placeholder="Konfirmasi password baru" 
                  required autocomplete="new-password" />
                <button type="button" class="input-icon-right-btn" id="toggleRegConfirmPassword" tabindex="-1" title="Tampilkan password">
                  ${icons.eye}
                </button>
              </div>
            </div>

            <button type="submit" class="reference-btn-primary" id="registerBtn">
              <span class="btn-text">Daftar Sekarang →</span>
              <span class="btn-loading" style="display:none">
                <div class="spinner" style="margin:0 auto;width:20px;height:20px;border-width:2px"></div>
              </span>
            </button>
          </form>

          <div class="login-footer">
            Sudah punya akun? <a href="#/login">Masuk di sini</a>
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

  // ── DOM Elements ────────────────────────────────────────────────
  const form = document.getElementById('registerForm');
  const invitationCodeInput = document.getElementById('regInvitationCode');
  const invitationFeedback = document.getElementById('invitationFeedback');
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

  // ── Dynamic Password Criteria Checking ──────────────────────────
  passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    
    // 1. Min 6 characters
    const isMinLength = val.length >= 6;
    toggleCriteriaClass('critLength', isMinLength);
    
    // 2. Has uppercase
    const hasUppercase = /[A-Z]/.test(val);
    toggleCriteriaClass('critUppercase', hasUppercase);
    
    // 3. Has lowercase
    const hasLowercase = /[a-z]/.test(val);
    toggleCriteriaClass('critLowercase', hasLowercase);
    
    // 4. Has number
    const hasNumber = /[0-9]/.test(val);
    toggleCriteriaClass('critNumber', hasNumber);
  });

  function toggleCriteriaClass(elementId, meetsCriteria) {
    const el = document.getElementById(elementId);
    if (el) {
      if (meetsCriteria) {
        el.classList.add('met');
      } else {
        el.classList.remove('met');
      }
    }
  }

  let isInvitationCodeValid = true;
  let resolvedRole = 'warga';
  let resolvedJobType = null;
  let resolvedDesaId = null;
  let resolvedKecamatan = null;  // ── Kecamatan → Desa Cascading Dropdown (Searchable Select) ─────────
  const regKecamatan = document.getElementById('regKecamatan');
  const regDesaGroup = document.getElementById('regDesaGroup');
  const regDesaInput = document.getElementById('regDesaInput');
  const regDesa = document.getElementById('regDesa');
  const desaFromCodeBadge = document.getElementById('desaFromCodeBadge');
  const regKecFeedback = document.getElementById('regKecFeedback');
  const regDesaFeedback = document.getElementById('regDesaFeedback');

  let selectKecInstance, selectDesaInstance;

  selectKecInstance = wireSearchableSelect({
    inputEl: regKecamatan,
    dropdownEl: document.getElementById('regKecDropdown'),
    hiddenEl: { value: '' },
    feedbackEl: regKecFeedback,
    getOptions: () => {
      const uniqueKec = [...new Set(masterWilayah.map(w => w.kecamatan))].sort();
      return uniqueKec.map(k => ({ value: k, label: k }));
    },
    onSelect: (opt) => {
      regDesaGroup.style.display = 'block';
      regDesaInput.value = '';
      regDesa.value = '';
      desaFromCodeBadge.style.display = 'none';
    },
    onClear: () => {
      regDesaGroup.style.display = 'none';
      regDesaInput.value = '';
      regDesa.value = '';
      desaFromCodeBadge.style.display = 'none';
    }
  });

  selectDesaInstance = wireSearchableSelect({
    inputEl: regDesaInput,
    dropdownEl: document.getElementById('regDesaDropdown'),
    hiddenEl: regDesa,
    feedbackEl: regDesaFeedback,
    getOptions: () => {
      const selectedKec = regKecamatan.value.trim();
      const filtered = masterWilayah.filter(w => w.kecamatan.toLowerCase() === selectedKec.toLowerCase());
      return filtered.map(w => ({ value: w.id, label: w.desa_kelurahan }));
    },
    onSelect: (opt) => {
      // Validated
    },
    onClear: () => {
      // Cleared
    }
  });
  invitationCodeInput.addEventListener('change', async () => {
    const code = invitationCodeInput.value.trim();
    if (!code) {
      invitationFeedback.style.display = 'none';
      invitationFeedback.innerHTML = '';
      isInvitationCodeValid = true;
      resolvedRole = 'warga';
      return;
    }

    invitationFeedback.style.display = 'flex';
    invitationFeedback.style.color = '#4b5563';
    invitationFeedback.innerHTML = `<div class="spinner" style="width:12px;height:12px;border-width:1.5px;margin:0"></div> Memvalidasi kode...`;

    try {
      const res = await validateInvitationCode(code);
      if (res && res.is_valid) {
        isInvitationCodeValid = true;
        resolvedRole = res.role;
        resolvedJobType = res.job_type;
        resolvedDesaId = res.desa_id || null;
        resolvedKecamatan = res.kecamatan || null;
        invitationFeedback.style.color = '#059669';
        
        let roleName = res.role;
        if (res.role === 'petugas') {
          const jobLabels = {
            kader: 'Kader Lingkungan',
            operator_tps: 'Operator TPS3R',
            angkut: 'Petugas Pengangkut',
            koordinator: 'Koordinator Lapangan'
          };
          roleName = jobLabels[res.job_type] || 'Petugas Lapangan';
        } else if (res.role === 'eksekutif') {
          roleName = 'Eksekutif';
        } else if (res.role === 'admin') {
          roleName = 'Administrator';
        } else {
          roleName = 'Warga';
        }

        if (res.location_name) {
          roleName += ` - ${res.location_name}`;
        }
        invitationFeedback.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color:#059669;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Kode Valid: Terdaftar sebagai <strong>${roleName}</strong></span>
        `;
        // Auto-select desa from invitation code if available
        if (res.desa_id) {
          const desaData = masterWilayah.find(w => w.id === res.desa_id);
          if (desaData) {
            regKecamatan.value = desaData.kecamatan;
            regDesaGroup.style.display = 'block';
            regDesaInput.value = desaData.desa_kelurahan;
            regDesa.value = desaData.id;

            // Show badge
            desaFromCodeBadge.style.display = 'flex';
            desaFromCodeBadge.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color:#059669"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Desa otomatis dari kode undangan: <strong>${res.desa_name || desaData.desa_kelurahan}</strong></span>
            `;
          }
        } else if (res.kecamatan) {
          regKecamatan.value = res.kecamatan;
          regDesaGroup.style.display = 'none';
          regDesaInput.value = '';
          regDesa.value = '';

          // Show badge
          desaFromCodeBadge.style.display = 'flex';
          desaFromCodeBadge.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color:#059669"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Kecamatan otomatis dari kode: <strong>${res.kecamatan}</strong></span>
          `;
        }
      } else {
        isInvitationCodeValid = false;
        resolvedRole = 'warga';
        invitationFeedback.style.color = '#b91c1c';
        invitationFeedback.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color:#b91c1c;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>${res?.error_message || 'Kode undangan tidak valid'}</span>
        `;
      }
    } catch (err) {
      console.error('Validation error:', err);
      isInvitationCodeValid = false;
      resolvedRole = 'warga';
      invitationFeedback.style.color = '#b91c1c';
      const errMsg = err?.message || err?.error_description || JSON.stringify(err);
      invitationFeedback.innerHTML = `<span>Gagal memverifikasi kode: ${errMsg}</span>`;
    }
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

    // Password criteria checks
    if (password.length < 6) {
      showError('Password harus minimal 6 karakter');
      shakeCard();
      return;
    }
    if (!/[A-Z]/.test(password)) {
      showError('Password harus mengandung minimal satu huruf besar (A-Z)');
      shakeCard();
      return;
    }
    if (!/[a-z]/.test(password)) {
      showError('Password harus mengandung minimal satu huruf kecil (a-z)');
      shakeCard();
      return;
    }
    if (!/[0-9]/.test(password)) {
      showError('Password harus mengandung minimal satu angka (0-9)');
      shakeCard();
      return;
    }

    // Password matching check
    if (password !== confirmPassword) {
      showError('Konfirmasi password tidak cocok');
      shakeCard();
      return;
    }

    // Check code validity before proceeding
    if (!isInvitationCodeValid) {
      showError('Kode undangan yang Anda masukkan tidak valid. Silakan periksa kembali atau kosongkan.');
      shakeCard();
      return;
    }
    // Kecamatan / Desa selection validation
    const isKecValid = selectKecInstance.validate();
    const isDesaValid = selectDesaInstance.validate();
    const typedKec = regKecamatan.value.trim();
    const desaId = regDesa.value || null;

    if (!isKecValid) {
      showError('Kecamatan tidak ditemukan. Harap pilih dari daftar yang valid.');
      shakeCard();
      regKecamatan.focus();
      return;
    }

    if (typedKec && (!isDesaValid || !desaId)) {
      showError('Harap pilih Desa / Kelurahan yang valid dari Kecamatan terpilih');
      shakeCard();
      regDesaInput.focus();
      return;
    }
    // 2. Perform Register
    setLoading(true);

    try {
      const invitationCode = invitationCodeInput.value.trim();
      const desaId = regDesa.value || null;
      const kecamatan = regKecamatan.value.trim() || null;
      const data = await authRegister(email, password, username, fullName, invitationCode, desaId, kecamatan);
      showToast('Registrasi berhasil!', 'success');

      // Check if user is active or needs confirmation
      const isConfirmed = data.user?.email_confirmed_at || data.user?.confirmed_at;

      // Render success state
      form.style.display = 'none';
      document.querySelector('.login-footer').style.display = 'none';
      
      if (!isConfirmed && data.user?.confirmation_sent_at) {
        successMessage.textContent = 'Akun Anda telah berhasil didaftarkan. Silakan periksa email Anda (termasuk folder spam) untuk memverifikasi alamat email sebelum melakukan login.';
      } else {
        let roleDisplay = 'Warga';
        if (resolvedRole === 'petugas') {
          const jobLabels = {
            kader: 'Kader Lingkungan',
            operator_tps: 'Operator TPS3R',
            angkut: 'Petugas Pengangkut',
            koordinator: 'Koordinator Lapangan'
          };
          roleDisplay = jobLabels[resolvedJobType] || 'Petugas Lapangan';
        } else if (resolvedRole === 'eksekutif') {
          roleDisplay = 'Eksekutif';
        } else if (resolvedRole === 'admin') {
          roleDisplay = 'Administrator';
        }

        successMessage.textContent = `Akun Anda telah berhasil terdaftar sebagai ${roleDisplay} SIMPAH. Anda sekarang dapat masuk menggunakan email dan password Anda.`;
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
    if (btnText) btnText.style.display = loading ? 'none' : '';
    if (btnLoading) btnLoading.style.display = loading ? '' : 'none';
    
    fullNameInput.disabled = loading;
    usernameInput.disabled = loading;
    emailInput.disabled = loading;
    passwordInput.disabled = loading;
    confirmPasswordInput.disabled = loading;
    invitationCodeInput.disabled = loading;
  }

  // Helper inside form
  const borderEl = document.getElementById('registerErrorBanner');

  function showError(message) {
    errorText.textContent = message;
    borderEl.style.display = 'block';
  }

  function hideError() {
    borderEl.style.display = 'none';
    errorText.textContent = '';
  }

  function shakeCard() {
    registerCard.classList.remove('shake');
    void registerCard.offsetWidth; // force reflow
    registerCard.classList.add('shake');
  }
}
