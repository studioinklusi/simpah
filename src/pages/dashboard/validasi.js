// SIMPAH - Halaman Validasi Data (Anti-Fraud Queue)
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatWeight, formatDate } from '../../utils/helpers.js';
import { getAllWasteRecords, updateWasteRecordStatus } from '../../db/store.js';
import { SIPSN_CATEGORIES } from '../../utils/sipsn.js';
import { showToast } from '../../components/toast.js';
import { renderDashboardLayout } from './layout.js';

import { canValidate } from '../../utils/permissions.js';

let pendingRecords = [];
let allRecordsCache = [];

export async function renderValidasi() {
  const user = getCurrentUser();
  if (!user || !canValidate(user)) { 
    window.location.hash = '#/dashboard'; 
    return; 
  }

  await loadData();
  renderView();
}

async function loadData() {
  allRecordsCache = await getAllWasteRecords();
  pendingRecords = allRecordsCache
    .filter(r => r.verification_status === 'pending')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function renderView() {
  const approvedCount = allRecordsCache.filter(r => !r.verification_status || r.verification_status === 'approved').length;
  const rejectedCount = allRecordsCache.filter(r => r.verification_status === 'rejected').length;

  renderDashboardLayout('Validasi Data', `
    <div class="page-enter">
      <div class="section-header" style="display:flex;justify-content:space-between;align-items:flex-end">
        <div>
          <h2 class="section-title">Antrean Validasi (Anti-Fraud)</h2>
          <p class="section-subtitle">Tinjau dan setujui input data sampah dari kader lapangan sebelum masuk ke SIPSN</p>
        </div>
        ${pendingRecords.length > 0 ? `<button class="btn btn-primary" id="approveAllBtn" style="background:var(--primary-600);border-color:var(--primary-600);white-space:nowrap">${icons.checkCircle} Setujui Semua (${pendingRecords.length})</button>` : ''}
      </div>

      <!-- Stats -->
      <div class="grid-4" style="margin-bottom:var(--space-6)">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b">${icons.activity}</div>
          <div class="stat-value" style="color:#f59e0b" id="statPending">${pendingRecords.length}</div>
          <div class="stat-label">Menunggu Validasi</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.12);color:#10b981">${icons.checkCircle}</div>
          <div class="stat-value" style="color:#10b981">${approvedCount}</div>
          <div class="stat-label">Total Disetujui</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444">${icons.alert}</div>
          <div class="stat-value" style="color:#ef4444">${rejectedCount}</div>
          <div class="stat-label">Total Ditolak</div>
        </div>
      </div>

      <!-- Queue Table -->
      <div class="card">
        <div class="table-container" style="border:none">
          ${pendingRecords.length === 0 
            ? `<div style="text-align:center;padding:var(--space-8);color:var(--text-muted)">
                 <div style="font-size:2rem;margin-bottom:var(--space-3);color:var(--primary-500)">${icons.award}</div>
                 <p>Tidak ada data antrean. Seluruh data telah tervalidasi.</p>
               </div>`
            : `
            <table class="table" id="validasiTable">
              <thead>
                <tr>
                  <th>Waktu Laporan</th>
                  <th>Petugas / Kader</th>
                  <th>Lokasi / TPS</th>
                  <th>Jenis & Kategori</th>
                  <th style="text-align:right">Volume</th>
                  <th>Bukti Lampiran</th>
                  <th style="text-align:center;width:150px">Aksi Keputusan</th>
                </tr>
              </thead>
              <tbody>
                ${pendingRecords.map(r => `
                  <tr id="row-${r.id}" class="val-row">
                    <td style="font-size:12px">
                      <div><strong>${formatDate(r.created_at).split(' ')[0]}</strong></div>
                      <div style="color:var(--text-muted)">${formatDate(r.created_at).split(' ').slice(1).join(' ')}</div>
                    </td>
                    <td>
                      <div><strong>${r.user_name || 'Anonim'}</strong></div>
                      <div style="font-size:11px;color:var(--text-muted)">ID: ${r.user_id}</div>
                    </td>
                    <td>
                      <div><strong>${r.location_name || '-'}</strong></div>
                      ${r.lat ? `<div style="font-size:10px;color:var(--primary-500)">${icons.mapPin} ${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}</div>` : ''}
                    </td>
                    <td>
                      <span class="badge ${r.type==='masuk'?'badge-success':r.type==='pilah'?'badge-primary':r.type==='campur'?'badge-warning':'badge-danger'}">
                        ${r.type === 'campur' ? 'CAMPUR' : r.type.toUpperCase()}
                      </span>
                      <div style="font-size:11px;margin-top:4px">${getCatName(r.category_sipsn)}</div>
                      ${r.notes ? `<div style="font-size:10px;color:var(--text-muted);font-style:italic;margin-top:2px">"${r.notes}"</div>` : ''}
                    </td>
                    <td style="text-align:right">
                      <strong style="font-size:var(--font-lg);color:var(--text-primary)">${r.weight_kg} kg</strong>
                    </td>
                    <td>
                      ${r.photo_url 
                        ? `<img src="${r.photo_url}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;cursor:pointer" onclick="window.open('${r.photo_url}','_blank')">` 
                        : '<span style="font-size:10px;color:var(--text-muted)">Tidak ada foto</span>'}
                    </td>
                    <td style="text-align:center;white-space:nowrap;">
                      <button class="btn btn-sm btn-icon" style="color:#ef4444;background:rgba(239,68,68,0.1)" title="Tolak Data" data-action="reject" data-id="${r.id}">${icons.xCircle}</button>
                      <button class="btn btn-sm btn-icon" style="color:#10b981;background:rgba(16,185,129,0.1);margin-left:4px" title="Setujui Data" data-action="approve" data-id="${r.id}">${icons.checkCircle}</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    </div>
  `, 'validasi');

  // Bind actions
  document.querySelectorAll('button[data-action="approve"]').forEach(btn => {
    btn.addEventListener('click', (e) => handleAction(e.target.closest('button').dataset.id, 'approved'));
  });
  
  document.querySelectorAll('button[data-action="reject"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('button').dataset.id;
      const notes = prompt('Alasan penolakan data (Fraud/Duplikat/dll):');
      if (notes !== null) {
        handleAction(id, 'rejected', notes);
      }
    });
  });

  // Bind Approve All
  const approveAllBtn = document.getElementById('approveAllBtn');
  if (approveAllBtn) {
    approveAllBtn.addEventListener('click', async () => {
      if (confirm(`Apakah Anda yakin ingin menyetujui ${pendingRecords.length} data sekaligus? Tindakan ini akan mengesahkan data ke sistem SIPSN.`)) {
        approveAllBtn.innerHTML = '<div class="spinner" style="margin:0 auto"></div>';
        approveAllBtn.disabled = true;
        try {
          const user = getCurrentUser();
          const promises = pendingRecords.map(r => updateWasteRecordStatus(r.id, 'approved', '', user.id));
          await Promise.all(promises);
          showToast(`${pendingRecords.length} data pahlawan lingkungan berhasil disetujui!`, 'success');
          pendingRecords = [];
          const countEl = document.getElementById('statPending');
          if (countEl) countEl.innerText = 0;
          renderValidasi();
        } catch (e) {
          showToast('Gagal menyetujui data massal', 'error');
          renderValidasi();
        }
      }
    });
  }
}

async function handleAction(id, action, notes = '') {
  try {
    const user = getCurrentUser();
    await updateWasteRecordStatus(id, action, notes, user.id);
    showToast(action === 'approved' ? 'Data disetujui & masuk ke SIPSN' : 'Data ditolak', action === 'approved' ? 'success' : 'error');
    
    // Animate removal
    const row = document.getElementById(`row-${id}`);
    if (row) {
      row.style.opacity = '0';
      row.style.transform = 'translateX(20px)';
      setTimeout(() => {
        row.remove();
        // Update local state
        pendingRecords = pendingRecords.filter(r => r.id !== id);
        const countEl = document.getElementById('statPending');
        if (countEl) countEl.innerText = pendingRecords.length;
        if (pendingRecords.length === 0) renderView(); // Re-render to show empty state
      }, 300);
    }
  } catch (e) {
    console.error(e);
    showToast('Terjadi kesalahan sistem', 'error');
  }
}

function getCatName(code) {
  if (!code) return '-';
  const cat = SIPSN_CATEGORIES.find(c => c.code === code);
  return cat ? cat.name : code;
}
