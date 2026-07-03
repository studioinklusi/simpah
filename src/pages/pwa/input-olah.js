// SIMPAH - Input Pengolahan Mandiri (Treatment at Source)
import { icons } from '../../components/icons.js';
import { TREATMENT_METHODS, SIPSN_CATEGORIES } from '../../utils/sipsn.js';
import { getCurrentUser } from '../../utils/helpers.js';
import { getCurrentPosition } from '../../utils/gps.js';
import { addWasteRecord, getAllLocations, getAllMasterWilayah } from '../../db/store.js';
import { showToast } from '../../components/toast.js';
import { renderPWALayout } from './layout.js';
import { photoPickerHTML, initPhotoPicker } from '../../components/photo-picker.js';

export async function renderInputOlah() {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/login'; return; }

  const [locations, masterWilayah] = await Promise.all([
    getAllLocations(),
    getAllMasterWilayah()
  ]);
  const userDesa = user.desa_id ? masterWilayah.find(w => w.id === user.desa_id) : null;
  let gpsData = null;
  let photoPicker = null;

  getCurrentPosition(false).then(pos => {
    gpsData = pos;
    const el = document.getElementById('gpsStatus');
    if (el) { el.className = 'gps-indicator active'; el.querySelector('span:last-child').textContent = `GPS: ${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}`; }
  }).catch(() => {});

  renderPWALayout('Olah Sampah', `
    <div class="pwa-form page-enter">
      <div class="gps-indicator pending" id="gpsStatus">
        ${icons.mapPin}
        <span>Mendeteksi lokasi GPS...</span>
      </div>

      <div class="olah-info-banner">
        <span class="olah-info-icon">${icons.refreshCw}</span>
        <div>
          <strong>Pengolahan Mandiri</strong>
          <p>Catat sampah yang diolah sendiri menjadi produk berguna (kompos, pakan ternak, dll) tanpa masuk TPA.</p>
        </div>
      </div>

      <form id="olahForm">
        <div class="form-group">
          <label class="form-label">Metode Pengolahan</label>
          <div class="category-grid" style="grid-template-columns:repeat(2,1fr)" id="methodGrid">
            ${TREATMENT_METHODS.map(m => `
              <div class="category-chip" data-method="${m.id}" title="${m.desc}">
                <span class="category-emoji">${m.icon}</span>
                <span>${m.label}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Jenis Bahan Sampah</label>
          <div class="category-grid" id="categoryGrid">
            ${SIPSN_CATEGORIES.map(c => `
              <div class="category-chip" data-cat="${c.code}">
                <span class="category-emoji" style="color:${c.color}">${c.icon}</span>
                <span>${c.name}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Berat Olahan (kg)</label>
          <input type="number" id="weightInput" class="form-input form-input-lg"
            placeholder="0.0" step="0.1" min="0.1" inputmode="decimal" required style="font-size:var(--font-2xl);text-align:center;font-weight:700" />
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
              <input type="number" id="accumCustomDays" class="form-input" placeholder="Jumlah hari" min="2" max="30" style="width:120px" />
            </div>
            <div class="accum-preview" id="accumPreview"></div>
          </div>
        </div>

        <!-- Location (Wilayah & Fasilitas) -->
        <div class="form-group">
          <label class="form-label">Kecamatan</label>
          <select id="kecamatanSelect" class="form-select">
            <option value="">Pilih Kecamatan...</option>
            ${[...new Set(masterWilayah.map(w => w.kecamatan))].sort().map(k => `<option value="${k}" ${userDesa && userDesa.kecamatan === k ? 'selected' : ''}>${k}</option>`).join('')}
          </select>
        </div>

        <div class="form-group" id="desaGroup" style="display:${userDesa ? 'block' : 'none'}">
          <label class="form-label">Desa / Kelurahan</label>
          <select id="desaSelect" class="form-select">
            <option value="">Pilih Desa...</option>
            ${userDesa ? masterWilayah.filter(w => w.kecamatan === userDesa.kecamatan).map(w => `<option value="${w.id}" ${w.id === userDesa.id ? 'selected' : ''}>${w.desa_kelurahan}</option>`).join('') : ''}
          </select>
        </div>

        <div class="form-group" id="locationGroup" style="display:${userDesa ? 'block' : 'none'}">
          <label class="form-label">Lokasi TPS3R / Bank Sampah (Opsional)</label>
          <select id="locationSelect" class="form-select">
            <option value="">Tanpa Fasilitas (Pencatatan Mandiri Desa)</option>
            ${userDesa ? locations.filter(l => (l.desa_id === userDesa.id || (Array.isArray(l.served_desa_ids) && l.served_desa_ids.includes(userDesa.id))) && ['tps3r', 'bank_sampah'].includes(l.type)).map(l => `<option value="${l.id}" data-lat="${l.lat}" data-lng="${l.lng}">${l.name}</option>`).join('') : ''}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Hasil / Keterangan</label>
          <textarea id="notesInput" class="form-textarea" rows="2" placeholder="Misal: 15 kg kompos dihasilkan, dijual ke petani desa..."></textarea>
        </div>

        <!-- Photo -->
        ${photoPickerHTML('olah', false, 3)}

        <button type="submit" class="btn btn-lg btn-block" id="submitBtn" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none">
          ${icons.refreshCw} Simpan Pengolahan
        </button>
      </form>
    </div>
    <style>
      .olah-info-banner { display:flex; gap:var(--space-3); align-items:flex-start; padding:var(--space-4); border-radius:var(--radius-lg); background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); margin-bottom:var(--space-5); }
      .olah-info-icon { font-size:28px; }
      .olah-info-banner p { font-size:var(--font-xs); color:var(--text-secondary); margin-top:var(--space-1); line-height:1.4; }
      .olah-info-banner strong { font-size:var(--font-sm); color:var(--amber-600, #d97706); }
      .accumulation-toggle { margin-bottom:var(--space-5); }
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
  photoPicker = initPhotoPicker('olah');

  // Wire up cascading dropdown events
  const kecSelect = document.getElementById('kecamatanSelect');
  const desaSelect = document.getElementById('desaSelect');
  const locSelect = document.getElementById('locationSelect');
  const desaGroup = document.getElementById('desaGroup');
  const locGroup = document.getElementById('locationGroup');

  if (kecSelect) {
    kecSelect.addEventListener('change', () => {
      const selectedKec = kecSelect.value;
      if (!selectedKec) {
        desaGroup.style.display = 'none';
        locGroup.style.display = 'none';
        desaSelect.innerHTML = '<option value="">Pilih Desa...</option>';
        locSelect.innerHTML = '<option value="">Tanpa Fasilitas (Pencatatan Mandiri Desa)</option>';
        return;
      }

      const filteredDesa = masterWilayah.filter(w => w.kecamatan === selectedKec);
      desaSelect.innerHTML = '<option value="">Pilih Desa...</option>' + 
        filteredDesa.map(w => `<option value="${w.id}">${w.desa_kelurahan}</option>`).join('');
      
      desaGroup.style.display = 'block';
      locGroup.style.display = 'none';
    });

    desaSelect.addEventListener('change', () => {
      const selectedDesaId = desaSelect.value;
      if (!selectedDesaId) {
        locGroup.style.display = 'none';
        locSelect.innerHTML = '<option value="">Tanpa Fasilitas (Pencatatan Mandiri Desa)</option>';
        return;
      }

      const filteredLocs = locations.filter(l => (l.desa_id === selectedDesaId || (Array.isArray(l.served_desa_ids) && l.served_desa_ids.includes(selectedDesaId))) && ['tps3r', 'bank_sampah'].includes(l.type));
      locSelect.innerHTML = '<option value="">Tanpa Fasilitas (Pencatatan Mandiri Desa)</option>' + 
        filteredLocs.map(l => `<option value="${l.id}" data-lat="${l.lat}" data-lng="${l.lng}">${l.name}</option>`).join('');
      
      locGroup.style.display = 'block';
    });
  }

  // Method selection
  let selectedMethod = null;
  document.querySelectorAll('#methodGrid .category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#methodGrid .category-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedMethod = chip.dataset.method;
    });
  });

  // Category selection
  let selectedCategory = null;
  document.querySelectorAll('#categoryGrid .category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#categoryGrid .category-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedCategory = chip.dataset.cat;
    });
  });

  // Accumulation toggle
  const accumToggle = document.getElementById('accumToggle');
  const accumPanel = document.getElementById('accumPanel');
  accumToggle?.addEventListener('change', () => {
    accumPanel.style.display = accumToggle.checked ? 'block' : 'none';
    updateAccumPreview();
  });

  // Day preset buttons
  document.querySelectorAll('.accum-day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.accum-day-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('accumCustomDays').value = '';
      updateAccumPreview();
    });
  });

  // Custom days input
  document.getElementById('accumCustomDays')?.addEventListener('input', () => {
    document.querySelectorAll('.accum-day-btn').forEach(b => b.classList.remove('selected'));
    updateAccumPreview();
  });

  // Weight change also updates preview
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
    const weight = parseFloat(document.getElementById('weightInput')?.value) || 0;
    const days = getSelectedAccumDays();
    if (weight > 0 && days > 1) {
      const daily = (weight / days).toFixed(1);
      preview.innerHTML = `${icons.chart} Sistem akan mencatat <strong>${daily} kg/hari</strong> selama ${days} hari ke belakang`;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
  }  // Submit
  document.getElementById('olahForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedMethod) { showToast('Pilih metode pengolahan', 'warning'); return; }
    if (!selectedCategory) { showToast('Pilih jenis bahan sampah', 'warning'); return; }

    const weight = parseFloat(document.getElementById('weightInput').value);
    if (!weight || weight <= 0) { showToast('Masukkan berat olahan', 'warning'); return; }

    const btn = document.getElementById('submitBtn');
    btn.innerHTML = '<div class="spinner" style="margin:0 auto"></div>';
    btn.disabled = true;

    try {
      const desaEl = document.getElementById('desaSelect');
      const desaId = desaEl ? desaEl.value : null;

      if (!desaId) {
        showToast('Pilih wilayah Desa / Kelurahan terlebih dahulu', 'warning');
        btn.innerHTML = 'Simpan Pengolahan';
        btn.disabled = false;
        return;
      }

      const photos = photoPicker?.getPhotos() || [];
      const locationEl = document.getElementById('locationSelect');
      const selectedOption = (locationEl && locationEl.selectedIndex >= 0) ? locationEl.options[locationEl.selectedIndex] : null;
      const methodInfo = TREATMENT_METHODS.find(m => m.id === selectedMethod);

      const isAccum = document.getElementById('accumToggle').checked;
      const accumDays = isAccum ? getSelectedAccumDays() : 1;

      const baseRecord = {
        type: 'olah',
        category_sipsn: selectedCategory,
        treatment_method: selectedMethod,
        treatment_label: methodInfo?.label || selectedMethod,
        lat: gpsData?.latitude || (selectedOption?.dataset?.lat ? parseFloat(selectedOption.dataset.lat) : null),
        lng: gpsData?.longitude || (selectedOption?.dataset?.lng ? parseFloat(selectedOption.dataset.lng) : null),
        location_id: (locationEl && locationEl.value) ? locationEl.value : null,
        location_name: (locationEl && locationEl.value) ? selectedOption.text : '',
        desa_id: desaId,
        photos: photos.map(p => ({ dataUrl: p.dataUrl, name: p.name })),
        photo_count: photos.length,
        user_id: user.id,
        user_name: user.full_name
      };

      if (accumDays > 1) {
        const batchId = crypto.randomUUID();
        // Distribute weight evenly across past N days
        const dailyWeight = parseFloat((weight / accumDays).toFixed(1));
        const now = new Date();
        const oldestDate = new Date(now);
        oldestDate.setDate(oldestDate.getDate() - (accumDays - 1));

        for (let d = 0; d < accumDays; d++) {
          const backDate = new Date(now);
          backDate.setDate(backDate.getDate() - d);
          await addWasteRecord({
            ...baseRecord,
            weight_kg: dailyWeight,
            notes: document.getElementById('notesInput').value.trim() + (d === 0 ? '' : ` [Akumulasi hari ke-${accumDays - d}/${accumDays}]`),
            is_accumulation: true,
            accumulation_days: accumDays,
            accumulation_total_kg: weight,
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
          ...baseRecord,
          weight_kg: weight,
          notes: document.getElementById('notesInput').value.trim(),
        }, user.id);
      }

      showToast(`${weight} kg berhasil dicatat sebagai ${methodInfo?.label}!`, 'success');
      setTimeout(() => { window.location.hash = '#/pwa/sampah-masuk'; }, 800);
    } catch (err) {
      showToast('Gagal: ' + err.message, 'error');
      btn.innerHTML = `${icons.refreshCw} Simpan Pengolahan`;
      btn.disabled = false;
    }
  });
}
