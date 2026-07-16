// SIMPAH - Dashboard Layout (Sidebar + Navbar)
import { icons } from '../../components/icons.js';
import { confirmLogout } from '../../components/logout-modal.js';
import { getCurrentUser, toggleTheme, getState } from '../../utils/helpers.js';
import { isActiveRoute } from '../../router.js';
import { canValidate, isAdmin, canViewExecutive } from '../../utils/permissions.js';
import { supabase } from '../../lib/supabase.js';
import { showToast } from '../../components/toast.js';
import { getSidebarInstallBanner, bindInstallButtons } from '../../lib/pwa.js';

export function renderDashboardLayout(title, content, activeMenu = '') {
  const user = getCurrentUser();
  const app = document.getElementById('app');

  let scopeText = '';
  if (user) {
    if (user.role === 'admin') {
      scopeText = 'Seluruh Kabupaten';
    } else if (user.role === 'eksekutif') {
      scopeText = 'Kab. Banjarnegara';
    } else if (user.role === 'petugas') {
      if (user.job_type === 'koordinator' && user.kecamatan) {
        scopeText = `Kec. ${user.kecamatan}`;
      } else if (user.wilayah) {
        scopeText = user.wilayah;
      }
    }
  }

  app.innerHTML = `
    <div class="app-layout">
      <!-- Sidebar -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 2 20 2s-1.7 5.5-3.8 10.7A7 7 0 0 1 11 20z" fill="rgba(255,255,255,0.2)" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <div class="sidebar-brand">
            <h2>SIMPAH</h2>
            <p>Monitoring Sampah</p>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${(canViewExecutive(user) || (!(user?.role === 'petugas' && user?.job_type === 'kader') && user?.role !== 'warga')) ? `
          <div class="sidebar-section">
            <div class="sidebar-section-title">Pemantauan</div>
            ${canViewExecutive(user) ? `
            <a href="#/dashboard/eksekutif" class="sidebar-link ${isActiveRoute('/dashboard/eksekutif') ? 'active' : ''}">
              ${icons.chart} <span>Ringkasan Eksekutif</span>
            </a>` : ''}
            ${!(user?.role === 'petugas' && user?.job_type === 'kader') && user?.role !== 'warga' ? `
            <a href="#/dashboard/gis" class="sidebar-link ${isActiveRoute('/dashboard/gis') ? 'active' : ''}">
              ${icons.map} <span>Peta GIS</span>
            </a>` : ''}
          </div>
          ` : ''}
           ${(isAdmin(user) || canValidate(user)) ? `
          <div class="sidebar-section">
            <div class="sidebar-section-title">Pengelolaan</div>
            ${isAdmin(user) ? `
            <a href="#/dashboard/laporan" class="sidebar-link ${isActiveRoute('/dashboard/laporan') ? 'active' : ''}">
              ${icons.file} <span>Laporan & Export</span>
            </a>` : ''}
            ${canValidate(user) ? `
            <a href="#/dashboard/validasi" class="sidebar-link ${isActiveRoute('/dashboard/validasi') ? 'active' : ''}">
              ${icons.checkCircle} <span>Validasi Data</span>
            </a>` : ''}
            ${isAdmin(user) ? `
            <a href="#/dashboard/mou" class="sidebar-link ${isActiveRoute('/dashboard/mou') ? 'active' : ''}">
              ${icons.clipboard} <span>Manajemen MoU</span>
            </a>
            <a href="#/dashboard/intervensi" class="sidebar-link ${isActiveRoute('/dashboard/intervensi') ? 'active' : ''}">
              ${icons.shield} <span>Intervensi Wilayah</span>
            </a>
             <a href="#/dashboard/intervensi-fasum" class="sidebar-link ${isActiveRoute('/dashboard/intervensi-fasum') ? 'active' : ''}">
               ${icons.grid} <span>Intervensi Fasum</span>
             </a>
             <a href="#/dashboard/edukasi" class="sidebar-link ${isActiveRoute('/dashboard/edukasi') ? 'active' : ''}">
               ${icons.book} <span>Kelola Edukasi</span>
             </a>
             <a href="#/dashboard/masterdata" class="sidebar-link ${isActiveRoute('/dashboard/masterdata') ? 'active' : ''}">
               ${icons.settings} <span>Master Data</span>
             </a>` : ''}
          </div>
          ` : ''}
          <div class="sidebar-section">
            <div class="sidebar-section-title">Layanan</div>
            <a href="#/dashboard/aduan" class="sidebar-link ${isActiveRoute('/dashboard/aduan') ? 'active' : ''}">
              ${icons.messageCircle} <span>Aduan Warga</span>
            </a>
          </div>
          ${user?.role !== 'warga' ? `
          <div class="sidebar-section">
            <div class="sidebar-section-title">Operasional</div>
            <a href="#/pwa/home" class="sidebar-link ${isActiveRoute('/pwa') ? 'active' : ''}">
              ${icons.activity} <span>Input Lapangan</span>
            </a>
          </div>
          ` : ''}
        </nav>
        ${getSidebarInstallBanner()}
        <div class="sidebar-footer">
          <div class="sidebar-user" id="sidebarUser">
            <div class="sidebar-user-avatar">${user ? (user.full_name || 'U').charAt(0).toUpperCase() : 'U'}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${user?.full_name || 'Guest'}</div>
              <div class="sidebar-user-role">${getRoleName(user)}</div>
              ${scopeText ? `<div class="sidebar-user-scope" style="font-size:10px;color:var(--text-muted);opacity:0.85;margin-top:2px;font-weight:500">${scopeText}</div>` : ''}
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
  document.getElementById('dashLogoutBtn')?.addEventListener('click', () => confirmLogout());

  // Bind PWA install buttons
  bindInstallButtons();



  // Realtime Subscriptions
  if (user && (isAdmin(user) || canValidate(user) || canViewExecutive(user))) {
    // Pastikan channel sebelumnya di-unsubscribe jika layout dirender ulang
    if (window._simpahRealtimeChannel) {
      supabase.removeChannel(window._simpahRealtimeChannel);
    }
    
    window._simpahRealtimeChannel = supabase.channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'complaints' },
        (payload) => {
          showToast(`Aduan Baru: ${payload.new.category}`, 'info');
          const dot = document.querySelector('.notif-dot');
          if (dot) dot.style.display = 'block';
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'waste_records' },
        (payload) => {
          // Hanya beri notifikasi untuk transaksi yang diverifikasi jika admin
          if (payload.new.verification_status === 'pending' && (isAdmin(user) || canValidate(user))) {
            showToast(`Transaksi Baru Masuk: ${payload.new.weight_kg} kg`, 'info');
            const dot = document.querySelector('.notif-dot');
            if (dot) dot.style.display = 'block';
          }
        }
      )
      .subscribe();
  }

}

function getRoleName(user) {
  if (!user) return 'User';
  if (user.role === 'petugas') {
    const jobLabels = {
      kader: 'Kader Lingkungan',
      operator_tps: 'Operator TPS3R',
      angkut: 'Petugas Pengangkut',
      koordinator: 'Koordinator Lapangan'
    };
    return jobLabels[user.job_type] || 'Petugas Lapangan';
  }
  const names = { warga: 'Warga', eksekutif: 'Eksekutif', admin: 'Administrator' };
  return names[user.role] || 'User';
}
