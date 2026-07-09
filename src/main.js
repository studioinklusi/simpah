// SIMPAH - Main Application Bootstrap
import './styles/index.css';
import './styles/components.css';
import './styles/dashboard.css';
import './styles/pwa.css';
import './styles/auth.css';
import './styles/portal.css';
import './styles/intervensi-print.css';
import 'leaflet/dist/leaflet.css';

import { registerRoute, startRouter } from './router.js';
import { icons } from './components/icons.js';
import { initTheme } from './utils/helpers.js';
import { initAuth, waitForAuth } from './lib/auth.js';
import { initDB } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { initSync } from './db/sync.js';

// Pages
import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderForgotPassword } from './pages/forgot-password.js';
import { renderResetPassword } from './pages/reset-password.js';

// Portal Pages
import { renderPortalBeranda } from './pages/portal/beranda.js';
import { renderEdukasi } from './pages/portal/edukasi.js';
import { renderGaleri } from './pages/portal/galeri.js';
import { renderRegulasi } from './pages/portal/regulasi.js';
import { renderAduan } from './pages/portal/aduan.js';
import { renderCekAduan } from './pages/portal/cek-aduan.js';
import { renderPortalTentang } from './pages/portal/tentang.js';
import { renderPWAHome } from './pages/pwa/home.js';
import { renderSampahHub } from './pages/pwa/sampah-hub.js';
import { renderInputSampah } from './pages/pwa/input-sampah.js';
import { renderInputPilah } from './pages/pwa/input-pilah.js';
import { renderInputResidu } from './pages/pwa/input-residu.js';
import { renderArmada } from './pages/pwa/armada.js';
import { renderInsidental } from './pages/pwa/insidental.js';
import { renderInputOlah } from './pages/pwa/input-olah.js';
import { renderRiwayat } from './pages/pwa/riwayat.js';
import { renderGIS } from './pages/dashboard/gis.js';
import { renderEksekutif } from './pages/dashboard/eksekutif.js';
import { renderLaporan } from './pages/dashboard/laporan.js';
import { renderMou } from './pages/dashboard/mou.js';
import { renderIntervensi } from './pages/dashboard/intervensi.js';
import { renderIntervensiFasum } from './pages/dashboard/intervensi-fasum.js';
import { renderMasterData } from './pages/dashboard/masterdata.js';
import { renderValidasi } from './pages/dashboard/validasi.js';
import { renderAduanManagement } from './pages/dashboard/aduan.js';


async function bootstrap() {
  try {
    // Initialize theme
    initTheme();

    // Initialize IndexedDB
    await initDB();

    // Seed demo data
    await seedDatabase();

    // Initialize offline sync
    initSync();

    // Register routes
    registerRoute('/login', () => renderLogin());
    registerRoute('/register', () => renderRegister());
    registerRoute('/forgot-password', () => renderForgotPassword());
    registerRoute('/reset-password', () => renderResetPassword());

    // Portal routes
    registerRoute('/portal', () => { window.location.hash = '#/portal/tentang'; });
    registerRoute('/portal/edukasi', () => renderEdukasi());
    registerRoute('/portal/galeri', () => renderGaleri());
    registerRoute('/portal/regulasi', () => renderRegulasi());
    registerRoute('/portal/aduan', () => renderAduan());
    registerRoute('/portal/cek-aduan', () => renderCekAduan());
    registerRoute('/portal/tentang', () => renderPortalTentang());

    // PWA routes
    registerRoute('/pwa/home', () => renderPWAHome(), ['warga', 'petugas', 'eksekutif', 'admin']);
    registerRoute('/pwa/sampah-masuk', () => renderSampahHub(), ['petugas', 'admin']);
    registerRoute('/pwa/input-sampah', () => renderInputSampah(), ['petugas', 'admin']);
    registerRoute('/pwa/input-pilah', () => renderInputPilah(), ['petugas', 'admin']);
    registerRoute('/pwa/input-residu', () => renderInputResidu(), ['petugas', 'admin']);
    registerRoute('/pwa/armada', () => renderArmada(), ['petugas', 'admin']);
    registerRoute('/pwa/insidental', () => renderInsidental(), ['petugas', 'admin']);
    registerRoute('/pwa/input-olah', () => renderInputOlah(), ['petugas', 'admin']);
    registerRoute('/pwa/riwayat', () => renderRiwayat(), ['petugas', 'eksekutif', 'admin']);

    // Dashboard routes
    registerRoute('/dashboard', () => { window.location.hash = '#/dashboard/gis'; }, ['warga', 'petugas', 'eksekutif', 'admin']);
    registerRoute('/dashboard/gis', () => renderGIS(), ['warga', 'petugas', 'eksekutif', 'admin']);
    registerRoute('/dashboard/eksekutif', () => renderEksekutif(), ['eksekutif', 'admin']);
    registerRoute('/dashboard/laporan', () => renderLaporan(), ['admin']);
    registerRoute('/dashboard/validasi', () => renderValidasi(), ['admin', 'petugas']);
    registerRoute('/dashboard/mou', () => renderMou(), ['admin']);
    registerRoute('/dashboard/intervensi', () => renderIntervensi(), ['admin']);
    registerRoute('/dashboard/intervensi-fasum', () => renderIntervensiFasum(), ['admin']);
    registerRoute('/dashboard/masterdata', () => renderMasterData(), ['admin']);
    registerRoute('/dashboard/aduan', () => renderAduanManagement(), ['warga', 'petugas', 'eksekutif', 'admin']);




    // Initialize auth FIRST (restore Supabase session)
    // Splash screen stays visible until auth state is fully resolved
    try {
      const authInitPromise = (async () => {
        await initAuth();
        await waitForAuth();
      })();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth initialization timed out after 10 seconds')), 10000));
      
      await Promise.race([authInitPromise, timeoutPromise]);
    } catch (authErr) {
      console.warn('Auth init warning:', authErr);
      // Continue anyway — user can still access public routes
    }

    // Start router AFTER auth is resolved — correct routing decision guaranteed
    startRouter('/login');

    // Hide splash screen AFTER routing decision is made
    const loading = document.getElementById('loadingScreen');
    if (loading) {
      setTimeout(() => {
        loading.classList.add('hidden');
      }, 600);
    }

  } catch (error) {
    console.error('Bootstrap failed:', error);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem;background:#0a0f1a;color:white">
          <div style="max-width:500px">
            <h1 style="display:flex;align-items:center;justify-content:center;gap:0.5rem;font-size:2rem;margin-bottom:1rem;color:#ef4444">${icons.alert} <span style="color:white">Terjadi Kesalahan Sistem</span></h1>
            <p style="color:#9ca3af;margin-bottom:1.5rem">Aplikasi gagal memuat data lokal. Ini mungkin disebabkan oleh pembaruan sistem atau data yang tidak kompatibel.</p>
            <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);padding:1rem;border-radius:8px;margin-bottom:2rem;text-align:left;font-family:monospace;font-size:0.875rem;color:#f87171">
              ${error.message}
            </div>
            <div style="display:flex;gap:1rem;justify-content:center">
              <button onclick="location.reload()" style="padding:0.75rem 1.5rem;background:#374151;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;transition:all 0.2s">Muat Ulang</button>
              <button onclick="indexedDB.deleteDatabase('simpah-db');localStorage.clear();location.reload();" style="padding:0.75rem 1.5rem;background:#ef4444;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:600;display:flex;align-items:center;gap:8px;transition:all 0.2s">${icons.trash} Reset & Perbaiki Sistem</button>
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
