// SIMPAH - Input Sampah Terpilah
import { icons } from '../../components/icons.js';
import { SIPSN_CATEGORIES } from '../../utils/sipsn.js';
import { getCurrentUser } from '../../utils/helpers.js';
import { getCurrentPosition } from '../../utils/gps.js';
import { addWasteRecord, addSortedWaste, getAllLocations } from '../../db/store.js';
import { showToast } from '../../components/toast.js';
import { renderPWALayout } from './layout.js';
import { photoPickerHTML, initPhotoPicker } from '../../components/photo-picker.js';

export async function renderInputPilah() {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/login'; return; }
  
  const locations = await getAllLocations();
  let gpsData = null;
  let photoPicker = null;
  
  getCurrentPosition(false).then(pos => {
    gpsData = pos;
    const el = document.getElementById('gpsStatus');
    if (el) { el.className = 'gps-indicator active'; el.querySelector('span:last-child').textContent = `GPS: ${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}`; }
  }).catch(() => {});

  renderPWALayout('Sampah Terpilah', `
    <div class="pwa-form page-enter">
      <div class="gps-indicator pending" id="gpsStatus">
        ${icons.mapPin}
        <span>Mendeteksi lokasi GPS...</span>
      </div>

      <form id="pilahForm">
        <div class="form-group">
          <label class="form-label">Lokasi</label>
          <select id="locationSelect" class="form-select">
            <option value="">Pilih lokasi...</option>
            ${locations.filter(l => ['tps3r', 'bank_sampah'].includes(l.type)).map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
          </select>
        </div>

        <!-- Source -->
        <div class="form-group">
          <label class="form-label">Asal / Sumber Sampah</label>
          <p style="font-size:var(--font-xs); color:var(--text-muted); margin-bottom:var(--space-2);">Pilih untuk mencegah penghitungan ganda.</p>
          <select id="sourceSelect" class="form-select">
            <option value="sumber_langsung">Sumber Langsung (Warga/Rumah Tangga/Pasar)</option>
            <option value="fasilitas">Dari Fasilitas Lain (Pengepul/Bank Sampah Unit/TPS)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Input Berat per Kategori (kg)</label>
          <div class="pilah-categories" id="pilahCategories">
            ${SIPSN_CATEGORIES.map(cat => `
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
    </style>
  `);

  // Init photo picker
  photoPicker = initPhotoPicker('pilah');

  // Plus Minus Controls
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
      const photos = photoPicker?.getPhotos() || [];
      const locationEl = document.getElementById('locationSelect');
      let pilahRecordId = null;

      if (items.length > 0) {
        const record = await addWasteRecord({
          type: 'pilah',
          source_type: document.getElementById('sourceSelect').value,
          category_sipsn: items.length === 1 ? items[0].category_sipsn : 'MIX',
          weight_kg: totalPilah,
          lat: gpsData?.latitude || null,
          lng: gpsData?.longitude || null,
          location_id: locationEl.value || null,
          location_name: locationEl.value ? locationEl.options[locationEl.selectedIndex].text : '',
          notes: document.getElementById('notesInput').value.trim(),
          photos: photos.map(p => ({ dataUrl: p.dataUrl, name: p.name })),
          photo_count: photos.length,
          user_id: user.id,
          user_name: user.name
        }, user.id);
        pilahRecordId = record.id;
        await addSortedWaste(items, record.id, user.id);
      }

      if (residuVal > 0) {
        await addWasteRecord({
          type: 'residu',
          source_type: document.getElementById('sourceSelect').value,
          category_sipsn: 'MIX',
          weight_kg: residuVal,
          lat: gpsData?.latitude || null,
          lng: gpsData?.longitude || null,
          location_id: locationEl.value || null,
          location_name: locationEl.value ? locationEl.options[locationEl.selectedIndex].text : '',
          notes: (document.getElementById('notesInput').value.trim() + (pilahRecordId ? ' [Sisa pemilahan]' : '')).trim(),
          photos: !pilahRecordId ? photos.map(p => ({ dataUrl: p.dataUrl, name: p.name })) : [], // Attach photos to residu if no pilah record
          photo_count: !pilahRecordId ? photos.length : 0,
          user_id: user.id,
          user_name: user.name
        }, user.id);
      }

      showToast('Data pemilahan berhasil disimpan!', 'success');
      setTimeout(() => { window.location.hash = '#/pwa/sampah-masuk'; }, 800);
    } catch (err) {
      showToast('Gagal: ' + err.message, 'error');
      btn.innerHTML = `${icons.recycle} Simpan Data Pilah`;
      btn.disabled = false;
    }
  });
}
