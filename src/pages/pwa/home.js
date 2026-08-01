// SIMPAH - PWA Home Page
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatWeight, formatNumber, getState, onStateChange } from '../../utils/helpers.js';
import { getWasteStats, getAllMasterWilayah, getAllLocations, getAllComplaints } from '../../db/store.js';
import { canInputWaste, getAllowedInputTypes, hasPermission, canValidate } from '../../utils/permissions.js';
import { renderPWALayout } from './layout.js';

export async function renderPWAHome() {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/login'; return; }

  const isInputter = user.role === 'petugas' && ['kader', 'operator_tps', 'angkut', 'operator_institusi'].includes(user.job_type);

  let stats = null;
  let userComplaints = [];
  let masterWilayah = [];
  let locations = [];

  if (user.role === 'warga') {
    const [allComplaints, mwData, locData] = await Promise.all([
      getAllComplaints(),
      getAllMasterWilayah(),
      getAllLocations()
    ]);
    userComplaints = allComplaints.filter(c => c.reporter_user_id === user.id);
    masterWilayah = mwData;
    locations = locData;
  } else {
    const [wasteStats, mwData, locData] = await Promise.all([
      getWasteStats(isInputter ? user.id : null),
      getAllMasterWilayah(),
      getAllLocations()
    ]);
    stats = wasteStats;
    masterWilayah = mwData;
    locations = locData;
  }

  let authorityText = '';
  if (user.role === 'admin') {
    authorityText = 'Administrator (Seluruh Wilayah)';
  } else if (user.role === 'eksekutif') {
    authorityText = 'Eksekutif (Kabupaten Banjarnegara)';
  } else if (user.role === 'petugas') {
    const jobLabels = {
      kader: 'Kader Lingkungan',
      operator_tps: 'Operator TPS3R',
      angkut: 'Petugas Pengangkut',
      koordinator: 'Koordinator Lapangan',
      operator_institusi: 'Operator Institusi'
    };
    const roleLabel = jobLabels[user.job_type] || 'Petugas Lapangan';
    
    if (user.job_type === 'koordinator') {
      authorityText = `${roleLabel} · Kec. ${user.kecamatan || '-'}`;
    } else if (user.job_type === 'kader' && user.desa_id) {
      const desa = masterWilayah.find(w => w.id === user.desa_id);
      authorityText = `${roleLabel} · Desa ${desa ? desa.desa_kelurahan : '-'}`;
    } else if (user.job_type === 'operator_tps' && user.location_id) {
      const loc = locations.find(l => l.id === user.location_id);
      authorityText = `${roleLabel} · ${loc ? loc.name : 'Fasilitas'}`;
    } else if (user.job_type === 'operator_institusi' && user.location_id) {
      const loc = locations.find(l => l.id === user.location_id);
      authorityText = `${roleLabel} · ${loc ? loc.name : 'Institusi'}`;
    } else {
      authorityText = roleLabel;
    }
  } else {
    authorityText = 'Warga Banjarnegara';
  }

  renderPWALayout('Beranda', `
    <!-- Greeting -->
    <div class="pwa-greeting page-enter">
      <div class="greeting-text">
        <h2>Halo, ${(user.full_name || 'User').split(' ')[0]}!</h2>
        <div class="pwa-role-badge">
          <span class="pwa-role-dot"></span>
          ${authorityText}
        </div>
        <p class="pwa-greeting-moto">${getMotivationalGreeting()}</p>
        <p style="margin-top:2px; font-size:11px; color:var(--text-muted)">${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <div class="sync-status ${navigator.onLine ? 'online' : 'offline'}" id="syncIndicator">
        <span class="sync-dot"></span>
        ${navigator.onLine ? 'Online' : 'Offline'}
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="pwa-summary-row page-enter stagger-1" style="animation-fill-mode:both">
      ${user.role === 'warga' ? `
      <div class="pwa-summary-card">
        <div class="summary-icon" style="color:var(--primary-600)">${icons.clipboard}</div>
        <div class="summary-value" style="color:var(--primary-600)">${userComplaints.length}</div>
        <div class="summary-label">Total Aduan</div>
      </div>
      <div class="pwa-summary-card">
        <div class="summary-icon" style="color:#3b82f6">${icons.download}</div>
        <div class="summary-value" style="color:#3b82f6">${userComplaints.filter(c => c.status === 'baru').length}</div>
        <div class="summary-label">Baru</div>
      </div>
      <div class="pwa-summary-card">
        <div class="summary-icon" style="color:#f59e0b">${icons.clock}</div>
        <div class="summary-value" style="color:#f59e0b">${userComplaints.filter(c => ['diproses', 'ditindaklanjuti'].includes(c.status)).length}</div>
        <div class="summary-label">Diproses</div>
      </div>
      <div class="pwa-summary-card">
        <div class="summary-icon" style="color:#10b981">${icons.checkCircle}</div>
        <div class="summary-value" style="color:#10b981">${userComplaints.filter(c => c.status === 'selesai').length}</div>
        <div class="summary-label">Selesai</div>
      </div>
      ` : `
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
      `}
    </div>

    <!-- Quick Actions -->
    <div class="section-header" style="margin-top:var(--space-2)">
      <h3 style="font-size:var(--font-base);font-weight:700">Menu Cepat</h3>
    </div>
    <div class="quick-actions page-enter stagger-2" style="animation-fill-mode:both">
      ${canInputWaste(user) ? (() => {
        const allowed = getAllowedInputTypes(user);
        let buttons = '';
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
      <a href="#/dashboard/validasi" class="quick-action-btn">
        <div class="quick-action-icon green">${icons.checkCircle}</div>
        <span class="quick-action-label">Validasi Data</span>
      </a>
      ` : ''}
      ${user?.job_type !== 'angkut' ? `
      <a href="#/dashboard/aduan" class="quick-action-btn">
        <div class="quick-action-icon teal">${icons.messageCircle}</div>
        <span class="quick-action-label">${user?.role === 'warga' ? 'Aduan Saya' : 'Aduan'}</span>
      </a>
      ` : ''}
      ${user?.role !== 'warga' ? `
      <a href="#/pwa/riwayat" class="quick-action-btn">
        <div class="quick-action-icon gray">${icons.clock}</div>
        <span class="quick-action-label">Riwayat</span>
      </a>
      ` : ''}
    </div>

    ${user?.role === 'warga' ? `
    <!-- Recent Complaints -->
    <div class="section-header">
      <h3 style="font-size:var(--font-base);font-weight:700">Aduan Terakhir</h3>
      <a href="#/dashboard/aduan" class="btn btn-ghost btn-sm">Lihat Semua ${icons.chevronRight}</a>
    </div>
    <div class="record-list page-enter stagger-3" style="animation-fill-mode:both">
      ${userComplaints.slice(0, 5).map(c => `
        <div class="record-item" style="cursor:pointer" onclick="window.location.hash='#/dashboard/aduan'">
          <div class="record-icon" style="background:${getComplaintStatusBg(c.status)}">
            ${getComplaintStatusIcon(c.status)}
          </div>
          <div class="record-info">
            <div class="record-title">${c.category || 'Aduan'} - ${c.tracking_number || '-'}</div>
            <div class="record-meta">${c.description ? (c.description.substring(0, 45) + (c.description.length > 45 ? '...' : '')) : ''} · ${timeAgo(c.created_at)}</div>
          </div>
          <div class="record-value" style="display:flex;flex-direction:column;align-items:flex-end">
            ${getComplaintStatusBadge(c.status)}
          </div>
        </div>
      `).join('')}
      ${userComplaints.length === 0 ? '<div class="empty-state"><p>Belum ada aduan</p></div>' : ''}
    </div>
    ` : `
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
    `}
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
  if (!r.synced) {
    const errorMsg = r.sync_error ? `: ${r.sync_error}` : '';
    return `<span class="badge badge-warning" style="font-size:11px;margin-top:4px" title="Gagal sync: ${r.sync_error || 'Sedang proses...'}">Sinkronisasi${errorMsg}</span>`;
  }
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

function getComplaintStatusBg(status) {
  const bgs = {
    baru: 'rgba(59,130,246,0.12)',
    diproses: 'rgba(245,158,11,0.12)',
    ditindaklanjuti: 'rgba(139,92,246,0.12)',
    selesai: 'rgba(16,185,129,0.12)',
    ditolak: 'rgba(239,68,68,0.12)'
  };
  return bgs[status] || 'rgba(107,114,128,0.12)';
}

function getComplaintStatusIcon(status) {
  const config = {
    baru: icons.download,
    diproses: icons.clock,
    ditindaklanjuti: icons.tool,
    selesai: icons.checkCircle,
    ditolak: icons.xCircle
  };
  return config[status] || icons.box;
}

function getComplaintStatusBadge(status) {
  const config = {
    baru: { label: 'Baru', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    diproses: { label: 'Diproses', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    ditindaklanjuti: { label: 'Ditindaklanjuti', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    selesai: { label: 'Selesai', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    ditolak: { label: 'Ditolak', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
  };
  const cfg = config[status] || { label: status, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
  return `<span class="badge" style="background:${cfg.bg};color:${cfg.color};font-size:11px;margin-top:4px">${cfg.label}</span>`;
}
