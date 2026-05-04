// SIMPAH - Master Data Management (CRUD Panel for Dinas)
import { icons } from '../../components/icons.js';
import { getCurrentUser } from '../../utils/helpers.js';
import { LOCATION_TYPES, USER_ROLES } from '../../utils/sipsn.js';
import { JOB_TYPES } from '../../utils/permissions.js';
import { showToast } from '../../components/toast.js';
import { renderDashboardLayout } from './layout.js';
import {
  getAllLocations, addLocation, updateLocation, deleteLocation,
  getAllFleet, addFleet, updateFleet, deleteFleet,
  getAllUsers, addUser, updateUser, deleteUser
} from '../../db/store.js';

export async function renderMasterData() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    window.location.hash = '#/dashboard/gis';
    return;
  }

  renderDashboardLayout('Master Data', `
    <div class="master-data page-enter">
      <div class="md-header">
        <h2 style="display:flex;align-items:center;gap:var(--space-2)">${icons.settings} Pengaturan Master Data</h2>
        <p>Kelola data referensi sistem: lokasi, kendaraan, dan pengguna.</p>
      </div>

      <div class="md-tabs" id="mdTabs">
        <button class="md-tab active" data-tab="locations" style="display:inline-flex;align-items:center;gap:8px">${icons.mapPin} Lokasi</button>
        <button class="md-tab" data-tab="fleet" style="display:inline-flex;align-items:center;gap:8px">${icons.truck} Kendaraan</button>
        <button class="md-tab" data-tab="users" style="display:inline-flex;align-items:center;gap:8px">${icons.users} Pengguna</button>
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
      .master-data { max-width:1100px; }
      .md-header h2 { font-size:var(--font-xl); font-weight:700; margin-bottom:var(--space-1); }
      .md-header p { font-size:var(--font-sm); color:var(--text-secondary); margin-bottom:var(--space-5); }
      .md-tabs { display:flex; gap:var(--space-2); border-bottom:2px solid var(--border-color); margin-bottom:var(--space-5); }
      .md-tab { padding:var(--space-3) var(--space-5); border:none; background:none; font-size:var(--font-sm); font-weight:600; cursor:pointer; color:var(--text-secondary); border-bottom:2px solid transparent; margin-bottom:-2px; transition:all 0.2s; border-radius:var(--radius-md) var(--radius-md) 0 0; }
      .md-tab:hover { color:var(--text-primary); background:var(--gray-50); }
      .md-tab.active { color:var(--primary-600); border-bottom-color:var(--primary-500); background:rgba(16,185,129,0.05); }
      .md-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4); flex-wrap:wrap; gap:var(--space-3); }
      .md-toolbar h3 { font-size:var(--font-base); font-weight:600; }
      .md-count { font-size:var(--font-xs); color:var(--text-muted); background:var(--gray-100); padding:var(--space-1) var(--space-3); border-radius:var(--radius-full); }
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
    if (tab === 'locations') await renderLocationsTab(container);
    else if (tab === 'fleet') await renderFleetTab(container);
    else if (tab === 'users') await renderUsersTab(container);
  }

  // ---------- LOCATIONS TAB ----------
  async function renderLocationsTab(container) {
    const locations = await getAllLocations();
    const badgeColors = { tps: 'amber', tps3r: 'green', bank_sampah: 'blue', pengepul: 'purple', tpa: 'red' };
    container.innerHTML = `
      <div class="md-toolbar">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <h3 style="display:flex;align-items:center;gap:8px">${icons.mapPin} Daftar Lokasi</h3>
          <span class="md-count">${locations.length} lokasi</span>
        </div>
        <button class="btn btn-primary btn-sm" id="addLocationBtn">${icons.plus} Tambah Lokasi</button>
      </div>
      <table class="md-table">
        <thead><tr><th>Nama</th><th>Tipe</th><th>Wilayah</th><th>Koordinat</th><th>Aksi</th></tr></thead>
        <tbody>
          ${locations.length === 0 ? '<tr><td colspan="5" class="md-empty">Belum ada data lokasi</td></tr>' :
            locations.map(l => `<tr>
              <td><strong>${l.name}</strong></td>
              <td><span class="md-badge ${badgeColors[l.type] || 'blue'}">${l.type?.toUpperCase()}</span></td>
              <td>${l.wilayah || '-'}</td>
              <td style="font-size:var(--font-xs);color:var(--text-muted)">${l.lat && l.lng ? `${Number(l.lat).toFixed(4)}, ${Number(l.lng).toFixed(4)}` : '-'}</td>
              <td><div class="md-actions">
                <button class="md-btn-icon" title="Edit" data-edit-loc="${l.id}">${icons.edit}</button>
                <button class="md-btn-icon danger" title="Hapus" data-del-loc="${l.id}">${icons.trash}</button>
              </div></td>
            </tr>`).join('')}
        </tbody>
      </table>
    `;
    document.getElementById('addLocationBtn')?.addEventListener('click', () => openLocationForm());
    container.querySelectorAll('[data-edit-loc]').forEach(btn => btn.addEventListener('click', async () => {
      const loc = locations.find(l => l.id === btn.dataset.editLoc);
      if (loc) openLocationForm(loc);
    }));
    container.querySelectorAll('[data-del-loc]').forEach(btn => btn.addEventListener('click', async () => {
      if (confirm('Yakin ingin menghapus lokasi ini?')) {
        await deleteLocation(btn.dataset.delLoc);
        showToast('Lokasi berhasil dihapus', 'success');
        loadTabContent('locations');
      }
    }));
  }

  function openLocationForm(existing = null) {
    const isEdit = !!existing;
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
        <div class="form-group">
          <label class="form-label">Wilayah / Kecamatan</label>
          <input class="form-input" id="locWilayah" value="${existing?.wilayah || ''}" placeholder="Misal: Banjarnegara" />
        </div>
        <div style="display:flex;gap:var(--space-3)">
          <div class="form-group" style="flex:1">
            <label class="form-label">Latitude</label>
            <input class="form-input" id="locLat" type="number" step="any" value="${existing?.lat || ''}" placeholder="-7.xxx" />
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Longitude</label>
            <input class="form-input" id="locLng" type="number" step="any" value="${existing?.lng || ''}" placeholder="109.xxx" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Kapasitas (m³, opsional)</label>
          <input class="form-input" id="locCapacity" type="number" step="0.1" value="${existing?.capacity_m3 || ''}" placeholder="10" />
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" onclick="document.getElementById('mdModal').style.display='none'">Batal</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Simpan Perubahan' : 'Tambah Lokasi'}</button>
        </div>
      </form>
    `);
    document.getElementById('locForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('locName').value.trim(),
        type: document.getElementById('locType').value,
        wilayah: document.getElementById('locWilayah').value.trim(),
        lat: parseFloat(document.getElementById('locLat').value) || null,
        lng: parseFloat(document.getElementById('locLng').value) || null,
        capacity_m3: parseFloat(document.getElementById('locCapacity').value) || null
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
      <table class="md-table">
        <thead><tr><th>Plat Nomor</th><th>Jenis</th><th>Kapasitas</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>
          ${fleet.length === 0 ? '<tr><td colspan="5" class="md-empty">Belum ada data kendaraan</td></tr>' :
            fleet.map(f => `<tr>
              <td><strong>${f.plate_number}</strong></td>
              <td>${f.vehicle_type || '-'}</td>
              <td>${f.capacity_m3 ? f.capacity_m3 + ' m³' : '-'}</td>
              <td><span class="md-badge ${f.status === 'active' ? 'green' : 'red'}">${f.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td>
              <td><div class="md-actions">
                <button class="md-btn-icon" title="Edit" data-edit-fleet="${f.id}">${icons.edit}</button>
                <button class="md-btn-icon danger" title="Hapus" data-del-fleet="${f.id}">${icons.trash}</button>
              </div></td>
            </tr>`).join('')}
        </tbody>
      </table>
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
          <label class="form-label">Kapasitas (m³)</label>
          <input class="form-input" id="fleetCapacity" type="number" step="0.1" value="${existing?.capacity_m3 || ''}" placeholder="8" />
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
        capacity_m3: parseFloat(document.getElementById('fleetCapacity').value) || null,
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
    const users = await getAllUsers();
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
    `;
    document.getElementById('addUserBtn')?.addEventListener('click', () => openUserForm());
    container.querySelectorAll('[data-edit-user]').forEach(btn => btn.addEventListener('click', () => {
      const u = users.find(x => x.id === btn.dataset.editUser);
      if (u) openUserForm(u);
    }));
    container.querySelectorAll('[data-del-user]').forEach(btn => btn.addEventListener('click', async () => {
      if (confirm('Yakin ingin menghapus pengguna ini? Pengguna yang sudah terhapus tidak bisa dikembalikan.')) {
        await deleteUser(btn.dataset.delUser);
        showToast('Pengguna berhasil dihapus', 'success');
        loadTabContent('users');
      }
    }));
  }

  function openUserForm(existing = null) {
    const isEdit = !!existing;
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
        <div class="form-group">
          <label class="form-label">Wilayah (opsional)</label>
          <input class="form-input" id="userWilayah" value="${existing?.wilayah || ''}" placeholder="Misal: Banjarnegara" />
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" onclick="document.getElementById('mdModal').style.display='none'">Batal</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Simpan Perubahan' : 'Tambah Pengguna'}</button>
        </div>
      </form>
    `);
    // Toggle job_type visibility based on role
    const roleSelect = document.getElementById('userRole');
    const jobTypeGroup = document.getElementById('jobTypeGroup');
    roleSelect?.addEventListener('change', () => {
      jobTypeGroup.style.display = roleSelect.value === 'petugas' ? 'block' : 'none';
    });

    document.getElementById('userForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const role = document.getElementById('userRole').value;
      const roleInfo = USER_ROLES.find(r => r.id === role);
      const jobType = document.getElementById('userJobType')?.value || null;
      const data = {
        name: document.getElementById('userName').value.trim(),
        username: document.getElementById('userUsername').value.trim().toLowerCase(),
        role: role,
        role_icon: roleInfo?.icon || '',
        job_type: role === 'petugas' ? jobType : null,
        wilayah: document.getElementById('userWilayah').value.trim()
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

  // Load initial tab
  loadTabContent(activeTab);
}
