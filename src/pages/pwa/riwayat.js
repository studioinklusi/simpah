// SIMPAH - Riwayat (History)
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatDate, formatWeight, formatDateTime } from '../../utils/helpers.js';
import { getAllWasteRecords } from '../../db/store.js';
import { showToast } from '../../components/toast.js';
import { renderPWALayout } from './layout.js';

export async function renderRiwayat() {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/login'; return; }
  
  const records = await getAllWasteRecords();
  const sorted = records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const typeFilter = { masuk: true, pilah: true, residu: true };

  renderPWALayout('Riwayat', `
    <div class="page-enter">
      <div class="tabs" style="margin-bottom:var(--space-4)">
        <button class="tab active" data-filter="all">Semua</button>
        <button class="tab" data-filter="masuk">Masuk</button>
        <button class="tab" data-filter="campur">Campur</button>
        <button class="tab" data-filter="pilah">Terpilah</button>
        <button class="tab" data-filter="residu">Residu</button>
      </div>

      <div class="record-list" id="recordList">
        ${renderRecords(sorted)}
      </div>
    </div>
  `, 'riwayat');

  // Filter tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      const filtered = filter === 'all' ? sorted : sorted.filter(r => r.type === filter);
      document.getElementById('recordList').innerHTML = renderRecords(filtered);
    });
  });
}

function renderRecords(records) {
  if (records.length === 0) {
    return '<div class="empty-state"><p>Tidak ada data</p></div>';
  }

  let currentDate = '';
  let html = '';
  records.forEach(r => {
    const dateStr = formatDate(r.created_at);
    if (dateStr !== currentDate) {
      currentDate = dateStr;
      html += `<div style="padding:var(--space-3) 0 var(--space-2);font-size:var(--font-xs);font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em">${dateStr}</div>`;
    }
    html += `
      <div class="record-item">
        <div class="record-icon" style="background:${getTypeBg(r.type)}">${getTypeEmoji(r.type)}</div>
        <div class="record-info">
          <div class="record-title">${getTypeLabel(r.type)} ${r.category_sipsn ? `· ${r.category_sipsn}` : ''}</div>
          <div class="record-meta">${r.location_name || 'Lokasi manual'} · ${new Date(r.created_at).toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'})}</div>
          ${r.photo_count > 0 ? `<div style="display:flex;gap:4px;margin-top:4px;align-items:center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span style="font-size:10px;color:var(--text-muted)">${r.photo_count} foto</span>
            ${(r.photos || []).slice(0, 3).map(p => `<img src="${p.dataUrl}" style="width:20px;height:20px;object-fit:cover;border-radius:3px;border:1px solid var(--border-color)" />`).join('')}
          </div>` : ''}
        </div>
        <div class="record-value" style="display:flex;flex-direction:column;align-items:flex-end">
          <span style="font-size:var(--font-lg);font-weight:700;color:var(--text-primary)">${formatWeight(r.weight_kg)}</span>
          ${getVerificationBadge(r)}
        </div>
      </div>
    `;
  });
  return html;
}

function getTypeLabel(t) { return {masuk:'Sampah Masuk',campur:'Sampah Campur',pilah:'Terpilah',olah:'Olah Sampah',residu:'Residu'}[t]||t; }
function getTypeEmoji(t) { return {masuk:icons.download,campur:icons.box,pilah:icons.layers,olah:icons.activity,residu:icons.trash}[t]||icons.box; }
function getTypeBg(t) { return {masuk:'rgba(16,185,129,0.12)',campur:'rgba(245,158,11,0.12)',pilah:'rgba(59,130,246,0.12)',olah:'rgba(245,158,11,0.12)',residu:'rgba(239,68,68,0.12)'}[t]; }

function getVerificationBadge(r) {
  if (!r.synced) return '<span class="badge badge-warning" style="font-size:9px;margin-top:4px">Sinkronisasi...</span>';
  if (!r.verification_status || r.verification_status === 'approved') return '<span class="badge badge-success" style="font-size:9px;margin-top:4px">Disetujui</span>';
  if (r.verification_status === 'rejected') return '<span class="badge badge-danger" style="font-size:9px;margin-top:4px">Ditolak</span>';
  return '<span class="badge" style="background:#fef08a;color:#854d0e;font-size:9px;margin-top:4px">Menunggu Validasi</span>';
}
