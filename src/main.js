// SIMPAH - Main Application Bootstrap (Performance Optimized)
// Critical CSS only — loaded eagerly for instant LCP
import './styles/index.css';
import './styles/auth.css';
import './styles/components.css';

// Handle dynamic import chunk loading error due to new deployment/release (Stale Asset Cache)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[Vite] Dynamic import chunk load error detected (new build deployed). Reloading page...');
  event.preventDefault();
  window.location.reload();
});

import { registerRoute, startRouter } from './router.js';
import { initTheme, getCurrentUser } from './utils/helpers.js';
import { initPWAInstall } from './lib/pwa.js';

// ── Lazy CSS loaders (non-critical, loaded on demand) ──────────────────────
let _dashboardCssLoaded = false;
let _pwaCssLoaded = false;
let _portalCssLoaded = false;

async function loadDashboardCSS() {
  if (_dashboardCssLoaded) return;
  _dashboardCssLoaded = true;
  await Promise.all([
    import('./styles/dashboard.css'),
    import('./styles/intervensi-print.css'),
    import('leaflet/dist/leaflet.css'),
  ]);
}

async function loadPwaCSS() {
  if (_pwaCssLoaded) return;
  _pwaCssLoaded = true;
  await import('./styles/pwa.css');
}

async function loadPortalCSS() {
  if (_portalCssLoaded) return;
  _portalCssLoaded = true;
  await import('./styles/portal.css');
}

// ── Background initialization (non-blocking) ──────────────────────────────
let _dbReadyResolve;
const _dbReady = new Promise((resolve) => {
  _dbReadyResolve = resolve;
});

function initDatabaseServices() {
  (async () => {
    try {
      const { initDB } = await import('./db/schema.js');
      await initDB();
      const { seedDatabase } = await import('./db/seed.js');
      await seedDatabase();
      const { initSync } = await import('./db/sync.js');
      initSync();
    } catch (err) {
      console.warn('Background DB init warning:', err);
    } finally {
      _dbReadyResolve();
    }
  })();
}

function initBackgroundServices() {
  // Initialize auth in background
  (async () => {
    try {
      const { initAuth, waitForAuth, getAuthProfile, getDefaultRoute } = await import('./lib/auth.js');
      const authInitPromise = (async () => {
        await initAuth();
        await waitForAuth();
      })();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth initialization timed out after 10 seconds')), 10000)
      );
      await Promise.race([authInitPromise, timeoutPromise]);

      // If user is logged in, and they are currently on the login page or root, redirect them!
      const user = getAuthProfile();
      if (user) {
        const currentHash = window.location.hash.slice(1) || '/';
        if (currentHash === '/login' || currentHash === '/') {
          window.location.hash = getDefaultRoute(user);
        }
      }
    } catch (authErr) {
      console.warn('Auth init warning:', authErr);
    }
  })();

  // Register SW manually (non-blocking, after page load)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const { registerSW } = await import('virtual:pwa-register');
        registerSW({ immediate: true });
      } catch (err) {
        console.warn('SW registration warning:', err);
      }
    });
  }
}

// ── Helper: wait for DB before data-dependent operations ───────────────────
export function waitForDB() {
  return _dbReady || Promise.resolve();
}

// ── Route Registration (all lazy-loaded) ───────────────────────────────────
function registerAllRoutes() {
  // Auth routes (login CSS already loaded eagerly)
  registerRoute('/login', async () => {
    const { renderLogin } = await import('./pages/login.js');
    return renderLogin();
  });
  registerRoute('/register', async () => {
    const { renderRegister } = await import('./pages/register.js');
    return renderRegister();
  });
  registerRoute('/forgot-password', async () => {
    const { renderForgotPassword } = await import('./pages/forgot-password.js');
    return renderForgotPassword();
  });
  registerRoute('/reset-password', async () => {
    const { renderResetPassword } = await import('./pages/reset-password.js');
    return renderResetPassword();
  });

  // Portal routes (lazy CSS + lazy JS)
  registerRoute('/portal', () => { window.location.hash = '#/portal/tentang'; });
  registerRoute('/portal/edukasi', async () => {
    await loadPortalCSS();
    const { renderEdukasi } = await import('./pages/portal/edukasi.js');
    return renderEdukasi();
  });
  registerRoute('/portal/galeri', async () => {
    await loadPortalCSS();
    const { renderGaleri } = await import('./pages/portal/galeri.js');
    return renderGaleri();
  });
  registerRoute('/portal/regulasi', async () => {
    await loadPortalCSS();
    const { renderRegulasi } = await import('./pages/portal/regulasi.js');
    return renderRegulasi();
  });
  registerRoute('/portal/aduan', async () => {
    await loadPortalCSS();
    const { renderAduan } = await import('./pages/portal/aduan.js');
    return renderAduan();
  });
  registerRoute('/portal/cek-aduan', async () => {
    await loadPortalCSS();
    const { renderCekAduan } = await import('./pages/portal/cek-aduan.js');
    return renderCekAduan();
  });
  registerRoute('/portal/tentang', async () => {
    await loadPortalCSS();
    const { renderPortalTentang } = await import('./pages/portal/tentang.js');
    return renderPortalTentang();
  });

  // PWA routes (lazy CSS + lazy JS)
  registerRoute('/pwa/home', async () => {
    await loadPwaCSS();
    const { renderPWAHome } = await import('./pages/pwa/home.js');
    return renderPWAHome();
  }, ['warga', 'petugas', 'eksekutif', 'admin']);
  registerRoute('/pwa/sampah-masuk', async () => {
    await loadPwaCSS();
    const { renderSampahHub } = await import('./pages/pwa/sampah-hub.js');
    return renderSampahHub();
  }, ['petugas', 'admin']);
  registerRoute('/pwa/input-sampah', async () => {
    await loadPwaCSS();
    const { renderInputSampah } = await import('./pages/pwa/input-sampah.js');
    return renderInputSampah();
  }, ['petugas', 'admin']);
  registerRoute('/pwa/input-pilah', async () => {
    await loadPwaCSS();
    const { renderInputPilah } = await import('./pages/pwa/input-pilah.js');
    return renderInputPilah();
  }, ['petugas', 'admin']);
  registerRoute('/pwa/input-residu', async () => {
    await loadPwaCSS();
    const { renderInputResidu } = await import('./pages/pwa/input-residu.js');
    return renderInputResidu();
  }, ['petugas', 'admin']);
  registerRoute('/pwa/armada', async () => {
    await loadPwaCSS();
    const { renderArmada } = await import('./pages/pwa/armada.js');
    return renderArmada();
  }, ['petugas', 'admin']);
  registerRoute('/pwa/insidental', async () => {
    await loadPwaCSS();
    const { renderInsidental } = await import('./pages/pwa/insidental.js');
    return renderInsidental();
  }, ['petugas', 'admin']);
  registerRoute('/pwa/input-olah', async () => {
    await loadPwaCSS();
    const { renderInputOlah } = await import('./pages/pwa/input-olah.js');
    return renderInputOlah();
  }, ['petugas', 'admin']);
  registerRoute('/pwa/riwayat', async () => {
    await loadPwaCSS();
    const { renderRiwayat } = await import('./pages/pwa/riwayat.js');
    return renderRiwayat();
  }, ['petugas', 'eksekutif', 'admin']);

  // Dashboard routes (lazy CSS + lazy JS)
  registerRoute('/dashboard', async () => {
    const user = getCurrentUser();
    if (user && (user.role === 'admin' || user.role === 'eksekutif')) {
      window.location.hash = '#/dashboard/eksekutif';
    } else {
      window.location.hash = '#/dashboard/gis';
    }
  }, ['petugas', 'eksekutif', 'admin']);
  registerRoute('/dashboard/gis', async () => {
    await loadDashboardCSS();
    const { renderGIS } = await import('./pages/dashboard/gis.js');
    return renderGIS();
  }, ['petugas', 'eksekutif', 'admin']);
  registerRoute('/dashboard/eksekutif', async () => {
    await loadDashboardCSS();
    const { renderEksekutif } = await import('./pages/dashboard/eksekutif.js');
    return renderEksekutif();
  }, ['eksekutif', 'admin']);
  registerRoute('/dashboard/laporan', async () => {
    await loadDashboardCSS();
    const { renderLaporan } = await import('./pages/dashboard/laporan.js');
    return renderLaporan();
  }, ['admin']);
  registerRoute('/dashboard/validasi', async () => {
    await loadDashboardCSS();
    const { renderValidasi } = await import('./pages/dashboard/validasi.js');
    return renderValidasi();
  }, ['admin', 'petugas']);
  registerRoute('/dashboard/mou', async () => {
    await loadDashboardCSS();
    const { renderMou } = await import('./pages/dashboard/mou.js');
    return renderMou();
  }, ['admin']);
  registerRoute('/dashboard/intervensi', async () => {
    await loadDashboardCSS();
    const { renderIntervensi } = await import('./pages/dashboard/intervensi.js');
    return renderIntervensi();
  }, ['admin']);
  registerRoute('/dashboard/intervensi-fasum', async () => {
    await loadDashboardCSS();
    const { renderIntervensiFasum } = await import('./pages/dashboard/intervensi-fasum.js');
    return renderIntervensiFasum();
  }, ['admin']);
  registerRoute('/dashboard/edukasi', async () => {
    await loadDashboardCSS();
    const { renderDashboardEdukasi } = await import('./pages/dashboard/edukasi.js');
    return renderDashboardEdukasi();
  }, ['admin']);
  registerRoute('/dashboard/masterdata', async () => {
    await loadDashboardCSS();
    const { renderMasterData } = await import('./pages/dashboard/masterdata.js');
    return renderMasterData();
  }, ['admin']);
  registerRoute('/dashboard/aduan', async () => {
    await loadDashboardCSS();
    const { renderAduanManagement } = await import('./pages/dashboard/aduan.js');
    return renderAduanManagement();
  }, ['warga', 'petugas', 'eksekutif', 'admin']);
}

// ── Bootstrap ──────────────────────────────────────────────────────────────
function bootstrap() {
  try {
    // Phase 1: Instant render (synchronous, < 50ms)
    initTheme();
    initPWAInstall();
    registerAllRoutes();

    // Start router immediately — login page renders NOW (LCP element visible)
    startRouter('/login');

    // Hide splash screen immediately after first route renders
    const loading = document.getElementById('loadingScreen');
    if (loading) {
      setTimeout(() => {
        loading.classList.add('hidden');
      }, 300);
    }

    // Phase 2: Background initialization (non-blocking)
    initBackgroundServices();

    // Phase 3: Defer database & heavy sync services until browser is idle / loaded
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => initDatabaseServices());
    } else {
      window.addEventListener('load', () => {
        setTimeout(initDatabaseServices, 1000);
      });
    }

  } catch (error) {
    console.error('Bootstrap failed:', error);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem;background:#0a0f1a;color:white">
          <div style="max-width:500px">
            <h1 style="font-size:2rem;margin-bottom:1rem;color:#ef4444">⚠ <span style="color:white">Terjadi Kesalahan Sistem</span></h1>
            <p style="color:#9ca3af;margin-bottom:1.5rem">Aplikasi gagal memuat. Ini mungkin disebabkan oleh pembaruan sistem atau data yang tidak kompatibel.</p>
            <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);padding:1rem;border-radius:8px;margin-bottom:2rem;text-align:left;font-family:monospace;font-size:0.875rem;color:#f87171">
              ${error.message}
            </div>
            <div style="display:flex;gap:1rem;justify-content:center">
              <button onclick="location.reload()" style="padding:0.75rem 1.5rem;background:#374151;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;transition:all 0.2s">Muat Ulang</button>
              <button onclick="indexedDB.deleteDatabase('simpah-db');localStorage.clear();location.reload();" style="padding:0.75rem 1.5rem;background:#ef4444;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:600;transition:all 0.2s">🗑 Reset & Perbaiki Sistem</button>
            </div>
          </div>
        </div>
      `;
    }
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
