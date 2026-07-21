// SIMPAH - Input Residu
import { icons } from '../../components/icons.js';
import { getCurrentUser } from '../../utils/helpers.js';
import { initGPSIndicator } from '../../utils/gps.js';
import { addWasteRecord, getAllLocations, getAllMasterWilayah } from '../../db/store.js';
import { showToast } from '../../components/toast.js';
import { renderPWALayout } from './layout.js';
import { photoPickerHTML, initPhotoPicker } from '../../components/photo-picker.js';
import { wireSearchableSelect } from '../../utils/searchable-select.js';
import { getAllowedInputTypes } from '../../utils/permissions.js';

export async function renderInputResidu() {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/login'; return; }

  const allowed = getAllowedInputTypes(user);
  if (!allowed.includes('residu')) { window.location.hash = '#/pwa/home'; return; }

  const [locations, masterWilayah] = await Promise.all([
    getAllLocations(),
    getAllMasterWilayah()
  ]);
  const userFacility = user.location_id ? locations.find(l => l.id === user.location_id) : null;
  const userDesa = userFacility 
    ? masterWilayah.find(w => w.id === userFacility.desa_id) 
    : (user.desa_id ? masterWilayah.find(w => w.id === user.desa_id) : null);
  const isOperatorTPS = user?.role === 'petugas' && user?.job_type === 'operator_tps' && userFacility;
  const isKader = user?.role === 'petugas' && user?.job_type === 'kader' && userDesa;
  const isLockedLocation = isOperatorTPS || isKader;
  let gpsData = null;
  let photoPicker = null;

  renderPWALayout('Residu', `
    <div class="pwa-form page-enter">
      <div class="gps-indicator pending" id="gpsStatus">
        ${icons.mapPin}
        <span>Mendeteksi lokasi...</span>
      </div>

      <form id="residuForm">
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

        <div class="form-group">
          <label class="form-label">Berat Residu</label>
          <div class="weight-input-group">
            <input type="number" id="weightInput" class="form-input form-input-lg" placeholder="0" step="0.1" min="0" required inputmode="decimal" />
            <div class="weight-unit-toggle fat-finger-toggle">
              <button type="button" class="weight-unit-btn active" data-unit="kg">KG</button>
              <button type="button" class="weight-unit-btn" data-unit="ton">TON</button>
            </div>
          </div>
        </div>

        <!-- Location (Wilayah & Fasilitas) -->
        <div class="form-group">
          <label class="form-label">Kecamatan</label>
          <div class="custom-select-container" id="kecSelectContainer">
            <div class="custom-select-wrapper">
              <input type="text" id="kecamatanSelect" class="form-select" placeholder="Ketik/Pilih Kecamatan..." autocomplete="off" value="${userDesa ? userDesa.kecamatan : ''}" style="border: 1px solid var(--border-color);" ${isLockedLocation ? 'disabled' : ''} />
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
              <input type="text" id="desaSelectInput" class="form-select" placeholder="Ketik/Pilih Desa..." autocomplete="off" value="${userDesa ? userDesa.desa_kelurahan : ''}" style="border: 1px solid var(--border-color);" ${isLockedLocation ? 'disabled' : ''} />
              ${isLockedLocation ? '' : '<span class="custom-select-arrow">▼</span>'}
            </div>
            <div class="custom-select-dropdown" id="desaDropdown" style="display:none;"></div>
            <input type="hidden" id="desaSelect" value="${userDesa ? userDesa.id : ''}" />
            <div id="desaFeedback" style="color:#ef4444; font-size:var(--font-xs); margin-top:4px; display:none; font-weight:600;">⚠️ Desa tidak ditemukan di kecamatan terpilih</div>
          </div>
        </div>

        <div class="form-group" id="locationGroup" style="display:${(userDesa || isOperatorTPS) ? 'block' : 'none'}">
          <label class="form-label">${isOperatorTPS ? 'Fasilitas Terdaftar' : 'Lokasi TPS3R / Bank Sampah (Opsional)'}</label>
          <select id="locationSelect" class="form-select" ${isOperatorTPS ? 'disabled' : ''}>
            ${isOperatorTPS && userFacility ? `
              <option value="${userFacility.id}" data-lat="${userFacility.lat || 0}" data-lng="${userFacility.lng || 0}" data-name="${userFacility.name}" selected>${userFacility.name} (${(userFacility.type || 'tps3r').toUpperCase()})</option>
            ` : `
              <option value="">Tanpa Fasilitas (Pencatatan Mandiri Desa)</option>
              ${userDesa ? locations.filter(l => (l.desa_id === userDesa.id || (Array.isArray(l.served_desa_ids) && l.served_desa_ids.includes(userDesa.id))) && ['tps3r', 'bank_sampah'].includes(l.type)).map(l => `<option value="${l.id}" data-lat="${l.lat}" data-lng="${l.lng}" data-name="${l.name}">${l.name}</option>`).join('') : ''}
            `}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Metode Pembuangan Akhir (SIPSN)</label>
          <select id="destinationSelect" class="form-select">
            <option value="tpa_open_dumping">TPA - Open Dumping</option>
            <option value="tpa">TPA - Controlled Landfill</option>
            <option value="sanitary_landfill">TPA - Sanitary Landfill</option>
            <option value="insinerasi">Insinerasi</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Catatan</label>
          <textarea id="notesInput" class="form-textarea" rows="2" placeholder="Catatan opsional..."></textarea>
        </div>

        <!-- Photo -->
        ${photoPickerHTML('residu', false, 3)}

        <button type="submit" class="btn btn-primary btn-lg btn-block" id="submitBtn">
          ${icons.residue} Simpan Data Residu
        </button>
      </form>
    </div>
    <style>
      .fat-finger-toggle {
        display: flex;
        border-radius: var(--radius-lg);
        background: var(--bg-secondary);
        padding: 4px;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
      }
      .fat-finger-toggle .weight-unit-btn {
        flex: 1;
        padding: var(--space-4) var(--space-6);
        font-size: var(--font-base);
        font-weight: 700;
        border-radius: var(--radius-md);
        border: none;
        background: transparent;
        color: var(--text-muted);
        transition: all 0.2s;
        cursor: pointer;
      }
      .fat-finger-toggle .weight-unit-btn.active {
        background: var(--primary-500);
        color: white;
        box-shadow: 0 4px 6px rgba(16,185,129,0.2);
      }
    </style>
  `);

  // Init GPS Indicator
  initGPSIndicator('gpsStatus', pos => { gpsData = pos; });

  // Init photo picker
  photoPicker = initPhotoPicker('residu');



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
    if (isOperatorTPS && userFacility) {
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
    const filteredLocs = locations.filter(l => (l.desa_id === selectedDesaId || (Array.isArray(l.served_desa_ids) && l.served_desa_ids.includes(selectedDesaId))) && ['tps3r', 'bank_sampah'].includes(l.type));
    locSelect.innerHTML = '<option value="">Tanpa Fasilitas (Pencatatan Mandiri Desa)</option>' + 
      filteredLocs.map(l => `<option value="${l.id}" data-lat="${l.lat}" data-lng="${l.lng}" data-name="${l.name}">${l.name}</option>`).join('');
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

  if (userDesa) {
    updateLocationDropdown(userDesa.id);
  }
  document.querySelectorAll('.weight-unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.weight-unit-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Submit
  document.getElementById('residuForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const w = parseFloat(document.getElementById('weightInput').value);
    if (!w || w <= 0) { showToast('Masukkan berat yang valid', 'warning'); return; }
    const unit = document.querySelector('.weight-unit-btn.active').dataset.unit;
    const kg = unit === 'ton' ? w * 1000 : w;

    const btn = document.getElementById('submitBtn');
    btn.innerHTML = '<div class="spinner" style="margin:0 auto"></div>';
    btn.disabled = true;

    try {
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
        btn.innerHTML = `Simpan Data Residu`;
        btn.disabled = false;
        return;
      }
      const locEl = document.getElementById('locationSelect');
      const selectedOption = (locEl && locEl.selectedIndex >= 0) ? locEl.options[locEl.selectedIndex] : null;
      const photos = photoPicker?.getPhotos() || [];

      await addWasteRecord({
        type: 'residu',
        category_sipsn: 'LN',
        weight_kg: kg,
        lat: gpsData?.latitude || (selectedOption?.dataset?.lat ? parseFloat(selectedOption.dataset.lat) : null),
        lng: gpsData?.longitude || (selectedOption?.dataset?.lng ? parseFloat(selectedOption.dataset.lng) : null),
        location_id: (locEl && locEl.value) ? locEl.value : null,
        location_name: (locEl && locEl.value) ? (selectedOption.dataset.name || selectedOption.text) : '',
        desa_id: desaId,
        destination: document.getElementById('destinationSelect').value,
        notes: document.getElementById('notesInput').value.trim(),
        photos: photos.map(p => ({ dataUrl: p.dataUrl, name: p.name })),
        photo_count: photos.length,
        user_id: user.id,
        user_name: user.full_name
      }, user.id);
      if (navigator.onLine) {
        showToast('Data residu berhasil disimpan!', 'success');
      } else {
        showToast('Data disimpan secara lokal (antrean offline). Akan otomatis sinkron saat online.', 'warning', 'Offline');
      }
      setTimeout(() => { window.location.hash = '#/pwa/home'; }, 800);
    } catch (err) {
      showToast('Gagal: ' + err.message, 'error');
      btn.innerHTML = `${icons.residue} Simpan Data Residu`;
      btn.disabled = false;
    }
  });
}
