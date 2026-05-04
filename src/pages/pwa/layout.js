// SIMPAH - PWA Layout (Header + Bottom Nav)
import { icons } from '../../components/icons.js';
import { getCurrentUser, toggleTheme, getState, logout } from '../../utils/helpers.js';
import { isActiveRoute } from '../../router.js';

export function renderPWALayout(title, content, activeTab = 'home') {
  const user = getCurrentUser();
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="pwa-layout">
      <!-- Header -->
      <div class="pwa-header">
        <div class="pwa-header-left">
          ${title !== 'Beranda' ? `<button class="pwa-header-back" onclick="history.back()">${icons.chevronLeft}</button>` : 
            (['eksekutif', 'admin'].includes(user?.role) ? `
              <a href="${user?.role === 'eksekutif' ? '#/dashboard/eksekutif' : '#/dashboard'}" class="pwa-header-back" style="text-decoration:none;display:flex;align-items:center;color:var(--text-secondary)" title="Kembali ke Dashboard">
                ${icons.chevronLeft}
              </a>
            ` : `
              <div style="width:32px;height:32px;border-radius:var(--radius-md);background:linear-gradient(135deg,var(--primary-600),var(--primary-400));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:12px">S</div>
            `)
          }
          <span class="pwa-header-title">${title}</span>
        </div>
        <div class="pwa-header-right">
          <button class="navbar-icon-btn" onclick="document.querySelector('.theme-toggle-fn')()" id="themeToggleBtn">
            ${getState('theme') === 'dark' ? icons.sun : icons.moon}
          </button>
          <button class="navbar-icon-btn" id="pwaLogoutBtn">
            ${icons.logout}
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="pwa-content">
        ${content}
      </div>

      <!-- Bottom Nav -->
      <nav class="bottom-nav">
        <a href="#/pwa/home" class="bottom-nav-item ${activeTab === 'home' ? 'active' : ''}">
          ${icons.home}
          <span>Beranda</span>
        </a>
        ${user?.role !== 'warga' ? `
        <a href="#/pwa/riwayat" class="bottom-nav-item ${activeTab === 'riwayat' ? 'active' : ''}">
          ${icons.clock}
          <span>Riwayat</span>
        </a>
        ` : ''}
        <a href="${['petugas', 'admin'].includes(user?.role) ? '#/pwa/sampah-masuk' : '#/dashboard/aduan'}" class="bottom-nav-add">
          ${icons.plus}
        </a>
        ${['eksekutif', 'admin'].includes(user?.role) ? `
        <a href="${user?.role === 'eksekutif' ? '#/dashboard/eksekutif' : '#/dashboard'}" class="bottom-nav-item">
          ${icons.chart}
          <span>Dashboard</span>
        </a>
        ` : `
        <a href="#/dashboard/gis" class="bottom-nav-item ${activeTab === 'map' ? 'active' : ''}">
          ${icons.map}
          <span>Peta</span>
        </a>
        `}
        <a href="#/portal" class="bottom-nav-item ${activeTab === 'portal' ? 'active' : ''}" id="pwaPortalLink">
          ${icons.globe}
          <span>Portal</span>
        </a>
      </nav>
    </div>
    <style>
      .pwa-greeting { display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-5); }
      .greeting-text h2 { font-size:var(--font-xl); font-weight:700; }
      .greeting-text p { font-size:var(--font-sm); color:var(--text-secondary); margin-top:var(--space-1); }
      .pwa-summary-row { grid-template-columns:repeat(2,1fr); }
    </style>
  `;

  // Wire up theme toggle
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.onclick = () => {
      toggleTheme();
      themeBtn.innerHTML = getState('theme') === 'dark' ? icons.sun : icons.moon;
    };
  }

  // Wire up logout
  const logoutBtn = document.getElementById('pwaLogoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = () => logout();
  }

  const portalLink = document.getElementById('pwaPortalLink');
  if (portalLink) {
    portalLink.addEventListener('click', (e) => {
      if (!confirm('Anda akan keluar dari aplikasi dan menuju Portal Publik. Lanjutkan?')) {
        e.preventDefault();
      }
    });
  }
}
