// SIMPAH - Input Sampah Campur (Mixed Waste → TPA)
import { icons } from '../../components/icons.js';
import { getCurrentUser } from '../../utils/helpers.js';
import { getCurrentPosition } from '../../utils/gps.js';
import { addWasteRecord, getAllLocations, getAllFleet } from '../../db/store.js';
import { showToast } from '../../components/toast.js';
import { renderPWALayout } from './layout.js';
import { photoPickerHTML, initPhotoPicker } from '../../components/photo-picker.js';

export async function renderInputSampah() {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/login'; return; }

  const locations = await getAllLocations();
  const fleet = await getAllFleet();
  let gpsData = null;
  let photoPicker = null;

  // Try to get GPS immediately
  captureGPS();

  renderPWALayout('Sampah Campur', `
    <div class="pwa-form page-enter">
      <!-- GPS Indicator -->
      <div class="gps-indicator pending" id="gpsStatus">
        ${icons.mapPin}
        <span id="gpsText">Mendeteksi lokasi GPS...</span>
      </div>

      <form id="wasteForm">
        <!-- Info Banner -->
        <div class="campur-info-banner">
          <span class="campur-info-icon">${icons.alert}</span>
          <div>
            <strong>Sampah Campur (Tidak Dipilah)</strong>
            <p>Sampah ini tercatat sebagai "tidak tereduksi" di SIPSN karena tidak melalui proses pemilahan.</p>
          </div>
        </div>

        <!-- Source -->
        <div class="form-group">
          <label class="form-label">Asal / Sumber Sampah</label>
          <p style="font-size:var(--font-xs); color:var(--text-muted); margin-bottom:var(--space-2);">Pilih untuk mencegah penghitungan ganda (double counting).</p>
          <select id="sourceSelect" class="form-select form-input-lg">
            <option value="sumber_langsung">Sumber Langsung (Warga/Rumah Tangga/Pasar)</option>
            <option value="fasilitas">Dari Fasilitas Lain (Pengepul/Bank Sampah Unit/TPS)</option>
          </select>
        </div>

        <!-- Destination -->
        <div class="form-group">
          <label class="form-label">Tujuan Pembuangan</label>
          <select id="campurDestSelect" class="form-select form-input-lg">
            <option value="tpa">TPA</option>
            <option value="sanitary_landfill">Sanitary Landfill</option>
            <option value="insinerasi">Insinerasi</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>

        <!-- Weight Input -->
        <div class="form-group">
          <label class="form-label">Berat</label>
          <div class="weight-input-group">
            <input type="number" id="weightInput" class="form-input form-input-lg" placeholder="0" step="0.1" min="0" required inputmode="decimal" />
            <div class="weight-unit-toggle">
              <button type="button" class="weight-unit-btn active" data-unit="kg">kg</button>
              <button type="button" class="weight-unit-btn" data-unit="ton">ton</button>
            </div>
          </div>
        </div>

        <div class="accumulation-toggle">
          <label class="accum-label">
            <input type="checkbox" id="accumToggle" />
            <span class="accum-switch"></span>
            <span>Ini laporan akumulasi beberapa hari</span>
          </label>
          <div class="accum-panel" id="accumPanel" style="display:none">
            <p class="accum-hint">Berapa hari sampah ini dikumpulkan sebelum ditimbang?</p>
            <div class="accum-days-row">
              <button type="button" class="accum-day-btn" data-days="3">3 hari</button>
              <button type="button" class="accum-day-btn" data-days="5">5 hari</button>
              <button type="button" class="accum-day-btn selected" data-days="7">7 hari</button>
              <button type="button" class="accum-day-btn" data-days="14">14 hari</button>
            </div>
            <div class="accum-custom">
              <span>atau</span>
              <input type="number" id="accumCustomDays" class="form-input" placeholder="Jumlah hari" min="2" max="30" style="width:120px" />
            </div>
            <div class="accum-preview" id="accumPreview"></div>
          </div>
        </div>

        <!-- Location -->
        <div class="form-group">
          <label class="form-label">Lokasi TPS/TPS3R</label>
          <select id="locationSelect" class="form-select form-input-lg">
            <option value="">Pilih lokasi...</option>
            ${locations.map(l => `<option value="${l.id}" data-lat="${l.lat}" data-lng="${l.lng}">${l.name} (${l.type.toUpperCase()})</option>`).join('')}
          </select>
        </div>

        <!-- Fleet (optional) -->
        <div class="form-group">
          <label class="form-label">Kendaraan (Opsional)</label>
          <select id="fleetSelect" class="form-select">
            <option value="">Tanpa kendaraan</option>
            ${fleet.filter(f => f.status === 'active').map(f => `<option value="${f.id}" data-plate="${f.plate_number}">${f.plate_number} - ${f.vehicle_type}</option>`).join('')}
          </select>
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label class="form-label">Catatan (Opsional)</label>
          <textarea id="notesInput" class="form-textarea" rows="2" placeholder="Tambahkan catatan..."></textarea>
        </div>

        <!-- Photo -->
        ${photoPickerHTML('sampah', false, 3)}

        <!-- Submit -->
        <button type="submit" class="btn btn-primary btn-lg btn-block" id="submitBtn">
          ${icons.plus} Simpan Data Campur
        </button>
      </form>
    </div>
    <style>
      .campur-info-banner { display:flex; gap:var(--space-3); align-items:flex-start; padding:var(--space-4); border-radius:var(--radius-lg); background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); margin-bottom:var(--space-5); }
      .campur-info-icon { font-size:24px; color:#f59e0b; flex-shrink:0; }
      .campur-info-banner p { font-size:var(--font-xs); color:var(--text-secondary); margin-top:var(--space-1); line-height:1.4; }
      .campur-info-banner strong { font-size:var(--font-sm); color:#d97706; }
      .accumulation-toggle { margin-bottom:var(--space-4); }
      .accum-label { display:flex; align-items:center; gap:var(--space-3); cursor:pointer; font-size:var(--font-base); font-weight:600; }
      .accum-label input { display:none; }
      .accum-switch { width:40px; height:22px; border-radius:11px; background:var(--gray-300); position:relative; transition:all 0.2s; flex-shrink:0; }
      .accum-switch::after { content:''; width:18px; height:18px; border-radius:50%; background:#fff; position:absolute; top:2px; left:2px; transition:all 0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.2); }
      .accum-label input:checked + .accum-switch { background:var(--primary-500); }
      .accum-label input:checked + .accum-switch::after { left:20px; }
      .accum-panel { margin-top:var(--space-3); padding:var(--space-4); border-radius:var(--radius-lg); background:rgba(16,185,129,0.05); border:1px solid rgba(16,185,129,0.15); animation:scaleIn 0.2s ease; }
      .accum-hint { font-size:var(--font-sm); color:var(--text-secondary); margin-bottom:var(--space-3); font-weight:500; }
      .accum-days-row { display:flex; gap:var(--space-2); flex-wrap:wrap; margin-bottom:var(--space-3); }
      .accum-day-btn { padding:var(--space-3) var(--space-5); border-radius:var(--radius-full); border:1px solid var(--border-color); background:transparent; font-size:var(--font-sm); font-weight:600; cursor:pointer; transition:all 0.15s; color:var(--text-primary); }
      .accum-day-btn.selected { background:var(--primary-500); color:#fff; border-color:var(--primary-500); }
      .accum-custom { display:flex; align-items:center; gap:var(--space-3); font-size:var(--font-sm); color:var(--text-muted); }
      .accum-preview { margin-top:var(--space-3); padding:var(--space-3); border-radius:var(--radius-md); background:rgba(16,185,129,0.1); font-size:var(--font-sm); color:var(--primary-700, #047857); text-align:center; font-weight:600; }
    </style>
  `);

  // Init photo picker
  photoPicker = initPhotoPicker('sampah');

  // Wire up unit toggle
  document.querySelectorAll('.weight-unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.weight-unit-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Accumulation toggle
  const accumToggle = document.getElementById('accumToggle');
  const accumPanel = document.getElementById('accumPanel');
  accumToggle?.addEventListener('change', () => {
    accumPanel.style.display = accumToggle.checked ? 'block' : 'none';
    updateAccumPreview();
  });
  document.querySelectorAll('.accum-day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.accum-day-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('accumCustomDays').value = '';
      updateAccumPreview();
    });
  });
  document.getElementById('accumCustomDays')?.addEventListener('input', () => {
    document.querySelectorAll('.accum-day-btn').forEach(b => b.classList.remove('selected'));
    updateAccumPreview();
  });
  document.getElementById('weightInput')?.addEventListener('input', updateAccumPreview);

  function getSelectedAccumDays() {
    const custom = parseInt(document.getElementById('accumCustomDays')?.value);
    if (custom >= 2) return custom;
    const selected = document.querySelector('.accum-day-btn.selected');
    return selected ? parseInt(selected.dataset.days) : 7;
  }
  function updateAccumPreview() {
    const preview = document.getElementById('accumPreview');
    if (!preview) return;
    const w = parseFloat(document.getElementById('weightInput')?.value) || 0;
    const unit = document.querySelector('.weight-unit-btn.active')?.dataset.unit || 'kg';
    const wKg = unit === 'ton' ? w * 1000 : w;
    const days = getSelectedAccumDays();
    if (wKg > 0 && days > 1) {
      preview.innerHTML = `${icons.chart} Sistem akan mencatat <strong>${(wKg / days).toFixed(1)} kg/hari</strong> selama ${days} hari ke belakang`;
      preview.style.display = 'block';
    } else { preview.style.display = 'none'; }
  }

  // Wire up form submission
  document.getElementById('wasteForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const weightInput = parseFloat(document.getElementById('weightInput').value);
    if (!weightInput || weightInput <= 0) {
      showToast('Masukkan berat yang valid', 'warning');
      return;
    }

    const activeUnit = document.querySelector('.weight-unit-btn.active').dataset.unit;
    const weightKg = activeUnit === 'ton' ? weightInput * 1000 : weightInput;

    const locationEl = document.getElementById('locationSelect');
    const fleetEl = document.getElementById('fleetSelect');
    const selectedOption = locationEl.options[locationEl.selectedIndex];
    const selectedFleet = fleetEl.options[fleetEl.selectedIndex];

    const photos = photoPicker?.getPhotos() || [];

    const record = {
      type: 'campur',
      source_type: document.getElementById('sourceSelect').value,
      category_sipsn: 'MIX',
      destination: document.getElementById('campurDestSelect').value,
      weight_kg: weightKg,
      lat: gpsData?.latitude || (selectedOption?.dataset?.lat ? parseFloat(selectedOption.dataset.lat) : null),
      lng: gpsData?.longitude || (selectedOption?.dataset?.lng ? parseFloat(selectedOption.dataset.lng) : null),
      location_id: locationEl.value || null,
      location_name: locationEl.value ? selectedOption.text : '',
      fleet_id: fleetEl.value || null,
      fleet_plate: fleetEl.value ? selectedFleet.dataset.plate : '',
      notes: document.getElementById('notesInput').value.trim(),
      photos: photos.map(p => ({ dataUrl: p.dataUrl, name: p.name })),
      photo_count: photos.length,
      user_id: user.id,
      user_name: user.name
    };

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerHTML = '<div class="spinner" style="margin:0 auto"></div>';
    submitBtn.disabled = true;

    try {
      const isAccum = document.getElementById('accumToggle').checked;
      const accumDays = isAccum ? getSelectedAccumDays() : 1;

      if (accumDays > 1) {
        const dailyWeight = parseFloat((weightKg / accumDays).toFixed(1));
        const now = new Date();
        for (let d = 0; d < accumDays; d++) {
          const backDate = new Date(now);
          backDate.setDate(backDate.getDate() - d);
          await addWasteRecord({
            ...record,
            weight_kg: dailyWeight,
            notes: record.notes + (d === 0 ? '' : ` [Akumulasi hari ke-${accumDays - d}/${accumDays}]`),
            is_accumulation: true,
            accumulation_days: accumDays,
            accumulation_total_kg: weightKg,
            override_date: backDate.toISOString()
          }, user.id);
        }
      } else {
        await addWasteRecord(record, user.id);
      }
      showToast('Data sampah campur berhasil disimpan!', 'success', 'Tersimpan');
      setTimeout(() => { window.location.hash = '#/pwa/sampah-masuk'; }, 800);
    } catch (err) {
      showToast('Gagal menyimpan data: ' + err.message, 'error');
      submitBtn.innerHTML = `${icons.plus} Simpan Data Campur`;
      submitBtn.disabled = false;
    }
  });

  async function captureGPS() {
    try {
      const pos = await getCurrentPosition(false);
      gpsData = pos;
      const statusEl = document.getElementById('gpsStatus');
      const textEl = document.getElementById('gpsText');
      if (statusEl && textEl) {
        statusEl.className = 'gps-indicator active';
        textEl.textContent = `GPS: ${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}`;
      }
    } catch (e) {
      const statusEl = document.getElementById('gpsStatus');
      const textEl = document.getElementById('gpsText');
      if (statusEl && textEl) {
        textEl.textContent = 'GPS tidak tersedia - lokasi manual';
      }
    }
  }
}
