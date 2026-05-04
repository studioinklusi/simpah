// SIMPAH - PWA Home Page
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatWeight, formatNumber, getState, onStateChange } from '../../utils/helpers.js';
import { getWasteStats } from '../../db/store.js';
import { canInputWaste, getAllowedInputTypes, hasPermission, canValidate } from '../../utils/permissions.js';
import { renderPWALayout } from './layout.js';

export async function renderPWAHome() {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/login'; return; }

  const stats = await getWasteStats();

  renderPWALayout('Beranda', `
    <!-- Greeting -->
    <div class="pwa-greeting page-enter">
      <div class="greeting-text">
        <h2>Halo, ${user.name.split(' ')[0]}!</h2>
        <p style="font-size:var(--font-sm);color:var(--primary-600);font-weight:600;margin:2px 0 4px">${getMotivationalGreeting()}</p>
        <p>${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <div class="sync-status ${navigator.onLine ? 'online' : 'offline'}" id="syncIndicator">
        <span class="sync-dot"></span>
        ${navigator.onLine ? 'Online' : 'Offline'}
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="pwa-summary-row page-enter stagger-1" style="animation-fill-mode:both">
      <div class="pwa-summary-card">
        <div class="summary-icon">${icons.trashIn}</div>
        <div class="summary-value" style="color:var(--primary-600)">${formatWeight(stats.todayWeight)}</div>
        <div class="summary-label">Hari Ini</div>
      </div>
      <div class="pwa-summary-card">
        <div class="summary-icon">${icons.chart}</div>
        <div class="summary-value" style="color:var(--info-500)">${formatWeight(stats.monthWeight)}</div>
        <div class="summary-label">Bulan Ini</div>
      </div>
      <div class="pwa-summary-card">
        <div class="summary-icon">${icons.recycle}</div>
        <div class="summary-value" style="color:var(--accent-500)">${stats.recycleRate}%</div>
        <div class="summary-label">Pengurangan</div>
      </div>
      <div class="pwa-summary-card">
        <div class="summary-icon">${icons.activity}</div>
        <div class="summary-value">${formatNumber(stats.totalRecords)}</div>
        <div class="summary-label">Total Data</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="section-header" style="margin-top:var(--space-2)">
      <h3 style="font-size:var(--font-base);font-weight:700">Menu Cepat</h3>
    </div>
    <div class="quick-actions page-enter stagger-2" style="animation-fill-mode:both">
      ${canInputWaste(user) ? (() => {
        const allowed = getAllowedInputTypes(user);
        let buttons = '';
        // Single "Sampah Masuk" hub button (combines campur/pilah/olah)
        if (allowed.includes('masuk') || allowed.includes('pilah') || allowed.includes('olah') || allowed.includes('campur')) buttons += `
        <a href="#/pwa/sampah-masuk" class="quick-action-btn">
          <div class="quick-action-icon green">${icons.trashIn}</div>
          <span class="quick-action-label">Sampah Masuk</span>
        </a>`;
        if (allowed.includes('armada')) buttons += `
        <a href="#/pwa/armada" class="quick-action-btn">
          <div class="quick-action-icon amber">${icons.truck}</div>
          <span class="quick-action-label">Armada</span>
        </a>`;
        if (allowed.includes('insidental')) buttons += `
        <a href="#/pwa/insidental" class="quick-action-btn">
          <div class="quick-action-icon purple">${icons.alert}</div>
          <span class="quick-action-label">Insidental</span>
        </a>`;
        return buttons;
      })() : ''}
      ${canValidate(user) ? `
      <a href="#/dashboard/validasi" class="quick-action-btn" style="border:1px solid var(--primary-500);background:rgba(16,185,129,0.05)">
        <div class="quick-action-icon" style="background:var(--primary-500);color:white;box-shadow:0 4px 12px rgba(16,185,129,0.3)">${icons.checkCircle}</div>
        <span class="quick-action-label" style="font-weight:700">Validasi Data</span>
      </a>
      ` : ''}
      ${user?.job_type !== 'angkut' ? `
      <a href="#/dashboard/aduan" class="quick-action-btn">
        <div class="quick-action-icon teal">${icons.messageCircle}</div>
        <span class="quick-action-label">Aduan</span>
      </a>
      ` : ''}
      ${user?.role !== 'warga' ? `
      <a href="#/pwa/riwayat" class="quick-action-btn">
        <div class="quick-action-icon" style="background:rgba(107,114,128,0.12);color:#4b5563">${icons.clock}</div>
        <span class="quick-action-label">Riwayat</span>
      </a>
      ` : ''}
    </div>

    ${user?.role !== 'warga' ? `
    <!-- Recent Records -->
    <div class="section-header">
      <h3 style="font-size:var(--font-base);font-weight:700">Catatan Terakhir</h3>
      <a href="#/pwa/riwayat" class="btn btn-ghost btn-sm">Lihat Semua ${icons.chevronRight}</a>
    </div>
    <div class="record-list page-enter stagger-3" style="animation-fill-mode:both">
      ${stats.records.slice(0, 5).map(r => `
        <div class="record-item">
          <div class="record-icon" style="background:${getTypeBg(r)}">
            ${getTypeEmoji(r)}
          </div>
          <div class="record-info">
            <div class="record-title">${getTypeLabel(r)} - ${r.category_sipsn || '-'}</div>
            <div class="record-meta">${r.location_name || '-'} · ${timeAgo(r.created_at)}</div>
          </div>
          <div class="record-value" style="display:flex;flex-direction:column;align-items:flex-end">
            <span style="font-size:var(--font-base);font-weight:700;color:var(--text-primary)">${formatWeight(r.weight_kg)}</span>
            ${getVerificationBadge(r)}
          </div>
        </div>
      `).join('')}
      ${stats.records.length === 0 ? '<div class="empty-state"><p>Belum ada catatan</p></div>' : ''}
    </div>
    ` : ''}
  `, 'home');

  // Update sync status listener
  const unsub = onStateChange('online', (val) => {
    const el = document.getElementById('syncIndicator');
    if (el) {
      el.className = `sync-status ${val ? 'online' : 'offline'}`;
      el.innerHTML = `<span class="sync-dot"></span> ${val ? 'Online' : 'Offline'}`;
    }
  });

  return unsub;
}

function getTypeLabel(r) {
  if (r && r.is_incidental) return 'Insidental';
  const type = typeof r === 'string' ? r : r.type;
  const labels = { masuk: 'Sampah Masuk', campur: 'Sampah Campur', pilah: 'Sampah Terpilah', olah: 'Olah Sampah', residu: 'Residu' };
  return labels[type] || type;
}
function getTypeEmoji(r) {
  if (r && r.is_incidental) return icons.alert;
  const type = typeof r === 'string' ? r : r.type;
  const typeIcons = { masuk: icons.download, campur: icons.box, pilah: icons.layers, olah: icons.activity, residu: icons.trash };
  return typeIcons[type] || icons.box;
}
function getTypeBg(r) {
  if (r && r.is_incidental) return 'rgba(168,85,247,0.12)';
  const type = typeof r === 'string' ? r : r.type;
  const bgs = { masuk: 'rgba(16,185,129,0.12)', campur: 'rgba(245,158,11,0.12)', pilah: 'rgba(59,130,246,0.12)', olah: 'rgba(245,158,11,0.12)', residu: 'rgba(239,68,68,0.12)' };
  return bgs[type] || 'rgba(107,114,128,0.12)';
}
function timeAgo(iso) {
  const now = new Date(), d = new Date(iso), diff = now - d;
  const mins = Math.floor(diff/60000), hrs = Math.floor(diff/3600000), days = Math.floor(diff/86400000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins}m lalu`;
  if (hrs < 24) return `${hrs}j lalu`;
  return `${days}h lalu`;
}

function getVerificationBadge(r) {
  if (!r.synced) return '<span class="badge badge-warning" style="font-size:11px;margin-top:4px">Sinkronisasi...</span>';
  if (!r.verification_status || r.verification_status === 'approved') return '<span class="badge badge-success" style="font-size:11px;margin-top:4px">Disetujui</span>';
  if (r.verification_status === 'rejected') return '<span class="badge badge-danger" style="font-size:11px;margin-top:4px">Ditolak</span>';
  return '<span class="badge" style="background:#fef08a;color:#854d0e;font-size:11px;margin-top:4px">Tunggu Validasi</span>';
}

function getMotivationalGreeting() {
  const greetings = [
    "Hebat! Mari kita selamatkan bumi hari ini 🌱",
    "Bumi berterima kasih atas kerjamu 🌍",
    "Aksi kecil untuk masa depan yang resik ✨",
    "Keringatmu bernilai emas bagi lingkungan 🥇",
    "Semangat berlaga pahlawan lingkungan! 🦸‍♂️"
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}
