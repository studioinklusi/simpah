// SIMPAH - PWA Install Manager
// Handles beforeinstallprompt event, install prompt, and install state detection

let deferredPrompt = null;
let isInstalled = false;

/**
 * Initialize PWA install event listeners.
 * Call this once at app bootstrap.
 */
export function initPWAInstall() {
  // Check if app is already installed (standalone mode)
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    isInstalled = true;
  }

  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    isInstalled = false;
    // Show install buttons across the app
    showInstallButtons();
  });

  // Listen for successful installation
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    isInstalled = true;
    hideInstallButtons();
    console.log('[PWA] SIMPAH berhasil diinstall!');
  });
}

/**
 * Trigger the browser's native install prompt.
 * Returns true if user accepted, false otherwise.
 */
export async function triggerInstallPrompt() {
  if (!deferredPrompt) return false;

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    
    if (outcome === 'accepted') {
      isInstalled = true;
      hideInstallButtons();
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[PWA] Install prompt error:', err);
    return false;
  }
}

/**
 * Check if install prompt is available.
 */
export function canInstall() {
  return deferredPrompt !== null && !isInstalled;
}

/**
 * Check if app is already installed.
 */
export function isAppInstalled() {
  return isInstalled;
}

/**
 * Show all install buttons across the app.
 */
function showInstallButtons() {
  document.querySelectorAll('[data-pwa-install]').forEach(el => {
    if (!isInstalled) {
      el.style.display = el.tagName === 'A' ? 'inline-flex' : '';
    }
  });
}

/**
 * Hide all install buttons across the app.
 */
function hideInstallButtons() {
  document.querySelectorAll('[data-pwa-install]').forEach(el => {
    el.style.display = 'none';
  });
}

/**
 * Get the install button HTML for the portal hero section.
 * Always visible by default (unless installed), triggers native prompt or shows fallback guide on click.
 */
export function getPortalInstallButton() {
  const downloadIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
  
  return `
    <button id="portalInstallBtn" data-pwa-install class="btn btn-lg pwa-install-hero-btn" style="padding:var(--space-4) var(--space-8);background:rgba(16,185,129,0.15);border:2px solid rgba(16,185,129,0.4);color:#10b981;backdrop-filter:blur(8px);font-weight:700;gap:8px;cursor:pointer;transition:all 0.3s ease">
      ${downloadIcon} Install Aplikasi
    </button>
  `;
}

/**
 * Get the install button HTML for navbars (e.g. login navbar, public header).
 * Always visible by default (unless installed), triggers native prompt or shows fallback guide on click.
 */
export function getNavbarInstallButton(className = 'nav-link') {
  const downloadIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:text-bottom"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
  return `
    <a href="javascript:void(0)" id="navbarInstallBtn" data-pwa-install class="${className}" style="display:inline-flex;align-items:center">
      ${downloadIcon} Download Aplikasi
    </a>
  `;
}

/**
 * Get the install banner HTML for the dashboard sidebar.
 * Always visible by default (unless installed), triggers native prompt or shows fallback guide on click.
 */
export function getSidebarInstallBanner() {
  const downloadIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

  return `
    <div id="sidebarInstallBanner" data-pwa-install class="sidebar-install-banner">
      <div class="sidebar-install-icon">
        <img src="/icons/icon-192.png" alt="SIMPAH" width="28" height="28" style="border-radius:6px">
      </div>
      <div class="sidebar-install-text">
        <div class="sidebar-install-title">Install SIMPAH</div>
        <div class="sidebar-install-desc">Akses lebih cepat dari layar utama</div>
      </div>
      <button id="sidebarInstallBtn" class="sidebar-install-action" title="Install Aplikasi">
        ${downloadIcon}
      </button>
    </div>
  `;
}

/**
 * Show a friendly guide modal when native PWA installation is not supported or ready
 */
export function showInstallGuideModal() {
  const modalContainer = document.getElementById('modal-container') || document.body;
  
  // Remove existing guide modal if any
  const existing = document.getElementById('pwaGuideModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'pwaGuideModal';
  modal.className = 'modal-backdrop active';
  modal.style.zIndex = '9999';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  
  modal.innerHTML = `
    <div class="modal-card" style="max-width:480px;animation:modalEnter 0.3s ease;font-family:Inter,sans-serif;margin:var(--space-4)">
      <div class="modal-header" style="border-bottom:1px solid var(--border-color);padding:var(--space-4) var(--space-6);display:flex;justify-content:space-between;align-items:center">
        <h3 style="font-size:var(--font-lg);font-weight:800;color:var(--text-primary);margin:0;display:flex;align-items:center;gap:8px">
          <img src="/icons/icon-192.png" width="24" height="24" style="border-radius:6px"> Install SIMPAH
        </h3>
        <button id="closePwaGuideBtn" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:24px;line-height:1">&times;</button>
      </div>
      <div class="modal-body" style="padding:var(--space-6)">
        <p style="font-size:var(--font-sm);color:var(--text-secondary);line-height:1.6;margin-bottom:var(--space-6)">
          Instal SIMPAH di ponsel atau komputer Anda untuk akses lebih cepat, konsumsi data lebih hemat, dan dukungan input data secara offline di lapangan.
        </p>

        <!-- Android & Chrome -->
        <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:12px;padding:var(--space-4);margin-bottom:var(--space-4);text-align:left">
          <h4 style="font-size:var(--font-sm);font-weight:700;margin-bottom:6px;color:var(--text-primary);display:flex;align-items:center;gap:6px">
            🤖 Android / Google Chrome / Edge
          </h4>
          <ol style="margin:0;padding-left:18px;font-size:12px;color:var(--text-secondary);line-height:1.6">
            <li>Klik tombol menu titik tiga di pojok kanan atas browser Anda.</li>
            <li>Pilih opsi <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
          </ol>
        </div>

        <!-- iOS Safari -->
        <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:12px;padding:var(--space-4);text-align:left">
          <h4 style="font-size:var(--font-sm);font-weight:700;margin-bottom:6px;color:var(--text-primary);display:flex;align-items:center;gap:6px">
            🍎 iPhone / iPad (Safari)
          </h4>
          <ol style="margin:0;padding-left:18px;font-size:12px;color:var(--text-secondary);line-height:1.6">
            <li>Buka halaman ini menggunakan browser bawaan <strong>Safari</strong>.</li>
            <li>Ketuk tombol <strong>Bagikan (Share)</strong> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;display:inline-block;margin:0 2px"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> di bagian bawah layar.</li>
            <li>Gulir ke bawah dan ketuk opsi <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</li>
          </ol>
        </div>
      </div>
      <div class="modal-footer" style="border-top:1px solid var(--border-color);padding:var(--space-4) var(--space-6);text-align:right">
        <button id="closePwaGuideBtn2" class="btn btn-secondary btn-sm" style="padding:var(--space-2) var(--space-4)">Tutup</button>
      </div>
    </div>
  `;

  modalContainer.appendChild(modal);

  const close = () => {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  };
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  modal.querySelector('#closePwaGuideBtn').addEventListener('click', close);
  modal.querySelector('#closePwaGuideBtn2').addEventListener('click', close);
}

/**
 * Bind click event listeners to install buttons.
 * Call this after rendering any page that contains install buttons.
 */
export function bindInstallButtons() {
  // Check and show buttons if NOT installed
  document.querySelectorAll('[data-pwa-install]').forEach(el => {
    if (isInstalled) {
      el.style.display = 'none';
    } else {
      el.style.display = el.tagName === 'A' ? 'inline-flex' : '';
    }
  });

  // Portal hero install button
  const portalBtn = document.getElementById('portalInstallBtn');
  if (portalBtn) {
    portalBtn.addEventListener('click', async () => {
      const accepted = await triggerInstallPrompt();
      if (accepted) {
        portalBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Terinstall!`;
        portalBtn.disabled = true;
      } else {
        showInstallGuideModal();
      }
    });
  }

  // Navbar install button (Login/Portal)
  const navbarBtn = document.getElementById('navbarInstallBtn');
  if (navbarBtn) {
    navbarBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const accepted = await triggerInstallPrompt();
      if (!accepted) {
        showInstallGuideModal();
      }
    });
  }

  // Sidebar install button
  const sidebarBtn = document.getElementById('sidebarInstallBtn');
  const sidebarBanner = document.getElementById('sidebarInstallBanner');
  if (sidebarBtn) {
    sidebarBtn.addEventListener('click', async () => {
      const accepted = await triggerInstallPrompt();
      if (accepted && sidebarBanner) {
        sidebarBanner.style.display = 'none';
      } else {
        showInstallGuideModal();
      }
    });
  }
}
