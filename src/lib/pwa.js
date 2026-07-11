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
    el.style.display = '';
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
 * Hidden by default, shown when beforeinstallprompt fires.
 */
export function getPortalInstallButton() {
  const downloadIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
  
  return `
    <button id="portalInstallBtn" data-pwa-install class="btn btn-lg pwa-install-hero-btn" style="display:none;padding:var(--space-4) var(--space-8);background:rgba(16,185,129,0.15);border:2px solid rgba(16,185,129,0.4);color:#10b981;backdrop-filter:blur(8px);font-weight:700;gap:8px;cursor:pointer;transition:all 0.3s ease">
      ${downloadIcon} Install Aplikasi
    </button>
  `;
}

/**
 * Get the install banner HTML for the dashboard sidebar.
 * Hidden by default, shown when beforeinstallprompt fires.
 */
export function getSidebarInstallBanner() {
  const downloadIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

  return `
    <div id="sidebarInstallBanner" data-pwa-install class="sidebar-install-banner" style="display:none">
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
 * Bind click event listeners to install buttons.
 * Call this after rendering any page that contains install buttons.
 */
export function bindInstallButtons() {
  // Portal hero install button
  const portalBtn = document.getElementById('portalInstallBtn');
  if (portalBtn) {
    portalBtn.addEventListener('click', async () => {
      const accepted = await triggerInstallPrompt();
      if (accepted) {
        portalBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Terinstall!`;
        portalBtn.disabled = true;
      }
    });
    // Show if install is available
    if (canInstall()) portalBtn.style.display = '';
  }

  // Sidebar install button
  const sidebarBtn = document.getElementById('sidebarInstallBtn');
  const sidebarBanner = document.getElementById('sidebarInstallBanner');
  if (sidebarBtn) {
    sidebarBtn.addEventListener('click', async () => {
      const accepted = await triggerInstallPrompt();
      if (accepted && sidebarBanner) {
        sidebarBanner.style.display = 'none';
      }
    });
    // Show banner if install is available
    if (canInstall() && sidebarBanner) sidebarBanner.style.display = '';
  }
}
