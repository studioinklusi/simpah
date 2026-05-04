// SIMPAH - Armada (Fleet) Page
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatDate } from '../../utils/helpers.js';
import { getAllFleet, addFleet, getAllMou } from '../../db/store.js';
import { showToast } from '../../components/toast.js';
import { renderPWALayout } from './layout.js';

export async function renderArmada() {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/login'; return; }
  
  const fleet = await getAllFleet();
  const mous = await getAllMou();

  renderPWALayout('Armada', `
    <div class="page-enter">
      <div class="section-header">
        <h3 style="font-size:var(--font-base);font-weight:700">Daftar Kendaraan</h3>
        ${user.role === 'admin' ? `<button class="btn btn-primary btn-sm" id="addFleetBtn">${icons.plus} Tambah</button>` : ''}
      </div>

      <div class="record-list" id="fleetList">
        ${fleet.map(f => `
          <div class="record-item">
            <div class="record-icon" style="background:rgba(245,158,11,0.12)">${icons.truck}</div>
            <div class="record-info">
              <div class="record-title">${f.plate_number}</div>
              <div class="record-meta">${f.vehicle_type} · ${f.driver_name}</div>
            </div>
            <div>
              <span class="badge ${f.status === 'active' ? 'badge-success' : 'badge-warning'}">${f.status === 'active' ? 'Aktif' : 'Perawatan'}</span>
            </div>
          </div>
        `).join('')}
        ${fleet.length === 0 ? '<div class="empty-state"><p>Belum ada kendaraan terdaftar</p></div>' : ''}
      </div>

      <div class="section-header" style="margin-top:var(--space-8)">
        <h3 style="font-size:var(--font-base);font-weight:700">Status MoU</h3>
      </div>
      <div class="record-list">
        ${mous.map(m => `
          <div class="record-item">
            <div class="record-icon" style="background:rgba(59,130,246,0.12)">${icons.clipboard}</div>
            <div class="record-info">
              <div class="record-title">${m.transporter_name}</div>
              <div class="record-meta">${m.contract_number} · s/d ${formatDate(m.end_date)}</div>
            </div>
            <span class="badge ${m.status === 'active' ? 'badge-success' : m.status === 'expiring' ? 'badge-warning' : 'badge-danger'}">${m.status === 'active' ? 'Aktif' : m.status === 'expiring' ? 'Segera Habis' : 'Kadaluarsa'}</span>
          </div>
        `).join('')}
      </div>
    </div>

    ${user.role === 'admin' ? `
    <!-- Add Fleet Form (hidden) -->
    <div class="pwa-form" id="addFleetForm" style="display:none;margin-top:var(--space-4)">
      <h3 class="pwa-form-title">${icons.truck} Tambah Kendaraan Baru</h3>
      <form id="newFleetForm">
        <div class="form-group">
          <label class="form-label">Nomor Plat</label>
          <input type="text" id="plateInput" class="form-input" placeholder="R 1234 XX" required />
        </div>
        <div class="form-group">
          <label class="form-label">Jenis Kendaraan</label>
          <select id="vehicleTypeInput" class="form-select">
            <option value="Dump Truck">Dump Truck</option>
            <option value="Arm Roll">Arm Roll</option>
            <option value="Pick Up">Pick Up</option>
            <option value="Motor Roda Tiga">Motor Roda Tiga</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Nama Pengemudi</label>
          <input type="text" id="driverInput" class="form-input" placeholder="Nama pengemudi" required />
        </div>
        <div class="form-group">
          <label class="form-label">Kapasitas (kg)</label>
          <input type="number" id="capacityInput" class="form-input" placeholder="5000" min="0" required />
        </div>
        <div style="display:flex;gap:var(--space-3)">
          <button type="button" class="btn btn-secondary btn-block" id="cancelFleetBtn">Batal</button>
          <button type="submit" class="btn btn-primary btn-block">Simpan</button>
        </div>
      </form>
    </div>` : ''}
  `);

  const addBtn = document.getElementById('addFleetBtn');
  const formDiv = document.getElementById('addFleetForm');
  const cancelBtn = document.getElementById('cancelFleetBtn');

  if (addBtn && formDiv && cancelBtn) {
    addBtn.addEventListener('click', () => { formDiv.style.display = 'block'; addBtn.style.display = 'none'; });
    cancelBtn.addEventListener('click', () => { formDiv.style.display = 'none'; addBtn.style.display = ''; });

    document.getElementById('newFleetForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await addFleet({
          plate_number: document.getElementById('plateInput').value.trim(),
          vehicle_type: document.getElementById('vehicleTypeInput').value,
          driver_name: document.getElementById('driverInput').value.trim(),
          capacity_kg: parseInt(document.getElementById('capacityInput').value),
          status: 'active'
        }, user.id);
        showToast('Kendaraan berhasil ditambahkan!', 'success');
        renderArmada(); // Refresh
      } catch (err) {
        showToast('Gagal: ' + err.message, 'error');
      }
    });
  }
}
