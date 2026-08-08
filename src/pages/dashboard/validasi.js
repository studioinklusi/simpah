// SIMPAH - Halaman Validasi Data (Anti-Fraud Queue)
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatWeight, formatDate, onStateChange, getKaderActivityStatus } from '../../utils/helpers.js';
import { getAllWasteRecords, updateWasteRecordStatus, getAllMasterWilayah, getUsersWithActivity } from '../../db/store.js';
import { SIPSN_CATEGORIES } from '../../utils/sipsn.js';
import { showToast } from '../../components/toast.js';
import { renderDashboardLayout } from './layout.js';
import { showModal } from '../../components/modal.js';

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

  const unsubWaste = onStateChange('waste_records_updated', async () => {
    console.log('[Realtime] Validation Queue: waste_records updated, refreshing queue...');
    await loadData();
    renderView();
  });

  return () => {
    unsubWaste();
  };
}

let usersWithActivityCache = [];
let masterWilayahCache = [];

async function loadData() {
  const [records, masterWilayah, usersWithAct] = await Promise.all([
    getAllWasteRecords(),
    getAllMasterWilayah(),
    getUsersWithActivity()
  ]);
  masterWilayahCache = masterWilayah;
  usersWithActivityCache = usersWithAct.map(u => {
    let desaDisplay = '-';
    if (u.desa_id) {
      const w = masterWilayah.find(item => item.id === u.desa_id);
      if (w) {
        desaDisplay = w.desa_kelurahan;
      } else if (u.desa) {
        desaDisplay = u.desa;
      } else if (!u.desa_id.includes('-')) {
        desaDisplay = u.desa_id;
      }
    } else if (u.desa) {
      desaDisplay = u.desa;
    }
    return { ...u, desa_display: desaDisplay };
  });

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
      <div class="card" style="padding:0; overflow:hidden; border:1px solid var(--border-color)">
        <div id="validasiTableContainer" style="max-height:calc(100vh - 340px); overflow:auto;">
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
                  <th class="sticky-col" style="text-align:center;width:150px">Aksi Keputusan</th>
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
                          ? `<img src="${safePhoto}" class="val-thumbnail" data-id="${isBatch ? r.batchId : r.id}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;cursor:pointer" title="Klik untuk memperbesar">` 
                          : '<span style="font-size:10px;color:var(--text-muted)">Tidak ada foto</span>'}
                      </td>
                      <td class="sticky-col" style="text-align:center;white-space:nowrap;">
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
        </div>
      
      ${user?.role === 'petugas' && user?.job_type === 'koordinator' && user?.kecamatan ? (() => {
        const kecKaders = usersWithActivityCache.filter(u => {
          if (u.role !== 'petugas' || u.job_type !== 'kader') return false;
          if (u.kecamatan && u.kecamatan.toLowerCase() === user.kecamatan.toLowerCase()) return true;
          if (u.wilayah && u.wilayah.toLowerCase() === user.kecamatan.toLowerCase()) return true;
          if (u.desa_id) {
            const w = masterWilayahCache.find(item => item.id === u.desa_id);
            if (w && w.kecamatan.toLowerCase() === user.kecamatan.toLowerCase()) return true;
          }
          return false;
        });
        let kecActive = 0, kecPassive = 0, kecInactive = 0;
        kecKaders.forEach(u => {
          const act = getKaderActivityStatus(u.last_input_at);
          if (act.status === 'active') kecActive++;
          else if (act.status === 'passive') kecPassive++;
          else if (act.status === 'inactive' || act.status === 'never') kecInactive++;
        });

        return `
          <div class="card" style="margin-top:var(--space-6); padding:var(--space-5); border:1px solid var(--border-color);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4); flex-wrap:wrap; gap:var(--space-2);">
              <h3 style="margin:0; font-size:var(--font-md); font-weight:700; display:flex; align-items:center; gap:8px;">
                🌿 Pemantauan Keaktifan Kader Lapangan (Kec. ${escapeHTML(user.kecamatan)})
              </h3>
              <span style="font-size:var(--font-xs); color:var(--text-muted); font-weight:600;">${kecKaders.length} kader terdaftar</span>
            </div>
            
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:var(--space-3); margin-bottom:var(--space-4);">
              <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2); border-radius:var(--radius-md); padding:var(--space-3); text-align:center;">
                <div style="font-size:11px; font-weight:700; color:#065f46; text-transform:uppercase;">🟢 Aktif (≤10 hr)</div>
                <div style="font-size:20px; font-weight:800; color:#10b981; margin-top:2px;">${kecActive} <span style="font-size:12px; font-weight:500; color:var(--text-muted)">kader</span></div>
              </div>
              <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:var(--radius-md); padding:var(--space-3); text-align:center;">
                <div style="font-size:11px; font-weight:700; color:#92400e; text-transform:uppercase;">🟡 Pasif (11-30 hr)</div>
                <div style="font-size:20px; font-weight:800; color:#d97706; margin-top:2px;">${kecPassive} <span style="font-size:12px; font-weight:500; color:var(--text-muted)">kader</span></div>
              </div>
              <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:var(--radius-md); padding:var(--space-3); text-align:center;">
                <div style="font-size:11px; font-weight:700; color:#991b1b; text-transform:uppercase;">🔴 Inaktif (>30 hr/Nihil)</div>
                <div style="font-size:20px; font-weight:800; color:#ef4444; margin-top:2px;">${kecInactive} <span style="font-size:12px; font-weight:500; color:var(--text-muted)">kader</span></div>
              </div>
            </div>

            ${kecKaders.length > 0 ? `
              <div style="max-height:220px; overflow:auto; border:1px solid var(--border-color); border-radius:var(--radius-md);">
                <table class="table" style="font-size:var(--font-xs); width:100%;">
                  <thead>
                    <tr>
                      <th>Nama Kader</th>
                      <th>Desa</th>
                      <th>Status Keaktifan</th>
                      <th>Input Terakhir</th>
                      <th>Total Record</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${kecKaders.map(k => {
                      const act = getKaderActivityStatus(k.last_input_at);
                      const desaName = k.desa_display || k.desa_name || k.desa || '-';
                      return `
                        <tr>
                          <td><strong>${escapeHTML(k.full_name || k.name || '-')}</strong></td>
                          <td>Desa ${escapeHTML(desaName)}</td>
                          <td>
                            <span class="badge" style="background:${act.color === 'green' ? '#d1fae5' : (act.color === 'amber' ? '#fef3c7' : '#fee2e2')}; color:${act.color === 'green' ? '#065f46' : (act.color === 'amber' ? '#92400e' : '#991b1b')}; font-weight:700;">
                              ${act.icon} ${act.label}
                            </span>
                          </td>
                          <td>${k.last_input_at ? (act.days === 0 ? 'Hari ini' : `${act.days} hari lalu`) : 'Belum pernah'}</td>
                          <td>${k.total_waste_records || 0}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<div style="text-align:center; padding:var(--space-4); color:var(--text-muted); font-size:var(--font-xs);">Belum ada kader terdaftar di kecamatan ini.</div>'}
          </div>
        `;
      })() : ''}

      <!-- Custom Table Fix Style for Sticky Header -->
      <style>
        #validasiTableContainer {
          position: relative;
        }
        #validasiTable {
          border-collapse: separate !important;
          border-spacing: 0 !important;
        }
        #validasiTable th, #validasiTable td {
          border-bottom: 1px solid var(--border-color) !important;
        }
        #validasiTable thead th {
          position: sticky !important;
          top: 0;
          z-index: 20;
          background: var(--bg-secondary) !important;
        }
        #validasiTable thead th.sticky-col {
          z-index: 30;
        }
        .sticky-col {
          position: sticky !important;
          right: 0;
          z-index: 10;
          box-shadow: -6px 0 10px rgba(0,0,0,0.05);
        }
        th.sticky-col {
          background: var(--bg-secondary) !important;
        }
        td.sticky-col {
          background: var(--bg-card) !important;
        }
        tr:hover td.sticky-col {
          background: var(--gray-50) !important;
        }
        [data-theme="dark"] tr:hover td.sticky-col {
          background: rgba(255,255,255,0.03) !important;
        }
      </style>
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

      const modalObj = showModal({
        title: 'Tolak Laporan Sampah',
        content: `
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 600; font-size: 13px; margin-bottom: 8px; display: block; color: var(--text-primary);">Alasan Penolakan Data (Fraud/Duplikat/dll):</label>
            <input type="text" id="rejectReasonInput" class="form-input" placeholder="Masukkan alasan penolakan..." style="width: 100%;" />
          </div>
        `,
        actions: [
          {
            label: 'Batal',
            variant: 'btn-secondary',
            handler: () => {}
          },
          {
            label: 'Tolak Data',
            variant: 'btn-danger',
            closeOnClick: false,
            handler: () => {
              const input = document.getElementById('rejectReasonInput');
              const reason = input ? input.value.trim() : '';
              if (!reason) {
                showToast('Alasan penolakan harus diisi!', 'warning');
                if (input) input.focus();
                return;
              }
              modalObj.close();
              handleAction(id, 'rejected', reason, isBatch);
            }
          }
        ]
      });

      // Focus the input and add Enter submit handler
      setTimeout(() => {
        const input = document.getElementById('rejectReasonInput');
        if (input) {
          input.focus();
          input.addEventListener('keydown', (evt) => {
            if (evt.key === 'Enter') {
              const reason = input.value.trim();
              if (!reason) {
                showToast('Alasan penolakan harus diisi!', 'warning');
                input.focus();
                return;
              }
              modalObj.close();
              handleAction(id, 'rejected', reason, isBatch);
            }
          });
        }
      }, 50);
    });
  });

  // Bind Approve All
  const approveAllBtn = document.getElementById('approveAllBtn');
  if (approveAllBtn) {
    approveAllBtn.addEventListener('click', async () => {
      const modalObj = showModal({
        title: 'Setujui Semua Data',
        content: `
          <div style="display: flex; gap: var(--space-4); align-items: flex-start; padding-top: var(--space-2)">
            <div style="background: rgba(16, 185, 129, 0.1); color: var(--primary-500); padding: var(--space-3); border-radius: var(--radius-lg); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div>
              <p style="margin: 0; font-weight: 600; font-size: 15px; color: var(--text-primary);">Apakah Anda yakin ingin menyetujui semua data?</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">Tindakan ini akan menyetujui <strong>${pendingRecords.length}</strong> kelompok/data sekaligus dan mengesahkannya ke sistem SIPSN.</p>
            </div>
          </div>
        `,
        actions: [
          {
            label: 'Batal',
            variant: 'btn-secondary',
            handler: () => {}
          },
          {
            label: 'Ya, Setujui',
            variant: 'btn-primary',
            handler: async () => {
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
          }
        ]
      });
    });
  }

  // Bind Lightbox preview
  document.querySelectorAll('.val-thumbnail').forEach(img => {
    img.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const group = pendingRecords.find(g => (g.isBatchGroup && g.batchId === id) || (!g.isBatchGroup && g.id === id));
      if (group) {
        showPhotoLightbox(group.photo_url || (group.records?.[0]?.photo_url), group);
      }
    });
  });
}

function showPhotoLightbox(photoUrl, record) {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.style = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(13, 18, 31, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.25s ease-out;
  `;
  
  const content = document.createElement('div');
  content.className = 'lightbox-content';
  content.style = `
    position: relative;
    max-width: 90%;
    max-height: 85%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  closeBtn.style = `
    position: absolute;
    top: -48px;
    right: 0;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  `;
  closeBtn.onmouseover = () => { closeBtn.style.background = 'rgba(255, 255, 255, 0.2)'; };
  closeBtn.onmouseout = () => { closeBtn.style.background = 'rgba(255, 255, 255, 0.1)'; };
  
  const img = document.createElement('img');
  img.src = photoUrl;
  img.style = `
    max-width: 100%;
    max-height: 65vh;
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(255,255,255,0.1);
    object-fit: contain;
  `;
  
  const info = document.createElement('div');
  info.style = `
    background: rgba(28, 36, 56, 0.95);
    border: 1px solid rgba(255,255,255,0.08);
    padding: var(--space-4) var(--space-5);
    border-radius: 12px;
    color: #fff;
    width: 100%;
    max-width: 480px;
    box-sizing: border-box;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
  `;
  
  const title = record.isBatchGroup 
    ? `Akumulasi Laporan: ${record.total_weight.toFixed(1)} kg (${record.batch_days} Hari)`
    : `Laporan Sampah: ${record.weight_kg} kg`;
  
  info.innerHTML = `
    <h4 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">${title}</h4>
    <table style="width: 100%; font-size: 12px; border-collapse: collapse; text-align: left;">
      <tr><td style="padding: 2px 0; color: #9ca3af; width: 80px;">Kader</td><td style="padding: 2px 0; color: #fff;">: ${escapeHTML(record.user_name || 'Anonim')}</td></tr>
      <tr><td style="padding: 2px 0; color: #9ca3af;">Desa</td><td style="padding: 2px 0; color: #fff;">: ${escapeHTML(record.desa_only || '-')}</td></tr>
      <tr><td style="padding: 2px 0; color: #9ca3af;">Lokasi</td><td style="padding: 2px 0; color: #fff;">: ${escapeHTML(record.location_name || '-')}</td></tr>
      <tr><td style="padding: 2px 0; color: #9ca3af;">Kategori</td><td style="padding: 2px 0; color: #fff;">: ${escapeHTML(getCatName(record.category_sipsn))}</td></tr>
      ${record.notes ? `<tr><td style="padding: 4px 0 2px 0; color: #9ca3af; vertical-align: top;">Catatan</td><td style="padding: 4px 0 2px 0; color: #e5e7eb; font-style: italic;">: "${escapeHTML(record.notes)}"</td></tr>` : ''}
    </table>
  `;
  
  content.appendChild(closeBtn);
  content.appendChild(img);
  content.appendChild(info);
  overlay.appendChild(content);
  
  const closeLightbox = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s ease';
    setTimeout(() => overlay.remove(), 200);
  };
  
  closeBtn.onclick = closeLightbox;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeLightbox();
  };
  
  document.body.appendChild(overlay);
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
