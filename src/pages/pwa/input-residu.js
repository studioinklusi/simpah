// SIMPAH - Input Residu
import { icons } from '../../components/icons.js';
import { getCurrentUser } from '../../utils/helpers.js';
import { getCurrentPosition } from '../../utils/gps.js';
import { addWasteRecord, getAllLocations } from '../../db/store.js';
import { showToast } from '../../components/toast.js';
import { renderPWALayout } from './layout.js';
import { photoPickerHTML, initPhotoPicker } from '../../components/photo-picker.js';

export async function renderInputResidu() {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/login'; return; }
  
  const locations = await getAllLocations();
  let gpsData = null;
  let photoPicker = null;
  getCurrentPosition(false).then(p => { gpsData = p; const el = document.getElementById('gpsStatus'); if(el){el.className='gps-indicator active'; el.querySelector('span:last-child').textContent=`GPS: ${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}`;} }).catch(()=>{});

  renderPWALayout('Residu', `
    <div class="pwa-form page-enter">
      <div class="gps-indicator pending" id="gpsStatus">
        ${icons.mapPin}
        <span>Mendeteksi lokasi...</span>
      </div>

      <form id="residuForm">
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

        <div class="form-group">
          <label class="form-label">Asal / Lokasi</label>
          <select id="locationSelect" class="form-select">
            <option value="">Pilih lokasi asal...</option>
            ${locations.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Tujuan Residu</label>
          <select id="destinationSelect" class="form-select">
            <option value="tpa">TPA</option>
            <option value="sanitary_landfill">Sanitary Landfill</option>
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

  // Init photo picker
  photoPicker = initPhotoPicker('residu');

  // Unit toggle
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
    const locEl = document.getElementById('locationSelect');

    const btn = document.getElementById('submitBtn');
    btn.innerHTML = '<div class="spinner" style="margin:0 auto"></div>';
    btn.disabled = true;

    const photos = photoPicker?.getPhotos() || [];

    try {
      await addWasteRecord({
        type: 'residu',
        category_sipsn: 'LN',
        weight_kg: kg,
        lat: gpsData?.latitude || null,
        lng: gpsData?.longitude || null,
        location_id: locEl.value || null,
        location_name: locEl.value ? locEl.options[locEl.selectedIndex].text : '',
        destination: document.getElementById('destinationSelect').value,
        notes: document.getElementById('notesInput').value.trim(),
        photos: photos.map(p => ({ dataUrl: p.dataUrl, name: p.name })),
        photo_count: photos.length,
        user_id: user.id,
        user_name: user.name
      }, user.id);
      showToast('Data residu berhasil disimpan!', 'success');
      setTimeout(() => { window.location.hash = '#/pwa/home'; }, 800);
    } catch (err) {
      showToast('Gagal: ' + err.message, 'error');
      btn.innerHTML = `${icons.residue} Simpan Data Residu`;
      btn.disabled = false;
    }
  });
}
