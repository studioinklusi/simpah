// SIMPAH - Dashboard Layout (Sidebar + Navbar)
import { icons } from '../../components/icons.js';
import { getCurrentUser, toggleTheme, getState, logout } from '../../utils/helpers.js';
import { isActiveRoute } from '../../router.js';
import { canValidate, isAdmin, canViewExecutive } from '../../utils/permissions.js';

export function renderDashboardLayout(title, content, activeMenu = '') {
  const user = getCurrentUser();
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="app-layout">
      <!-- Sidebar -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">S</div>
          <div class="sidebar-brand">
            <h2>SIMPAH</h2>
            <p>Monitoring Sampah</p>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="sidebar-section">
            <div class="sidebar-section-title">Pemantauan</div>
            ${canViewExecutive(user) ? `
            <a href="#/dashboard/eksekutif" class="sidebar-link ${activeMenu === 'eksekutif' ? 'active' : ''}">
              ${icons.chart} <span>Ringkasan Eksekutif</span>
            </a>` : ''}
            <a href="#/dashboard/gis" class="sidebar-link ${activeMenu === 'gis' ? 'active' : ''}">
              ${icons.map} <span>Peta GIS</span>
            </a>
          </div>
           ${(isAdmin(user) || canValidate(user)) ? `
          <div class="sidebar-section">
            <div class="sidebar-section-title">Pengelolaan</div>
            ${isAdmin(user) ? `
            <a href="#/dashboard/laporan" class="sidebar-link ${activeMenu === 'laporan' ? 'active' : ''}">
              ${icons.file} <span>Laporan & Export</span>
            </a>` : ''}
            ${canValidate(user) ? `
            <a href="#/dashboard/validasi" class="sidebar-link ${activeMenu === 'validasi' ? 'active' : ''}">
              ${icons.checkCircle} <span>Validasi Data</span>
            </a>` : ''}
            ${isAdmin(user) ? `
            <a href="#/dashboard/mou" class="sidebar-link ${activeMenu === 'mou' ? 'active' : ''}">
              ${icons.clipboard} <span>Manajemen MoU</span>
            </a>
            <a href="#/dashboard/intervensi" class="sidebar-link ${activeMenu === 'intervensi' ? 'active' : ''}">
              ${icons.shield} <span>Intervensi Desa</span>
            </a>
            <a href="#/dashboard/masterdata" class="sidebar-link ${activeMenu === 'masterdata' ? 'active' : ''}">
              ${icons.settings} <span>Master Data</span>
            </a>
            <a href="#/dashboard/audit" class="sidebar-link ${activeMenu === 'audit' ? 'active' : ''}">
              ${icons.activity} <span>Audit Log</span>
            </a>` : ''}
          </div>
          ` : ''}
          <div class="sidebar-section">
            <div class="sidebar-section-title">Layanan</div>
            <a href="#/dashboard/aduan" class="sidebar-link ${activeMenu === 'aduan' ? 'active' : ''}">
              ${icons.messageCircle} <span>Aduan Warga</span>
            </a>
          </div>
          <div class="sidebar-section">
            <div class="sidebar-section-title">Operasional</div>
            <a href="#/pwa/home" class="sidebar-link ${activeMenu === 'pwa' ? 'active' : ''}">
              ${icons.activity} <span>Input Lapangan</span>
            </a>
            <a href="#/portal" class="sidebar-link ${activeMenu === 'portal' ? 'active' : ''}" id="dashPortalLink">
              ${icons.globe} <span>Portal Publik</span>
            </a>
          </div>
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user" id="sidebarUser">
            <div class="sidebar-user-avatar">${user ? user.name.charAt(0).toUpperCase() : 'U'}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${user?.name || 'Guest'}</div>
              <div class="sidebar-user-role">${getRoleName(user?.role)}</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Sidebar Overlay (mobile) -->
      <div class="sidebar-overlay" id="sidebarOverlay"></div>

      <!-- Main -->
      <main class="app-main">
        <nav class="navbar">
          <div class="navbar-left">
            <button class="navbar-menu-btn" id="menuToggle">${icons.menu}</button>
            <div class="navbar-breadcrumb">
              <span>Dashboard</span>
              <span>/</span>
              <strong>${title}</strong>
            </div>
          </div>
          <div class="navbar-right">
            <button class="navbar-icon-btn" id="dashThemeBtn">${getState('theme') === 'dark' ? icons.sun : icons.moon}</button>
            <button class="navbar-icon-btn" style="position:relative">
              ${icons.bell}
              <span class="notif-dot"></span>
            </button>
            <button class="navbar-icon-btn" id="dashLogoutBtn">${icons.logout}</button>
          </div>
        </nav>
        <div class="app-content">
          ${content}
        </div>
      </main>
    </div>
  `;

  // Mobile sidebar toggle
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuToggle = document.getElementById('menuToggle');

  menuToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });

  // Theme toggle
  document.getElementById('dashThemeBtn')?.addEventListener('click', () => {
    toggleTheme();
    document.getElementById('dashThemeBtn').innerHTML = getState('theme') === 'dark' ? icons.sun : icons.moon;
  });

  // Logout
  document.getElementById('dashLogoutBtn')?.addEventListener('click', () => logout());

  // Portal Confirmation
  document.getElementById('dashPortalLink')?.addEventListener('click', (e) => {
    if (!confirm('Anda akan keluar dari area Dasbor menuju Portal Publik. Lanjutkan?')) {
      e.preventDefault();
    }
  });
}

function getRoleName(role) {
  const names = { warga: 'Warga', petugas: 'Petugas Pengangkut', eksekutif: 'Eksekutif', admin: 'Administrator' };
  return names[role] || 'User';
}
