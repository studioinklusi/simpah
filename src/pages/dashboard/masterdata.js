// SIMPAH - Master Data Management (CRUD Panel for Dinas)
import { icons } from '../../components/icons.js';
import { getCurrentUser } from '../../utils/helpers.js';
import { LOCATION_TYPES, USER_ROLES } from '../../utils/sipsn.js';
import { JOB_TYPES, hasPermission, getAllowedInputTypes } from '../../utils/permissions.js';
import { showToast } from '../../components/toast.js';
import { renderDashboardLayout } from './layout.js';
import {
  getAllLocations, addLocation, updateLocation, deleteLocation,
  getAllFleet, addFleet, updateFleet, deleteFleet,
  getAllUsers, addUser, updateUser, deleteUser,
  getAllVillagePopulation, addVillagePopulation, updateVillagePopulation, deleteVillagePopulation,
  getAllPublicFacilities, addPublicFacility, updatePublicFacility, deletePublicFacility,
  getSystemModules, getSystemRoles, getRolePermissions, saveRolePermissions,
  getAllInvitationCodes, addInvitationCode, updateInvitationCode, deleteInvitationCode,
  getAllMasterWilayah, updateMasterWilayah} from '../../db/store.js';
import { wireSearchableSelect } from '../../utils/searchable-select.js';
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
      .md-modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:1000; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s ease; }
      .md-modal { background:var(--bg-primary); border-radius:var(--radius-xl); width:90%; max-width:520px; max-height:85vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.2); animation:scaleIn 0.2s ease; }
      .md-modal-header { display:flex; justify-content:space-between; align-items:center; padding:var(--space-5) var(--space-6); border-bottom:1px solid var(--border-color); }
      .md-modal-header h3 { font-size:var(--font-lg); font-weight:700; }
      .md-modal-close { width:32px; height:32px; border-radius:var(--radius-full); border:none; background:var(--gray-100); cursor:pointer; display:flex; align-items:center; justify-content:center; }
      .md-modal-body { padding:var(--space-5) var(--space-6); }
      .md-modal-body .form-group { margin-bottom:var(--space-4); }
      .md-modal-body .form-label { display:block; font-size:var(--font-sm); font-weight:600; margin-bottom:var(--space-2); }
      .md-modal-body .form-actions { display:flex; gap:var(--space-3); justify-content:flex-end; margin-top:var(--space-5); padding-top:var(--space-4); border-top:1px solid var(--border-color); }
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
        errorMessage = 'Tabel <code>invitation_codes</code> belum dibuat di database Supabase Anda. Harap jalankan script SQL migrasi di editor Supabase Anda terlebih dahulu.';
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

  // ---------- LOCATIONS TAB ----------
  async function renderLocationsTab(container) {
    const [locations, masterWilayah] = await Promise.all([
      getAllLocations(),
      getAllMasterWilayah()
    ]);
    const badgeColors = { tps: 'amber', tps3r: 'green', bank_sampah: 'blue', pengepul: 'purple', tpa: 'red' };
    container.innerHTML = `
      <div class="md-toolbar">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <h3 style="display:flex;align-items:center;gap:8px">${icons.mapPin} Daftar Lokasi</h3>
          <span class="md-count">${locations.length} lokasi</span>
        </div>
        <button class="btn btn-primary btn-sm" id="addLocationBtn">${icons.plus} Tambah Lokasi</button>
      </div>
      <div class="md-table-container">
        <table class="md-table">
          <thead><tr><th>Nama</th><th>Tipe</th><th>Wilayah / Desa</th><th>Koordinat</th><th>Aksi</th></tr></thead>
          <tbody>
            ${locations.length === 0 ? '<tr><td colspan="5" class="md-empty">Belum ada data lokasi</td></tr>' :
              locations.map(l => {
                const matchedWil = masterWilayah.find(w => w.id === l.desa_id);
                const wilayahDisplay = matchedWil ? `Desa ${matchedWil.desa_kelurahan}, Kec. ${matchedWil.kecamatan}` : (l.wilayah || '-');
                return `<tr>
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
    document.getElementById('addLocationBtn')?.addEventListener('click', () => openLocationForm(null, masterWilayah));
    container.querySelectorAll('[data-edit-loc]').forEach(btn => btn.addEventListener('click', async () => {
      const loc = locations.find(l => l.id === btn.dataset.editLoc);
      if (loc) openLocationForm(loc, masterWilayah);
    }));
    container.querySelectorAll('[data-del-loc]').forEach(btn => btn.addEventListener('click', async () => {
      if (confirm('Yakin ingin menghapus lokasi ini?')) {
        await deleteLocation(btn.dataset.delLoc);
        showToast('Lokasi berhasil dihapus', 'success');
        loadTabContent('locations');
      }
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

      const data = {
        name: document.getElementById('locName').value.trim(),
        type: document.getElementById('locType').value,
        wilayah: kecSelect.value,
        desa_id: selectedDesaId || null,
        served_desa_ids: servedDesaIds,
        address: document.getElementById('locAddress').value.trim() || null,
        lat: parseFloat(document.getElementById('locLat').value),
        lng: parseFloat(document.getElementById('locLng').value),
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
    container.querySelectorAll('[data-del-fleet]').forEach(btn => btn.addEventListener('click', async () => {
      if (confirm('Yakin ingin menghapus kendaraan ini?')) {
        await deleteFleet(btn.dataset.delFleet);
        showToast('Kendaraan berhasil dihapus', 'success');
        loadTabContent('fleet');
      }
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
      getAllUsers(),
      getAllMasterWilayah()
    ]);
    const roleColors = { warga: 'green', petugas: 'amber', eksekutif: 'blue', admin: 'purple' };
    const roleLabels = {};
    USER_ROLES.forEach(r => { roleLabels[r.id] = r.label; });
    container.innerHTML = `
      <div class="md-toolbar">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <h3 style="display:flex;align-items:center;gap:8px">${icons.users} Daftar Pengguna</h3>
          <span class="md-count">${users.length} akun</span>
        </div>
        <button class="btn btn-primary btn-sm" id="addUserBtn">${icons.plus} Tambah Pengguna</button>
      </div>
      <div class="md-table-container">
        <table class="md-table">
          <thead><tr><th>Nama</th><th>Username</th><th>Role</th><th>Wilayah</th><th>Aksi</th></tr></thead>
          <tbody>
            ${users.length === 0 ? '<tr><td colspan="5" class="md-empty">Belum ada data pengguna</td></tr>' :
              users.map(u => `<tr>
                <td><strong>${u.name}</strong></td>
                <td><code style="font-size:var(--font-xs);background:var(--gray-100);padding:2px 8px;border-radius:4px">${u.username}</code></td>
                <td><span class="md-badge ${roleColors[u.role] || 'blue'}">${u.role_icon || ''} ${roleLabels[u.role] || u.role}</span></td>
                <td>${u.wilayah || '-'}</td>
                <td><div class="md-actions">
                  <button class="md-btn-icon" title="Edit" data-edit-user="${u.id}">${icons.edit}</button>
                  ${u.role !== 'admin' ? `<button class="md-btn-icon danger" title="Hapus" data-del-user="${u.id}">${icons.trash}</button>` : ''}
                </div></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
    document.getElementById('addUserBtn')?.addEventListener('click', () => openUserForm(null, masterWilayah));
    container.querySelectorAll('[data-edit-user]').forEach(btn => btn.addEventListener('click', () => {
      const u = users.find(x => x.id === btn.dataset.editUser);
      if (u) openUserForm(u, masterWilayah);
    }));
    container.querySelectorAll('[data-del-user]').forEach(btn => btn.addEventListener('click', async () => {
      if (confirm('Yakin ingin menghapus pengguna ini? Pengguna yang sudah terhapus tidak bisa dikembalikan.')) {
        await deleteUser(btn.dataset.delUser);
        showToast('Pengguna berhasil dihapus', 'success');
        loadTabContent('users');
      }
    }));
  }

  function openUserForm(existing = null, masterWilayah = []) {
    const isEdit = !!existing;
    const kecamatanList = [...new Set(masterWilayah.map(w => w.kecamatan))].sort();

    openModal(isEdit ? 'Edit Pengguna' : 'Tambah Pengguna Baru', `
      <form id="userForm">
        <div class="form-group">
          <label class="form-label">Nama Lengkap</label>
          <input class="form-input" id="userName" required value="${existing?.name || ''}" placeholder="Misal: Siti Aminah" />
        </div>
        <div class="form-group">
          <label class="form-label">Username</label>
          <input class="form-input" id="userUsername" required value="${existing?.username || ''}" placeholder="Misal: kader_siti" ${isEdit ? 'readonly style="background:var(--gray-100)"' : ''} />
        </div>
        ${!isEdit ? `<div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" id="userPassword" type="password" required placeholder="Minimal 6 karakter" minlength="6" />
        </div>` : `<div class="form-group">
          <label class="form-label">Password Baru (kosongkan jika tidak diganti)</label>
          <input class="form-input" id="userPassword" type="password" placeholder="Biarkan kosong jika tidak ingin diubah" />
        </div>`}
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
        username: document.getElementById('userUsername').value.trim().toLowerCase(),
        role: role,
        role_icon: roleInfo?.icon || '',
        job_type: role === 'petugas' ? jobType : null,
        kecamatan: kecamatan,
        wilayah: kecamatan ? `Kec. ${kecamatan}` : document.getElementById('userWilayah').value.trim()
      };
      const pw = document.getElementById('userPassword').value;
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
          <div style="display:flex;gap:var(--space-2);flex:1;min-width:260px;justify-content:flex-end">
            <input type="text" class="form-input form-input-sm" id="wilSearch" placeholder="Cari desa atau kecamatan..." value="${searchVal}" style="max-width:300px" />
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
        // Set cursor to end
        const len = searchInput.value.length;
        searchInput.setSelectionRange(len, len);
        
        searchInput.addEventListener('input', (e) => {
          searchVal = e.target.value;
          drawTable();
        });
      }

      // Bind edit action
      container.querySelectorAll('[data-edit-wil]').forEach(btn => btn.addEventListener('click', () => {
        const v = villages.find(x => x.id === btn.dataset.editWil);
        if (v) openWilayahForm(v);
      }));
    }

    drawTable();
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
    const facilities = await getAllPublicFacilities();
    container.innerHTML = `
      <div class="md-toolbar">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <h3 style="display:flex;align-items:center;gap:8px">${icons.grid} Daftar Fasilitas Umum</h3>
          <span class="md-count">${facilities.length} fasilitas</span>
        </div>
        <button class="btn btn-primary btn-sm" id="addFasumBtn">${icons.plus} Tambah Fasum</button>
      </div>
      <div class="md-table-container">
        <table class="md-table">
          <thead><tr><th>Nama</th><th>Kategori</th><th>Wilayah</th><th>Kapasitas</th><th>Potensi Sampah</th><th>Aksi</th></tr></thead>
          <tbody>
            ${facilities.length === 0 ? '<tr><td colspan="6" class="md-empty">Belum ada data fasilitas umum</td></tr>' :
              facilities.map(f => {
                const potensiHarian = (f.capacity_value * (f.timbulan_per_unit || 0)).toFixed(1);
                return `<tr>
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
    document.getElementById('addFasumBtn')?.addEventListener('click', () => openFasumForm());
    container.querySelectorAll('[data-edit-fasum]').forEach(btn => btn.addEventListener('click', () => {
      const f = facilities.find(x => x.id === btn.dataset.editFasum);
      if (f) openFasumForm(f);
    }));
    container.querySelectorAll('[data-del-fasum]').forEach(btn => btn.addEventListener('click', async () => {
      if (confirm('Yakin ingin menghapus fasilitas umum ini?')) {
        await deletePublicFacility(btn.dataset.delFasum);
        showToast('Fasilitas umum berhasil dihapus', 'success');
        loadTabContent('fasum');
      }
    }));
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
      btn.addEventListener('click', async () => {
        if (confirm('Yakin ingin menghapus kode undangan ini?')) {
          try {
            await deleteInvitationCode(btn.dataset.id);
            showToast('Kode undangan berhasil dihapus', 'success');
            loadTabContent('invitations');
          } catch (err) {
            showToast('Gagal menghapus: ' + err.message, 'error');
          }
        }
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
