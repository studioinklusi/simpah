// SIMPAH - Manajemen Aduan (Complaint Management with Privacy Controls)
import { icons } from '../../components/icons.js';
import { getCurrentUser } from '../../utils/helpers.js';
import { getAllComplaints, getComplaintsByUser, updateComplaint } from '../../db/store.js';
import { hasPermission } from '../../utils/permissions.js';
import { showToast } from '../../components/toast.js';
import { renderDashboardLayout } from './layout.js';
import { renderPWALayout } from '../pwa/layout.js';

const STATUS_CONFIG = {
  baru: { label: 'Baru', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: icons.download },
  diproses: { label: 'Diproses', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: icons.clock },
  ditindaklanjuti: { label: 'Ditindaklanjuti', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: icons.tool },
  selesai: { label: 'Selesai', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: icons.checkCircle },
  ditolak: { label: 'Ditolak', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: icons.xCircle }
};

export async function renderAduanManagement() {
  const user = getCurrentUser();
  if (!user) {
    window.location.hash = '#/login';
    return;
  }
  const canViewAll = hasPermission(user, 'VIEW_ALL_COMPLAINTS');
  const canManage = hasPermission(user, 'MANAGE_COMPLAINT_STATUS');
  const pageTitle = canViewAll ? 'Manajemen Aduan Warga' : 'Aduan Saya';
  const pageDesc = canViewAll
    ? 'Pantau, proses, dan tindak lanjuti laporan dari masyarakat.'
    : 'Lihat status dan riwayat aduan yang Anda buat.';

  const renderLayout = ['warga', 'petugas'].includes(user.role) ? renderPWALayout : renderDashboardLayout;

  renderLayout('Aduan Warga', `
    <div class="aduan-mgmt page-enter">
      <div class="am-header">
        <div>
          <h2 style="display:flex;align-items:center;gap:8px;">${icons.clipboard} ${pageTitle}</h2>
          <p>${pageDesc}</p>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="am-stats" id="aduanStats"></div>

      <!-- Filter -->
      <div class="am-filter">
        <div class="am-filter-group">
          <button class="am-filter-btn active" data-filter="all">Semua</button>
          <button class="am-filter-btn" data-filter="baru" style="display:inline-flex;align-items:center;gap:4px;">${icons.download} Baru</button>
          <button class="am-filter-btn" data-filter="diproses" style="display:inline-flex;align-items:center;gap:4px;">${icons.clock} Diproses</button>
          <button class="am-filter-btn" data-filter="ditindaklanjuti" style="display:inline-flex;align-items:center;gap:4px;">${icons.tool} Ditindaklanjuti</button>
          <button class="am-filter-btn" data-filter="selesai" style="display:inline-flex;align-items:center;gap:4px;">${icons.checkCircle} Selesai</button>
          <button class="am-filter-btn" data-filter="ditolak" style="display:inline-flex;align-items:center;gap:4px;">${icons.xCircle} Ditolak</button>
        </div>
      </div>

      <!-- List -->
      <div id="aduanList"></div>
    </div>

    <!-- Detail Modal -->
    <div class="am-modal-overlay" id="aduanModal" style="display:none">
      <div class="am-modal">
        <div class="am-modal-header">
          <h3 id="aduanModalTitle">Detail Aduan</h3>
          <button class="md-modal-close" id="aduanModalClose">${icons.close}</button>
        </div>
        <div class="am-modal-body" id="aduanModalBody"></div>
      </div>
    </div>

    <style>
      .aduan-mgmt { max-width:1100px; }
      .am-header h2 { font-size:var(--font-xl); font-weight:700; margin-bottom:var(--space-1); }
      .am-header p { font-size:var(--font-sm); color:var(--text-secondary); margin-bottom:var(--space-5); }
      .am-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:var(--space-4); margin-bottom:var(--space-6); }
      .am-stat-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:var(--space-4); text-align:center; }
      .am-stat-icon { font-size:24px; margin-bottom:var(--space-1); }
      .am-stat-num { font-size:var(--font-2xl); font-weight:800; }
      .am-stat-label { font-size:var(--font-xs); color:var(--text-muted); }
      .am-filter { margin-bottom:var(--space-5); }
      .am-filter-group { display:flex; gap:var(--space-2); flex-wrap:wrap; }
      .am-filter-btn { padding:var(--space-2) var(--space-4); border-radius:var(--radius-full); border:1px solid var(--border-color); background:transparent; font-size:var(--font-xs); font-weight:600; cursor:pointer; transition:all 0.15s; color:var(--text-secondary); }
      .am-filter-btn.active { background:var(--primary-500); color:#fff; border-color:var(--primary-500); }
      .am-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:var(--space-5); margin-bottom:var(--space-3); cursor:pointer; transition:all 0.15s; }
      .am-card:hover { border-color:var(--primary-300); box-shadow:0 2px 12px rgba(16,185,129,0.08); }
      .am-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--space-3); }
      .am-card-resi { font-size:var(--font-xs); font-weight:700; letter-spacing:0.06em; color:var(--text-muted); }
      .am-card-date { font-size:var(--font-xs); color:var(--text-muted); }
      .am-card-cat { font-weight:700; margin-bottom:var(--space-1); }
      .am-card-desc { font-size:var(--font-sm); color:var(--text-secondary); line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .am-card-footer { display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-3); padding-top:var(--space-3); border-top:1px solid var(--border-color); }
      .am-card-reporter { font-size:var(--font-xs); color:var(--text-muted); }
      .am-badge { display:inline-flex; align-items:center; gap:var(--space-1); padding:var(--space-1) var(--space-3); border-radius:var(--radius-full); font-size:var(--font-xs); font-weight:700; }
      .am-empty { text-align:center; padding:var(--space-10); color:var(--text-muted); }
      .am-modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:1000; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s; }
      .am-modal { background:var(--bg-primary); border-radius:var(--radius-xl); width:92%; max-width:580px; max-height:85vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.2); animation:scaleIn 0.2s; }
      .am-modal-header { display:flex; justify-content:space-between; align-items:center; padding:var(--space-5) var(--space-6); border-bottom:1px solid var(--border-color); }
      .am-modal-header h3 { font-size:var(--font-lg); font-weight:700; }
      .am-modal-body { padding:var(--space-5) var(--space-6); }
      .am-detail-row { display:flex; justify-content:space-between; padding:var(--space-2) 0; font-size:var(--font-sm); border-bottom:1px solid var(--border-color); }
      .am-detail-row:last-child { border-bottom:none; }
      .am-detail-label { color:var(--text-muted); }
      .am-detail-value { font-weight:600; text-align:right; max-width:60%; }
      .am-desc-box { background:var(--bg-secondary); padding:var(--space-4); border-radius:var(--radius-lg); margin:var(--space-4) 0; font-size:var(--font-sm); line-height:1.6; color:var(--text-secondary); }
      .am-action-section { margin-top:var(--space-5); padding-top:var(--space-4); border-top:1px solid var(--border-color); }
      .am-action-section h4 { font-size:var(--font-sm); font-weight:700; margin-bottom:var(--space-3); }
      .am-action-btns { display:flex; gap:var(--space-2); flex-wrap:wrap; margin-bottom:var(--space-3); }
      .am-action-btn { padding:var(--space-2) var(--space-4); border-radius:var(--radius-md); border:1px solid var(--border-color); background:transparent; font-size:var(--font-xs); font-weight:600; cursor:pointer; transition:all 0.15s; }
      .am-action-btn:hover { background:var(--gray-100); }
      .am-action-btn.primary { background:var(--primary-500); color:#fff; border-color:var(--primary-500); }
    </style>
  `);

  // Load complaints based on role/permissions
  let allComplaints = canViewAll
    ? await getAllComplaints()
    : await getComplaintsByUser(user.id);
  let activeFilter = 'all';

  // Render stats
  function renderStats() {
    const stats = { baru: 0, diproses: 0, ditindaklanjuti: 0, selesai: 0, ditolak: 0 };
    allComplaints.forEach(c => { if (stats[c.status] !== undefined) stats[c.status]++; });
    document.getElementById('aduanStats').innerHTML = Object.entries(STATUS_CONFIG).map(([key, cfg]) => `
      <div class="am-stat-card">
        <div class="am-stat-icon">${cfg.icon}</div>
        <div class="am-stat-num" style="color:${cfg.color}">${stats[key]}</div>
        <div class="am-stat-label">${cfg.label}</div>
      </div>
    `).join('');
  }

  // Render list
  function renderList() {
    const filtered = activeFilter === 'all' ? allComplaints : allComplaints.filter(c => c.status === activeFilter);
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const container = document.getElementById('aduanList');
    if (filtered.length === 0) {
      container.innerHTML = '<div class="am-empty"><p>Tidak ada aduan untuk filter ini.</p></div>';
      return;
    }
    container.innerHTML = filtered.map(c => {
      const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.baru;
      const dt = new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      const reporterDisplay = getReporterDisplay(c, canViewAll);
      return `
        <div class="am-card" data-id="${c.id}">
          <div class="am-card-top">
            <span class="am-card-resi">${c.tracking_number}</span>
            <span class="am-badge" style="background:${cfg.bg};color:${cfg.color}">${cfg.icon} ${cfg.label}</span>
          </div>
          <div class="am-card-cat">${c.category}</div>
          <div class="am-card-desc">${c.description}</div>
          <div class="am-card-footer">
            <span class="am-card-reporter" style="display:inline-flex;align-items:center;gap:4px;">${icons.user} ${reporterDisplay}</span>
            <span class="am-card-date">${dt}</span>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.am-card').forEach(card => {
      card.addEventListener('click', () => openDetail(card.dataset.id));
    });
  }

  // Filter
  document.querySelectorAll('.am-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.am-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderList();
    });
  });

  // Modal
  function closeModal() { document.getElementById('aduanModal').style.display = 'none'; }
  document.getElementById('aduanModalClose')?.addEventListener('click', closeModal);
  document.getElementById('aduanModal')?.addEventListener('click', (e) => { if (e.target.id === 'aduanModal') closeModal(); });

  function openDetail(id) {
    const c = allComplaints.find(x => x.id === id);
    if (!c) return;
    const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.baru;
    const dt = new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    document.getElementById('aduanModalTitle').textContent = `Detail: ${c.tracking_number}`;
    const detailReporter = getReporterDisplay(c, canViewAll);
    document.getElementById('aduanModalBody').innerHTML = `
      <div class="am-detail-row"><span class="am-detail-label">Resi</span><span class="am-detail-value" style="letter-spacing:0.06em">${c.tracking_number}</span></div>
      <div class="am-detail-row"><span class="am-detail-label">Status</span><span class="am-detail-value"><span class="am-badge" style="background:${cfg.bg};color:${cfg.color}">${cfg.icon} ${cfg.label}</span></span></div>
      <div class="am-detail-row"><span class="am-detail-label">Kategori</span><span class="am-detail-value">${c.category}</span></div>
      <div class="am-detail-row"><span class="am-detail-label">Pelapor</span><span class="am-detail-value">${detailReporter}</span></div>
      ${canViewAll && !c.is_anonymous ? `<div class="am-detail-row"><span class="am-detail-label">Telepon</span><span class="am-detail-value">${c.reporter_phone || '-'}</span></div>` : ''}
      <div class="am-detail-row"><span class="am-detail-label">Tanggal</span><span class="am-detail-value">${dt}</span></div>
      <div class="am-detail-row"><span class="am-detail-label">Alamat</span><span class="am-detail-value">${c.address || '-'}</span></div>
      ${c.lat ? `<div class="am-detail-row"><span class="am-detail-label">GPS</span><span class="am-detail-value" style="font-size:var(--font-xs)">${Number(c.lat).toFixed(6)}, ${Number(c.lng).toFixed(6)}</span></div>` : ''}
      ${c.is_anonymous ? '<div class="am-detail-row"><span class="am-detail-label">Mode</span><span class="am-detail-value"><span class="am-badge" style="background:rgba(107,114,128,0.1);color:#6b7280">🔒 Anonim</span></span></div>' : ''}

      <div class="am-desc-box"><strong>Deskripsi:</strong><br/>${c.description}</div>

      ${c.response ? `<div class="am-desc-box" style="border-left:3px solid var(--primary-500)"><strong><span style="display:inline-flex;align-items:center;gap:4px;vertical-align:-4px">${icons.messageCircle}</span> Tanggapan Dinas:</strong><br/>${c.response}</div>` : ''}

      ${canManage ? `
      <div class="am-action-section">
        <h4>Ubah Status</h4>
        <div class="am-action-btns">
          ${Object.entries(STATUS_CONFIG).map(([key, s]) => `
            <button class="am-action-btn ${c.status === key ? 'primary' : ''}" data-status="${key}" style="display:inline-flex;align-items:center;gap:4px;">${s.icon} ${s.label}</button>
          `).join('')}
        </div>
        <div class="form-group" style="margin-top:var(--space-3)">
          <label class="form-label" style="font-size:var(--font-xs)">Tanggapan / Catatan Tindak Lanjut</label>
          <textarea id="responseInput" class="form-textarea" rows="3" placeholder="Tuliskan tanggapan atau penjelasan untuk masyarakat...">${c.response || ''}</textarea>
        </div>
        <button class="btn btn-primary btn-block" id="saveStatusBtn" style="margin-top:var(--space-3);display:flex;align-items:center;justify-content:center;gap:8px;">${icons.checkCircle} Simpan Perubahan</button>
      </div>
      ` : ''}
    `;
    document.getElementById('aduanModal').style.display = 'flex';

    let selectedStatus = c.status;
    document.querySelectorAll('.am-action-btn[data-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.am-action-btn[data-status]').forEach(b => b.classList.remove('primary'));
        btn.classList.add('primary');
        selectedStatus = btn.dataset.status;
      });
    });

    document.getElementById('saveStatusBtn')?.addEventListener('click', async () => {
      const response = document.getElementById('responseInput')?.value.trim();
      try {
        await updateComplaint(c.id, { status: selectedStatus, response: response || c.response });
        allComplaints = canViewAll
          ? await getAllComplaints()
          : await getComplaintsByUser(user.id);
        showToast(`Status aduan diperbarui ke "${STATUS_CONFIG[selectedStatus].label}"`, 'success');
        closeModal();
        renderStats();
        renderList();
      } catch (err) {
        showToast('Gagal: ' + err.message, 'error');
      }
    });
  }

  renderStats();
  renderList();
}

/**
 * Privacy-aware reporter display
 * - Admin (canViewAll=true): Shows full name + phone
 * - Non-admin: Shows masked name, no phone
 * - Anonymous complaints: Shows "Anonim" for everyone
 */
function getReporterDisplay(complaint, canViewAll) {
  if (complaint.is_anonymous) {
    return '\ud83d\udd12 Pelapor Anonim';
  }

  if (canViewAll) {
    // Admin can see everything
    const name = complaint.reporter_name || 'Tidak diketahui';
    const phone = complaint.reporter_phone ? ' \u2022 ' + complaint.reporter_phone : '';
    return `${name}${phone}`;
  }

  // Non-admin: mask the name, hide phone
  const name = complaint.reporter_name || 'Pelapor';
  if (name.length <= 3) return name;
  return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
}
