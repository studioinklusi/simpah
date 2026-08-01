// SIMPAH - Input Sampah Campur (Mixed Waste → TPA)
import { icons } from '../../components/icons.js';
import { INSTITUTION_TYPES, FACILITY_TYPES } from '../../utils/sipsn.js';
import { getCurrentUser } from '../../utils/helpers.js';
import { initGPSIndicator } from '../../utils/gps.js';
import { addWasteRecord, getAllLocations, getAllFleet, getAllMou, getAllMasterWilayah } from '../../db/store.js';
import { showToast } from '../../components/toast.js';
import { renderPWALayout } from './layout.js';
import { photoPickerHTML, initPhotoPicker } from '../../components/photo-picker.js';
import { wireSearchableSelect } from '../../utils/searchable-select.js';
import { getAllowedInputTypes } from '../../utils/permissions.js';

export async function renderInputSampah() {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/login'; return; }

  const allowed = getAllowedInputTypes(user);
  if (!allowed.includes('masuk')) { window.location.hash = '#/pwa/home'; return; }

  const [locations, fleet, mous, masterWilayah] = await Promise.all([
    getAllLocations(),
    getAllFleet(),
    getAllMou(),
    getAllMasterWilayah()
  ]);

  const userFacility = user.location_id ? locations.find(l => l.id === user.location_id) : null;
  const userDesa = userFacility 
    ? masterWilayah.find(w => w.id === userFacility.desa_id) 
    : (user.desa_id ? masterWilayah.find(w => w.id === user.desa_id) : null);
  const isOperatorTPS = user?.role === 'petugas' && user?.job_type === 'operator_tps' && userFacility;
  const isOperatorInstitusi = user?.role === 'petugas' && user?.job_type === 'operator_institusi';
  const institusiHasFacility = isOperatorInstitusi && userFacility;
  const institusiFacilityIsTPSType = institusiHasFacility && FACILITY_TYPES.includes(userFacility.type);
  const isKader = user?.role === 'petugas' && user?.job_type === 'kader' && userDesa;
  const isLockedLocation = isOperatorTPS || institusiHasFacility || isKader;
  let gpsData = null;
  let mouValid = true; // Track MoU validation state
  let photoPicker = null;

  renderPWALayout('Sampah Campur', `
    <div class="pwa-form page-enter">
      <!-- GPS Indicator -->
      <div class="gps-indicator pending" id="gpsStatus">
        ${icons.mapPin}
        <span id="gpsText">Mendeteksi lokasi GPS...</span>
      </div>

      <form id="wasteForm">
        ${isOperatorTPS && userFacility ? `
          <div class="tps-facility-badge" style="display:flex; align-items:center; gap:var(--space-3); padding:var(--space-3) var(--space-4); border-radius:var(--radius-lg); background:rgba(13,124,61,0.08); border:1px solid rgba(13,124,61,0.25); margin-bottom:var(--space-4);">
            <div style="width:36px; height:36px; border-radius:8px; background:#0D7C3D; color:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">
              🏭
            </div>
            <div>
              <div style="font-size:11px; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Lokasi Fasilitas TPS3R / Pengolahan</div>
              <div style="font-size:var(--font-sm); font-weight:700; color:var(--primary-800, #065f46); margin-top:1px;">${userFacility.name}</div>
              <div style="font-size:var(--font-xs); color:var(--text-secondary);">Desa ${userDesa ? userDesa.desa_kelurahan : '-'}, Kec. ${userDesa ? userDesa.kecamatan : '-'}</div>
            </div>
          </div>
        ` : ''}
        ${institusiHasFacility ? `
          <div class="tps-facility-badge" style="display:flex; align-items:center; gap:var(--space-3); padding:var(--space-3) var(--space-4); border-radius:var(--radius-lg); background:${institusiFacilityIsTPSType ? 'rgba(13,124,61,0.08)' : 'rgba(6,182,212,0.08)'}; border:1px solid ${institusiFacilityIsTPSType ? 'rgba(13,124,61,0.25)' : 'rgba(6,182,212,0.25)'}; margin-bottom:var(--space-4);">
            <div style="width:36px; height:36px; border-radius:8px; background:${institusiFacilityIsTPSType ? '#0D7C3D' : '#0891b2'}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">
              ${institusiFacilityIsTPSType ? '🏭' : '🏫'}
            </div>
            <div>
              <div style="font-size:11px; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">${institusiFacilityIsTPSType ? 'Lokasi Fasilitas TPS3R / Pengolahan' : 'Lokasi Institusi'}</div>
              <div style="font-size:var(--font-sm); font-weight:700; color:var(--primary-800, #065f46); margin-top:1px;">${userFacility.name}</div>
              <div style="font-size:var(--font-xs); color:var(--text-secondary);">Desa ${userDesa ? userDesa.desa_kelurahan : '-'}, Kec. ${userDesa ? userDesa.kecamatan : '-'}</div>
            </div>
          </div>
        ` : ''}

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
            <option value="langsung">Sumber Langsung (Warga/Rumah Tangga/Pasar)</option>
            <option value="fasilitas_lain">Dari Fasilitas Lain (Pengepul/Bank Sampah Unit/TPS)</option>
          </select>
        </div>

        <!-- Destination -->
        <div class="form-group">
          <label class="form-label">Metode Pembuangan Akhir (SIPSN)</label>
          <select id="campurDestSelect" class="form-select form-input-lg">
            <option value="tpa_open_dumping">TPA - Open Dumping</option>
            <option value="tpa">TPA - Controlled Landfill</option>
            <option value="sanitary_landfill">TPA - Sanitary Landfill</option>
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
            <input type="checkbox" id="accumToggle" checked />
            <span class="accum-switch"></span>
            <span>Ini laporan akumulasi beberapa hari</span>
          </label>
          <div class="accum-panel" id="accumPanel" style="display:block">
            <p class="accum-hint">Berapa hari sampah ini dikumpulkan sebelum ditimbang?</p>
            <div class="accum-days-row">
              <button type="button" class="accum-day-btn" data-days="3">3 hari</button>
              <button type="button" class="accum-day-btn" data-days="5">5 hari</button>
              <button type="button" class="accum-day-btn selected" data-days="7">7 hari</button>
              <button type="button" class="accum-day-btn" data-days="14">14 hari</button>
            </div>
            <div class="accum-custom">
              <span>atau</span>
              <input type="number" id="accumCustomDays" class="form-input" placeholder="10" min="2" max="30" style="width:110px; text-align:center" />
              <span>hari</span>
            </div>
            <div class="accum-preview" id="accumPreview"></div>
          </div>
        </div>
        <!-- Location (Wilayah & Fasilitas) -->
        <div class="form-group">
          <label class="form-label">Kecamatan</label>
          <div class="custom-select-container" id="kecSelectContainer">
            <div class="custom-select-wrapper">
              <input type="text" id="kecamatanSelect" class="form-select form-input-lg" placeholder="Ketik/Pilih Kecamatan..." autocomplete="off" value="${userDesa ? userDesa.kecamatan : ''}" style="border: 1px solid var(--border-color);" ${isLockedLocation ? 'disabled' : ''} />
              ${isLockedLocation ? '' : '<span class="custom-select-arrow">▼</span>'}
            </div>
            <div class="custom-select-dropdown" id="kecDropdown" style="display:none;"></div>
            <div id="kecFeedback" style="color:#ef4444; font-size:var(--font-xs); margin-top:4px; display:none; font-weight:600;">⚠️ Kecamatan tidak ditemukan</div>
          </div>
        </div>

        <div class="form-group" id="desaGroup" style="display:${userDesa ? 'block' : 'none'}">
          <label class="form-label">Desa / Kelurahan</label>
          <div class="custom-select-container" id="desaSelectContainer">
            <div class="custom-select-wrapper">
              <input type="text" id="desaSelectInput" class="form-select form-input-lg" placeholder="Ketik/Pilih Desa..." autocomplete="off" value="${userDesa ? userDesa.desa_kelurahan : ''}" style="border: 1px solid var(--border-color);" ${isLockedLocation ? 'disabled' : ''} />
              ${isLockedLocation ? '' : '<span class="custom-select-arrow">▼</span>'}
            </div>
            <div class="custom-select-dropdown" id="desaDropdown" style="display:none;"></div>
            <input type="hidden" id="desaSelect" value="${userDesa ? userDesa.id : ''}" />
            <div id="desaFeedback" style="color:#ef4444; font-size:var(--font-xs); margin-top:4px; display:none; font-weight:600;">⚠️ Desa tidak ditemukan di kecamatan terpilih</div>
          </div>
        </div>
        <div class="form-group" id="locationGroup" style="display:${(userDesa || isOperatorTPS || institusiHasFacility) ? 'block' : 'none'}">
          <label class="form-label">${(isOperatorTPS || institusiHasFacility) ? 'Fasilitas Terdaftar' : 'Dicatat di Fasilitas (Opsional)'}</label>
          <select id="locationSelect" class="form-select form-input-lg" ${(isOperatorTPS || institusiHasFacility) ? 'disabled' : ''}>
            ${(isOperatorTPS && userFacility) || institusiHasFacility ? `
              <option value="${userFacility.id}" data-lat="${userFacility.lat || 0}" data-lng="${userFacility.lng || 0}" data-name="${userFacility.name}" selected>${userFacility.name} (${(userFacility.type || 'tps3r').toUpperCase()})</option>
            ` : `
              <option value="">Tanpa Fasilitas (Pencatatan Mandiri Desa)</option>
              ${userDesa ? locations.filter(l => (l.desa_id === userDesa.id || (Array.isArray(l.served_desa_ids) && l.served_desa_ids.includes(userDesa.id))) && [...FACILITY_TYPES, ...INSTITUTION_TYPES].includes(l.type)).map(l => `<option value="${l.id}" data-lat="${l.lat}" data-lng="${l.lng}" data-name="${l.name}">${l.name} (${l.type.toUpperCase()})</option>`).join('') : ''}
            `}
          </select>
        </div>

        <!-- Fleet (optional) -->
        <div class="form-group">
          <label class="form-label">Kendaraan (Opsional)</label>
          <select id="fleetSelect" class="form-select">
            <option value="">Tanpa kendaraan</option>
            ${fleet.filter(f => f.status === 'active').map(f => `<option value="${f.id}" data-plate="${f.plate_number}">${f.plate_number} - ${f.vehicle_type}</option>`).join('')}
          </select>
          <div id="mouStatusIndicator" style="margin-top:var(--space-2);display:none"></div>
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

  // Init GPS Indicator
  initGPSIndicator('gpsStatus', pos => { gpsData = pos; });

  // Init photo picker
  photoPicker = initPhotoPicker('sampah');

  // Wire up cascading dropdown events
  const kecSelect = document.getElementById('kecamatanSelect');
  const desaSelectInput = document.getElementById('desaSelectInput');
  const desaSelect = document.getElementById('desaSelect');
  const locSelect = document.getElementById('locationSelect');
  const desaGroup = document.getElementById('desaGroup');
  const locGroup = document.getElementById('locationGroup');
  const kecFeedback = document.getElementById('kecFeedback');
  const desaFeedback = document.getElementById('desaFeedback');

  let selectKecInstance, selectDesaInstance;

  const updateLocationDropdown = (selectedDesaId) => {
    if ((isOperatorTPS && userFacility) || institusiHasFacility) {
      locSelect.innerHTML = `<option value="${userFacility.id}" data-lat="${userFacility.lat || 0}" data-lng="${userFacility.lng || 0}" data-name="${userFacility.name}" selected>${userFacility.name} (${(userFacility.type || 'tps3r').toUpperCase()})</option>`;
      locSelect.disabled = true;
      locGroup.style.display = 'block';
      return;
    }
    if (!selectedDesaId) {
      locGroup.style.display = 'none';
      locSelect.innerHTML = '<option value="">Tanpa Fasilitas (Pencatatan Mandiri Desa)</option>';
      return;
    }
    const filteredLocs = locations.filter(l => (l.desa_id === selectedDesaId || (Array.isArray(l.served_desa_ids) && l.served_desa_ids.includes(selectedDesaId))) && [...FACILITY_TYPES, ...INSTITUTION_TYPES].includes(l.type));
    locSelect.innerHTML = '<option value="">Tanpa Fasilitas (Pencatatan Mandiri Desa)</option>' + 
      filteredLocs.map(l => `<option value="${l.id}" data-lat="${l.lat}" data-lng="${l.lng}">${l.name} (${l.type.toUpperCase()})</option>`).join('');
    locGroup.style.display = 'block';
  };

  const kecHidden = { value: userDesa ? userDesa.kecamatan : '' };

  selectKecInstance = wireSearchableSelect({
    inputEl: kecSelect,
    dropdownEl: document.getElementById('kecDropdown'),
    hiddenEl: kecHidden,
    feedbackEl: kecFeedback,
    getOptions: () => {
      const uniqueKec = [...new Set(masterWilayah.map(w => w.kecamatan))].sort();
      return uniqueKec.map(k => ({ value: k, label: k }));
    },
    onSelect: (opt) => {
      desaGroup.style.display = 'block';
      desaSelectInput.value = '';
      desaSelect.value = '';
      updateLocationDropdown('');
    },
    onClear: () => {
      desaGroup.style.display = 'none';
      locGroup.style.display = 'none';
      desaSelectInput.value = '';
      desaSelect.value = '';
      updateLocationDropdown('');
    }
  });

  selectDesaInstance = wireSearchableSelect({
    inputEl: desaSelectInput,
    dropdownEl: document.getElementById('desaDropdown'),
    hiddenEl: desaSelect,
    feedbackEl: desaFeedback,
    getOptions: () => {
      const selectedKec = kecSelect.value.trim();
      const filtered = masterWilayah.filter(w => w.kecamatan.toLowerCase() === selectedKec.toLowerCase());
      return filtered.map(w => ({ value: w.id, label: w.desa_kelurahan }));
    },
    onSelect: (opt) => {
      updateLocationDropdown(opt.value);
    },
    onClear: () => {
      updateLocationDropdown('');
    }
  });

  // Wire up unit toggle
  document.querySelectorAll('.weight-unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.weight-unit-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ── MoU Validation on Fleet Selection ──
  function checkFleetMou(fleetId) {
    const indicator = document.getElementById('mouStatusIndicator');
    if (!indicator) return;

    if (!fleetId) {
      indicator.style.display = 'none';
      mouValid = true;
      return;
    }

    // Find MoU that contains this fleet (by ID or plate number)
    const selectedFleetData = fleet.find(f => f.id === fleetId);
    const linkedMou = mous.find(m => {
      if (!m.fleet_ids || !Array.isArray(m.fleet_ids)) return false;
      // Match by fleet ID directly
      if (m.fleet_ids.includes(fleetId)) return true;
      // Fallback: match by plate number in fleet_ids (for cross-source compatibility)
      if (selectedFleetData?.plate_number) {
        return m.fleet_ids.some(fid => {
          const fleetByFid = fleet.find(f => f.id === fid);
          return fleetByFid?.plate_number === selectedFleetData.plate_number;
        });
      }
      return false;
    });

    if (!linkedMou) {
      indicator.style.display = 'block';
      indicator.innerHTML = `
        <div style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-3);border-radius:var(--radius-md);background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);font-size:var(--font-sm)">
          ${icons.alert}
          <div>
            <strong style="color:#d97706">Kendaraan belum terdaftar di MoU</strong>
            <div style="font-size:var(--font-xs);color:var(--text-muted);margin-top:2px">Kendaraan ini belum dikaitkan dengan perjanjian transporter manapun. Data tetap bisa disimpan tapi perlu verifikasi.</div>
          </div>
        </div>`;
      mouValid = true; // Allow but warn
      return;
    }

    if (linkedMou.status === 'active') {
      indicator.style.display = 'block';
      indicator.innerHTML = `
        <div style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-3);border-radius:var(--radius-md);background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);font-size:var(--font-sm)">
          ${icons.checkCircle}
          <div>
            <strong style="color:#059669">MoU Aktif: ${linkedMou.transporter_name}</strong>
            <div style="font-size:var(--font-xs);color:var(--text-muted);margin-top:2px">${linkedMou.contract_number} • Berlaku s/d ${linkedMou.end_date}</div>
          </div>
        </div>`;
      mouValid = true;
    } else if (linkedMou.status === 'expiring') {
      indicator.style.display = 'block';
      indicator.innerHTML = `
        <div style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-3);border-radius:var(--radius-md);background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);font-size:var(--font-sm)">
          ${icons.alert}
          <div>
            <strong style="color:#d97706">MoU Segera Habis: ${linkedMou.transporter_name}</strong>
            <div style="font-size:var(--font-xs);color:var(--text-muted);margin-top:2px">${linkedMou.contract_number} • Berakhir ${linkedMou.end_date} — Segera perpanjang!</div>
          </div>
        </div>`;
      mouValid = true; // Allow but warn
    } else {
      // expired or terminated
      indicator.style.display = 'block';
      indicator.innerHTML = `
        <div style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-3);border-radius:var(--radius-md);background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);font-size:var(--font-sm)">
          ${icons.xCircle}
          <div>
            <strong style="color:#dc2626">MoU Kadaluarsa: ${linkedMou.transporter_name}</strong>
            <div style="font-size:var(--font-xs);color:var(--text-muted);margin-top:2px">${linkedMou.contract_number} • Berakhir ${linkedMou.end_date} — Kendaraan ini tidak boleh digunakan untuk pengangkutan!</div>
          </div>
        </div>`;
      mouValid = false;
    }
  }

  document.getElementById('fleetSelect')?.addEventListener('change', (e) => {
    checkFleetMou(e.target.value);
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

    // Block if MoU expired
    if (!mouValid) {
      showToast('Tidak dapat menyimpan: Kendaraan terpilih memiliki MoU yang sudah kadaluarsa. Pilih kendaraan lain atau hubungi admin.', 'error');
      return;
    }

    const weightInput = parseFloat(document.getElementById('weightInput').value);
    if (!weightInput || weightInput <= 0) {
      showToast('Masukkan berat yang valid', 'warning');
      return;
    }

    const activeUnit = document.querySelector('.weight-unit-btn.active').dataset.unit;
    const weightKg = activeUnit === 'ton' ? weightInput * 1000 : weightInput;
    const isKecValid = selectKecInstance.validate();
    const isDesaValid = selectDesaInstance.validate();
    const desaId = desaSelect.value || null;

    if (!isKecValid || !isDesaValid || !desaId) {
      showToast('Pilih wilayah Kecamatan dan Desa / Kelurahan yang valid terlebih dahulu', 'warning');
      if (!isKecValid) {
        kecSelect.focus();
      } else {
        desaSelectInput.focus();
      }
      return;
    }
    const locationEl = document.getElementById('locationSelect');
    const fleetEl = document.getElementById('fleetSelect');
    const selectedOption = (locationEl && locationEl.selectedIndex >= 0) ? locationEl.options[locationEl.selectedIndex] : null;
    const selectedFleet = (fleetEl && fleetEl.selectedIndex >= 0) ? fleetEl.options[fleetEl.selectedIndex] : null;

    const photos = photoPicker?.getPhotos() || [];

    const record = {
      type: 'campur',
      source_type: document.getElementById('sourceSelect').value,
      category_sipsn: 'MIX',
      destination: document.getElementById('campurDestSelect').value,
      weight_kg: weightKg,
      lat: gpsData?.latitude || (selectedOption?.dataset?.lat ? parseFloat(selectedOption.dataset.lat) : null),
      lng: gpsData?.longitude || (selectedOption?.dataset?.lng ? parseFloat(selectedOption.dataset.lng) : null),
      location_id: (locationEl && locationEl.value) ? locationEl.value : null,
      location_name: (locationEl && locationEl.value) ? (selectedOption.dataset.name || selectedOption.text) : '',
      desa_id: desaId,
      fleet_id: (fleetEl && fleetEl.value) ? fleetEl.value : null,
      fleet_plate: (fleetEl && fleetEl.value) ? selectedFleet.dataset.plate : '',
      notes: document.getElementById('notesInput').value.trim(),
      photos: photos.map(p => ({ dataUrl: p.dataUrl, name: p.name })),
      photo_count: photos.length,
      user_id: user.id,
      user_name: user.full_name
    };

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerHTML = '<div class="spinner" style="margin:0 auto"></div>';
    submitBtn.disabled = true;

    try {
      const isAccum = document.getElementById('accumToggle').checked;
      const accumDays = isAccum ? getSelectedAccumDays() : 1;

      if (accumDays > 1) {
        const batchId = crypto.randomUUID();
        const dailyWeight = parseFloat((weightKg / accumDays).toFixed(1));
        const now = new Date();
        const oldestDate = new Date(now);
        oldestDate.setDate(oldestDate.getDate() - (accumDays - 1));

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
            is_batch: true,
            batch_id: batchId,
            batch_days: accumDays,
            batch_start_date: oldestDate.toISOString().split('T')[0],
            batch_end_date: now.toISOString().split('T')[0],
            override_date: backDate.toISOString()
          }, user.id);
        }
      } else {
        await addWasteRecord(record, user.id);
      }
      if (navigator.onLine) {
        showToast('Data sampah campur berhasil disimpan!', 'success', 'Tersimpan');
      } else {
        showToast('Data disimpan secara lokal (antrean offline). Akan otomatis sinkron saat online.', 'warning', 'Offline');
      }
      setTimeout(() => { window.location.hash = '#/pwa/sampah-masuk'; }, 800);
    } catch (err) {
      showToast('Gagal menyimpan data: ' + err.message, 'error');
      submitBtn.innerHTML = `${icons.plus} Simpan Data Campur`;
      submitBtn.disabled = false;
    }
  });
}
