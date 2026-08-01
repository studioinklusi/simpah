// SIMPAH - Master Data Management (CRUD Panel for Dinas)
import { icons } from '../../components/icons.js';
import { getCurrentUser, getKaderActivityStatus } from '../../utils/helpers.js';
import { LOCATION_TYPES, USER_ROLES } from '../../utils/sipsn.js';
import { JOB_TYPES, hasPermission, getAllowedInputTypes, canInputWaste } from '../../utils/permissions.js';
import { showToast } from '../../components/toast.js';
import { renderDashboardLayout } from './layout.js';
import {
  getAllLocations, addLocation, addLocationsBatch, updateLocation, deleteLocation, deleteLocationsBatch,
  getAllFleet, addFleet, updateFleet, deleteFleet,
  getAllUsers, getUsersWithActivity, addUser, updateUser, deleteUser, deleteUsersBatch, deactivateUsersBatch,
  getAllVillagePopulation, addVillagePopulation, updateVillagePopulation, deleteVillagePopulation,
  getAllPublicFacilities, addPublicFacility, updatePublicFacility, deletePublicFacility, deletePublicFacilitiesBatch, addPublicFacilitiesBatch,
  getSystemModules, getSystemRoles, getRolePermissions, saveRolePermissions,
  getAllInvitationCodes, addInvitationCode, updateInvitationCode, deleteInvitationCode,
  getAllMasterWilayah, updateMasterWilayah, updatePopulationBatch} from '../../db/store.js';
import { wireSearchableSelect } from '../../utils/searchable-select.js';
import { showModal } from '../../components/modal.js';
export async function renderMasterData() {
  const user = getCurrentUser();
  if (!user || !hasPermission(user, 'MANAGE_MASTER_DATA')) {
    window.location.hash = '#/dashboard/gis';
    return;
  }

  renderDashboardLayout('Master Data', `
    <div class="master-data page-enter">
      <div class="md-header">
        <h2 style="display:flex;align-items:center;gap:var(--space-2)">${icons.settings} Pengaturan Master Data</h2>
        <p>Kelola data referensi sistem: lokasi, kendaraan, pengguna, dan data kependudukan.</p>
      </div>

      <div class="md-tabs" id="mdTabs">
        <button class="md-tab active" data-tab="locations" style="display:inline-flex;align-items:center;gap:8px">${icons.mapPin} Lokasi</button>
        <button class="md-tab" data-tab="fleet" style="display:inline-flex;align-items:center;gap:8px">${icons.truck} Kendaraan</button>
        <button class="md-tab" data-tab="users" style="display:inline-flex;align-items:center;gap:8px">${icons.users} Pengguna</button>
        <button class="md-tab" data-tab="population" style="display:inline-flex;align-items:center;gap:8px">${icons.chart} Kependudukan</button>
        <button class="md-tab" data-tab="fasum" style="display:inline-flex;align-items:center;gap:8px">${icons.grid} Fasilitas Umum</button>
        <button class="md-tab" data-tab="rbac" style="display:inline-flex;align-items:center;gap:8px">${icons.shield} Hak Akses</button>
        <button class="md-tab" data-tab="invitations" style="display:inline-flex;align-items:center;gap:8px">🎟️ Kode Undangan</button>
      </div>

      <div class="md-content" id="mdContent">
        <div class="md-loading"><div class="spinner"></div></div>
      </div>
    </div>

    <!-- Modal Overlay -->
    <div class="md-modal-overlay" id="mdModal" style="display:none">
      <div class="md-modal">
        <div class="md-modal-header">
          <h3 id="modalTitle">Form</h3>
          <button class="md-modal-close" id="modalClose">${icons.close}</button>
        </div>
        <div class="md-modal-body" id="modalBody"></div>
      </div>
    </div>

    <style>
      .master-data { width:100%; max-width:1100px; }
      .md-header h2 { font-size:var(--font-xl); font-weight:700; margin-bottom:var(--space-1); }
      .md-header p { font-size:var(--font-sm); color:var(--text-secondary); margin-bottom:var(--space-5); }
      .md-tabs { display:flex; gap:var(--space-2); border-bottom:2px solid var(--border-color); margin-bottom:var(--space-5); flex-wrap:nowrap; overflow-x:auto; -webkit-overflow-scrolling:touch; padding-bottom:6px; scrollbar-width:thin; scrollbar-color:rgba(156,163,175,0.3) transparent; }
      .md-tabs::-webkit-scrollbar { height:4px; }
      .md-tabs::-webkit-scrollbar-track { background:transparent; }
      .md-tabs::-webkit-scrollbar-thumb { background:rgba(156,163,175,0.3); border-radius:4px; }
      .md-tabs::-webkit-scrollbar-thumb:hover { background:rgba(156,163,175,0.6); }
      .md-tab { padding:var(--space-3) var(--space-5); border:none; background:none; font-size:var(--font-sm); font-weight:600; cursor:pointer; color:var(--text-secondary); border-bottom:2px solid transparent; margin-bottom:-2px; transition:all 0.2s; border-radius:var(--radius-md) var(--radius-md) 0 0; flex-shrink:0; white-space:nowrap; }
      .md-tab:hover { color:var(--text-primary); background:var(--gray-50); }
      .md-tab.active { color:var(--primary-600); border-bottom-color:var(--primary-500); background:rgba(16,185,129,0.05); }
      .md-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4); flex-wrap:wrap; gap:var(--space-3); }
      .md-toolbar h3 { font-size:var(--font-base); font-weight:600; }
      .md-count { font-size:var(--font-xs); color:var(--text-muted); background:var(--gray-100); padding:var(--space-1) var(--space-3); border-radius:var(--radius-full); }
      .md-table-container { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; margin-bottom:var(--space-4); }
      .md-table { width:100%; border-collapse:separate; border-spacing:0; border:1px solid var(--border-color); border-radius:var(--radius-lg); overflow:hidden; }
      .md-table th { background:var(--gray-50); padding:var(--space-3) var(--space-4); font-size:var(--font-xs); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-secondary); text-align:left; border-bottom:1px solid var(--border-color); }
      .md-table td { padding:var(--space-3) var(--space-4); font-size:var(--font-sm); border-bottom:1px solid var(--border-color); vertical-align:middle; }
      .md-table tr:last-child td { border-bottom:none; }
      .md-table tr:hover td { background:rgba(16,185,129,0.03); }
      .md-badge { display:inline-flex; align-items:center; gap:var(--space-1); padding:var(--space-1) var(--space-3); border-radius:var(--radius-full); font-size:var(--font-xs); font-weight:600; }
      .md-badge.green { background:rgba(16,185,129,0.1); color:#047857; }
      .md-badge.red { background:rgba(239,68,68,0.1); color:#b91c1c; }
      .md-badge.blue { background:rgba(59,130,246,0.1); color:#1d4ed8; }
      .md-badge.amber { background:rgba(245,158,11,0.1); color:#92400e; }
      .md-badge.purple { background:rgba(139,92,246,0.1); color:#6d28d9; }
      .md-actions { display:flex; gap:var(--space-2); }
      .md-btn-icon { width:32px; height:32px; border-radius:var(--radius-md); border:1px solid var(--border-color); background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; transition:all 0.15s; }
      .md-btn-icon:hover { background:var(--gray-100); }
      .md-btn-icon.danger:hover { background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.3); }
      .md-empty { text-align:center; padding:var(--space-8); color:var(--text-muted); font-size:var(--font-sm); }
      .md-modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s ease; }
      .md-modal { background:var(--bg-primary); border-radius:var(--radius-xl); width:90%; max-width:520px; max-height:85vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.2); animation:scaleIn 0.2s ease; }
      .md-modal-header { display:flex; justify-content:space-between; align-items:center; padding:var(--space-5) var(--space-6); border-bottom:1px solid var(--border-color); }
      .md-modal-header h3 { font-size:var(--font-lg); font-weight:700; }
      .md-modal-close { width:32px; height:32px; border-radius:var(--radius-full); border:none; background:var(--gray-100); cursor:pointer; display:flex; align-items:center; justify-content:center; }
      .md-modal-body { padding:var(--space-5) var(--space-6); }
      .md-modal-body .form-group { margin-bottom:var(--space-4); }
      .md-modal-body .form-label { display:block; font-size:var(--font-sm); font-weight:600; margin-bottom:var(--space-2); }
      .md-modal-body .form-actions { display:flex; gap:var(--space-3); justify-content:flex-end; margin-top:var(--space-5); padding-top:var(--space-4); border-top:1px solid var(--border-color); }
      .md-bulk-bar {
        position: fixed;
        bottom: var(--space-6);
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 600px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        border-radius: var(--radius-xl);
        padding: var(--space-4) var(--space-5);
        z-index: 1050;
        display: none;
        justify-content: space-between;
        align-items: center;
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @media (min-width: 1025px) {
        .md-bulk-bar {
          left: calc(50% + var(--sidebar-width) / 2);
        }
      }
      @keyframes slideUp {
        from { transform: translate(-50%, 20px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
      @media (max-width:768px) { .md-table { font-size:var(--font-xs); } .md-table th, .md-table td { padding:var(--space-2); } }
    </style>
  `);

  let activeTab = 'locations';

  // Tab switching
  document.querySelectorAll('.md-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.md-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      loadTabContent(activeTab);
    });
  });

  // Modal helpers
  function openModal(title, bodyHTML) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('mdModal').style.display = 'flex';
  }
  function closeModal() {
    document.getElementById('mdModal').style.display = 'none';
    const modalEl = document.querySelector('.md-modal');
    if (modalEl) modalEl.style.maxWidth = '520px';
  }
  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('mdModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'mdModal') closeModal();
  });

  // ============ TAB CONTENT LOADERS ============
  async function loadTabContent(tab) {
    const container = document.getElementById('mdContent');
    container.innerHTML = '<div class="md-loading"><div class="spinner"></div></div>';
    try {
      if (tab === 'locations') await renderLocationsTab(container);
      else if (tab === 'fleet') await renderFleetTab(container);
      else if (tab === 'users') await renderUsersTab(container);
      else if (tab === 'population') await renderPopulationTab(container);
      else if (tab === 'fasum') await renderFasumTab(container);
      else if (tab === 'rbac') await renderRbacTab(container);
      else if (tab === 'invitations') await renderInvitationsTab(container);
    } catch (err) {
      console.error(`[MasterData] Error loading tab ${tab}:`, err);
      let errorMessage = err.message || 'Terjadi kesalahan saat memuat data.';
      
      if (tab === 'invitations' && (
        errorMessage.toLowerCase().includes('relation') || 
        errorMessage.toLowerCase().includes('does not exist') ||
        errorMessage.toLowerCase().includes('invitation_codes') ||
        errorMessage.toLowerCase().includes('schema cache')
      )) {
        errorMessage = 'Tabel <code>invitation_codes</code> belum dibuat di server database Anda. Harap jalankan script SQL migrasi di editor database Anda terlebih dahulu.';
      }
      
      container.innerHTML = `
        <div class="md-empty" style="color:var(--text-muted); padding:var(--space-8); text-align:center;">
          <div style="font-size:24px; margin-bottom:var(--space-2)">⚠️</div>
          <p style="font-weight:600; color:var(--text-primary); margin-bottom:var(--space-1)">Gagal Memuat Data</p>
          <p style="font-size:var(--font-xs); max-width:400px; margin:0 auto; line-height: 1.5;">${errorMessage}</p>
          <button class="btn btn-secondary btn-sm" id="btnRetryTab" style="margin-top:var(--space-4)">Coba Lagi</button>
        </div>
      `;
      document.getElementById('btnRetryTab')?.addEventListener('click', () => loadTabContent(tab));
    }
  }

  async function downloadLocationTemplate(masterWilayah = []) {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // 1. Template Sheet
      const headers = [
        'Nama Lokasi',
        'Tipe',
        'Kecamatan',
        'Desa Lokasi Fisik',
        'Alamat',
        'Latitude',
        'Longitude',
        'Kapasitas (kg)',
        'Desa yang Dilayani (Opsional - Pisahkan Koma)'
      ];

      const descriptionRow = [
        'Contoh: TPS3R Banjarnegara',
        'Pilih salah satu: TPS, TPS3R, Bank Sampah, Pengepul, TPA',
        'Contoh: Banjarnegara (Harus sesuai referensi)',
        'Contoh: Krandegan (Harus sesuai referensi)',
        'Contoh: Jl. Selamanik No. 10',
        'Contoh: -7.389100',
        'Contoh: 109.695200',
        'Contoh: 2500 (Isi angka saja atau kosongkan)',
        'Contoh: Krandegan, Semampir (Pisahkan dengan koma jika melayani lebih dari satu desa)'
      ];

      const templateData = [
        headers,
        descriptionRow
      ];

      const ws = XLSX.utils.aoa_to_sheet(templateData);
      XLSX.utils.book_append_sheet(wb, ws, 'Template');

      // 2. Reference Sheet for Kecamatan & Desa
      const refHeaders = ['Kecamatan', 'Desa / Kelurahan'];
      const refRows = masterWilayah.map(w => [w.kecamatan, w.desa_kelurahan]);
      const wsRef = XLSX.utils.aoa_to_sheet([refHeaders, ...refRows]);
      XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi Wilayah');

      // 3. Reference Sheet for Types
      const typeHeaders = ['Tipe Lokasi (Input)', 'Label'];
      const typeRows = [
        ['TPS', 'Tempat Penampungan Sementara'],
        ['TPS3R', 'TPS 3R (Reduce, Reuse, Recycle)'],
        ['Bank Sampah', 'Bank Sampah Unit/Induk'],
        ['Pengepul', 'Pengepul / Lapak Sampah'],
        ['TPA', 'Tempat Pemrosesan Akhir'],
        ['MBG', 'Dapur Makan Bergizi Gratis'],
        ['Sekolah', 'Sekolah / Madrasah'],
        ['Perkantoran', 'Kantor Pemerintah / Swasta'],
        ['Pesantren', 'Pondok Pesantren / Asrama'],
        ['Fasilitas Kesehatan', 'Rumah Sakit / Puskesmas / Klinik'],
        ['Institusi Lainnya', 'Hotel / Tempat Wisata / Tempat Ibadah / Dll']
      ];
      const wsTypes = XLSX.utils.aoa_to_sheet([typeHeaders, ...typeRows]);
      XLSX.utils.book_append_sheet(wb, wsTypes, 'Referensi Tipe Lokasi');

      XLSX.writeFile(wb, 'Template_Upload_Lokasi.xlsx');
      showToast('Templat Excel berhasil diunduh', 'success');
    } catch (err) {
      showToast('Gagal mengunduh templat: ' + err.message, 'error');
      console.error('[MasterData] Template creation error:', err);
    }
  }

  // ---------- LOCATIONS TAB ----------
  async function renderLocationsTab(container) {
    const [locations, masterWilayah] = await Promise.all([
      getAllLocations(),
      getAllMasterWilayah()
    ]);
    const badgeColors = { tps: 'amber', tps3r: 'green', bank_sampah: 'blue', pengepul: 'purple', tpa: 'red', mbg: 'orange', sekolah: 'cyan', perkantoran: 'indigo', pesantren: 'lime', faskes: 'red', institusi_lain: 'slate' };
    container.innerHTML = `
      <div class="md-toolbar">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <h3 style="display:flex;align-items:center;gap:8px">${icons.mapPin} Daftar Lokasi</h3>
          <span class="md-count">${locations.length} lokasi</span>
        </div>
        <div style="display:flex;gap:var(--space-2)">
          <button class="btn btn-secondary btn-sm" id="downloadLocationTemplateBtn" style="display:inline-flex;align-items:center;gap:6px" title="Unduh Templat Format Excel">
            ${icons.download} Download Format
          </button>
          <button class="btn btn-secondary btn-sm" id="uploadLocationExcelBtn" style="display:inline-flex;align-items:center;gap:6px">
            ${icons.upload} Upload Excel
          </button>
          <button class="btn btn-primary btn-sm" id="addLocationBtn">${icons.plus} Tambah Lokasi</button>
        </div>
      </div>

      <!-- Bulk Action Bar -->
      <div id="locationsBulkActionBar" class="md-bulk-bar">
        <div style="display:flex; align-items:center; gap:8px; font-size:var(--font-sm); font-weight:600; color:var(--text-primary)">
          <span style="background:rgba(239,68,68,0.1); color:#ef4444; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:11px">!</span>
          <span id="locationsSelectedCount">0</span> lokasi terpilih
        </div>
        <div style="display:flex; gap:var(--space-2)">
          <button type="button" class="btn btn-ghost btn-sm" id="btnCancelBulkSelect" style="color:var(--text-muted); padding:6px 12px; font-size:var(--font-xs)">Batal</button>
          <button type="button" class="btn btn-primary btn-sm" id="btnDeleteBulkSelected" style="background:#dc2626; border-color:#dc2626; display:inline-flex; align-items:center; gap:6px; padding:6px 12px; font-size:var(--font-xs)">
            ${icons.trash} Hapus Terpilih
          </button>
        </div>
      </div>

      <div class="md-table-container">
        <table class="md-table">
          <thead>
            <tr>
              <th style="width:40px; text-align:center"><input type="checkbox" id="selectAllLocations" style="cursor:pointer; transform:scale(1.1)" /></th>
              <th>Nama</th>
              <th>Tipe</th>
              <th>Wilayah / Desa</th>
              <th>Koordinat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${locations.length === 0 ? '<tr><td colspan="6" class="md-empty">Belum ada data lokasi</td></tr>' :
              locations.map(l => {
                const matchedWil = masterWilayah.find(w => w.id === l.desa_id);
                const wilayahDisplay = matchedWil ? `Desa ${matchedWil.desa_kelurahan}, Kec. ${matchedWil.kecamatan}` : (l.wilayah || '-');
                return `<tr>
                  <td style="text-align:center; vertical-align:middle">
                    <input type="checkbox" class="location-select-checkbox" data-id="${l.id}" style="cursor:pointer; transform:scale(1.1)" />
                  </td>
                  <td>
                    <strong>${l.name}</strong>
                    ${l.address ? `<div style="font-size:var(--font-xs);color:var(--text-muted);margin-top:2px">${l.address}</div>` : ''}
                  </td>
                  <td><span class="md-badge ${badgeColors[l.type] || 'blue'}">${l.type?.toUpperCase()}</span></td>
                  <td>
                    <div>${wilayahDisplay}</div>
                    ${l.served_desa_ids && l.served_desa_ids.length > 1 ? `
                      <div style="font-size:var(--font-xs);color:var(--primary-color);margin-top:2px" title="${
                        l.served_desa_ids.map(id => {
                          const w = masterWilayah.find(x => x.id === id);
                          return w ? w.desa_kelurahan : '';
                        }).filter(Boolean).join(', ')
                      }">
                        Melayani ${l.served_desa_ids.length} Desa
                      </div>
                    ` : ''}
                  </td>
                  <td style="font-size:var(--font-xs);color:var(--text-muted)">${l.lat && l.lng ? `${Number(l.lat).toFixed(4)}, ${Number(l.lng).toFixed(4)}` : '-'}</td>
                  <td><div class="md-actions">
                    <button class="md-btn-icon" title="Edit" data-edit-loc="${l.id}">${icons.edit}</button>
                    <button class="md-btn-icon danger" title="Hapus" data-del-loc="${l.id}">${icons.trash}</button>
                  </div></td>
                </tr>`;
              }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Bulk selection logic
    let selectedIds = [];
    const selectAllCb = document.getElementById('selectAllLocations');
    const rowCheckboxes = container.querySelectorAll('.location-select-checkbox');
    const bulkBar = document.getElementById('locationsBulkActionBar');
    const selectedCountEl = document.getElementById('locationsSelectedCount');
    const btnCancelBulk = document.getElementById('btnCancelBulkSelect');
    const btnDeleteBulk = document.getElementById('btnDeleteBulkSelected');

    function updateBulkBar() {
      if (selectedIds.length > 0) {
        if (bulkBar) bulkBar.style.display = 'flex';
        if (selectedCountEl) selectedCountEl.textContent = selectedIds.length;
      } else {
        if (bulkBar) bulkBar.style.display = 'none';
      }
      if (selectAllCb) {
        selectAllCb.checked = selectedIds.length === rowCheckboxes.length && rowCheckboxes.length > 0;
        selectAllCb.indeterminate = selectedIds.length > 0 && selectedIds.length < rowCheckboxes.length;
      }
    }

    selectAllCb?.addEventListener('change', () => {
      const isChecked = selectAllCb.checked;
      selectedIds = [];
      rowCheckboxes.forEach(cb => {
        cb.checked = isChecked;
        if (isChecked) selectedIds.push(cb.dataset.id);
      });
      updateBulkBar();
    });

    rowCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.id;
        if (cb.checked) {
          if (!selectedIds.includes(id)) selectedIds.push(id);
        } else {
          selectedIds = selectedIds.filter(x => x !== id);
        }
        updateBulkBar();
      });
    });

    btnCancelBulk?.addEventListener('click', () => {
      selectedIds = [];
      rowCheckboxes.forEach(cb => cb.checked = false);
      if (selectAllCb) selectAllCb.checked = false;
      updateBulkBar();
    });

    btnDeleteBulk?.addEventListener('click', () => {
      if (selectedIds.length === 0) return;
      showModal({
        title: 'Konfirmasi Hapus Terpilih',
        content: `<p>Apakah Anda yakin ingin menghapus ${selectedIds.length} lokasi terpilih? Tindakan ini tidak bisa dibatalkan.</p>`,
        actions: [
          {
            label: 'Batal',
            variant: 'btn-secondary'
          },
          {
            label: 'Ya, Hapus',
            variant: 'btn-danger',
            handler: async () => {
              if (btnDeleteBulk) {
                btnDeleteBulk.disabled = true;
                btnDeleteBulk.innerHTML = '<span class="spinner" style="width:12px;height:12px;border-width:2px;display:inline-block;margin-right:6px;vertical-align:middle"></span> Menghapus...';
              }
              try {
                await deleteLocationsBatch(selectedIds);
                showToast(`${selectedIds.length} lokasi berhasil dihapus`, 'success');
                loadTabContent('locations');
              } catch (err) {
                showToast('Gagal menghapus: ' + err.message, 'error');
                if (btnDeleteBulk) {
                  btnDeleteBulk.disabled = false;
                  btnDeleteBulk.innerHTML = `${icons.trash} Hapus Terpilih`;
                }
              }
            }
          }
        ]
      });
    });

    // Form buttons and action handlers
    document.getElementById('addLocationBtn')?.addEventListener('click', () => openLocationForm(null, masterWilayah));
    document.getElementById('downloadLocationTemplateBtn')?.addEventListener('click', () => downloadLocationTemplate(masterWilayah));
    document.getElementById('uploadLocationExcelBtn')?.addEventListener('click', () => openLocationExcelUpload(masterWilayah, locations));
    container.querySelectorAll('[data-edit-loc]').forEach(btn => btn.addEventListener('click', async () => {
      const loc = locations.find(l => l.id === btn.dataset.editLoc);
      if (loc) openLocationForm(loc, masterWilayah);
    }));
    container.querySelectorAll('[data-del-loc]').forEach(btn => btn.addEventListener('click', () => {
      showModal({
        title: 'Konfirmasi Hapus Lokasi',
        content: '<p>Yakin ingin menghapus lokasi ini?</p>',
        actions: [
          {
            label: 'Batal',
            variant: 'btn-secondary'
          },
          {
            label: 'Ya, Hapus',
            variant: 'btn-danger',
            handler: async () => {
              try {
                await deleteLocation(btn.dataset.delLoc);
                showToast('Lokasi berhasil dihapus', 'success');
                loadTabContent('locations');
              } catch (err) {
                showToast('Gagal menghapus: ' + err.message, 'error');
                console.error('[MasterData] Delete location error:', err);
              }
            }
          }
        ]
      });
    }));
  }

  function openLocationForm(existing = null, masterWilayah = []) {
    const isEdit = !!existing;
    const kecamatans = [...new Set(masterWilayah.map(w => w.kecamatan))].sort();

    openModal(isEdit ? 'Edit Lokasi' : 'Tambah Lokasi Baru', `
      <form id="locForm">
        <div class="form-group">
          <label class="form-label">Nama Lokasi</label>
          <input class="form-input" id="locName" required value="${existing?.name || ''}" placeholder="Misal: TPS3R Banjarnegara" />
        </div>
        <div class="form-group">
          <label class="form-label">Tipe</label>
          <select class="form-select" id="locType" required>
            ${LOCATION_TYPES.map(t => `<option value="${t.id}" ${existing?.type === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}
          </select>
        </div>
        
        <div style="display:flex;gap:var(--space-3)">
          <div class="form-group" style="flex:1">
            <label class="form-label">Kecamatan</label>
            <select class="form-select" id="locKecamatan" required>
              <option value="">Pilih Kecamatan...</option>
              ${kecamatans.map(k => `<option value="${k}">${k}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Desa Lokasi Fisik</label>
            <select class="form-select" id="locDesa" required>
              <option value="">Pilih Desa...</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Desa Yang Dilayani</label>
          <div style="display:flex; gap:10px; margin-bottom:8px">
            <button type="button" class="btn btn-secondary btn-sm" id="btnSelectAllServed" style="padding:2px 8px; font-size:var(--font-xs)">Pilih Semua</button>
            <button type="button" class="btn btn-secondary btn-sm" id="btnClearAllServed" style="padding:2px 8px; font-size:var(--font-xs)">Hapus Semua</button>
          </div>
          <div id="servedDesaGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap:6px; border:1px solid var(--border-color); border-radius:var(--radius-md); padding:10px; max-height:120px; overflow-y:auto; background:var(--gray-50)">
            <div style="color:var(--text-muted); font-size:var(--font-sm)">Silakan pilih kecamatan terlebih dahulu</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Alamat (Opsional)</label>
          <input class="form-input" id="locAddress" value="${existing?.address || ''}" placeholder="Misal: Jl. Selamanik No. 10" />
        </div>

        <div class="form-group">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px">
            <label class="form-label" style="margin-bottom:0">Koordinat (Latitude & Longitude)</label>
            <button type="button" class="btn btn-secondary btn-sm" id="btnGetGPS" style="padding:2px 8px; font-size:var(--font-xs); display:flex; align-items:center; gap:4px">
              🎯 Gunakan Lokasi Saat Ini
            </button>
          </div>
          <div style="display:flex;gap:var(--space-3)">
            <div class="form-group" style="flex:1; margin-bottom:0">
              <input class="form-input" id="locLat" type="number" step="any" required value="${existing?.lat || ''}" placeholder="Latitude (e.g. -7.3891)" />
            </div>
            <div class="form-group" style="flex:1; margin-bottom:0">
              <input class="form-input" id="locLng" type="number" step="any" required value="${existing?.lng || ''}" placeholder="Longitude (e.g. 109.6952)" />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Kapasitas (kg, opsional)</label>
          <input class="form-input" id="locCapacity" type="number" step="0.1" value="${existing?.capacity_kg || ''}" placeholder="Misal: 1000" />
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" onclick="document.getElementById('mdModal').style.display='none'">Batal</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Simpan Perubahan' : 'Tambah Lokasi'}</button>
        </div>
      </form>
    `);

    const kecSelect = document.getElementById('locKecamatan');
    const desaSelect = document.getElementById('locDesa');
    const servedGrid = document.getElementById('servedDesaGrid');

    function updateDesaOptions(selectedKec, preselectedDesaId = null, preselectedServedIds = []) {
      if (!selectedKec) {
        desaSelect.innerHTML = '<option value="">Pilih Desa...</option>';
        servedGrid.innerHTML = '<div style="color:var(--text-muted); font-size:var(--font-sm)">Silakan pilih kecamatan terlebih dahulu</div>';
        return;
      }

      const filteredVillages = masterWilayah.filter(w => w.kecamatan === selectedKec);
      
      // Populate Desa dropdown
      desaSelect.innerHTML = '<option value="">Pilih Desa...</option>' + 
        filteredVillages.map(v => `<option value="${v.id}" ${preselectedDesaId === v.id ? 'selected' : ''}>${v.desa_kelurahan}</option>`).join('');

      // Populate Served checkboxes
      servedGrid.innerHTML = filteredVillages.map(v => {
        const isChecked = preselectedServedIds.includes(v.id) || (preselectedDesaId === v.id);
        return `
          <label style="display:flex;align-items:center;gap:6px;margin-bottom:2px;font-size:var(--font-xs);cursor:pointer">
            <input type="checkbox" name="servedDesa" value="${v.id}" class="served-desa-checkbox" ${isChecked ? 'checked' : ''} />
            <span>${v.desa_kelurahan}</span>
          </label>
        `;
      }).join('');
    }

    kecSelect.addEventListener('change', () => {
      updateDesaOptions(kecSelect.value);
    });

    desaSelect.addEventListener('change', () => {
      const val = desaSelect.value;
      if (val) {
        const cb = servedGrid.querySelector(`.served-desa-checkbox[value="${val}"]`);
        if (cb) cb.checked = true;
      }
    });

    document.getElementById('btnSelectAllServed')?.addEventListener('click', () => {
      servedGrid.querySelectorAll('.served-desa-checkbox').forEach(cb => cb.checked = true);
    });

    document.getElementById('btnClearAllServed')?.addEventListener('click', () => {
      servedGrid.querySelectorAll('.served-desa-checkbox').forEach(cb => cb.checked = false);
    });

    document.getElementById('btnGetGPS')?.addEventListener('click', () => {
      if (navigator.geolocation) {
        showToast('Meminta koordinat GPS...', 'info');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            document.getElementById('locLat').value = position.coords.latitude.toFixed(6);
            document.getElementById('locLng').value = position.coords.longitude.toFixed(6);
            showToast('Koordinat GPS berhasil didapatkan', 'success');
          },
          (error) => {
            showToast('Gagal mendapatkan GPS: ' + error.message, 'error');
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        showToast('Browser Anda tidak mendukung Geolocation', 'error');
      }
    });

    // Set initial values if edit
    if (isEdit && existing) {
      const matched = masterWilayah.find(w => w.id === existing.desa_id);
      const preselectedKec = matched ? matched.kecamatan : (existing.wilayah || '');
      kecSelect.value = preselectedKec;
      
      const servedIds = Array.isArray(existing.served_desa_ids) ? existing.served_desa_ids : [existing.desa_id].filter(Boolean);
      updateDesaOptions(preselectedKec, existing.desa_id, servedIds);
    }

    document.getElementById('locForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const selectedDesaId = desaSelect.value;
      const servedDesaIds = Array.from(document.querySelectorAll('.served-desa-checkbox:checked')).map(cb => cb.value);

      if (selectedDesaId && !servedDesaIds.includes(selectedDesaId)) {
        servedDesaIds.unshift(selectedDesaId);
      }

      const lat = parseFloat(document.getElementById('locLat').value);
      const lng = parseFloat(document.getElementById('locLng').value);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        showToast('Latitude harus berada di rentang -90 s/d 90', 'error');
        return;
      }

      if (isNaN(lng) || lng < -180 || lng > 180) {
        showToast('Longitude harus berada di rentang -180 s/d 180', 'error');
        return;
      }

      const data = {
        name: document.getElementById('locName').value.trim(),
        type: document.getElementById('locType').value,
        wilayah: kecSelect.value,
        desa_id: selectedDesaId || null,
        served_desa_ids: servedDesaIds,
        address: document.getElementById('locAddress').value.trim() || null,
        lat,
        lng,
        capacity_kg: parseFloat(document.getElementById('locCapacity').value) || null
      };

      try {
        if (isEdit) await updateLocation(existing.id, data);
        else await addLocation(data);
        showToast(isEdit ? 'Lokasi berhasil diperbarui' : 'Lokasi baru berhasil ditambahkan', 'success');
        closeModal();
        loadTabContent('locations');
      } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
    });
  }

  function openLocationExcelUpload(masterWilayah = [], locations = []) {
    // Dynamically adjust modal width for preview table
    const modalEl = document.querySelector('.md-modal');
    if (modalEl) modalEl.style.maxWidth = '900px';

    openModal('Upload Batch Lokasi', `
      <div class="excel-upload-wizard">
        <!-- Step 1: Download Template -->
        <div class="wizard-section" style="margin-bottom:var(--space-4); padding-bottom:var(--space-4); border-bottom:1px solid var(--border-color)">
          <h4 style="font-weight:600; font-size:var(--font-sm); margin-bottom:var(--space-2); display:flex; align-items:center; gap:8px">
            1. Unduh Templat Excel Resmi
          </h4>
          <p style="font-size:var(--font-xs); color:var(--text-secondary); margin-bottom:var(--space-3)">
            Gunakan templat resmi kami untuk memastikan format data Anda sesuai. Sistem menyertakan daftar referensi wilayah Kecamatan & Desa terbaru secara dinamis di dalam file Excel.
          </p>
          <button type="button" class="btn btn-secondary btn-sm" id="btnDownloadTemplate" style="display:inline-flex; align-items:center; gap:6px">
            ${icons.download} Unduh Templat Excel
          </button>
        </div>

        <!-- Step 2: Upload File -->
        <div class="wizard-section" style="margin-bottom:var(--space-4)">
          <h4 style="font-weight:600; font-size:var(--font-sm); margin-bottom:var(--space-2)">
            2. Unggah File Excel Anda
          </h4>
          <div id="excelDropzone" style="border:2px dashed var(--border-color); border-radius:var(--radius-lg); padding:var(--space-6); text-align:center; background:var(--gray-50); cursor:pointer; transition:all 0.2s">
            <div style="font-size:32px; margin-bottom:var(--space-2)">📄</div>
            <p style="font-weight:600; font-size:var(--font-sm); color:var(--text-primary)">
              Seret & taruh file Excel di sini, atau klik untuk memilih file
            </p>
            <p style="font-size:var(--font-xs); color:var(--text-muted); margin-top:4px">
              Format yang didukung: .xlsx, .xls
            </p>
            <input type="file" id="excelFileInput" accept=".xlsx, .xls" style="display:none" />
          </div>
        </div>

        <!-- Step 3: Preview & Validasi -->
        <div id="previewSection" style="display:none; margin-bottom:var(--space-4)">
          <h4 style="font-weight:600; font-size:var(--font-sm); margin-bottom:var(--space-2); display:flex; justify-content:space-between; align-items:center">
            <span>3. Preview & Validasi Data</span>
            <span id="previewSummary" class="md-badge blue" style="font-size:10px; padding:2px 8px">0 Baris Terdeteksi</span>
          </h4>
          <div class="md-table-container" style="max-height:220px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-md)">
            <table class="md-table" style="font-size:var(--font-xs)">
              <thead style="position:sticky; top:0; z-index:10; background:var(--gray-50)">
                <tr>
                  <th>Status</th>
                  <th>Nama Lokasi</th>
                  <th>Tipe</th>
                  <th>Kecamatan</th>
                  <th>Desa Fisik</th>
                  <th>Koordinat</th>
                  <th>Kapasitas</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody id="previewTableBody">
              </tbody>
            </table>
          </div>
          <div id="validationAlert" style="margin-top:var(--space-3)"></div>
        </div>

        <div class="form-actions" style="margin-top:var(--space-4); padding-top:var(--space-4); border-top:1px solid var(--border-color); display:flex; justify-content:flex-end; gap:var(--space-3)">
          <button type="button" class="btn btn-ghost" id="btnCancelUpload">Batal</button>
          <button type="button" class="btn btn-primary" id="btnImportExcel" disabled>Impor Data</button>
        </div>
      </div>
    `);

    // Setup interactive dropzone
    const dropzone = document.getElementById('excelDropzone');
    const fileInput = document.getElementById('excelFileInput');
    const btnDownload = document.getElementById('btnDownloadTemplate');
    const btnCancel = document.getElementById('btnCancelUpload');
    const btnImport = document.getElementById('btnImportExcel');

    let validRowsToUpload = [];

    // Download template handler
    btnDownload?.addEventListener('click', () => downloadLocationTemplate(masterWilayah));

    // Dropzone logic
    dropzone?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (dropzone) {
        dropzone.style.borderColor = 'var(--primary-color)';
        dropzone.style.background = 'rgba(16, 185, 129, 0.05)';
      }
    });
    const resetDropzoneStyle = () => {
      if (dropzone) {
        dropzone.style.borderColor = 'var(--border-color)';
        dropzone.style.background = 'var(--gray-50)';
      }
    };
    dropzone?.addEventListener('dragleave', resetDropzoneStyle);
    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      resetDropzoneStyle();
      if (e.dataTransfer?.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
    fileInput?.addEventListener('change', () => {
      if (fileInput.files?.length > 0) {
        handleFile(fileInput.files[0]);
      }
    });

    // File processor
    async function handleFile(file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        showToast('Tipe file tidak didukung. Harus file Excel (.xlsx atau .xls).', 'error');
        return;
      }
      showToast('Membaca file Excel...', 'info');
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const XLSX = await import('xlsx');
            const workbook = XLSX.read(data, { type: 'array' });
            
            if (workbook.SheetNames.length === 0) {
              throw new Error('File Excel tidak memiliki sheet.');
            }
            
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json(sheet);
            
            if (rawRows.length === 0) {
              throw new Error('Sheet pertama kosong.');
            }

            // Remove description row if present (checking if cell contains "Contoh:")
            const rows = rawRows.filter(r => {
              const values = Object.values(r).map(v => String(v).toLowerCase());
              return !values.some(v => v.includes('contoh:') || v.includes('pilih salah satu:'));
            });

            validateRows(rows);
          } catch (err) {
            showToast('Gagal memproses excel: ' + err.message, 'error');
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        showToast('Gagal membaca file: ' + err.message, 'error');
      }
    }

    // Row Validator
    function validateRows(rows) {
      const previewSection = document.getElementById('previewSection');
      const previewTableBody = document.getElementById('previewTableBody');
      const previewSummary = document.getElementById('previewSummary');
      const validationAlert = document.getElementById('validationAlert');

      if (!previewTableBody || !previewSection || !previewSummary || !validationAlert || !btnImport) return;

      previewTableBody.innerHTML = '';
      validRowsToUpload = [];
      let errorCount = 0;
      let successCount = 0;
      let warningCount = 0;

      rows.forEach((row) => {
        const getRowValue = (possibleKeys) => {
          const foundKey = Object.keys(row).find(k => 
            possibleKeys.some(pk => k.toLowerCase().replace(/\s+/g, '') === pk.toLowerCase().replace(/\s+/g, ''))
          );
          return foundKey ? String(row[foundKey]).trim() : '';
        };

        const name = getRowValue(['namalokasi', 'nama', 'name']);
        const rawType = getRowValue(['tipe', 'jenis', 'type']);
        const kecamatan = getRowValue(['kecamatan', 'wilayah', 'subdistrict']);
        const desaName = getRowValue(['desalokasifisik', 'desa', 'kelurahan', 'village']);
        const address = getRowValue(['alamat', 'address']);
        const latVal = getRowValue(['latitude', 'lat']);
        const lngVal = getRowValue(['longitude', 'lng', 'long']);
        const capacityVal = getRowValue(['kapasitaskg', 'kapasitas', 'capacity']);
        const servedDesaStr = getRowValue(['desayangdilayani', 'desayangdilayaniopsional', 'served']);

        const errors = [];
        const warnings = [];

        // 1. Name Check
        if (!name) {
          errors.push('Nama lokasi wajib diisi');
        } else if (locations.some(l => l.name.toLowerCase() === name.toLowerCase())) {
          warnings.push('Nama lokasi sudah terdaftar (duplikat)');
        }

        // 2. Type Check
        let type = '';
        const typeLower = rawType.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (typeLower === 'tps') type = 'tps';
        else if (typeLower === 'tps3r') type = 'tps3r';
        else if (typeLower === 'banksampah') type = 'bank_sampah';
        else if (typeLower === 'pengepul') type = 'pengepul';
        else if (typeLower === 'tpa') type = 'tpa';
        else if (typeLower === 'mbg') type = 'mbg';
        else if (typeLower === 'sekolah') type = 'sekolah';
        else if (typeLower === 'perkantoran') type = 'perkantoran';
        else if (typeLower === 'pesantren') type = 'pesantren';
        else if (typeLower === 'faskes' || typeLower === 'fasilitaskesehatan' || typeLower === 'rumahsakit' || typeLower === 'puskesmas') type = 'faskes';
        else if (typeLower === 'institusilain' || typeLower === 'institusilainnya' || typeLower === 'lainnya') type = 'institusi_lain';
        else {
          errors.push('Tipe lokasi tidak valid');
        }

        // 3. Kecamatan Check
        let matchedKec = '';
        if (!kecamatan) {
          errors.push('Kecamatan wajib diisi');
        } else {
          const matched = masterWilayah.find(w => w.kecamatan.toLowerCase() === kecamatan.toLowerCase());
          if (!matched) {
            errors.push(`Kecamatan "${kecamatan}" tidak ditemukan`);
          } else {
            matchedKec = matched.kecamatan;
          }
        }

        // 4. Desa Check
        let desa_id = null;
        if (!desaName) {
          errors.push('Desa lokasi wajib diisi');
        } else if (matchedKec) {
          const matchedV = masterWilayah.find(w => 
            w.kecamatan.toLowerCase() === matchedKec.toLowerCase() && 
            w.desa_kelurahan.toLowerCase() === desaName.toLowerCase()
          );
          if (!matchedV) {
            errors.push(`Desa "${desaName}" tidak ditemukan di Kec. ${matchedKec}`);
          } else {
            desa_id = matchedV.id;
          }
        }

        // 5. Coordinates Check
        const lat = parseFloat(latVal);
        const lng = parseFloat(lngVal);
        if (isNaN(lat)) errors.push('Latitude wajib diisi dengan angka');
        else if (lat < -90 || lat > 90) errors.push('Latitude di luar batas (-90 s/d 90)');

        if (isNaN(lng)) errors.push('Longitude wajib diisi dengan angka');
        else if (lng < -180 || lng > 180) errors.push('Longitude di luar batas (-180 s/d 180)');

        // 6. Capacity Check
        const capacity = capacityVal ? parseFloat(capacityVal) : null;
        if (capacityVal && isNaN(capacity)) errors.push('Kapasitas harus berupa angka');

        // 7. Served Desa Check
        let served_desa_ids = [];
        if (desa_id) {
          if (!servedDesaStr) {
            served_desa_ids = [desa_id];
          } else {
            const vNames = servedDesaStr.split(',').map(v => v.trim()).filter(Boolean);
            for (const vName of vNames) {
              let matchedServed = masterWilayah.find(w => 
                w.kecamatan.toLowerCase() === matchedKec.toLowerCase() && 
                w.desa_kelurahan.toLowerCase() === vName.toLowerCase()
              );
              if (!matchedServed) {
                // Fallback global search
                matchedServed = masterWilayah.find(w => w.desa_kelurahan.toLowerCase() === vName.toLowerCase());
              }
              if (matchedServed) {
                served_desa_ids.push(matchedServed.id);
              } else {
                warnings.push(`Desa dilayani "${vName}" tidak ditemukan`);
              }
            }
            if (!served_desa_ids.includes(desa_id)) {
              served_desa_ids.unshift(desa_id);
            }
          }
        }

        const hasError = errors.length > 0;
        const hasWarning = warnings.length > 0;

        if (hasError) errorCount++;
        else {
          successCount++;
          if (hasWarning) warningCount++;
          validRowsToUpload.push({
            name,
            type,
            wilayah: matchedKec,
            desa_id,
            served_desa_ids,
            address: address || null,
            lat,
            lng,
            capacity_kg: capacity
          });
        }

        const statusBadge = hasError 
          ? '<span class="md-badge red" style="font-size:10px;padding:2px 6px">Error</span>' 
          : hasWarning 
            ? '<span class="md-badge amber" style="font-size:10px;padding:2px 6px">Warning</span>' 
            : '<span class="md-badge green" style="font-size:10px;padding:2px 6px">Valid</span>';

        const infoText = hasError 
          ? `<span style="color:#ef4444">${errors.join(', ')}</span>`
          : hasWarning 
            ? `<span style="color:#f59e0b">${warnings.join(', ')}</span>`
            : '<span style="color:#10b981">Siap diunggah</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${statusBadge}</td>
          <td><strong>${name || '-'}</strong></td>
          <td><span class="md-badge ${type ? (type === 'tps' ? 'amber' : type === 'tps3r' ? 'green' : type === 'bank_sampah' ? 'blue' : type === 'pengepul' ? 'purple' : 'red') : 'blue'}" style="font-size:10px;padding:2px 4px">${type ? type.toUpperCase() : (rawType || '-')}</span></td>
          <td>${kecamatan || '-'}</td>
          <td>${desaName || '-'}</td>
          <td style="color:var(--text-muted)">${!isNaN(lat) && !isNaN(lng) ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : '-'}</td>
          <td>${capacity ? capacity + ' kg' : '-'}</td>
          <td style="font-size:10px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${errors.join(', ') || warnings.join(', ')}">${infoText}</td>
        `;
        previewTableBody.appendChild(tr);
      });

      previewSection.style.display = 'block';
      previewSummary.textContent = `${rows.length} Baris Terdeteksi`;

      if (validRowsToUpload.length > 0) {
        btnImport.disabled = false;
        btnImport.textContent = `Impor ${validRowsToUpload.length} Data Valid`;
        validationAlert.innerHTML = `
          <div style="background:rgba(16,185,129,0.08); border-left:4px solid #10b981; padding:10px; border-radius:4px; font-size:var(--font-sm)">
            <strong>Hasil Validasi:</strong> ${validRowsToUpload.length} baris siap diimpor. 
            ${errorCount > 0 ? `<span style="color:#ef4444; font-weight:600">${errorCount} baris memiliki kesalahan dan akan dilewati.</span>` : ''}
          </div>
        `;
      } else {
        btnImport.disabled = true;
        btnImport.textContent = 'Impor Data';
        validationAlert.innerHTML = `
          <div style="background:rgba(239,68,68,0.08); border-left:4px solid #ef4444; padding:10px; border-radius:4px; font-size:var(--font-sm); color:#ef4444">
            <strong>Validasi Gagal:</strong> Tidak ada baris data valid yang ditemukan untuk diimpor. Silakan periksa kembali file Anda.
          </div>
        `;
      }
    }

    // Cancel Button click handler
    btnCancel?.addEventListener('click', closeModal);

    // Import click handler
    btnImport?.addEventListener('click', async () => {
      if (validRowsToUpload.length === 0) return;
      btnImport.disabled = true;
      btnImport.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-right:6px;vertical-align:middle"></span> Mengimpor...';
      
      try {
        await addLocationsBatch(validRowsToUpload);
        showToast(`${validRowsToUpload.length} lokasi berhasil diimpor!`, 'success');
        closeModal();
        loadTabContent('locations');
      } catch (err) {
        showToast('Gagal mengimpor data: ' + err.message, 'error');
        btnImport.disabled = false;
        btnImport.textContent = `Impor ${validRowsToUpload.length} Data Valid`;
      }
    });
  }

  // ---------- FLEET TAB ----------
  async function renderFleetTab(container) {
    const fleet = await getAllFleet();
    container.innerHTML = `
      <div class="md-toolbar">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <h3 style="display:flex;align-items:center;gap:8px">${icons.truck} Daftar Kendaraan</h3>
          <span class="md-count">${fleet.length} unit</span>
        </div>
        <button class="btn btn-primary btn-sm" id="addFleetBtn">${icons.plus} Tambah Kendaraan</button>
      </div>
      <div class="md-table-container">
        <table class="md-table">
          <thead><tr><th>Plat Nomor</th><th>Jenis</th><th>Kapasitas</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            ${fleet.length === 0 ? '<tr><td colspan="5" class="md-empty">Belum ada data kendaraan</td></tr>' :
              fleet.map(f => `<tr>
                <td><strong>${f.plate_number}</strong></td>
                <td>${f.vehicle_type || '-'}</td>
                <td>${f.capacity_kg ? f.capacity_kg + ' kg' : '-'}</td>
                <td><span class="md-badge ${f.status === 'active' ? 'green' : 'red'}">${f.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td>
                <td><div class="md-actions">
                  <button class="md-btn-icon" title="Edit" data-edit-fleet="${f.id}">${icons.edit}</button>
                  <button class="md-btn-icon danger" title="Hapus" data-del-fleet="${f.id}">${icons.trash}</button>
                </div></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
    document.getElementById('addFleetBtn')?.addEventListener('click', () => openFleetForm());
    container.querySelectorAll('[data-edit-fleet]').forEach(btn => btn.addEventListener('click', () => {
      const f = fleet.find(x => x.id === btn.dataset.editFleet);
      if (f) openFleetForm(f);
    }));
    container.querySelectorAll('[data-del-fleet]').forEach(btn => btn.addEventListener('click', () => {
      showModal({
        title: 'Konfirmasi Hapus Kendaraan',
        content: '<p>Yakin ingin menghapus kendaraan ini?</p>',
        actions: [
          {
            label: 'Batal',
            variant: 'btn-secondary'
          },
          {
            label: 'Ya, Hapus',
            variant: 'btn-danger',
            handler: async () => {
              try {
                await deleteFleet(btn.dataset.delFleet);
                showToast('Kendaraan berhasil dihapus', 'success');
                loadTabContent('fleet');
              } catch (err) {
                showToast('Gagal menghapus: ' + err.message, 'error');
                console.error('[MasterData] Delete fleet error:', err);
              }
            }
          }
        ]
      });
    }));
  }

  function openFleetForm(existing = null) {
    const isEdit = !!existing;
    openModal(isEdit ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru', `
      <form id="fleetForm">
        <div class="form-group">
          <label class="form-label">Plat Nomor</label>
          <input class="form-input" id="fleetPlate" required value="${existing?.plate_number || ''}" placeholder="Misal: R 1234 AB" />
        </div>
        <div class="form-group">
          <label class="form-label">Jenis Kendaraan</label>
          <select class="form-select" id="fleetType">
            ${['Dump Truck', 'Arm Roll', 'Pick-up', 'Motor Roda 3', 'Gerobak'].map(t => `<option ${existing?.vehicle_type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Kapasitas (kg)</label>
          <input class="form-input" id="fleetCapacity" type="number" step="0.1" value="${existing?.capacity_kg || ''}" placeholder="Misal: 2500" />
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="fleetStatus">
            <option value="active" ${existing?.status === 'active' || !existing ? 'selected' : ''}>Aktif</option>
            <option value="inactive" ${existing?.status === 'inactive' ? 'selected' : ''}>Nonaktif / Rusak</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" onclick="document.getElementById('mdModal').style.display='none'">Batal</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Simpan Perubahan' : 'Tambah Kendaraan'}</button>
        </div>
      </form>
    `);
    document.getElementById('fleetForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        plate_number: document.getElementById('fleetPlate').value.trim().toUpperCase(),
        vehicle_type: document.getElementById('fleetType').value,
        capacity_kg: parseFloat(document.getElementById('fleetCapacity').value) || null,
        status: document.getElementById('fleetStatus').value
      };
      try {
        if (isEdit) await updateFleet(existing.id, data);
        else await addFleet(data, user.id);
        showToast(isEdit ? 'Kendaraan berhasil diperbarui' : 'Kendaraan baru berhasil ditambahkan', 'success');
        closeModal();
        loadTabContent('fleet');
      } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
    });
  }

  // ---------- USERS TAB ----------
  async function renderUsersTab(container) {
    const [users, masterWilayah] = await Promise.all([
      getUsersWithActivity(),
      getAllMasterWilayah()
    ]);
    const roleColors = { warga: 'green', petugas: 'amber', eksekutif: 'blue', admin: 'purple' };
    const roleLabels = {};
    USER_ROLES.forEach(r => { roleLabels[r.id] = r.label; });

    const kaderUsers = users.filter(u => canInputWaste(u) && u.role !== 'admin');
    let activeKaderCount = 0;
    let passiveKaderCount = 0;
    let inactiveKaderCount = 0;
    kaderUsers.forEach(u => {
      const act = getKaderActivityStatus(u.last_input_at);
      if (act.status === 'active') activeKaderCount++;
      else if (act.status === 'passive') passiveKaderCount++;
      else inactiveKaderCount++;
    });

    container.innerHTML = `
      <!-- Kader Activity Overview Card -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:var(--space-3); margin-bottom:var(--space-4);">
        <div style="background:var(--card-bg, #fff); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:var(--space-3) var(--space-4); display:flex; align-items:center; gap:var(--space-3);">
          <div style="width:38px; height:38px; border-radius:10px; background:rgba(6,182,212,0.1); color:#0891b2; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">🌿</div>
          <div>
            <div style="font-size:11px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Petugas Input</div>
            <div style="font-size:18px; font-weight:800; color:var(--text-primary);">${kaderUsers.length} <span style="font-size:12px; font-weight:500; color:var(--text-muted)">akun</span></div>
          </div>
        </div>
        <div style="background:var(--card-bg, #fff); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:var(--space-3) var(--space-4); display:flex; align-items:center; gap:var(--space-3);">
          <div style="width:38px; height:38px; border-radius:10px; background:rgba(16,185,129,0.1); color:#10b981; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">🟢</div>
          <div>
            <div style="font-size:11px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Aktif (≤10 hr)</div>
            <div style="font-size:18px; font-weight:800; color:#10b981;">${activeKaderCount} <span style="font-size:12px; font-weight:500; color:var(--text-muted)">kader</span></div>
          </div>
        </div>
        <div style="background:var(--card-bg, #fff); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:var(--space-3) var(--space-4); display:flex; align-items:center; gap:var(--space-3);">
          <div style="width:38px; height:38px; border-radius:10px; background:rgba(245,158,11,0.1); color:#f59e0b; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">🟡</div>
          <div>
            <div style="font-size:11px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Pasif (11-30 hr)</div>
            <div style="font-size:18px; font-weight:800; color:#d97706;">${passiveKaderCount} <span style="font-size:12px; font-weight:500; color:var(--text-muted)">kader</span></div>
          </div>
        </div>
        <div style="background:var(--card-bg, #fff); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:var(--space-3) var(--space-4); display:flex; align-items:center; gap:var(--space-3);">
          <div style="width:38px; height:38px; border-radius:10px; background:rgba(239,68,68,0.1); color:#ef4444; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">🔴</div>
          <div>
            <div style="font-size:11px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Inaktif (>30 hr/Nihil)</div>
            <div style="font-size:18px; font-weight:800; color:#ef4444;">${inactiveKaderCount} <span style="font-size:12px; font-weight:500; color:var(--text-muted)">kader</span></div>
          </div>
        </div>
      </div>

      <div class="md-toolbar">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <h3 style="display:flex;align-items:center;gap:8px">${icons.users} Daftar Pengguna</h3>
          <span class="md-count">${users.length} akun</span>
        </div>
        <div style="display:flex;gap:var(--space-2)">
          <button class="btn btn-secondary btn-sm" id="exportKaderExcelBtn" style="display:inline-flex;align-items:center;gap:6px" title="Unduh Rekap Keaktifan Kader Format Excel">
            ${icons.download} Ekspor Keaktifan (Excel)
          </button>
          <button class="btn btn-primary btn-sm" id="addUserBtn">${icons.plus} Tambah Pengguna</button>
        </div>
      </div>

      <!-- Controls -->
      <div class="report-controls" style="margin-bottom:var(--space-4); display:flex; gap:var(--space-4); flex-wrap:wrap;">
        <div class="form-group" style="margin-bottom:0;flex:1;min-width:200px">
          <label class="form-label" style="font-size:11px">Cari Pengguna</label>
          <input type="text" id="userSearchInput" class="form-input" placeholder="Cari nama, username, atau email..." style="width:100%" />
        </div>
        <div class="form-group" style="margin-bottom:0;width:170px">
          <label class="form-label" style="font-size:11px">Filter Role</label>
          <select id="userRoleFilter" class="form-select" style="width:100%">
            <option value="all">Semua Role</option>
            ${USER_ROLES.map(r => `<option value="${r.id}">${r.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;width:170px">
          <label class="form-label" style="font-size:11px">Filter Keaktifan Input</label>
          <select id="userActivityFilter" class="form-select" style="width:100%">
            <option value="all">Semua Keaktifan</option>
            <option value="active">🟢 Aktif (≤10 hr)</option>
            <option value="passive">🟡 Pasif (11-30 hr)</option>
            <option value="inactive">🔴 Inaktif (>30 hr/Nihil)</option>
            <option value="non_inputter">⚪ Non-Inputter (-)</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;width:140px">
          <label class="form-label" style="font-size:11px">Filter Status Akun</label>
          <select id="userStatusFilter" class="form-select" style="width:100%">
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      <!-- Bulk Action Bar for Users -->
      <div id="usersBulkActionBar" class="md-bulk-bar">
        <div style="display:flex; align-items:center; gap:8px; font-size:var(--font-sm); font-weight:600; color:var(--text-primary)">
          <span style="background:rgba(239,68,68,0.1); color:#ef4444; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:11px">!</span>
          <span id="usersSelectedCount">0</span> pengguna terpilih
        </div>
        <div style="display:flex; gap:var(--space-2)">
          <button type="button" class="btn btn-ghost btn-sm" id="btnCancelUsersBulkSelect" style="color:var(--text-muted); padding:6px 12px; font-size:var(--font-xs)">Batal</button>
          <button type="button" class="btn btn-primary btn-sm" id="btnDeactivateUsersBulkSelected" style="background:#dc2626; border-color:#dc2626; display:inline-flex; align-items:center; gap:6px; padding:6px 12px; font-size:var(--font-xs)">
            ${icons.xCircle} Nonaktifkan Terpilih
          </button>
        </div>
      </div>

      <div class="md-table-container">
        <table class="md-table">
          <thead>
            <tr>
              <th style="width:40px; text-align:center"><input type="checkbox" id="selectAllUsers" style="cursor:pointer; transform:scale(1.1)" /></th>
              <th>Nama</th>
              <th>Username</th>
              <th>Role</th>
              <th>Keaktifan Input</th>
              <th>Wilayah</th>
              <th>Status Akun</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <!-- Rendered dynamically -->
          </tbody>
        </table>
      </div>
      <div id="usersInfo" style="text-align:center;padding:var(--space-4) var(--space-4) 0;color:var(--text-muted);font-size:var(--font-sm)"></div>
      <div id="usersPagination" style="display:flex; justify-content:center; align-items:center; gap:var(--space-2); margin-top:var(--space-4); margin-bottom:var(--space-6);"></div>
    `;

    let selectedIds = [];
    const selectAllCb = document.getElementById('selectAllUsers');
    const bulkBar = document.getElementById('usersBulkActionBar');
    const selectedCountEl = document.getElementById('usersSelectedCount');
    const btnCancelBulk = document.getElementById('btnCancelUsersBulkSelect');
    const btnDeactivateBulk = document.getElementById('btnDeactivateUsersBulkSelected');

    let currentPage = 1;
    const itemsPerPage = 10;

    function updateBulkBar(currentCheckboxes) {
      const cbs = currentCheckboxes || container.querySelectorAll('.user-select-checkbox');
      if (selectedIds.length > 0) {
        if (bulkBar) bulkBar.style.display = 'flex';
        if (selectedCountEl) selectedCountEl.textContent = selectedIds.length;
      } else {
        if (bulkBar) bulkBar.style.display = 'none';
      }
      if (selectAllCb) {
        selectAllCb.checked = cbs.length > 0 && selectedIds.length >= cbs.length && Array.from(cbs).every(cb => selectedIds.includes(cb.dataset.id));
        selectAllCb.indeterminate = selectedIds.length > 0 && selectedIds.length < cbs.length;
      }
    }

    const updateTable = () => {
      const search = document.getElementById('userSearchInput')?.value.toLowerCase().trim() || '';
      const role = document.getElementById('userRoleFilter')?.value || 'all';
      const status = document.getElementById('userStatusFilter')?.value || 'all';
      const activity = document.getElementById('userActivityFilter')?.value || 'all';

      // 1. Filter
      const filtered = users.filter(u => {
        const fullName = (u.full_name || u.name || '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const matchesSearch = fullName.includes(search) || username.includes(search) || email.includes(search);

        const matchesRole = (role === 'all' || u.role === role);

        let matchesStatus = true;
        if (status === 'active') matchesStatus = u.is_active !== false;
        else if (status === 'inactive') matchesStatus = u.is_active === false;

        let matchesActivity = true;
        if (activity !== 'all') {
          const isInputter = canInputWaste(u) && u.role !== 'admin';
          if (activity === 'non_inputter') {
            matchesActivity = !isInputter;
          } else {
            if (!isInputter) {
              matchesActivity = false;
            } else {
              const act = getKaderActivityStatus(u.last_input_at);
              matchesActivity = act.status === activity;
            }
          }
        }

        return matchesSearch && matchesRole && matchesStatus && matchesActivity;
      });

      // 2. Paginate
      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
      
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

      const isMobile = window.innerWidth <= 768;
      const limit = isMobile ? (currentPage * itemsPerPage) : itemsPerPage;
      const startIndex = isMobile ? 0 : (currentPage - 1) * itemsPerPage;
      const endIndex = isMobile ? limit : (currentPage * itemsPerPage);
      
      const paginatedItems = filtered.slice(startIndex, endIndex);

      // Update count badge in toolbar
      const countEl = container.querySelector('.md-count');
      if (countEl) {
        countEl.textContent = `${totalItems} akun`;
      }

      // Render table rows
      const tbody = container.querySelector('tbody');
      if (!tbody) return;

      if (paginatedItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="md-empty">Tidak ada data pengguna yang cocok</td></tr>';
        const infoEl = document.getElementById('usersInfo');
        if (infoEl) infoEl.textContent = '';
        const paginationContainer = document.getElementById('usersPagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
      }

      tbody.innerHTML = paginatedItems.map(u => {
        const isInputter = canInputWaste(u) && u.role !== 'admin';
        let activityHTML = '';

        if (isInputter) {
          const act = getKaderActivityStatus(u.last_input_at);
          const actBg = act.color === 'green' ? '#d1fae5' : (act.color === 'amber' ? '#fef3c7' : '#fee2e2');
          const actColor = act.color === 'green' ? '#065f46' : (act.color === 'amber' ? '#92400e' : '#991b1b');
          const lastInputText = u.last_input_at 
            ? (act.days === 0 ? 'Hari ini' : `${act.days} hr lalu`) 
            : 'Belum pernah';

          activityHTML = `
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span class="md-badge" style="background:${actBg}; color:${actColor}; display:inline-flex; align-items:center; gap:4px; font-weight:700; width:fit-content;">
                ${act.icon} ${act.label}
              </span>
              <span style="font-size:11px; color:var(--text-muted);">${lastInputText} (${u.total_waste_records || 0} record)</span>
            </div>
          `;
        } else {
          activityHTML = `
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span class="md-badge" style="background:var(--gray-100, #f3f4f6); color:var(--text-muted, #6b7280); font-weight:500; display:inline-flex; align-items:center; gap:4px; width:fit-content;">
                ⚪ - N/A -
              </span>
              <span style="font-size:11px; color:var(--text-muted);">Non-Inputter</span>
            </div>
          `;
        }

        return `
          <tr>
            <td style="text-align:center; vertical-align:middle">
              ${u.role !== 'admin' ? `<input type="checkbox" class="user-select-checkbox" data-id="${u.id}" style="cursor:pointer; transform:scale(1.1)" />` : '-'}
            </td>
            <td><strong>${u.full_name || u.name || ''}</strong></td>
            <td><code style="font-size:var(--font-xs);background:var(--gray-100);padding:2px 8px;border-radius:4px">${u.username}</code></td>
            <td>
              <span class="md-badge ${roleColors[u.role] || 'blue'}">${u.role_icon || ''} ${roleLabels[u.role] || u.role}</span>
              ${u.job_type ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px">${JOB_TYPES.find(j => j.id === u.job_type)?.label || u.job_type}</div>` : ''}
            </td>
            <td>${activityHTML}</td>
            <td>${u.wilayah || '-'}</td>
            <td>
              ${u.is_active !== false 
                ? `<span class="md-badge" style="background:#d1fae5; color:#065f46">Aktif</span>` 
                : `<span class="md-badge" style="background:#fee2e2; color:#991b1b">Nonaktif</span>`}
            </td>
            <td><div class="md-actions">
              <button class="md-btn-icon" title="Edit" data-edit-user="${u.id}">${icons.edit}</button>
              ${u.role !== 'admin' ? (
                u.is_active !== false
                  ? `<button class="md-btn-icon danger" title="Nonaktifkan Akun" data-toggle-user="${u.id}" data-active="true" style="color:#dc2626">${icons.xCircle}</button>`
                  : `<button class="md-btn-icon" title="Aktifkan Akun" data-toggle-user="${u.id}" data-active="false" style="color:#059669">${icons.checkCircle}</button>`
              ) : ''}
            </div></td>
          </tr>
        `;
      }).join('');

      // Wire up row checkboxes
      const rowCheckboxes = container.querySelectorAll('.user-select-checkbox');
      rowCheckboxes.forEach(cb => {
        cb.checked = selectedIds.includes(cb.dataset.id);
        cb.addEventListener('change', () => {
          const id = cb.dataset.id;
          if (cb.checked) {
            if (!selectedIds.includes(id)) selectedIds.push(id);
          } else {
            selectedIds = selectedIds.filter(x => x !== id);
          }
          updateBulkBar(rowCheckboxes);
        });
      });

      updateBulkBar(rowCheckboxes);

      // Re-bind actions (Edit & Toggle)
      container.querySelectorAll('[data-edit-user]').forEach(btn => btn.addEventListener('click', () => {
        const u = users.find(x => x.id === btn.dataset.editUser);
        if (u) openUserForm(u, masterWilayah);
      }));
      container.querySelectorAll('[data-toggle-user]').forEach(btn => btn.addEventListener('click', async () => {
        const userId = btn.dataset.toggleUser;
        const isActive = btn.dataset.active === 'true';
        const actionText = isActive ? 'menonaktifkan' : 'mengaktifkan';
        
        showModal({
          title: isActive ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna',
          content: `
            <div style="display: flex; gap: var(--space-4); align-items: flex-start; padding-top: var(--space-2)">
              <div style="background: ${isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${isActive ? 'var(--danger-500)' : 'var(--primary-500)'}; padding: var(--space-3); border-radius: var(--radius-lg); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                ${isActive ? icons.xCircle : icons.checkCircle}
              </div>
              <div>
                <p style="margin: 0; font-weight: 600; font-size: 15px; color: var(--text-primary);">Apakah Anda yakin ingin ${actionText} pengguna ini?</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">Pengguna yang nonaktif tidak akan dapat mengakses aplikasi.</p>
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
              label: isActive ? 'Nonaktifkan' : 'Aktifkan',
              variant: isActive ? 'btn-danger' : 'btn-primary',
              handler: async () => {
                try {
                  await updateUser(userId, { is_active: !isActive });
                  showToast(`Akun berhasil ${isActive ? 'dinonaktifkan' : 'diaktifkan'}`, 'success');
                  loadTabContent('users');
                } catch (err) {
                  showToast(`Gagal: ${err.message}`, 'error');
                }
              }
            }
          ]
        });
      }));

      // Render Pagination Info
      const infoEl = document.getElementById('usersInfo');
      if (infoEl) {
        infoEl.textContent = `Menampilkan ${Math.min(endIndex, totalItems)} dari ${totalItems} pengguna`;
      }

      // Render Pagination Controls
      const paginationContainer = document.getElementById('usersPagination');
      if (paginationContainer) {
        if (totalItems <= itemsPerPage) {
          paginationContainer.innerHTML = '';
          return;
        }

        if (isMobile) {
          if (totalItems > limit) {
            paginationContainer.innerHTML = `
              <button class="btn btn-ghost btn-sm" id="loadMoreUsersBtn" style="font-weight:600; padding:8px 16px; margin:12px 0; border:1px solid var(--border-color); border-radius:var(--radius-md);">
                Muat Lebih Banyak (${totalItems - limit} pengguna tersisa)
              </button>
            `;
            document.getElementById('loadMoreUsersBtn')?.addEventListener('click', () => {
              currentPage++;
              updateTable();
            });
          } else {
            paginationContainer.innerHTML = '';
          }
        } else {
          let html = `
            <button class="btn btn-ghost btn-sm pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} style="padding:4px 8px; min-width:32px;">
              ${icons.chevronLeft || '◀'}
            </button>
          `;
          for (let p = 1; p <= totalPages; p++) {
            html += `
              <button class="btn ${p === currentPage ? 'btn-primary' : 'btn-ghost'} btn-sm pagination-btn" data-page="${p}" style="padding:4px 8px; min-width:32px;">
                ${p}
              </button>
            `;
          }
          html += `
            <button class="btn btn-ghost btn-sm pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''} style="padding:4px 8px; min-width:32px;">
              ${icons.chevronRight || '▶'}
            </button>
          `;
          paginationContainer.innerHTML = html;

          paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              if (btn.disabled) return;
              currentPage = parseInt(btn.dataset.page);
              updateTable();
            });
          });
        }
      }
    };

    selectAllCb?.addEventListener('change', () => {
      const isChecked = selectAllCb.checked;
      const cbs = container.querySelectorAll('.user-select-checkbox');
      if (isChecked) {
        cbs.forEach(cb => {
          cb.checked = true;
          if (!selectedIds.includes(cb.dataset.id)) selectedIds.push(cb.dataset.id);
        });
      } else {
        cbs.forEach(cb => {
          cb.checked = false;
          selectedIds = selectedIds.filter(x => x !== cb.dataset.id);
        });
      }
      updateBulkBar(cbs);
    });

    btnCancelBulk?.addEventListener('click', () => {
      selectedIds = [];
      const cbs = container.querySelectorAll('.user-select-checkbox');
      cbs.forEach(cb => cb.checked = false);
      if (selectAllCb) selectAllCb.checked = false;
      updateBulkBar(cbs);
    });

    btnDeactivateBulk?.addEventListener('click', async () => {
      if (selectedIds.length === 0) return;
      showModal({
        title: 'Nonaktifkan Pengguna Terpilih',
        content: `
          <div style="display: flex; gap: var(--space-4); align-items: flex-start; padding-top: var(--space-2)">
            <div style="background: rgba(239, 68, 68, 0.1); color: var(--danger-500); padding: var(--space-3); border-radius: var(--radius-lg); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              ${icons.xCircle}
            </div>
            <div>
              <p style="margin: 0; font-weight: 600; font-size: 15px; color: var(--text-primary);">Apakah Anda yakin ingin menonaktifkan ${selectedIds.length} pengguna?</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">Pengguna yang dinonaktifkan tidak akan bisa login ke dalam aplikasi.</p>
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
            label: 'Nonaktifkan',
            variant: 'btn-danger',
            handler: async () => {
              if (btnDeactivateBulk) {
                btnDeactivateBulk.disabled = true;
                btnDeactivateBulk.innerHTML = '<span class="spinner" style="width:12px;height:12px;border-width:2px;display:inline-block;margin-right:6px;vertical-align:middle"></span> Menonaktifkan...';
              }
              try {
                await deactivateUsersBatch(selectedIds);
                showToast(`${selectedIds.length} pengguna berhasil dinonaktifkan`, 'success');
                loadTabContent('users');
              } catch (err) {
                showToast('Gagal menonaktifkan: ' + err.message, 'error');
                if (btnDeactivateBulk) {
                  btnDeactivateBulk.disabled = false;
                  btnDeactivateBulk.innerHTML = `${icons.xCircle} Nonaktifkan Terpilih`;
                }
              }
            }
          }
        ]
      });
    });

    document.getElementById('addUserBtn')?.addEventListener('click', () => openUserForm(null, masterWilayah));

    // Bind controls
    const searchInput = document.getElementById('userSearchInput');
    const roleFilter = document.getElementById('userRoleFilter');
    const statusFilter = document.getElementById('userStatusFilter');
    const activityFilterEl = document.getElementById('userActivityFilter');
    const exportKaderBtn = document.getElementById('exportKaderExcelBtn');

    ['input', 'change'].forEach(evtType => {
      searchInput?.addEventListener(evtType, () => {
        currentPage = 1;
        updateTable();
      });
    });
    roleFilter?.addEventListener('change', () => {
      currentPage = 1;
      updateTable();
    });
    statusFilter?.addEventListener('change', () => {
      currentPage = 1;
      updateTable();
    });
    activityFilterEl?.addEventListener('change', () => {
      currentPage = 1;
      updateTable();
    });

    exportKaderBtn?.addEventListener('click', async () => {
      const search = searchInput?.value.toLowerCase().trim() || '';
      const role = roleFilter?.value || 'all';
      const status = statusFilter?.value || 'all';
      const activity = activityFilterEl?.value || 'all';

      const filteredToExport = users.filter(u => {
        const fullName = (u.full_name || u.name || '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const matchesSearch = fullName.includes(search) || username.includes(search) || email.includes(search);
        const matchesRole = (role === 'all' || u.role === role);
        let matchesStatus = true;
        if (status === 'active') matchesStatus = u.is_active !== false;
        else if (status === 'inactive') matchesStatus = u.is_active === false;
        
        let matchesActivity = true;
        if (activity !== 'all') {
          const isInputter = canInputWaste(u) && u.role !== 'admin';
          if (activity === 'non_inputter') {
            matchesActivity = !isInputter;
          } else {
            if (!isInputter) {
              matchesActivity = false;
            } else {
              const act = getKaderActivityStatus(u.last_input_at);
              matchesActivity = act.status === activity;
            }
          }
        }
        return matchesSearch && matchesRole && matchesStatus && matchesActivity;
      });

      try {
        const XLSX = await import('xlsx');
        const headers = ['No', 'Nama Lengkap', 'Username', 'Email', 'Role', 'Tipe Pekerjaan', 'Kecamatan / Wilayah', 'Status Keaktifan', 'Tanggal Terakhir Input', 'Selisih Hari Input', 'Total Record Sampah'];
        const rows = filteredToExport.map((u, idx) => {
          const isInputter = canInputWaste(u) && u.role !== 'admin';
          const act = isInputter ? getKaderActivityStatus(u.last_input_at) : null;
          const statusText = isInputter ? `${act.icon} ${act.label}` : 'Non-Inputter';
          const lastDateStr = isInputter ? (u.last_input_at ? new Date(u.last_input_at).toLocaleString('id-ID') : 'Belum Pernah') : '-';
          const daysStr = isInputter ? (act.days !== null ? `${act.days} hari` : 'Belum Pernah') : '-';

          return [
            idx + 1,
            u.full_name || u.name || '-',
            u.username || '-',
            u.email || '-',
            u.role || '-',
            u.job_type ? (JOB_TYPES.find(j => j.id === u.job_type)?.label || u.job_type) : '-',
            u.kecamatan || u.wilayah || '-',
            statusText,
            lastDateStr,
            daysStr,
            isInputter ? (u.total_waste_records || 0) : '-'
          ];
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, 'Keaktifan Kader');
        XLSX.writeFile(wb, `Rekap_Keaktifan_Kader_${new Date().toISOString().split('T')[0]}.xlsx`);
        showToast('Rekap keaktifan kader berhasil diunduh', 'success');
      } catch (err) {
        showToast('Gagal mengunduh rekap: ' + err.message, 'error');
        console.error('[Export Kader Error]', err);
      }
    });

    // Initial render
    updateTable();
  }

  function openUserForm(existing = null, masterWilayah = []) {
    const isEdit = !!existing;
    const kecamatanList = [...new Set(masterWilayah.map(w => w.kecamatan))].sort();

    openModal(isEdit ? 'Edit Pengguna' : 'Tambah Pengguna Baru', `
      <form id="userForm">
        <div class="form-group">
          <label class="form-label">Nama Lengkap</label>
          <input class="form-input" id="userName" required value="${existing?.full_name || existing?.name || ''}" placeholder="Misal: Siti Aminah" />
        </div>
        <div class="form-group">
          <label class="form-label">Username</label>
          <input class="form-input" id="userUsername" required value="${existing?.username || ''}" placeholder="Misal: kader_siti" ${isEdit ? 'readonly style="background:var(--gray-100)"' : ''} />
        </div>
        ${!isEdit ? `<div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" id="userPassword" type="password" required placeholder="Minimal 6 karakter" minlength="6" />
        </div>` : (existing?.id === user?.id ? `<div class="form-group">
          <label class="form-label">Password Baru (kosongkan jika tidak diganti)</label>
          <input class="form-input" id="userPassword" type="password" placeholder="Biarkan kosong jika tidak ingin diubah" />
        </div>` : `<div class="form-group" style="background:var(--gray-50); padding:var(--space-3); border-radius:var(--radius-md); border:1px solid var(--border-color)">
          <label class="form-label" style="margin-bottom:4px; color:var(--text-muted)">Keamanan Password</label>
          <p style="font-size:var(--font-xs); color:var(--text-muted); margin:0; line-height:1.4">
            Password pengguna lain tidak dapat diubah langsung dari panel ini demi kebijakan keamanan sistem. Perubahan hanya bisa dilakukan secara mandiri oleh pengguna atau oleh admin melalui console utama database.
          </p>
        </div>`)}
        <div class="form-group">
          <label class="form-label">Role / Peran</label>
          <select class="form-select" id="userRole" required>
            ${USER_ROLES.map(r => `<option value="${r.id}" ${existing?.role === r.id ? 'selected' : ''}>${r.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" id="jobTypeGroup" style="display:${existing?.role === 'petugas' || !existing ? 'block' : 'none'}">
          <label class="form-label">Tipe Tugas (untuk Petugas)</label>
          <select class="form-select" id="userJobType">
            <option value="">(Tidak ditentukan)</option>
            ${JOB_TYPES.map(j => `<option value="${j.id}" ${existing?.job_type === j.id ? 'selected' : ''}>${j.label} — ${j.desc}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" id="kecamatanGroup" style="display:${(existing?.role === 'petugas' && existing?.job_type === 'koordinator') ? 'block' : 'none'}">
          <label class="form-label">Kecamatan Tanggung Jawab (Khusus Koordinator)</label>
          <select class="form-select" id="userKecamatan">
            <option value="">Pilih Kecamatan...</option>
            ${kecamatanList.map(k => `<option value="${k}" ${existing?.kecamatan === k ? 'selected' : ''}>${k}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" id="wilayahGroup" style="display:${(existing?.role === 'petugas' && existing?.job_type === 'koordinator') ? 'none' : 'block'}">
          <label class="form-label">Wilayah (opsional)</label>
          <input class="form-input" id="userWilayah" value="${existing?.wilayah || ''}" placeholder="Misal: Banjarnegara" />
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" onclick="document.getElementById('mdModal').style.display='none'">Batal</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Simpan Perubahan' : 'Tambah Pengguna'}</button>
        </div>
      </form>
    `);
    // Toggle fields visibility based on role and job type
    const roleSelect = document.getElementById('userRole');
    const jobTypeSelect = document.getElementById('userJobType');
    const jobTypeGroup = document.getElementById('jobTypeGroup');
    const kecamatanGroup = document.getElementById('kecamatanGroup');
    const wilayahGroup = document.getElementById('wilayahGroup');

    const updateFieldsVisibility = () => {
      const isPetugas = roleSelect.value === 'petugas';
      const isKoordinator = isPetugas && jobTypeSelect.value === 'koordinator';
      
      jobTypeGroup.style.display = isPetugas ? 'block' : 'none';
      kecamatanGroup.style.display = isKoordinator ? 'block' : 'none';
      wilayahGroup.style.display = isKoordinator ? 'none' : 'block';
    };

    roleSelect?.addEventListener('change', updateFieldsVisibility);
    jobTypeSelect?.addEventListener('change', updateFieldsVisibility);

    document.getElementById('userForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const role = document.getElementById('userRole').value;
      const roleInfo = USER_ROLES.find(r => r.id === role);
      const jobType = document.getElementById('userJobType')?.value || null;
      const kecamatan = (role === 'petugas' && jobType === 'koordinator')
        ? document.getElementById('userKecamatan').value || null
        : null;

      const data = {
        name: document.getElementById('userName').value.trim(),
        full_name: document.getElementById('userName').value.trim(),
        username: document.getElementById('userUsername').value.trim().toLowerCase(),
        role: role,
        role_icon: roleInfo?.icon || '',
        job_type: role === 'petugas' ? jobType : null,
        kecamatan: kecamatan,
        wilayah: kecamatan ? `Kec. ${kecamatan}` : document.getElementById('userWilayah').value.trim()
      };
      const passwordEl = document.getElementById('userPassword');
      const pw = passwordEl ? passwordEl.value : '';
      if (!isEdit && pw) data.password = pw;
      if (isEdit && pw) data.password = pw;
      try {
        if (isEdit) await updateUser(existing.id, data);
        else {
          if (!pw || pw.length < 6) { showToast('Password minimal 6 karakter', 'warning'); return; }
          await addUser(data);
        }
        showToast(isEdit ? 'Pengguna berhasil diperbarui' : 'Pengguna baru berhasil ditambahkan', 'success');
        closeModal();
        loadTabContent('users');
      } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
    });
  }

  // ---------- POPULATION (WILAYAH) TAB ----------
  async function renderPopulationTab(container) {
    const villages = await getAllMasterWilayah();
    // Sort by kecamatan, then desa/kelurahan
    villages.sort((a, b) => {
      const kecCompare = a.kecamatan.localeCompare(b.kecamatan);
      if (kecCompare !== 0) return kecCompare;
      return a.desa_kelurahan.localeCompare(b.desa_kelurahan);
    });

    let searchVal = '';
    
    function drawTable() {
      const query = searchVal.toLowerCase().trim();
      const filtered = villages.filter(v => 
        v.kecamatan.toLowerCase().includes(query) || 
        v.desa_kelurahan.toLowerCase().includes(query)
      );

      container.innerHTML = `
        <div class="md-toolbar" style="flex-wrap:wrap; gap:var(--space-3)">
          <div style="display:flex;align-items:center;gap:var(--space-3)">
            <h3 style="display:flex;align-items:center;gap:8px">${icons.chart} Data Kependudukan & Wilayah</h3>
            <span class="md-count">${filtered.length} desa/kelurahan</span>
          </div>
          <div style="display:flex;gap:var(--space-2);flex:1;min-width:320px;justify-content:flex-end">
            <input type="text" class="form-input form-input-sm" id="wilSearch" placeholder="Cari desa..." value="${searchVal}" style="max-width:200px; margin-right:auto" />
            <button class="btn btn-secondary btn-sm" id="downloadPopBtn" style="display:inline-flex;align-items:center;gap:6px" title="Ekspor data wilayah ke Excel">
              ${icons.download} Unduh Data
            </button>
            <button class="btn btn-secondary btn-sm" id="uploadPopBtn" style="display:inline-flex;align-items:center;gap:6px" title="Unggah pembaruan statistik wilayah">
              ${icons.upload} Upload Excel
            </button>
          </div>
        </div>

        <div class="md-table-container">
          <table class="md-table">
            <thead>
              <tr>
                <th>Kecamatan</th>
                <th>Desa / Kelurahan</th>
                <th style="text-align:right">Penduduk</th>
                <th style="text-align:right">KK</th>
                <th style="text-align:right">Luas (km²)</th>
                <th style="text-align:right">Timbulan/kap</th>
                <th style="text-align:right">Potensi Harian</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(v => {
                const potensiHarian = (v.jumlah_penduduk * (v.timbulan_per_kapita || 0.70)).toFixed(0);
                return `<tr>
                  <td><strong>${v.kecamatan}</strong></td>
                  <td>${v.desa_kelurahan}</td>
                  <td style="text-align:right">${Number(v.jumlah_penduduk || 0).toLocaleString('id-ID')} jiwa</td>
                  <td style="text-align:right">${Number(v.jumlah_kk || 0).toLocaleString('id-ID')}</td>
                  <td style="text-align:right">${v.luas_km2 || '-'}</td>
                  <td style="text-align:right">${v.timbulan_per_kapita || 0.7} kg</td>
                  <td style="text-align:right;font-weight:600;color:var(--primary-600)">${Number(potensiHarian).toLocaleString('id-ID')} kg</td>
                  <td><div class="md-actions">
                    <button class="md-btn-icon" title="Edit Data Wilayah" data-edit-wil="${v.id}">${icons.edit}</button>
                  </div></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div style="padding:var(--space-3);background:rgba(59,130,246,0.05);border-radius:var(--radius-md);margin-top:var(--space-4);font-size:var(--font-xs);color:var(--text-secondary);display:flex;align-items:flex-start;gap:var(--space-2)">
          ${icons.info} <span><strong>Info:</strong> Data kependudukan per desa/kelurahan di Banjarnegara ini digunakan sebagai dasar kalkulasi performa pengelolaan sampah di dashboard intervensi dan GIS. Anda dapat memperbarui angka-angka ini secara berkala.</span>
        </div>
      `;

      // Bind search input
      const searchInput = document.getElementById('wilSearch');
      if (searchInput) {
        searchInput.focus();
        const len = searchInput.value.length;
        searchInput.setSelectionRange(len, len);
        
        searchInput.addEventListener('input', (e) => {
          searchVal = e.target.value;
          drawTable();
        });
      }

      // Bind Excel action buttons
      document.getElementById('downloadPopBtn')?.addEventListener('click', () => downloadPopulationData(villages));
      document.getElementById('uploadPopBtn')?.addEventListener('click', () => openPopulationExcelUpload(villages));

      // Bind edit action
      container.querySelectorAll('[data-edit-wil]').forEach(btn => btn.addEventListener('click', () => {
        const v = villages.find(x => x.id === btn.dataset.editWil);
        if (v) openWilayahForm(v);
      }));
    }

    drawTable();
  }

  async function downloadPopulationData(villages = []) {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const headers = [
        'ID Wilayah (Jangan Diubah)',
        'Kecamatan',
        'Desa / Kelurahan',
        'Jumlah Penduduk (jiwa)',
        'Jumlah KK',
        'Luas Wilayah (km²)',
        'Timbulan per Kapita (kg/hari)'
      ];

      const refRows = villages.map(v => [
        v.id,
        v.kecamatan,
        v.desa_kelurahan,
        v.jumlah_penduduk || 0,
        v.jumlah_kk || 0,
        v.luas_km2 || 0,
        v.timbulan_per_kapita || 0.70
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...refRows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Data Kependudukan');

      XLSX.writeFile(wb, 'Data_Kependudukan_Simpah.xlsx');
      showToast('Data kependudukan berhasil diunduh', 'success');
    } catch (err) {
      showToast('Gagal mengunduh data: ' + err.message, 'error');
    }
  }

  function openPopulationExcelUpload(villages = []) {
    const modalEl = document.querySelector('.md-modal');
    if (modalEl) modalEl.style.maxWidth = '950px';

    openModal('Upload Pembaruan Data Kependudukan', `
      <div class="excel-upload-wizard">
        <!-- Step 1: Download Current Data -->
        <div class="wizard-section" style="margin-bottom:var(--space-4); padding-bottom:var(--space-4); border-bottom:1px solid var(--border-color)">
          <h4 style="font-weight:600; font-size:var(--font-sm); margin-bottom:var(--space-2); display:flex; align-items:center; gap:8px">
            1. Ekspor & Unduh Data Kependudukan Saat Ini
          </h4>
          <p style="font-size:var(--font-xs); color:var(--text-secondary); margin-bottom:var(--space-3)">
            Ekspor data kependudukan seluruh desa saat ini untuk mengedit angka penduduk, KK, luas, atau timbulan per kapita secara langsung di Excel.
          </p>
          <button type="button" class="btn btn-secondary btn-sm" id="btnDownloadCurrentPop" style="display:inline-flex; align-items:center; gap:6px">
            ${icons.download} Unduh Data Saat Ini
          </button>
        </div>

        <!-- Step 2: Upload File -->
        <div class="wizard-section" style="margin-bottom:var(--space-4)">
          <h4 style="font-weight:600; font-size:var(--font-sm); margin-bottom:var(--space-2)">
            2. Unggah File Excel yang Telah Diperbarui
          </h4>
          <div id="popExcelDropzone" style="border:2px dashed var(--border-color); border-radius:var(--radius-lg); padding:var(--space-6); text-align:center; background:var(--gray-50); cursor:pointer; transition:all 0.2s">
            <div style="font-size:32px; margin-bottom:var(--space-2)">📄</div>
            <p style="font-weight:600; font-size:var(--font-sm); color:var(--text-primary)">
              Seret & taruh file Excel di sini, atau klik untuk memilih file
            </p>
            <p style="font-size:var(--font-xs); color:var(--text-muted); margin-top:4px">
               Format yang didukung: .xlsx, .xls
            </p>
            <input type="file" id="popExcelFileInput" accept=".xlsx, .xls" style="display:none" />
          </div>
        </div>

        <!-- Step 3: Preview & Validasi Perubahan -->
        <div id="popPreviewSection" style="display:none; margin-bottom:var(--space-4)">
          <h4 style="font-weight:600; font-size:var(--font-sm); margin-bottom:var(--space-2); display:flex; justify-content:space-between; align-items:center">
            <span>3. Preview & Validasi Perubahan</span>
            <span id="popPreviewSummary" class="md-badge blue" style="font-size:10px; padding:2px 8px">0 Baris Terdeteksi</span>
          </h4>
          <div class="md-table-container" style="max-height:220px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-md)">
            <table class="md-table" style="font-size:var(--font-xs)">
              <thead style="position:sticky; top:0; z-index:10; background:var(--gray-50)">
                <tr>
                  <th>Status</th>
                  <th>Kecamatan</th>
                  <th>Desa / Kelurahan</th>
                  <th>Penduduk (Jiwa)</th>
                  <th>Jumlah KK</th>
                  <th>Luas Wilayah</th>
                  <th>Timbulan/Kap</th>
                  <th>Perubahan</th>
                </tr>
              </thead>
              <tbody id="popPreviewTableBody">
              </tbody>
            </table>
          </div>
          <div id="popValidationAlert" style="margin-top:var(--space-3)"></div>
        </div>

        <div class="form-actions" style="margin-top:var(--space-4); padding-top:var(--space-4); border-top:1px solid var(--border-color); display:flex; justify-content:flex-end; gap:var(--space-3)">
          <button type="button" class="btn btn-ghost" id="btnCancelPopUpload">Batal</button>
          <button type="button" class="btn btn-primary" id="btnImportPopExcel" disabled>Simpan Pembaruan</button>
        </div>
      </div>
    `);

    const dropzone = document.getElementById('popExcelDropzone');
    const fileInput = document.getElementById('popExcelFileInput');
    const btnDownload = document.getElementById('btnDownloadCurrentPop');
    const btnCancel = document.getElementById('btnCancelPopUpload');
    const btnImport = document.getElementById('btnImportPopExcel');

    let rowsToUpdate = [];

    btnDownload?.addEventListener('click', () => downloadPopulationData(villages));
    dropzone?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (dropzone) {
        dropzone.style.borderColor = 'var(--primary-color)';
        dropzone.style.background = 'rgba(16, 185, 129, 0.05)';
      }
    });
    const resetDropzoneStyle = () => {
      if (dropzone) {
        dropzone.style.borderColor = 'var(--border-color)';
        dropzone.style.background = 'var(--gray-50)';
      }
    };
    dropzone?.addEventListener('dragleave', resetDropzoneStyle);
    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      resetDropzoneStyle();
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    });
    fileInput?.addEventListener('change', () => {
      const files = fileInput.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    });

    btnCancel?.addEventListener('click', () => closeModal());

    btnImport?.addEventListener('click', async () => {
      if (rowsToUpdate.length === 0) return;
      btnImport.disabled = true;
      btnImport.innerHTML = '<span class="spinner" style="width:12px;height:12px;border-width:2px;display:inline-block;margin-right:6px;vertical-align:middle"></span> Menyimpan...';
      try {
        await updatePopulationBatch(rowsToUpdate);
        showToast(`Berhasil memperbarui ${rowsToUpdate.length} data kependudukan desa`, 'success');
        closeModal();
        loadTabContent('population');
      } catch (err) {
        showToast('Gagal menyimpan pembaruan: ' + err.message, 'error');
        btnImport.disabled = false;
        btnImport.innerHTML = 'Simpan Pembaruan';
      }
    });

    async function handleFileSelect(file) {
      try {
        const XLSX = await import('xlsx');
        const reader = new FileReader();
        reader.onload = function (e) {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (rawData.length < 2) {
            showToast('File Excel kosong atau format tidak sesuai.', 'warning');
            return;
          }

          processExcelData(rawData);
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        showToast('Gagal membaca file Excel: ' + err.message, 'error');
      }
    }

    function processExcelData(rows) {
      const headers = rows[0].map(h => String(h).trim());
      const expectedHeaders = [
        'ID Wilayah (Jangan Diubah)',
        'Kecamatan',
        'Desa / Kelurahan',
        'Jumlah Penduduk (jiwa)',
        'Jumlah KK',
        'Luas Wilayah (km²)',
        'Timbulan per Kapita (kg/hari)'
      ];

      const hasRequiredHeaders = expectedHeaders.every(h => headers.includes(h));
      if (!hasRequiredHeaders) {
        showToast('Format kolom Excel tidak sesuai. Pastikan Anda mengunggah file yang diekspor dari tombol Step 1.', 'error');
        return;
      }

      const idxMap = {};
      expectedHeaders.forEach(h => {
        idxMap[h] = headers.indexOf(h);
      });

      const records = rows.slice(1);
      const tbody = document.getElementById('popPreviewTableBody');
      const previewSection = document.getElementById('popPreviewSection');
      const summaryBadge = document.getElementById('popPreviewSummary');
      const valAlert = document.getElementById('popValidationAlert');

      if (!tbody || !previewSection) return;

      tbody.innerHTML = '';
      rowsToUpdate = [];
      let errorCount = 0;
      let modifiedCount = 0;

      records.forEach((row, i) => {
        if (row.length === 0 || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
          return;
        }

        const id = String(row[idxMap['ID Wilayah (Jangan Diubah)']] || '').trim();
        const kec = String(row[idxMap['Kecamatan']] || '').trim();
        const desa = String(row[idxMap['Desa / Kelurahan']] || '').trim();
        const jiwaRaw = row[idxMap['Jumlah Penduduk (jiwa)']];
        const kkRaw = row[idxMap['Jumlah KK']];
        const luasRaw = row[idxMap['Luas Wilayah (km²)']];
        const timbulanRaw = row[idxMap['Timbulan per Kapita (kg/hari)']];

        let status = 'valid';
        const errors = [];
        const changes = [];

        const original = villages.find(v => v.id === id);
        if (!original) {
          status = 'invalid';
          errors.push('ID Wilayah tidak dikenal atau telah diubah');
        }

        const jiwa = parseInt(jiwaRaw);
        if (isNaN(jiwa) || jiwa < 0) {
          status = 'invalid';
          errors.push('Jumlah Penduduk harus berupa angka non-negatif');
        }

        const kk = parseInt(kkRaw);
        if (isNaN(kk) || kk < 0) {
          status = 'invalid';
          errors.push('Jumlah KK harus berupa angka non-negatif');
        }

        const luas = parseFloat(luasRaw);
        if (isNaN(luas) || luas < 0) {
          status = 'invalid';
          errors.push('Luas wilayah harus berupa angka non-negatif');
        }

        const timbulan = parseFloat(timbulanRaw);
        if (isNaN(timbulan) || timbulan < 0) {
          status = 'invalid';
          errors.push('Timbulan per kapita harus berupa angka non-negatif');
        }

        if (status === 'valid' && original) {
          if (original.jumlah_penduduk !== jiwa) changes.push(`Penduduk: ${original.jumlah_penduduk || 0} ➔ ${jiwa}`);
          if (original.jumlah_kk !== kk) changes.push(`KK: ${original.jumlah_kk || 0} ➔ ${kk}`);
          if (Number(original.luas_km2 || 0).toFixed(2) !== Number(luas).toFixed(2)) changes.push(`Luas: ${original.luas_km2 || 0} ➔ ${luas}`);
          if (Number(original.timbulan_per_kapita || 0.70).toFixed(2) !== Number(timbulan).toFixed(2)) changes.push(`Timbulan: ${original.timbulan_per_kapita || 0.70} ➔ ${timbulan}`);

          if (changes.length > 0) {
            modifiedCount++;
            rowsToUpdate.push({
              id,
              jumlah_penduduk: jiwa,
              jumlah_kk: kk,
              luas_km2: luas,
              timbulan_per_kapita: timbulan
            });
          }
        }

        let statusBadge = '';
        let changeText = '';
        if (status === 'invalid') {
          errorCount++;
          statusBadge = `<span class="md-badge red" title="${errors.join('; ')}">Error</span>`;
          changeText = `<span style="color:#b91c1c; font-weight:600">${errors.join(', ')}</span>`;
        } else if (changes.length > 0) {
          statusBadge = `<span class="md-badge blue">Diperbarui</span>`;
          changeText = `<span style="color:#2563eb; font-weight:500">${changes.join(' | ')}</span>`;
        } else {
          statusBadge = `<span class="md-badge gray">Tidak Berubah</span>`;
          changeText = `<span style="color:var(--text-muted)">-</span>`;
        }

        tbody.insertAdjacentHTML('beforeend', `
          <tr>
            <td style="vertical-align:middle; text-align:center">${statusBadge}</td>
            <td><strong>${kec}</strong></td>
            <td>${desa}</td>
            <td style="text-align:right">${isNaN(jiwa) ? '-' : jiwa.toLocaleString('id-ID')}</td>
            <td style="text-align:right">${isNaN(kk) ? '-' : kk.toLocaleString('id-ID')}</td>
            <td style="text-align:right">${isNaN(luas) ? '-' : luas}</td>
            <td style="text-align:right">${isNaN(timbulan) ? '-' : timbulan}</td>
            <td>${changeText}</td>
          </tr>
        `);
      });

      previewSection.style.display = 'block';
      if (summaryBadge) {
        summaryBadge.textContent = `${records.length} Desa Terdeteksi`;
      }

      if (errorCount > 0) {
        if (valAlert) {
          valAlert.className = 'md-badge red';
          valAlert.style.display = 'block';
          valAlert.style.width = '100%';
          valAlert.style.padding = '8px 12px';
          valAlert.innerHTML = `⚠️ Terdeteksi <strong>${errorCount} baris bermasalah</strong>. Perbaiki file Excel Anda sebelum melakukan pembaruan.`;
        }
        if (btnImport) btnImport.disabled = true;
      } else {
        if (valAlert) {
          valAlert.className = 'md-badge green';
          valAlert.style.display = 'block';
          valAlert.style.width = '100%';
          valAlert.style.padding = '8px 12px';
          valAlert.innerHTML = `✅ Validasi selesai! Terdeteksi <strong>${modifiedCount} desa yang mengalami perubahan data</strong>. Klik <strong>Simpan Pembaruan</strong> untuk memperbarui database.`;
        }
        if (btnImport) btnImport.disabled = rowsToUpdate.length === 0;
      }
    }
  }


  function openWilayahForm(existing) {
    openModal('Edit Data Wilayah & Kependudukan', `
      <form id="wilForm">
        <div style="display:flex;gap:var(--space-3)">
          <div class="form-group" style="flex:1">
            <label class="form-label">Kecamatan</label>
            <input class="form-input" value="${existing.kecamatan}" disabled style="background:var(--gray-100)" />
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Desa / Kelurahan</label>
            <input class="form-input" value="${existing.desa_kelurahan}" disabled style="background:var(--gray-100)" />
          </div>
        </div>
        <div style="display:flex;gap:var(--space-3)">
          <div class="form-group" style="flex:1">
            <label class="form-label">Jumlah Penduduk (jiwa) *</label>
            <input class="form-input" id="wilJiwa" type="number" required min="0" value="${existing.jumlah_penduduk || '0'}" placeholder="Misal: 4500" />
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Jumlah KK *</label>
            <input class="form-input" id="wilKK" type="number" required min="0" value="${existing.jumlah_kk || '0'}" placeholder="Misal: 1100" />
          </div>
        </div>
        <div style="display:flex;gap:var(--space-3)">
          <div class="form-group" style="flex:1">
            <label class="form-label">Luas Wilayah (km²)</label>
            <input class="form-input" id="wilLuas" type="number" step="0.01" min="0" value="${existing.luas_km2 || '0'}" placeholder="Misal: 2.5" />
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Timbulan per Kapita (kg/hari)</label>
            <input class="form-input" id="wilTimbulan" type="number" step="0.01" min="0" value="${existing.timbulan_per_kapita || '0.70'}" placeholder="0.70" />
            <small style="color:var(--text-muted);font-size:11px">Standar nasional KLHK: 0.70 kg</small>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" onclick="document.getElementById('mdModal').style.display='none'">Batal</button>
          <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
        </div>
      </form>
    `);

    document.getElementById('wilForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        jumlah_penduduk: parseInt(document.getElementById('wilJiwa').value) || 0,
        jumlah_kk: parseInt(document.getElementById('wilKK').value) || 0,
        luas_km2: parseFloat(document.getElementById('wilLuas').value) || 0,
        timbulan_per_kapita: parseFloat(document.getElementById('wilTimbulan').value) || 0.70,
      };
      try {
        await updateMasterWilayah(existing.id, data);
        showToast('Data kependudukan wilayah berhasil diperbarui', 'success');
        closeModal();
        loadTabContent('population');
      } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
    });
  }

  // ---------- FASILITAS UMUM TAB ----------
  async function renderFasumTab(container) {
    const [facilities, masterWilayah] = await Promise.all([
      getAllPublicFacilities(),
      getAllMasterWilayah()
    ]);
    container.innerHTML = `
      <div class="md-toolbar">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <h3 style="display:flex;align-items:center;gap:8px">${icons.grid} Daftar Fasilitas Umum</h3>
          <span class="md-count">${facilities.length} fasilitas</span>
        </div>
        <div style="display:flex;gap:var(--space-2)">
          <button class="btn btn-secondary btn-sm" id="downloadFasumTemplateBtn" style="display:inline-flex;align-items:center;gap:6px" title="Unduh Templat Format Excel">
            ${icons.download} Download Format
          </button>
          <button class="btn btn-secondary btn-sm" id="uploadFasumExcelBtn" style="display:inline-flex;align-items:center;gap:6px">
            ${icons.upload} Upload Excel
          </button>
          <button class="btn btn-primary btn-sm" id="addFasumBtn">${icons.plus} Tambah Fasum</button>
        </div>
      </div>

      <!-- Bulk Action Bar for Fasum -->
      <div id="fasumBulkActionBar" class="md-bulk-bar">
        <div style="display:flex; align-items:center; gap:8px; font-size:var(--font-sm); font-weight:600; color:var(--text-primary)">
          <span style="background:rgba(239,68,68,0.1); color:#ef4444; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:11px">!</span>
          <span id="fasumSelectedCount">0</span> fasilitas terpilih
        </div>
        <div style="display:flex; gap:var(--space-2)">
          <button type="button" class="btn btn-ghost btn-sm" id="btnCancelFasumBulkSelect" style="color:var(--text-muted); padding:6px 12px; font-size:var(--font-xs)">Batal</button>
          <button type="button" class="btn btn-primary btn-sm" id="btnDeleteFasumBulkSelected" style="background:#dc2626; border-color:#dc2626; display:inline-flex; align-items:center; gap:6px; padding:6px 12px; font-size:var(--font-xs)">
            ${icons.trash} Hapus Terpilih
          </button>
        </div>
      </div>

      <div class="md-table-container">
        <table class="md-table">
          <thead>
            <tr>
              <th style="width:40px; text-align:center"><input type="checkbox" id="selectAllFasum" style="cursor:pointer; transform:scale(1.1)" /></th>
              <th>Nama</th>
              <th>Kategori</th>
              <th>Wilayah</th>
              <th>Kapasitas</th>
              <th>Potensi Sampah</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${facilities.length === 0 ? '<tr><td colspan="7" class="md-empty">Belum ada data fasilitas umum</td></tr>' :
              facilities.map(f => {
                const potensiHarian = (f.capacity_value * (f.timbulan_per_unit || 0)).toFixed(1);
                return `<tr>
                  <td style="text-align:center; vertical-align:middle">
                    <input type="checkbox" class="fasum-select-checkbox" data-id="${f.id}" style="cursor:pointer; transform:scale(1.1)" />
                  </td>
                  <td><strong>${f.name}</strong></td>
                  <td><span class="md-badge blue">${f.category}</span></td>
                  <td>${f.kecamatan || '-'}</td>
                  <td>${f.capacity_value || 0} ${f.capacity_unit || ''}</td>
                  <td style="font-weight:600;color:var(--primary-600)">${potensiHarian} kg/hari</td>
                  <td><div class="md-actions">
                    <button class="md-btn-icon" title="Edit" data-edit-fasum="${f.id}">${icons.edit}</button>
                    <button class="md-btn-icon danger" title="Hapus" data-del-fasum="${f.id}">${icons.trash}</button>
                  </div></td>
                </tr>`;
              }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Bulk selection logic for Fasum
    let selectedIds = [];
    const selectAllCb = document.getElementById('selectAllFasum');
    const rowCheckboxes = container.querySelectorAll('.fasum-select-checkbox');
    const bulkBar = document.getElementById('fasumBulkActionBar');
    const selectedCountEl = document.getElementById('fasumSelectedCount');
    const btnCancelBulk = document.getElementById('btnCancelFasumBulkSelect');
    const btnDeleteBulk = document.getElementById('btnDeleteFasumBulkSelected');

    function updateBulkBar() {
      if (selectedIds.length > 0) {
        if (bulkBar) bulkBar.style.display = 'flex';
        if (selectedCountEl) selectedCountEl.textContent = selectedIds.length;
      } else {
        if (bulkBar) bulkBar.style.display = 'none';
      }
      if (selectAllCb) {
        selectAllCb.checked = selectedIds.length === rowCheckboxes.length && rowCheckboxes.length > 0;
        selectAllCb.indeterminate = selectedIds.length > 0 && selectedIds.length < rowCheckboxes.length;
      }
    }

    selectAllCb?.addEventListener('change', () => {
      const isChecked = selectAllCb.checked;
      selectedIds = [];
      rowCheckboxes.forEach(cb => {
        cb.checked = isChecked;
        if (isChecked) selectedIds.push(cb.dataset.id);
      });
      updateBulkBar();
    });

    rowCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.id;
        if (cb.checked) {
          if (!selectedIds.includes(id)) selectedIds.push(id);
        } else {
          selectedIds = selectedIds.filter(x => x !== id);
        }
        updateBulkBar();
      });
    });

    btnCancelBulk?.addEventListener('click', () => {
      selectedIds = [];
      rowCheckboxes.forEach(cb => cb.checked = false);
      if (selectAllCb) selectAllCb.checked = false;
      updateBulkBar();
    });

    btnDeleteBulk?.addEventListener('click', () => {
      if (selectedIds.length === 0) return;
      showModal({
        title: 'Konfirmasi Hapus Terpilih',
        content: `<p>Apakah Anda yakin ingin menghapus ${selectedIds.length} fasilitas umum terpilih?</p>`,
        actions: [
          {
            label: 'Batal',
            variant: 'btn-secondary'
          },
          {
            label: 'Ya, Hapus',
            variant: 'btn-danger',
            handler: async () => {
              if (btnDeleteBulk) {
                btnDeleteBulk.disabled = true;
                btnDeleteBulk.innerHTML = '<span class="spinner" style="width:12px;height:12px;border-width:2px;display:inline-block;margin-right:6px;vertical-align:middle"></span> Menghapus...';
              }
              try {
                await deletePublicFacilitiesBatch(selectedIds);
                showToast(`${selectedIds.length} fasilitas umum berhasil dihapus`, 'success');
                loadTabContent('fasum');
              } catch (err) {
                showToast('Gagal menghapus: ' + err.message, 'error');
                if (btnDeleteBulk) {
                  btnDeleteBulk.disabled = false;
                  btnDeleteBulk.innerHTML = `${icons.trash} Hapus Terpilih`;
                }
              }
            }
          }
        ]
      });
    });

    document.getElementById('addFasumBtn')?.addEventListener('click', () => openFasumForm());
    document.getElementById('downloadFasumTemplateBtn')?.addEventListener('click', () => downloadFasumTemplate(masterWilayah));
    document.getElementById('uploadFasumExcelBtn')?.addEventListener('click', () => openFasumExcelUpload(masterWilayah, facilities));
    container.querySelectorAll('[data-edit-fasum]').forEach(btn => btn.addEventListener('click', () => {
      const f = facilities.find(x => x.id === btn.dataset.editFasum);
      if (f) openFasumForm(f);
    }));
    container.querySelectorAll('[data-del-fasum]').forEach(btn => btn.addEventListener('click', () => {
      showModal({
        title: 'Konfirmasi Hapus Fasilitas Umum',
        content: '<p>Yakin ingin menghapus fasilitas umum ini?</p>',
        actions: [
          {
            label: 'Batal',
            variant: 'btn-secondary'
          },
          {
            label: 'Ya, Hapus',
            variant: 'btn-danger',
            handler: async () => {
              try {
                await deletePublicFacility(btn.dataset.delFasum);
                showToast('Fasilitas umum berhasil dihapus', 'success');
                loadTabContent('fasum');
              } catch (err) {
                showToast('Gagal menghapus: ' + err.message, 'error');
              }
            }
          }
        ]
      });
    }));
  }

  async function downloadFasumTemplate(masterWilayah = []) {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // 1. Template Sheet
      const headers = [
        'Nama Fasilitas',
        'Kategori',
        'Kecamatan',
        'Alamat',
        'Latitude',
        'Longitude',
        'Nilai Kapasitas',
        'Satuan Kapasitas',
        'Timbulan per Unit (kg/hari)'
      ];

      const descriptionRow = [
        'Contoh: SDN 1 Krandegan',
        'Pilih salah satu: Pasar, Sekolah, Terminal, Perkantoran, Rumah Sakit, Destinasi Wisata, MBG / Dapur Umum, Hotel / Penginapan, Industri, Lainnya',
        'Contoh: Banjarnegara (Harus sesuai referensi)',
        'Contoh: Jl. Pemuda No. 12',
        'Contoh: -7.398500',
        'Contoh: 109.697000',
        'Contoh: 500 (Jumlah siswa, bed, dll.)',
        'Pilih salah satu: Orang, m2, Bed, Kios, Kamar, Porsi, Unit',
        'Contoh: 0.15 (Isi angka saja)'
      ];

      const templateData = [
        headers,
        descriptionRow
      ];

      const ws = XLSX.utils.aoa_to_sheet(templateData);
      XLSX.utils.book_append_sheet(wb, ws, 'Template');

      // 2. Reference Sheet for Kecamatan
      const refHeaders = ['Kecamatan Resmi'];
      const uniqueKecamatans = [...new Set(masterWilayah.map(w => w.kecamatan))].sort();
      const refRows = uniqueKecamatans.map(k => [k]);
      const wsRef = XLSX.utils.aoa_to_sheet([refHeaders, ...refRows]);
      XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi Kecamatan');

      // 3. Reference Sheet for Categories & Units
      const catHeaders = ['Kategori Resmi', 'Satuan Kapasitas Resmi'];
      const cats = ['Pasar', 'Sekolah', 'Terminal', 'Perkantoran', 'Rumah Sakit', 'Destinasi Wisata', 'MBG / Dapur Umum', 'Hotel / Penginapan', 'Industri', 'Lainnya'];
      const units = ['Orang', 'm2', 'Bed', 'Kios', 'Kamar', 'Porsi', 'Unit'];
      
      const maxRows = Math.max(cats.length, units.length);
      const refCatRows = [];
      for (let i = 0; i < maxRows; i++) {
        refCatRows.push([cats[i] || '', units[i] || '']);
      }
      const wsCats = XLSX.utils.aoa_to_sheet([catHeaders, ...refCatRows]);
      XLSX.utils.book_append_sheet(wb, wsCats, 'Referensi Kategori & Satuan');

      XLSX.writeFile(wb, 'Template_Upload_Fasum.xlsx');
      showToast('Templat Excel Fasum berhasil diunduh', 'success');
    } catch (err) {
      showToast('Gagal mengunduh templat: ' + err.message, 'error');
      console.error('[MasterData] Fasum template creation error:', err);
    }
  }

  function openFasumExcelUpload(masterWilayah = [], facilities = []) {
    const modalEl = document.querySelector('.md-modal');
    if (modalEl) modalEl.style.maxWidth = '950px';

    openModal('Upload Batch Fasilitas Umum', `
      <div class="excel-upload-wizard">
        <!-- Step 1: Download Template -->
        <div class="wizard-section" style="margin-bottom:var(--space-4); padding-bottom:var(--space-4); border-bottom:1px solid var(--border-color)">
          <h4 style="font-weight:600; font-size:var(--font-sm); margin-bottom:var(--space-2); display:flex; align-items:center; gap:8px">
            1. Unduh Templat Excel Resmi
          </h4>
          <p style="font-size:var(--font-xs); color:var(--text-secondary); margin-bottom:var(--space-3)">
            Gunakan templat resmi kami untuk memastikan format data Fasum Anda sesuai.
          </p>
          <button type="button" class="btn btn-secondary btn-sm" id="btnDownloadTemplate" style="display:inline-flex; align-items:center; gap:6px">
            ${icons.download} Unduh Templat Excel
          </button>
        </div>

        <!-- Step 2: Upload File -->
        <div class="wizard-section" style="margin-bottom:var(--space-4)">
          <h4 style="font-weight:600; font-size:var(--font-sm); margin-bottom:var(--space-2)">
            2. Unggah File Excel Anda
          </h4>
          <div id="excelDropzone" style="border:2px dashed var(--border-color); border-radius:var(--radius-lg); padding:var(--space-6); text-align:center; background:var(--gray-50); cursor:pointer; transition:all 0.2s">
            <div style="font-size:32px; margin-bottom:var(--space-2)">📄</div>
            <p style="font-weight:600; font-size:var(--font-sm); color:var(--text-primary)">
              Seret & taruh file Excel di sini, atau klik untuk memilih file
            </p>
            <p style="font-size:var(--font-xs); color:var(--text-muted); margin-top:4px">
              Format yang didukung: .xlsx, .xls
            </p>
            <input type="file" id="excelFileInput" accept=".xlsx, .xls" style="display:none" />
          </div>
        </div>

        <!-- Step 3: Preview & Validasi -->
        <div id="previewSection" style="display:none; margin-bottom:var(--space-4)">
          <h4 style="font-weight:600; font-size:var(--font-sm); margin-bottom:var(--space-2); display:flex; justify-content:space-between; align-items:center">
            <span>3. Preview & Validasi Data</span>
            <span id="previewSummary" class="md-badge blue" style="font-size:10px; padding:2px 8px">0 Baris Terdeteksi</span>
          </h4>
          <div class="md-table-container" style="max-height:220px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-md)">
            <table class="md-table" style="font-size:var(--font-xs)">
              <thead style="position:sticky; top:0; z-index:10; background:var(--gray-50)">
                <tr>
                  <th>Status</th>
                  <th>Nama Fasilitas</th>
                  <th>Kategori</th>
                  <th>Kecamatan</th>
                  <th>Alamat</th>
                  <th>Koordinat</th>
                  <th>Kapasitas</th>
                  <th>Satuan</th>
                  <th>Timbulan/Unit</th>
                </tr>
              </thead>
              <tbody id="previewTableBody">
              </tbody>
            </table>
          </div>
          <div id="validationAlert" style="margin-top:var(--space-3)"></div>
        </div>

        <div class="form-actions" style="margin-top:var(--space-4); padding-top:var(--space-4); border-top:1px solid var(--border-color); display:flex; justify-content:flex-end; gap:var(--space-3)">
          <button type="button" class="btn btn-ghost" id="btnCancelUpload">Batal</button>
          <button type="button" class="btn btn-primary" id="btnImportExcel" disabled>Impor Data</button>
        </div>
      </div>
    `);

    const dropzone = document.getElementById('excelDropzone');
    const fileInput = document.getElementById('excelFileInput');
    const btnDownload = document.getElementById('btnDownloadTemplate');
    const btnCancel = document.getElementById('btnCancelUpload');
    const btnImport = document.getElementById('btnImportExcel');

    let validRowsToUpload = [];

    btnDownload?.addEventListener('click', () => downloadFasumTemplate(masterWilayah));
    dropzone?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (dropzone) {
        dropzone.style.borderColor = 'var(--primary-color)';
        dropzone.style.background = 'rgba(16, 185, 129, 0.05)';
      }
    });
    const resetDropzoneStyle = () => {
      if (dropzone) {
        dropzone.style.borderColor = 'var(--border-color)';
        dropzone.style.background = 'var(--gray-50)';
      }
    };
    dropzone?.addEventListener('dragleave', resetDropzoneStyle);
    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      resetDropzoneStyle();
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    });
    fileInput?.addEventListener('change', (e) => {
      const files = fileInput.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    });

    btnCancel?.addEventListener('click', () => closeModal());

    btnImport?.addEventListener('click', async () => {
      if (validRowsToUpload.length === 0) return;
      btnImport.disabled = true;
      btnImport.innerHTML = '<span class="spinner" style="width:12px;height:12px;border-width:2px;display:inline-block;margin-right:6px;vertical-align:middle"></span> Mengimpor...';
      try {
        await addPublicFacilitiesBatch(validRowsToUpload);
        showToast(`Berhasil mengimpor ${validRowsToUpload.length} fasilitas umum`, 'success');
        closeModal();
        loadTabContent('fasum');
      } catch (err) {
        showToast('Gagal mengimpor data: ' + err.message, 'error');
        btnImport.disabled = false;
        btnImport.innerHTML = 'Impor Data';
      }
    });

    async function handleFileSelect(file) {
      try {
        const XLSX = await import('xlsx');
        const reader = new FileReader();
        reader.onload = function (e) {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (rawData.length < 2) {
            showToast('File Excel kosong atau tidak sesuai templat.', 'warning');
            return;
          }

          processExcelData(rawData);
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        showToast('Gagal membaca file Excel: ' + err.message, 'error');
      }
    }

    function processExcelData(rows) {
      const headers = rows[0].map(h => String(h).trim());
      const expectedHeaders = [
        'Nama Fasilitas',
        'Kategori',
        'Kecamatan',
        'Alamat',
        'Latitude',
        'Longitude',
        'Nilai Kapasitas',
        'Satuan Kapasitas',
        'Timbulan per Unit (kg/hari)'
      ];

      const hasRequiredHeaders = expectedHeaders.every(h => headers.includes(h));
      if (!hasRequiredHeaders) {
        showToast('Format kolom Excel tidak sesuai dengan templat resmi.', 'error');
        return;
      }

      const idxMap = {};
      expectedHeaders.forEach(h => {
        idxMap[h] = headers.indexOf(h);
      });

      const records = rows.slice(2);
      const validCategories = ['Pasar', 'Sekolah', 'Terminal', 'Perkantoran', 'Rumah Sakit', 'Destinasi Wisata', 'MBG / Dapur Umum', 'Hotel / Penginapan', 'Industri', 'Lainnya'];
      const validUnits = ['Orang', 'm2', 'Bed', 'Kios', 'Kamar', 'Porsi', 'Unit'];
      const validKecamatans = [...new Set(masterWilayah.map(w => w.kecamatan.toLowerCase()))];

      const tbody = document.getElementById('previewTableBody');
      const previewSection = document.getElementById('previewSection');
      const summaryBadge = document.getElementById('previewSummary');
      const valAlert = document.getElementById('validationAlert');

      if (!tbody || !previewSection) return;

      tbody.innerHTML = '';
      validRowsToUpload = [];
      let errorCount = 0;
      let warningCount = 0;

      records.forEach((row, i) => {
        if (row.length === 0 || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
          return;
        }

        const name = String(row[idxMap['Nama Fasilitas']] || '').trim();
        const category = String(row[idxMap['Kategori']] || '').trim();
        const kec = String(row[idxMap['Kecamatan']] || '').trim();
        const address = String(row[idxMap['Alamat']] || '').trim();
        const latRaw = row[idxMap['Latitude']];
        const lngRaw = row[idxMap['Longitude']];
        const capValRaw = row[idxMap['Nilai Kapasitas']];
        const capUnit = String(row[idxMap['Satuan Kapasitas']] || 'Unit').trim();
        const timbulanRaw = row[idxMap['Timbulan per Unit (kg/hari)']];

        let status = 'valid';
        const errors = [];
        const warnings = [];

        if (!name) {
          status = 'invalid';
          errors.push('Nama Fasilitas wajib diisi');
        }

        if (!category) {
          status = 'invalid';
          errors.push('Kategori wajib diisi');
        } else if (!validCategories.includes(category)) {
          status = 'invalid';
          errors.push(`Kategori harus salah satu dari: ${validCategories.join(', ')}`);
        }

        if (!kec) {
          status = 'invalid';
          errors.push('Kecamatan wajib diisi');
        } else if (!validKecamatans.includes(kec.toLowerCase())) {
          status = 'invalid';
          errors.push(`Kecamatan "${kec}" tidak ditemukan di referensi wilayah Banjarnegara`);
        }

        const lat = parseFloat(latRaw);
        const lng = parseFloat(lngRaw);
        if (latRaw !== undefined && latRaw !== '' && (isNaN(lat) || lat < -90 || lat > 90)) {
          status = 'invalid';
          errors.push('Latitude harus berupa angka koordinat valid (-90 s/d 90)');
        }
        if (lngRaw !== undefined && lngRaw !== '' && (isNaN(lng) || lng < -180 || lng > 180)) {
          status = 'invalid';
          errors.push('Longitude harus berupa angka koordinat valid (-180 s/d 180)');
        }

        const capVal = parseInt(capValRaw);
        if (capValRaw !== undefined && capValRaw !== '' && (isNaN(capVal) || capVal < 0)) {
          status = 'invalid';
          errors.push('Nilai kapasitas harus berupa angka non-negatif');
        }

        if (capUnit && !validUnits.includes(capUnit)) {
          warnings.push(`Satuan kapasitas disesuaikan ke "Unit" karena "${capUnit}" tidak dikenal`);
        }

        const timbulan = parseFloat(timbulanRaw);
        if (timbulanRaw !== undefined && timbulanRaw !== '' && (isNaN(timbulan) || timbulan < 0)) {
          status = 'invalid';
          errors.push('Timbulan per unit harus berupa angka non-negatif');
        }

        const isDuplicate = facilities.some(f => f.name.toLowerCase() === name.toLowerCase());
        if (isDuplicate) {
          warnings.push(`Fasilitas "${name}" sudah terdaftar sebelumnya (kemungkinan duplikat)`);
          if (status !== 'invalid') status = 'warning';
        }

        let statusBadge = '';
        if (status === 'invalid') {
          errorCount++;
          statusBadge = `<span class="md-badge red" title="${errors.join('; ')}">Error</span>`;
        } else if (status === 'warning') {
          warningCount++;
          statusBadge = `<span class="md-badge amber" title="${warnings.join('; ')}">Warning</span>`;
          validRowsToUpload.push({
            name,
            category,
            kecamatan: kec,
            address: address || null,
            latitude: isNaN(lat) ? null : lat,
            longitude: isNaN(lng) ? null : lng,
            capacity_value: isNaN(capVal) ? 0 : capVal,
            capacity_unit: validUnits.includes(capUnit) ? capUnit : 'Unit',
            timbulan_per_unit: isNaN(timbulan) ? 0.15 : timbulan
          });
        } else {
          statusBadge = `<span class="md-badge green">Valid</span>`;
          validRowsToUpload.push({
            name,
            category,
            kecamatan: kec,
            address: address || null,
            latitude: isNaN(lat) ? null : lat,
            longitude: isNaN(lng) ? null : lng,
            capacity_value: isNaN(capVal) ? 0 : capVal,
            capacity_unit: validUnits.includes(capUnit) ? capUnit : 'Unit',
            timbulan_per_unit: isNaN(timbulan) ? 0.15 : timbulan
          });
        }

        tbody.insertAdjacentHTML('beforeend', `
          <tr>
            <td style="vertical-align:middle; text-align:center">${statusBadge}</td>
            <td><strong>${name}</strong></td>
            <td>${category}</td>
            <td>${kec}</td>
            <td>${address || '-'}</td>
            <td>${isNaN(lat) || isNaN(lng) ? '-' : `${lat.toFixed(4)}, ${lng.toFixed(4)}`}</td>
            <td>${isNaN(capVal) ? '-' : capVal}</td>
            <td>${capUnit}</td>
            <td>${isNaN(timbulan) ? '-' : `${timbulan} kg`}</td>
          </tr>
        `);
      });

      previewSection.style.display = 'block';
      if (summaryBadge) {
        summaryBadge.textContent = `${validRowsToUpload.length + errorCount} Baris Terdeteksi`;
      }

      if (errorCount > 0) {
        if (valAlert) {
          valAlert.className = 'md-badge red';
          valAlert.style.display = 'block';
          valAlert.style.width = '100%';
          valAlert.style.padding = '8px 12px';
          valAlert.innerHTML = `⚠️ Terdeteksi <strong>${errorCount} baris bermasalah</strong>. Perbaiki file Excel Anda sebelum melakukan impor.`;
        }
        if (btnImport) btnImport.disabled = true;
      } else {
        if (valAlert) {
          valAlert.className = 'md-badge green';
          valAlert.style.display = 'block';
          valAlert.style.width = '100%';
          valAlert.style.padding = '8px 12px';
          valAlert.innerHTML = `✅ Seluruh data valid! Silakan klik <strong>Impor Data</strong> untuk menyimpan <strong>${validRowsToUpload.length} fasilitas umum</strong>.`;
        }
        if (btnImport) btnImport.disabled = validRowsToUpload.length === 0;
      }
    }
  }

  function openFasumForm(existing = null) {
    const isEdit = !!existing;
    openModal(isEdit ? 'Edit Fasilitas Umum' : 'Tambah Fasilitas Umum', `
      <form id="fasumForm">
        <div class="form-group">
          <label class="form-label">Nama Fasilitas</label>
          <input class="form-input" id="fasumName" required value="${existing?.name || ''}" placeholder="Misal: Pasar Kota" />
        </div>
        <div style="display:flex;gap:var(--space-3)">
          <div class="form-group" style="flex:1">
            <label class="form-label">Kategori</label>
            <select class="form-select" id="fasumCategory" required>
              ${['Pasar', 'Sekolah', 'Terminal', 'Perkantoran', 'Rumah Sakit', 'Destinasi Wisata', 'MBG / Dapur Umum', 'Hotel / Penginapan', 'Industri', 'Lainnya'].map(c => `<option value="${c}" ${existing?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Wilayah (Kecamatan)</label>
            <input class="form-input" id="fasumWilayah" required value="${existing?.kecamatan || ''}" placeholder="Misal: Banjarnegara" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Alamat</label>
          <input class="form-input" id="fasumAddress" value="${existing?.address || ''}" placeholder="Alamat lengkap" />
        </div>
        <div style="display:flex;gap:var(--space-3)">
          <div class="form-group" style="flex:1">
            <label class="form-label">Latitude (Peta)</label>
            <input class="form-input" id="fasumLat" type="number" step="any" value="${existing?.latitude || ''}" placeholder="-7.xxx" />
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Longitude (Peta)</label>
            <input class="form-input" id="fasumLng" type="number" step="any" value="${existing?.longitude || ''}" placeholder="109.xxx" />
          </div>
        </div>
        <div style="display:flex;gap:var(--space-3)">
          <div class="form-group" style="flex:1">
            <label class="form-label">Nilai Kapasitas</label>
            <input class="form-input" id="fasumCapVal" type="number" value="${existing?.capacity_value || '0'}" placeholder="Misal: 1000" />
            <small style="color:var(--text-muted);font-size:11px">Jml siswa / luas m2 / bed</small>
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Satuan Kapasitas</label>
            <select class="form-select" id="fasumCapUnit">
              ${['Orang', 'm2', 'Bed', 'Kios', 'Kamar', 'Porsi', 'Unit'].map(c => `<option value="${c}" ${existing?.capacity_unit === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Timbulan / Unit (kg)</label>
            <input class="form-input" id="fasumTimbulan" type="number" step="0.01" value="${existing?.timbulan_per_unit || '0.15'}" />
            <small style="color:var(--text-muted);font-size:11px">SNI: Sekolah 0.15, Pasar 0.25, RS 2.5, Hotel 1.0</small>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" onclick="document.getElementById('mdModal').style.display='none'">Batal</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Simpan Perubahan' : 'Tambah Fasum'}</button>
        </div>
      </form>
    `);
    document.getElementById('fasumForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('fasumName').value.trim(),
        category: document.getElementById('fasumCategory').value,
        kecamatan: document.getElementById('fasumWilayah').value.trim(),
        address: document.getElementById('fasumAddress').value.trim(),
        latitude: parseFloat(document.getElementById('fasumLat').value) || null,
        longitude: parseFloat(document.getElementById('fasumLng').value) || null,
        capacity_value: parseInt(document.getElementById('fasumCapVal').value) || 0,
        capacity_unit: document.getElementById('fasumCapUnit').value,
        timbulan_per_unit: parseFloat(document.getElementById('fasumTimbulan').value) || 0
      };
      try {
        if (isEdit) await updatePublicFacility(existing.id, data);
        else await addPublicFacility(data);
        showToast(isEdit ? 'Fasum berhasil diperbarui' : 'Fasum berhasil ditambahkan', 'success');
        closeModal();
        loadTabContent('fasum');
      } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
    });
  }

  // ---------- RBAC TAB ----------
  async function renderRbacTab(container) {
    const [roles, modules, permissions] = await Promise.all([
      getSystemRoles(),
      getSystemModules(),
      getRolePermissions()
    ]);

    container.innerHTML = `
      <div class="md-toolbar">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <h3 style="display:flex;align-items:center;gap:8px">${icons.shield} Pengaturan Hak Akses (RBAC)</h3>
          <span class="md-count">${roles.length} role</span>
        </div>
      </div>
      <div class="grid-2" style="gap:var(--space-4)">
        ${roles.map(role => {
          const rolePerms = permissions.filter(p => p.role_code === role.code).map(p => p.module_id);
          return `
          <div class="card" style="padding:var(--space-4);border:1px solid var(--gray-200)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-3)">
              <div>
                <h4 style="font-size:16px;font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:8px">
                  ${role.name} ${role.is_system ? '<span class="badge badge-primary" style="font-size:10px;padding:2px 6px">Bawaan Sistem</span>' : ''}
                </h4>
                <div style="font-size:12px;color:var(--text-muted)">Kode: ${role.code}</div>
              </div>
              <button class="btn btn-secondary btn-sm" data-edit-role="${role.code}">${icons.edit} Atur Izin</button>
            </div>
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:var(--space-3)">${role.description || '-'}</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px">
              ${rolePerms.length === 0 ? '<span style="font-size:12px;color:var(--text-muted)">Tidak ada akses menu dashboard</span>' : ''}
              ${rolePerms.map(pid => {
                const mod = modules.find(m => m.id === pid);
                return `<span class="badge badge-neutral" style="font-size:11px">${mod ? mod.name : pid}</span>`;
              }).join('')}
            </div>
            ${role.code === 'petugas' ? `
            <div style="margin-top:var(--space-4);padding-top:var(--space-4);border-top:1px solid var(--gray-200)">
              <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-3);display:flex;align-items:center;gap:6px">
                👥 Tipe Petugas & Izin Input Lapangan
              </div>
              <div style="display:grid;gap:var(--space-3)">
                ${JOB_TYPES.map(jt => {
                  const inputs = getAllowedInputTypes({ role: 'petugas', job_type: jt.id });
                  const isKoordinator = jt.id === 'koordinator';
                  const jobIcons = { koordinator: '📋', angkut: '🚛', operator_tps: '🏭', kader: '🌿' };
                  return `
                  <div style="padding:var(--space-3);background:var(--gray-50);border-radius:var(--radius-md);border:1px solid var(--gray-100)">
                    <div style="font-weight:600;font-size:13px;color:var(--gray-900);margin-bottom:2px;display:flex;align-items:center;gap:6px">
                      ${jobIcons[jt.id] || '👤'} ${jt.label}
                    </div>
                    <div style="font-size:12px;color:var(--text-muted);margin-bottom:var(--space-2)">${jt.desc}</div>
                    <div style="display:flex;flex-wrap:wrap;gap:4px">
                      ${isKoordinator ? '<span class="badge badge-primary" style="font-size:10px">Validasi Data</span>' : ''}
                      ${inputs.map(inp => '<span class="badge badge-neutral" style="font-size:10px">' + inp.charAt(0).toUpperCase() + inp.slice(1) + '</span>').join('')}
                      ${!isKoordinator && inputs.length === 0 ? '<span style="font-size:11px;color:var(--text-muted)">Tidak ada izin input</span>' : ''}
                    </div>
                  </div>
                  `;
                }).join('')}
              </div>
            </div>
            ` : ''}
          </div>
          `;
        }).join('')}
      </div>
    `;

    container.querySelectorAll('[data-edit-role]').forEach(btn => btn.addEventListener('click', () => {
      const role = roles.find(r => r.code === btn.dataset.editRole);
      if (role) openRbacForm(role, modules, permissions);
    }));
  }

  function openRbacForm(role, modules, permissions) {
    const rolePerms = permissions.filter(p => p.role_code === role.code).map(p => p.module_id);
    
    openModal(`Atur Hak Akses: ${role.name}`, `
      <form id="rbacForm">
        <p style="margin-bottom:var(--space-4);color:var(--text-secondary);font-size:13px">Pilih menu dashboard apa saja yang boleh diakses oleh <strong>${role.name}</strong>.</p>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-5)">
          ${modules.map(mod => `
            <label style="display:flex;align-items:flex-start;gap:8px;padding:var(--space-3);border:1px solid var(--gray-200);border-radius:var(--radius-md);cursor:pointer;background:${rolePerms.includes(mod.id) ? 'var(--blue-50)' : 'white'}">
              <input type="checkbox" name="modules" value="${mod.id}" ${rolePerms.includes(mod.id) ? 'checked' : ''} style="margin-top:4px" />
              <div>
                <div style="font-weight:600;font-size:14px;color:var(--gray-900)">${mod.name}</div>
                <div style="font-size:12px;color:var(--gray-500)">${mod.description || ''}</div>
              </div>
            </label>
          `).join('')}
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" onclick="document.getElementById('mdModal').style.display='none'">Batal</button>
          <button type="submit" class="btn btn-primary">Simpan Hak Akses</button>
        </div>
      </form>
    `);

    document.getElementById('rbacForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const checkboxes = document.querySelectorAll('input[name="modules"]:checked');
      const selectedModules = Array.from(checkboxes).map(cb => cb.value);
      
      try {
        await saveRolePermissions(role.code, selectedModules);
        showToast('Hak akses berhasil diperbarui', 'success');
        closeModal();
        loadTabContent('rbac');
      } catch (err) {
        showToast('Gagal: ' + err.message, 'error');
      }
    });
  }

  // ---------- INVITATIONS TAB ----------
  async function renderInvitationsTab(container) {
    const [invitations, locations, masterWilayah] = await Promise.all([
      getAllInvitationCodes(),
      getAllLocations(),
      getAllMasterWilayah()
    ]);

    container.innerHTML = `
      <div class="md-toolbar">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <h3 style="display:flex;align-items:center;gap:8px">🎟️ Daftar Kode Undangan</h3>
          <span class="md-count">${invitations.length} kode</span>
        </div>
        <button class="btn btn-primary" id="addInvitationBtn" style="display:inline-flex;align-items:center;gap:8px">
          ${icons.plus} Buat Kode Baru
        </button>
      </div>
      <div class="md-table-container">
        <table class="md-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Role / Job Type</th>
              <th>Desa Default</th>
              <th>Lokasi Default</th>
              <th>Penggunaan</th>
              <th>Kedaluwarsa</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${invitations.length === 0 ? `
              <tr>
                <td colspan="8" class="md-empty">Belum ada kode undangan yang dibuat.</td>
              </tr>
            ` : invitations.map(inv => {
              const expiresStr = inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tidak Terbatas';
              const maxUsesStr = inv.max_uses === 0 ? '∞' : inv.max_uses;
              const isExpired = inv.expires_at && new Date(inv.expires_at) < new Date();
              const isExhausted = inv.max_uses > 0 && inv.current_uses >= inv.max_uses;
              
              let statusBadge = '<span class="md-badge green">Aktif</span>';
              if (!inv.is_active) statusBadge = '<span class="md-badge red">Nonaktif</span>';
              else if (isExpired) statusBadge = '<span class="md-badge red">Expired</span>';
              else if (isExhausted) statusBadge = '<span class="md-badge amber">Habis</span>';

              const loc = locations.find(l => l.id === inv.location_id);
              const locName = loc ? loc.name : '-';

              const desa = masterWilayah.find(w => w.id === inv.desa_id);
              const desaName = desa ? `Desa ${desa.desa_kelurahan}, Kec. ${desa.kecamatan}` : '-';
              
              const roleDisplay = inv.role === 'petugas' ? `Petugas (${inv.job_type || 'Umum'})` : (inv.role === 'eksekutif' ? 'Eksekutif' : inv.role);

              return `
                <tr>
                  <td style="font-weight:700;color:var(--text-primary);letter-spacing:0.5px">${inv.code}</td>
                  <td>${roleDisplay}</td>
                  <td>${desaName}</td>
                  <td>${locName}</td>
                  <td><strong>${inv.current_uses}</strong> / ${maxUsesStr}</td>
                  <td>${expiresStr}</td>
                  <td>${statusBadge}</td>
                  <td>
                    <div class="md-actions">
                      <button class="md-btn-icon copy-inv-btn" data-code="${inv.code}" title="Salin Kode">${icons.clipboard}</button>
                      <button class="md-btn-icon edit-inv-btn" data-id="${inv.id}" title="Edit">${icons.edit}</button>
                      <button class="md-btn-icon danger delete-inv-btn" data-id="${inv.id}" title="Hapus">${icons.trash}</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Bind event handlers
    document.getElementById('addInvitationBtn')?.addEventListener('click', () => showInvitationModal(null, locations, masterWilayah));

    container.querySelectorAll('.copy-inv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.code);
        showToast(`Kode "${btn.dataset.code}" disalin ke clipboard`, 'success');
      });
    });

    container.querySelectorAll('.edit-inv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const inv = invitations.find(item => item.id === btn.dataset.id);
        showInvitationModal(inv, locations, masterWilayah);
      });
    });

    container.querySelectorAll('.delete-inv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showModal({
          title: 'Konfirmasi Hapus Kode Undangan',
          content: '<p>Yakin ingin menghapus kode undangan ini?</p>',
          actions: [
            {
              label: 'Batal',
              variant: 'btn-secondary'
            },
            {
              label: 'Ya, Hapus',
              variant: 'btn-danger',
              handler: async () => {
                try {
                  await deleteInvitationCode(btn.dataset.id);
                  showToast('Kode undangan berhasil dihapus', 'success');
                  loadTabContent('invitations');
                } catch (err) {
                  showToast('Gagal menghapus: ' + err.message, 'error');
                }
              }
            }
          ]
        });
      });
    });
  }

  // ---------- INVITATIONS MODAL ----------
  function showInvitationModal(inv, locations, masterWilayah) {
    const isEdit = !!inv;
    const kecamatanList = [...new Set(masterWilayah.map(w => w.kecamatan))].sort();

    let initialKec = '';
    let initialDesaName = '';
    if (inv?.desa_id) {
      const match = masterWilayah.find(w => w.id === inv.desa_id);
      if (match) {
        initialKec = match.kecamatan;
        initialDesaName = match.desa_kelurahan;
      }
    }

    const bodyHTML = `
      <form id="invitationForm" class="md-form">
        <div class="form-group">
          <label class="form-label">Kode Undangan</label>
          <div style="display:flex;gap:var(--space-2)">
            <input type="text" id="fInvCode" class="form-input" style="text-transform:uppercase;font-family:monospace;letter-spacing:1px;font-weight:700" value="${inv?.code || ''}" placeholder="Contoh: PETUGAS-KADER" required ${isEdit ? 'disabled' : ''} />
            ${isEdit ? '' : `<button type="button" class="btn btn-secondary" id="btnGenCode" style="white-space:nowrap">Acak Kode</button>`}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Role (Peran)</label>
          <select id="fInvRole" class="form-input" required>
            <option value="" disabled selected>Pilih Role</option>
            <option value="petugas" ${inv?.role === 'petugas' ? 'selected' : ''}>Petugas Lapangan</option>
            <option value="eksekutif" ${inv?.role === 'eksekutif' ? 'selected' : ''}>Eksekutif</option>
            <option value="warga" ${inv?.role === 'warga' ? 'selected' : ''}>Warga</option>
          </select>
        </div>

        <div class="form-group" id="groupJobType" style="display:${inv?.role === 'petugas' ? 'block' : 'none'}">
          <label class="form-label">Job Type (Tipe Pekerjaan)</label>
          <select id="fInvJobType" class="form-input">
            <option value="" selected>Pilih Tipe Pekerjaan (Opsional)</option>
            <option value="kader" ${inv?.job_type === 'kader' ? 'selected' : ''}>Kader Lingkungan</option>
            <option value="angkut" ${inv?.job_type === 'angkut' ? 'selected' : ''}>Driver Armada</option>
            <option value="operator_tps" ${inv?.job_type === 'operator_tps' ? 'selected' : ''}>Operator TPS3R</option>
            <option value="koordinator" ${inv?.job_type === 'koordinator' ? 'selected' : ''}>Koordinator Lapangan</option>
            <option value="operator_institusi" ${inv?.job_type === 'operator_institusi' ? 'selected' : ''}>Operator Institusi (MBG/Sekolah/Kantor/Faskes/dll)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Kecamatan Default (Opsional)</label>
          <div class="custom-select-container" id="fInvKecSelectContainer">
            <div class="custom-select-wrapper">
              <input type="text" id="fInvKecamatan" class="form-input" placeholder="Ketik/Pilih Kecamatan..." autocomplete="off" value="${initialKec}" style="border: 1px solid var(--border-color);" />
              <span class="custom-select-arrow">▼</span>
            </div>
            <div class="custom-select-dropdown" id="fInvKecDropdown" style="display:none;"></div>
            <div id="fInvKecFeedback" style="color:#ef4444; font-size:var(--font-xs); margin-top:4px; display:none; font-weight:600;">⚠️ Kecamatan tidak ditemukan</div>
          </div>
        </div>

        <div class="form-group" id="groupInvDesa" style="display:none">
          <label class="form-label">Desa / Kelurahan Default (Opsional)</label>
          <div class="custom-select-container" id="fInvDesaSelectContainer">
            <div class="custom-select-wrapper">
              <input type="text" id="fInvDesaInput" class="form-input" placeholder="Ketik/Pilih Desa..." autocomplete="off" value="${initialDesaName}" style="border: 1px solid var(--border-color);" />
              <span class="custom-select-arrow">▼</span>
            </div>
            <div class="custom-select-dropdown" id="fInvDesaDropdown" style="display:none;"></div>
            <input type="hidden" id="fInvDesa" value="${inv?.desa_id || ''}" />
            <div id="fInvDesaFeedback" style="color:#ef4444; font-size:var(--font-xs); margin-top:4px; display:none; font-weight:600;">⚠️ Desa tidak ditemukan di kecamatan terpilih</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Lokasi Default (Opsional)</label>
          <select id="fInvLocation" class="form-input">
            <option value="" selected>Pilih Lokasi</option>
            ${locations.map(loc => `<option value="${loc.id}" ${inv?.location_id === loc.id ? 'selected' : ''}>${loc.name} (${loc.type})</option>`).join('')}
          </select>
        </div>

        <div class="grid-2" style="gap:var(--space-3)">
          <div class="form-group">
            <label class="form-label">Kuota Pemakaian</label>
            <input type="number" id="fInvMaxUses" class="form-input" min="0" value="${inv?.max_uses !== undefined ? inv.max_uses : 0}" placeholder="0 = Tak Terbatas" />
            <small style="color:var(--text-muted);font-size:11px">Isi 0 untuk penggunaan tanpa batas</small>
          </div>
          <div class="form-group">
            <label class="form-label">Tanggal Kedaluwarsa</label>
            <input type="date" id="fInvExpiresAt" class="form-input" value="${inv?.expires_at ? new Date(inv.expires_at).toISOString().split('T')[0] : ''}" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Deskripsi / Catatan</label>
          <textarea id="fInvDesc" class="form-input" rows="2" placeholder="Tulis catatan (misal: kode untuk kader RW 02)...">${inv?.description || ''}</textarea>
        </div>

        <div class="form-group" style="display:flex;align-items:center;gap:8px">
          <input type="checkbox" id="fInvActive" ${inv?.is_active !== false ? 'checked' : ''} style="width:16px;height:16px" />
          <label for="fInvActive" style="font-weight:600;font-size:var(--font-sm);cursor:pointer">Kode Aktif</label>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-ghost" id="btnCancelInv">Batal</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Simpan Perubahan' : 'Buat Kode'}</button>
        </div>
      </form>
    `;

    openModal(isEdit ? 'Edit Kode Undangan' : 'Buat Kode Undangan Baru', bodyHTML);

    // Event listener cancel
    document.getElementById('btnCancelInv')?.addEventListener('click', closeModal);

    // Toggle Job Type dropdown based on role
    const roleSelect = document.getElementById('fInvRole');
    const jobTypeSelect = document.getElementById('fInvJobType');
    const groupJobType = document.getElementById('groupJobType');
    const groupInvDesa = document.getElementById('groupInvDesa');
    const invKecSelect = document.getElementById('fInvKecamatan');
    const invDesaInput = document.getElementById('fInvDesaInput');
    const invDesaSelect = document.getElementById('fInvDesa');
    const fInvKecFeedback = document.getElementById('fInvKecFeedback');
    const fInvDesaFeedback = document.getElementById('fInvDesaFeedback');

    const toggleDesaGroup = () => {
      const isKoordinator = roleSelect.value === 'petugas' && jobTypeSelect.value === 'koordinator';
      const hasKec = invKecSelect.value.trim() !== '';
      if (hasKec && !isKoordinator) {
        groupInvDesa.style.display = 'block';
      } else {
        groupInvDesa.style.display = 'none';
        invDesaInput.value = '';
        invDesaSelect.value = '';
      }
    };

    roleSelect.addEventListener('change', () => {
      if (roleSelect.value === 'petugas') {
        groupJobType.style.display = 'block';
      } else {
        groupJobType.style.display = 'none';
        jobTypeSelect.value = '';
      }
      toggleDesaGroup();
    });

    jobTypeSelect.addEventListener('change', toggleDesaGroup);

    let selectKecInstance, selectDesaInstance;

    selectKecInstance = wireSearchableSelect({
      inputEl: invKecSelect,
      dropdownEl: document.getElementById('fInvKecDropdown'),
      hiddenEl: { value: '' },
      feedbackEl: fInvKecFeedback,
      getOptions: () => {
        return kecamatanList.map(k => ({ value: k, label: k }));
      },
      onSelect: (opt) => {
        toggleDesaGroup();
      },
      onClear: () => {
        toggleDesaGroup();
      }
    });

    selectDesaInstance = wireSearchableSelect({
      inputEl: invDesaInput,
      dropdownEl: document.getElementById('fInvDesaDropdown'),
      hiddenEl: invDesaSelect,
      feedbackEl: fInvDesaFeedback,
      getOptions: () => {
        const selectedKec = invKecSelect.value.trim();
        const filtered = masterWilayah.filter(w => w.kecamatan.toLowerCase() === selectedKec.toLowerCase());
        return filtered.map(w => ({ value: w.id, label: w.desa_kelurahan }));
      },
      onSelect: (opt) => {
        // Selected
      },
      onClear: () => {
        // Cleared
      }
    });

    if (initialKec) {
      toggleDesaGroup();
    }

    // Generate random code helper
    const btnGenCode = document.getElementById('btnGenCode');
    if (btnGenCode) {
      btnGenCode.addEventListener('click', () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        document.getElementById('fInvCode').value = code;
      });
    }
    // Submit handler
    document.getElementById('invitationForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const isKecValid = selectKecInstance.validate();
      const isDesaValid = selectDesaInstance.validate();
      const typedKec = invKecSelect.value.trim();
      const desaId = invDesaSelect.value || null;
      const isKoordinator = roleSelect.value === 'petugas' && jobTypeSelect.value === 'koordinator';

      if (typedKec && !isKecValid) {
        showToast('Kecamatan tidak ditemukan. Harap pilih dari daftar yang valid.', 'warning');
        invKecSelect.focus();
        return;
      }

      if (!isKoordinator && typedKec && (!isDesaValid || !desaId)) {
        showToast('Pilih default Desa / Kelurahan yang valid dari Kecamatan terpilih', 'warning');
        if (invDesaInput) invDesaInput.focus();
        return;
      }
      const payload = {
        code: document.getElementById('fInvCode').value.trim().toUpperCase(),
        role: roleSelect.value,
        job_type: roleSelect.value === 'petugas' ? jobTypeSelect.value || null : null,
        location_id: document.getElementById('fInvLocation').value || null,
        desa_id: isKoordinator ? null : (invDesaSelect.value || null),
        kecamatan: typedKec || null,
        max_uses: parseInt(document.getElementById('fInvMaxUses').value) || 0,
        expires_at: document.getElementById('fInvExpiresAt').value ? new Date(document.getElementById('fInvExpiresAt').value).toISOString() : null,
        description: document.getElementById('fInvDesc').value.trim() || null,
        is_active: document.getElementById('fInvActive').checked
      };

      try {
        if (isEdit) {
          await updateInvitationCode(inv.id, payload);
          showToast('Kode undangan berhasil diperbarui', 'success');
        } else {
          // Set created_by using current user ID
          const currentUser = getCurrentUser();
          payload.created_by = currentUser?.id || null;
          await addInvitationCode(payload);
          showToast('Kode undangan berhasil dibuat', 'success');
        }
        closeModal();
        loadTabContent('invitations');
      } catch (err) {
        showToast('Gagal menyimpan: ' + err.message, 'error');
      }
    });
  }

  // Load initial tab
  loadTabContent(activeTab);
}
