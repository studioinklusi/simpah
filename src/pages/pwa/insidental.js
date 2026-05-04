// SIMPAH - Insidental (Incidental Events)
import { icons } from '../../components/icons.js';
import { INCIDENTAL_TYPES } from '../../utils/sipsn.js';
import { getCurrentUser, formatDateTime } from '../../utils/helpers.js';
import { getCurrentPosition } from '../../utils/gps.js';
import { addEvent, getAllEvents } from '../../db/store.js';
import { showToast } from '../../components/toast.js';
import { renderPWALayout } from './layout.js';
import { photoPickerHTML, initPhotoPicker } from '../../components/photo-picker.js';

export async function renderInsidental() {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/login'; return; }
  
  const events = await getAllEvents();
  let gpsData = null;
  let photoPicker = null;
  getCurrentPosition(false).then(p => { gpsData = p; }).catch(()=>{});

  renderPWALayout('Kegiatan Insidental', `
    <div class="page-enter">
      <div class="pwa-form">
        <h3 class="pwa-form-title">${icons.alert} Catat Kegiatan</h3>
        <form id="eventForm">
          <div class="form-group">
            <label class="form-label">Jenis Kegiatan</label>
            <div class="category-grid" style="grid-template-columns:repeat(2,1fr)" id="eventTypeGrid">
              ${INCIDENTAL_TYPES.map(t => `
                <div class="category-chip" data-type="${t.id}">
                  <span class="category-emoji">${t.icon}</span>
                  <span>${t.label}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Judul Kegiatan</label>
            <input type="text" id="eventTitle" class="form-input" placeholder="Contoh: Kerja Bakti RT 05" required />
          </div>
          <div class="form-group">
            <label class="form-label">Lokasi</label>
            <input type="text" id="eventLocation" class="form-input" placeholder="Nama lokasi kegiatan" />
          </div>
          <div class="form-group">
            <label class="form-label">Jumlah Peserta</label>
            <input type="number" id="eventParticipants" class="form-input" placeholder="0" min="0" inputmode="numeric" />
          </div>
          <div class="form-group">
            <label class="form-label">Deskripsi</label>
            <textarea id="eventDesc" class="form-textarea" rows="3" placeholder="Deskripsi kegiatan..."></textarea>
          </div>
          ${photoPickerHTML('insidental', false, 3)}
          <button type="submit" class="btn btn-primary btn-lg btn-block">${icons.plus} Simpan Kegiatan</button>
        </form>
      </div>

      ${events.length > 0 ? `
        <div class="section-header" style="margin-top:var(--space-6)">
          <h3 style="font-size:var(--font-base);font-weight:700">Riwayat Kegiatan</h3>
        </div>
        <div class="record-list">
          ${events.map(e => `
            <div class="record-item">
              <div class="record-icon" style="background:rgba(139,92,246,0.12)">${INCIDENTAL_TYPES.find(t=>t.id===e.type)?.icon || icons.box}</div>
              <div class="record-info">
                <div class="record-title">${e.title}</div>
                <div class="record-meta">${e.location_name || '-'} · ${formatDateTime(e.created_at)}</div>
              </div>
              <div class="record-value" style="text-align:right">
                ${e.photo_count ? `<div style="font-size:11px;color:var(--info-500);margin-bottom:2px">${icons.camera} ${e.photo_count}</div>` : ''}
                <div>${e.participants || '-'}<small> org</small></div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `);

  photoPicker = initPhotoPicker('insidental');

  let selectedType = null;
  document.querySelectorAll('#eventTypeGrid .category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#eventTypeGrid .category-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedType = chip.dataset.type;
    });
  });

  document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedType) { showToast('Pilih jenis kegiatan', 'warning'); return; }
    try {
      const photos = photoPicker?.getPhotos() || [];
      await addEvent({
        type: selectedType,
        title: document.getElementById('eventTitle').value.trim(),
        location_name: document.getElementById('eventLocation').value.trim(),
        participants: parseInt(document.getElementById('eventParticipants').value) || 0,
        description: document.getElementById('eventDesc').value.trim(),
        lat: gpsData?.latitude, lng: gpsData?.longitude,
        photos: photos.map(p => ({ dataUrl: p.dataUrl, name: p.name })),
        photo_count: photos.length,
        user_id: user.id, user_name: user.name
      }, user.id);
      showToast('Kegiatan berhasil dicatat!', 'success');
      renderInsidental();
    } catch (err) {
      showToast('Gagal: ' + err.message, 'error');
    }
  });
}
