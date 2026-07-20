// SIMPAH - Input Sampah Terpilah
import { icons } from '../../components/icons.js';
import { SIPSN_CATEGORIES } from '../../utils/sipsn.js';
import { getCurrentUser } from '../../utils/helpers.js';
import { initGPSIndicator } from '../../utils/gps.js';
import { addWasteRecord, addSortedWaste, getAllLocations, getAllMasterWilayah } from '../../db/store.js';
import { showToast } from '../../components/toast.js';
import { renderPWALayout } from './layout.js';
import { photoPickerHTML, initPhotoPicker } from '../../components/photo-picker.js';
import { wireSearchableSelect } from '../../utils/searchable-select.js';
import { getAllowedInputTypes } from '../../utils/permissions.js';

export async function renderInputPilah() {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/login'; return; }

  const allowed = getAllowedInputTypes(user);
  if (!allowed.includes('pilah')) { window.location.hash = '#/pwa/home'; return; }

  const [locations, masterWilayah] = await Promise.all([
    getAllLocations(),
    getAllMasterWilayah()
  ]);
  const userDesa = user.desa_id ? masterWilayah.find(w => w.id === user.desa_id) : null;
  const isKader = user?.role === 'petugas' && user?.job_type === 'kader' && userDesa;
  let gpsData = null;
  let photoPicker = null;

  renderPWALayout('Sampah Terpilah', `
    <div class="pwa-form page-enter">
      <div class="gps-indicator pending" id="gpsStatus">
        ${icons.mapPin}
        <span>Mendeteksi lokasi GPS...</span>
      </div>

      <form id="pilahForm">
        <!-- Location (Wilayah & Fasilitas) -->
        <div class="form-group">
          <label class="form-label">Kecamatan</label>
          <div class="custom-select-container" id="kecSelectContainer">
            <div class="custom-select-wrapper">
              <input type="text" id="kecamatanSelect" class="form-select" placeholder="Ketik/Pilih Kecamatan..." autocomplete="off" value="${userDesa ? userDesa.kecamatan : ''}" style="border: 1px solid var(--border-color);" ${isKader ? 'disabled' : ''} />
              ${isKader ? '' : '<span class="custom-select-arrow">▼</span>'}
            </div>
            <div class="custom-select-dropdown" id="kecDropdown" style="display:none;"></div>
            <div id="kecFeedback" style="color:#ef4444; font-size:var(--font-xs); margin-top:4px; display:none; font-weight:600;">⚠️ Kecamatan tidak ditemukan</div>
          </div>
        </div>

        <div class="form-group" id="desaGroup" style="display:${userDesa ? 'block' : 'none'}">
          <label class="form-label">Desa / Kelurahan</label>
          <div class="custom-select-container" id="desaSelectContainer">
            <div class="custom-select-wrapper">
              <input type="text" id="desaSelectInput" class="form-select" placeholder="Ketik/Pilih Desa..." autocomplete="off" value="${userDesa ? userDesa.desa_kelurahan : ''}" style="border: 1px solid var(--border-color);" ${isKader ? 'disabled' : ''} />
              ${isKader ? '' : '<span class="custom-select-arrow">▼</span>'}
            </div>
            <div class="custom-select-dropdown" id="desaDropdown" style="display:none;"></div>
            <input type="hidden" id="desaSelect" value="${userDesa ? userDesa.id : ''}" />
            <div id="desaFeedback" style="color:#ef4444; font-size:var(--font-xs); margin-top:4px; display:none; font-weight:600;">⚠️ Desa tidak ditemukan di kecamatan terpilih</div>
          </div>
        </div>

        <div class="form-group" id="locationGroup" style="display:${userDesa ? 'block' : 'none'}">
          <label class="form-label">Dicatat di Fasilitas (Opsional)</label>
          <select id="locationSelect" class="form-select">
            <option value="">Tanpa Fasilitas (Pencatatan Mandiri Desa)</option>
            ${userDesa ? locations.filter(l => (l.desa_id === userDesa.id || (Array.isArray(l.served_desa_ids) && l.served_desa_ids.includes(userDesa.id))) && ['tps3r', 'bank_sampah', 'pengepul'].includes(l.type)).map(l => `<option value="${l.id}" data-lat="${l.lat}" data-lng="${l.lng}" data-name="${l.name}">${l.name} (${l.type.toUpperCase()})</option>`).join('') : ''}
          </select>
        </div>

        <!-- Source -->
        <div class="form-group">
          <label class="form-label">Asal / Sumber Sampah</label>
          <p style="font-size:var(--font-xs); color:var(--text-muted); margin-bottom:var(--space-2);">Pilih untuk mencegah penghitungan ganda.</p>
          <select id="sourceSelect" class="form-select">
            <option value="langsung">Sumber Langsung (Warga/Rumah Tangga/Pasar)</option>
            <option value="fasilitas_lain">Dari Fasilitas Lain (Pengepul/Bank Sampah Unit/TPS)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Input Berat per Kategori (kg)</label>
          <div class="pilah-categories" id="pilahCategories">
            ${SIPSN_CATEGORIES.filter(c => !c.isMixed).map(cat => `
              <div class="pilah-card">
                <div class="pilah-card-header">
                  <span class="pilah-icon" style="color:${cat.color}">${cat.icon}</span>
                  <span class="pilah-name">${cat.name}</span>
                </div>
                <div class="pilah-card-controls">
                  <button type="button" class="pilah-btn min-btn" data-code="${cat.code}">-</button>
                  <input type="number" class="form-input pilah-input" id="input-${cat.code}" data-code="${cat.code}" value="0" step="0.5" min="0" inputmode="decimal" />
                  <span class="pilah-unit">KG</span>
                  <button type="button" class="pilah-btn plus-btn" data-code="${cat.code}">+</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="form-group" style="margin-top:var(--space-4);">
          <label class="form-label">Input Residu (kg)</label>
          <div class="pilah-card" style="border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.03);">
            <div class="pilah-card-header">
              <span class="pilah-icon" style="color:#ef4444">${icons.trash}</span>
              <span class="pilah-name">Residu ke TPA</span>
            </div>
            <div class="pilah-card-controls">
              <button type="button" class="pilah-btn min-btn residu-btn">-</button>
              <input type="number" class="form-input pilah-input residu-input" id="input-residu" value="0" step="0.5" min="0" inputmode="decimal" />
              <span class="pilah-unit">KG</span>
              <button type="button" class="pilah-btn plus-btn residu-btn">+</button>
            </div>
          </div>
          <p style="font-size:var(--font-xs); color:var(--text-muted); margin-top:var(--space-2);">Sisa hasil pemilahan yang tidak bisa diolah dan dibuang ke TPA</p>
        </div>

        <div class="pilah-total" id="pilahTotal">
          <span>Total (Pilah + Residu):</span>
          <strong>0 <small>KG</small></strong>
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

        <div class="form-group">
          <label class="form-label">Catatan</label>
          <textarea id="notesInput" class="form-textarea" rows="2" placeholder="Catatan opsional..."></textarea>
        </div>

        <!-- Photo -->
        ${photoPickerHTML('pilah', false, 3)}

        <button type="submit" class="btn btn-primary btn-lg btn-block" id="submitBtn">
          ${icons.recycle} Simpan Data Pilah
        </button>
      </form>
    </div>
    <style>
      .pilah-categories { display:flex; flex-direction:column; gap:var(--space-3); }
      .pilah-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-xl); padding:var(--space-3) var(--space-4); display:flex; flex-direction:column; gap:var(--space-3); }
      .pilah-card-header { display:flex; align-items:center; gap:var(--space-3); }
      .pilah-icon { width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:#fff; border-radius:var(--radius-lg); box-shadow:0 1px 3px rgba(0,0,0,0.1); }
      .pilah-name { flex:1; font-size:var(--font-base); font-weight:700; color:var(--text-primary); }
      .pilah-card-controls { display:flex; align-items:center; justify-content:space-between; gap:var(--space-2); background:#fff; padding:6px; border-radius:var(--radius-lg); border:1px solid var(--border-color); }
      .pilah-btn { width:48px; height:48px; border-radius:var(--radius-md); border:none; background:var(--gray-100); color:var(--text-secondary); font-size:24px; font-weight:500; display:flex; align-items:center; justify-content:center; cursor:pointer; }
      .pilah-btn:active { background:var(--primary-100); color:var(--primary-600); transform:scale(0.95); }
      .pilah-input { flex:1; border:none !important; text-align:center !important; font-size:24px !important; font-weight:800 !important; padding:4px !important; background:transparent !important; color:var(--primary-600) !important; box-shadow:none !important; }
      .pilah-input:focus { outline:none; }
      .pilah-unit { font-size:var(--font-xs); color:var(--text-muted); font-weight:800; padding-right:8px; }
      .pilah-total { display:flex; justify-content:space-between; align-items:center; padding:16px 20px; font-size:20px; color:var(--primary-700); background:linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.2)); border:1px solid rgba(16,185,129,0.3); border-radius:var(--radius-xl); margin-bottom:var(--space-5); text-transform:uppercase; font-weight:600; }
      .pilah-total strong { font-size:28px; font-weight:900; }
      .pilah-total small { font-size:14px; opacity:0.8; }
      
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
  photoPicker = initPhotoPicker('pilah');



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
    if (!selectedDesaId) {
      locGroup.style.display = 'none';
      locSelect.innerHTML = '<option value="">Tanpa Fasilitas (Pencatatan Mandiri Desa)</option>';
      return;
    }
    const filteredLocs = locations.filter(l => (l.desa_id === selectedDesaId || (Array.isArray(l.served_desa_ids) && l.served_desa_ids.includes(selectedDesaId))) && ['tps3r', 'bank_sampah', 'pengepul'].includes(l.type));
    locSelect.innerHTML = '<option value="">Tanpa Fasilitas (Pencatatan Mandiri Desa)</option>' + 
      filteredLocs.map(l => `<option value="${l.id}" data-lat="${l.lat}" data-lng="${l.lng}" data-name="${l.name}">${l.name} (${l.type.toUpperCase()})</option>`).join('');
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
  document.querySelectorAll('.pilah-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isPlus = btn.classList.contains('plus-btn');
      const isResidu = btn.classList.contains('residu-btn');
      const input = isResidu ? document.getElementById('input-residu') : document.getElementById(`input-${btn.dataset.code}`);
      let val = parseFloat(input.value) || 0;
      if (isPlus) { val += 1; } 
      else if (val >= 1) { val -= 1; }
      else { val = 0; }
      input.value = val;
      updateTotal();
    });
  });

  // Update total
  document.querySelectorAll('.pilah-input').forEach(input => {
    input.addEventListener('input', updateTotal);
    // Auto clear 0 on focus
    input.addEventListener('focus', () => { if (input.value === '0') input.value = ''; });
    input.addEventListener('blur', () => { if (input.value === '') input.value = '0'; });
  });

  function updateTotal() {
    let total = 0;
    document.querySelectorAll('.pilah-input').forEach(i => {
      total += parseFloat(i.value) || 0;
    });
    document.getElementById('pilahTotal').innerHTML = `<span>Total (Pilah + Residu):</span><strong>${total.toFixed(1)} <small>KG</small></strong>`;

    const preview = document.getElementById('accumPreview');
    if (preview) {
      const days = getSelectedAccumDays();
      if (total > 0 && days > 1) {
        preview.innerHTML = `${icons.chart} Sistem akan mencatat rata-rata <strong>${(total / days).toFixed(1)} kg/hari</strong> selama ${days} hari ke belakang`;
        preview.style.display = 'block';
      } else {
        preview.style.display = 'none';
      }
    }
  }

  // Accumulation logic
  const accumToggle = document.getElementById('accumToggle');
  const accumPanel = document.getElementById('accumPanel');
  accumToggle?.addEventListener('change', () => {
    accumPanel.style.display = accumToggle.checked ? 'block' : 'none';
    updateTotal();
  });
  
  document.querySelectorAll('.accum-day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.accum-day-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('accumCustomDays').value = '';
      updateTotal();
    });
  });

  document.getElementById('accumCustomDays')?.addEventListener('input', () => {
    document.querySelectorAll('.accum-day-btn').forEach(b => b.classList.remove('selected'));
    updateTotal();
  });

  function getSelectedAccumDays() {
    const custom = parseInt(document.getElementById('accumCustomDays')?.value);
    if (custom >= 2) return custom;
    const selected = document.querySelector('.accum-day-btn.selected');
    return selected ? parseInt(selected.dataset.days) : 7;
  }

  // Submit
  document.getElementById('pilahForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const items = [];
    let totalPilah = 0;
    const residuVal = parseFloat(document.getElementById('input-residu').value) || 0;

    document.querySelectorAll('.pilah-input:not(.residu-input)').forEach(i => {
      const val = parseFloat(i.value) || 0;
      if (val > 0) {
        items.push({ category_sipsn: i.dataset.code, weight_kg: val });
        totalPilah += val;
      }
    });

    if (items.length === 0 && residuVal === 0) {
      showToast('Masukkan minimal satu kategori atau residu', 'warning');
      return;
    }

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
        btn.innerHTML = 'Simpan Data Pilah';
        btn.disabled = false;
        return;
      }
      const photos = photoPicker?.getPhotos() || [];
      const locationEl = document.getElementById('locationSelect');
      const selectedOption = (locationEl && locationEl.selectedIndex >= 0) ? locationEl.options[locationEl.selectedIndex] : null;
      let pilahRecordId = null;
      
      const isAccum = document.getElementById('accumToggle').checked;
      const accumDays = isAccum ? getSelectedAccumDays() : 1;

      if (items.length > 0) {
        const baseRecord = {
          type: 'pilah',
          source_type: document.getElementById('sourceSelect').value,
          category_sipsn: items.length === 1 ? items[0].category_sipsn : 'MIX',
          lat: gpsData?.latitude || (selectedOption?.dataset?.lat ? parseFloat(selectedOption.dataset.lat) : null),
          lng: gpsData?.longitude || (selectedOption?.dataset?.lng ? parseFloat(selectedOption.dataset.lng) : null),
          location_id: (locationEl && locationEl.value) ? locationEl.value : null,
          location_name: (locationEl && locationEl.value) ? (selectedOption.dataset.name || selectedOption.text) : '',
          desa_id: desaId,
          notes: document.getElementById('notesInput').value.trim(),
          photos: photos.map(p => ({ dataUrl: p.dataUrl, name: p.name })),
          photo_count: photos.length,
          user_id: user.id,
          user_name: user.full_name
        };

        if (accumDays > 1) {
          const batchId = crypto.randomUUID();
          const dailyTotal = parseFloat((totalPilah / accumDays).toFixed(1));
          const dailyItems = items.map(i => ({ ...i, weight_kg: parseFloat((i.weight_kg / accumDays).toFixed(1)) }));
          const now = new Date();
          const oldestDate = new Date(now);
          oldestDate.setDate(oldestDate.getDate() - (accumDays - 1));
          
          for (let d = 0; d < accumDays; d++) {
            const backDate = new Date(now);
            backDate.setDate(backDate.getDate() - d);
            const record = await addWasteRecord({
              ...baseRecord,
              weight_kg: dailyTotal,
              notes: baseRecord.notes + (d === 0 ? '' : ` [Akumulasi hari ke-${accumDays - d}/${accumDays}]`),
              is_accumulation: true,
              accumulation_days: accumDays,
              accumulation_total_kg: totalPilah,
              is_batch: true,
              batch_id: batchId,
              batch_days: accumDays,
              batch_start_date: oldestDate.toISOString().split('T')[0],
              batch_end_date: now.toISOString().split('T')[0],
              override_date: backDate.toISOString()
            }, user.id);
            if (d === 0) pilahRecordId = record.id;
            await addSortedWaste(dailyItems, record.id, user.id);
          }
        } else {
          const record = await addWasteRecord({ ...baseRecord, weight_kg: totalPilah }, user.id);
          pilahRecordId = record.id;
          await addSortedWaste(items, record.id, user.id);
        }
      }

      if (residuVal > 0) {
        const residuBase = {
          type: 'residu',
          source_type: document.getElementById('sourceSelect').value,
          category_sipsn: 'MIX',
          lat: gpsData?.latitude || (selectedOption?.dataset?.lat ? parseFloat(selectedOption.dataset.lat) : null),
          lng: gpsData?.longitude || (selectedOption?.dataset?.lng ? parseFloat(selectedOption.dataset.lng) : null),
          location_id: (locationEl && locationEl.value) ? locationEl.value : null,
          location_name: (locationEl && locationEl.value) ? (selectedOption.dataset.name || selectedOption.text) : '',
          desa_id: desaId,
          photos: !pilahRecordId ? photos.map(p => ({ dataUrl: p.dataUrl, name: p.name })) : [],
          photo_count: !pilahRecordId ? photos.length : 0,
          user_id: user.id,
          user_name: user.full_name
        };

        if (accumDays > 1) {
          const batchId = crypto.randomUUID();
          const dailyResidu = parseFloat((residuVal / accumDays).toFixed(1));
          const now = new Date();
          const oldestDate = new Date(now);
          oldestDate.setDate(oldestDate.getDate() - (accumDays - 1));

          for (let d = 0; d < accumDays; d++) {
            const backDate = new Date(now);
            backDate.setDate(backDate.getDate() - d);
            await addWasteRecord({
              ...residuBase,
              weight_kg: dailyResidu,
              notes: (document.getElementById('notesInput').value.trim() + (pilahRecordId ? ' [Sisa pemilahan]' : '') + (d === 0 ? '' : ` [Akumulasi hari ke-${accumDays - d}/${accumDays}]`)).trim(),
              is_accumulation: true,
              accumulation_days: accumDays,
              accumulation_total_kg: residuVal,
              is_batch: true,
              batch_id: batchId,
              batch_days: accumDays,
              batch_start_date: oldestDate.toISOString().split('T')[0],
              batch_end_date: now.toISOString().split('T')[0],
              override_date: backDate.toISOString()
            }, user.id);
          }
        } else {
          await addWasteRecord({
            ...residuBase,
            weight_kg: residuVal,
            notes: (document.getElementById('notesInput').value.trim() + (pilahRecordId ? ' [Sisa pemilahan]' : '')).trim()
          }, user.id);
        }
      }

      if (navigator.onLine) {
        showToast('Data pemilahan berhasil disimpan!', 'success');
      } else {
        showToast('Data disimpan secara lokal (antrean offline). Akan otomatis sinkron saat online.', 'warning', 'Offline');
      }
      setTimeout(() => { window.location.hash = '#/pwa/sampah-masuk'; }, 800);
    } catch (err) {
      console.error('Submit error in input-pilah:', err);
      showToast('Gagal: ' + err.message, 'error');
      btn.innerHTML = `${icons.recycle} Simpan Data Pilah`;
      btn.disabled = false;
    }
  });
}
