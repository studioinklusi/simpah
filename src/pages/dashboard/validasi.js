// SIMPAH - Halaman Validasi Data (Anti-Fraud Queue)
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatWeight, formatDate } from '../../utils/helpers.js';
import { getAllWasteRecords, updateWasteRecordStatus, getAllMasterWilayah } from '../../db/store.js';
import { SIPSN_CATEGORIES } from '../../utils/sipsn.js';
import { showToast } from '../../components/toast.js';
import { renderDashboardLayout } from './layout.js';

import { canValidate } from '../../utils/permissions.js';
import { escapeHTML, sanitizeURL } from '../../utils/sanitize.js';

let pendingRecords = [];
let allRecordsCache = [];

export async function renderValidasi() {
  const user = getCurrentUser();
  if (!user || !canValidate(user)) {
    if (user?.role === 'petugas') {
      window.location.hash = '#/pwa/home';
    } else {
      window.location.hash = '#/dashboard/eksekutif';
    }
    return;
  }

  await loadData();
  renderView();
}

async function loadData() {
  const [records, masterWilayah] = await Promise.all([
    getAllWasteRecords(),
    getAllMasterWilayah()
  ]);

  const user = getCurrentUser();
  const isKecKoordinator = user?.role === 'petugas' && user?.job_type === 'koordinator' && user?.kecamatan;

  // Filter records by Kecamatan if user is a Koordinator
  let filteredRaw = records;
  if (isKecKoordinator) {
    filteredRaw = records.filter(r => {
      if (!r.desa_id) return false;
      const desa = masterWilayah.find(w => w.id === r.desa_id);
      return desa && desa.kecamatan.toLowerCase() === user.kecamatan.toLowerCase();
    });
  }

  // Set the cache based on the filter so local stats are scoped
  allRecordsCache = isKecKoordinator
    ? records.filter(r => {
        if (!r.desa_id) return false;
        const desa = masterWilayah.find(w => w.id === r.desa_id);
        return desa && desa.kecamatan.toLowerCase() === user.kecamatan.toLowerCase();
      })
    : records;

  const pendingRaw = filteredRaw
    .filter(r => r.verification_status === 'pending')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Enrich pending records with desa names
  pendingRaw.forEach(r => {
    if (r.desa_id) {
      const desa = masterWilayah.find(w => w.id === r.desa_id);
      if (desa) {
        r.desa_name = `Desa ${desa.desa_kelurahan}, Kec. ${desa.kecamatan}`;
        r.desa_only = desa.desa_kelurahan;
      }
    }
  });

  pendingRecords = groupPendingRecords(pendingRaw);
}

function groupPendingRecords(records) {
  const groups = [];
  const batchMap = new Map();

  for (const r of records) {
    if (r.is_batch && r.batch_id) {
      const batchId = r.batch_id;
      if (!batchMap.has(batchId)) {
        batchMap.set(batchId, {
          isBatchGroup: true,
          batchId: batchId,
          records: [],
          // Common properties
          id: r.id,
          created_at: r.created_at,
          user_id: r.user_id,
          user_name: r.user_name,
          location_id: r.location_id,
          location_name: r.location_name,
          desa_id: r.desa_id,
          desa_name: r.desa_name,
          desa_only: r.desa_only,
          type: r.type,
          category_sipsn: r.category_sipsn,
          lat: r.lat,
          lng: r.lng,
          photo_url: r.photo_url || '',
          notes: r.notes || ''
        });
      }
      const group = batchMap.get(batchId);
      group.records.push(r);
      if (r.photo_url && !group.photo_url) {
        group.photo_url = r.photo_url;
      }
      if (new Date(r.created_at) > new Date(group.created_at)) {
        group.created_at = r.created_at;
      }
    } else {
      // Normal record
      groups.push({
        isBatchGroup: false,
        id: r.id,
        records: [r],
        ...r
      });
    }
  }

  // Add the grouped batches to the list
  for (const group of batchMap.values()) {
    group.records.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    group.batch_start_date = group.records[0].created_at;
    group.batch_end_date = group.records[group.records.length - 1].created_at;
    group.batch_days = group.records.length;
    group.total_weight = group.records.reduce((sum, rec) => sum + parseFloat(rec.weight_kg || 0), 0);
    
    const baseNotes = group.records.map(rec => rec.notes || '').filter(n => n.trim() !== '');
    if (baseNotes.length > 0) {
      group.notes = baseNotes[0].replace(/\[Akumulasi[^\]]+\]/, '').trim();
    }
    
    groups.push(group);
  }

  // Sort groups by newest created_at
  groups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return groups;
}

function renderView() {
  const approvedCount = allRecordsCache.filter(r => !r.verification_status || r.verification_status === 'approved').length;
  const rejectedCount = allRecordsCache.filter(r => r.verification_status === 'rejected').length;

  const user = getCurrentUser();
  const isKecKoordinator = user?.role === 'petugas' && user?.job_type === 'koordinator' && user?.kecamatan;

  let headerContent = '';
  if (isKecKoordinator) {
    headerContent = `
      <div class="card" style="margin-bottom:var(--space-6); background:linear-gradient(135deg, var(--primary-900), var(--primary-800)); color:#fff; border:none; padding:var(--space-5); border-radius:12px; box-shadow:0 4px 12px rgba(5,150,105,0.15)">
        <div style="display:flex; align-items:center; gap:var(--space-4)">
          <div style="background:rgba(255,255,255,0.2); width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px">📍</div>
          <div>
            <h3 style="margin:0; font-size:var(--font-lg); font-weight:700; color:#fff">Wilayah Pengawasan: Kecamatan ${user.kecamatan}</h3>
            <p style="margin:4px 0 0 0; font-size:var(--font-xs); color:var(--primary-200); display:flex; align-items:center; gap:4px">
              Menampilkan data pending dan performa dari kader di seluruh desa/kelurahan di Kecamatan ${user.kecamatan}
            </p>
          </div>
        </div>
      </div>
    `;
  }

  renderDashboardLayout('Validasi Data', `
    <div class="page-enter">
      <div class="section-header" style="display:flex;justify-content:space-between;align-items:flex-end">
        <div>
          <h2 class="section-title">Antrean Validasi (Anti-Fraud)</h2>
          <p class="section-subtitle">Tinjau dan setujui input data sampah dari kader lapangan sebelum masuk ke SIPSN</p>
        </div>
        ${pendingRecords.length > 0 ? `<button class="btn btn-primary" id="approveAllBtn" style="background:var(--primary-600);border-color:var(--primary-600);white-space:nowrap">${icons.checkCircle} Setujui Semua (${pendingRecords.length})</button>` : ''}
      </div>

      ${headerContent}

      <!-- Stats -->
      <div class="grid-3" style="margin-bottom:var(--space-6)">
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
                  <th>Desa / Kelurahan</th>
                  <th>Lokasi / TPS</th>
                  <th>Jenis & Kategori</th>
                  <th style="text-align:right">Volume</th>
                  <th>Bukti Lampiran</th>
                  <th style="text-align:center;width:150px">Aksi Keputusan</th>
                </tr>
              </thead>
              <tbody>
                ${pendingRecords.map(r => {
                  const safePhoto = escapeHTML(sanitizeURL(r.photo_url));
                  const isBatch = r.isBatchGroup;
                  
                  return `
                    <tr id="row-${isBatch ? r.batchId : r.id}" class="val-row">
                      <td style="font-size:12px">
                        ${isBatch ? `
                          <div style="margin-bottom:4px"><span class="badge badge-primary" style="font-size:9px;padding:2px 6px">Akumulasi ${r.batch_days} Hari</span></div>
                          <div><strong>${formatDate(r.batch_start_date).split(' ')[0]} - ${formatDate(r.batch_end_date).split(' ')[0]}</strong></div>
                          <div style="color:var(--text-muted);font-size:11px">${formatDate(r.batch_end_date).split(' ').slice(1).join(' ')}</div>
                        ` : `
                          <div><strong>${formatDate(r.created_at).split(' ')[0]}</strong></div>
                          <div style="color:var(--text-muted)">${formatDate(r.created_at).split(' ').slice(1).join(' ')}</div>
                        `}
                      </td>
                      <td>
                        <div><strong>${escapeHTML(r.user_name || 'Anonim')}</strong></div>
                        <div style="font-size:11px;color:var(--text-muted)">ID: ${escapeHTML(r.user_id)}</div>
                      </td>
                      <td>
                        <div><strong>${escapeHTML(r.desa_only || '-')}</strong></div>
                        <div style="font-size:11px;color:var(--text-muted)">Kecamatan: ${escapeHTML(r.desa_name ? r.desa_name.split('Kec. ')[1] : '-')}</div>
                      </td>
                      <td>
                        <div><strong>${escapeHTML(r.location_name || '-')}</strong></div>
                        ${r.lat ? `<div style="font-size:10px;color:var(--primary-500)">${icons.mapPin} ${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}</div>` : ''}
                      </td>
                      <td>
                        <span class="badge ${(r.type==='masuk' || r.type==='campur') ? 'badge-warning' : r.type==='pilah' ? 'badge-primary' : r.type==='olah' ? 'badge-info' : 'badge-danger'}">
                          ${(r.type === 'campur' || r.type === 'masuk') ? 'CAMPUR' : r.type.toUpperCase()}
                        </span>
                        <div style="font-size:11px;margin-top:4px">${escapeHTML(getCatName(r.category_sipsn))}</div>
                        ${r.notes ? `<div style="font-size:10px;color:var(--text-muted);font-style:italic;margin-top:2px">"${escapeHTML(r.notes)}"</div>` : ''}
                      </td>
                      <td style="text-align:right">
                        ${isBatch ? `
                          <strong style="font-size:var(--font-lg);color:var(--text-primary)">${r.total_weight.toFixed(1)} kg</strong>
                          <div style="font-size:10px;color:var(--text-muted)">(${r.batch_days} hari @ ${(r.total_weight / r.batch_days).toFixed(1)} kg)</div>
                        ` : `
                          <strong style="font-size:var(--font-lg);color:var(--text-primary)">${r.weight_kg} kg</strong>
                        `}
                      </td>
                      <td>
                        ${safePhoto 
                          ? `<img src="${safePhoto}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;cursor:pointer" onclick="window.open('${safePhoto}','_blank')">` 
                          : '<span style="font-size:10px;color:var(--text-muted)">Tidak ada foto</span>'}
                      </td>
                      <td style="text-align:center;white-space:nowrap;">
                        <button class="btn btn-sm btn-icon" style="color:#ef4444;background:rgba(239,68,68,0.1)" title="Tolak Data" data-action="reject" data-id="${isBatch ? r.batchId : r.id}" data-is-batch="${isBatch}">${icons.xCircle}</button>
                        <button class="btn btn-sm btn-icon" style="color:#10b981;background:rgba(16,185,129,0.1);margin-left:4px" title="Setujui Data" data-action="approve" data-id="${isBatch ? r.batchId : r.id}" data-is-batch="${isBatch}">${icons.checkCircle}</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    </div>
  `, 'validasi');

  // Bind actions
  document.querySelectorAll('button[data-action="approve"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      handleAction(target.dataset.id, 'approved', '', target.dataset.isBatch === 'true');
    });
  });
  
  document.querySelectorAll('button[data-action="reject"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      const id = target.dataset.id;
      const isBatch = target.dataset.isBatch === 'true';
      const notes = prompt('Alasan penolakan data (Fraud/Duplikat/dll):');
      if (notes !== null) {
        handleAction(id, 'rejected', notes, isBatch);
      }
    });
  });

  // Bind Approve All
  const approveAllBtn = document.getElementById('approveAllBtn');
  if (approveAllBtn) {
    approveAllBtn.addEventListener('click', async () => {
      if (confirm(`Apakah Anda yakin ingin menyetujui ${pendingRecords.length} kelompok/data sekaligus? Tindakan ini akan mengesahkan data ke sistem SIPSN.`)) {
        approveAllBtn.innerHTML = '<div class="spinner" style="margin:0 auto"></div>';
        approveAllBtn.disabled = true;
        try {
          const user = getCurrentUser();
          const promises = [];
          for (const item of pendingRecords) {
            for (const r of item.records) {
              promises.push(updateWasteRecordStatus(r.id, 'approved', '', user.id));
            }
          }
          await Promise.all(promises);
          showToast(`Semua data pahlawan lingkungan berhasil disetujui!`, 'success');
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

async function handleAction(id, action, notes = '', isBatch = false) {
  try {
    const user = getCurrentUser();
    
    if (isBatch) {
      const group = pendingRecords.find(g => g.isBatchGroup && g.batchId === id);
      if (!group) throw new Error('Batch not found');
      
      const promises = group.records.map(r => updateWasteRecordStatus(r.id, action, notes, user.id));
      await Promise.all(promises);
      
      showToast(action === 'approved' ? `${group.records.length} data batch disetujui` : `${group.records.length} data batch ditolak`, action === 'approved' ? 'success' : 'error');
      
      // Animate removal
      const row = document.getElementById(`row-${id}`);
      if (row) {
        row.style.opacity = '0';
        row.style.transform = 'translateX(20px)';
        setTimeout(() => {
          row.remove();
          pendingRecords = pendingRecords.filter(g => !(g.isBatchGroup && g.batchId === id));
          const countEl = document.getElementById('statPending');
          if (countEl) countEl.innerText = pendingRecords.length;
          if (pendingRecords.length === 0) renderView();
        }, 300);
      }
    } else {
      await updateWasteRecordStatus(id, action, notes, user.id);
      showToast(action === 'approved' ? 'Data disetujui & masuk ke SIPSN' : 'Data ditolak', action === 'approved' ? 'success' : 'error');
      
      // Animate removal
      const row = document.getElementById(`row-${id}`);
      if (row) {
        row.style.opacity = '0';
        row.style.transform = 'translateX(20px)';
        setTimeout(() => {
          row.remove();
          pendingRecords = pendingRecords.filter(r => r.id !== id);
          const countEl = document.getElementById('statPending');
          if (countEl) countEl.innerText = pendingRecords.length;
          if (pendingRecords.length === 0) renderView();
        }, 300);
      }
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
