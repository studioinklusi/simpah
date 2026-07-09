// SIMPAH - Insidental (Incidental Events)
import { icons } from '../../components/icons.js';
import { INCIDENTAL_TYPES, SIPSN_CATEGORIES } from '../../utils/sipsn.js';
import { getCurrentUser, formatDateTime } from '../../utils/helpers.js';
import { getCurrentPosition } from '../../utils/gps.js';
import { addEvent, getAllEvents, getAllMasterWilayah } from '../../db/store.js';
import { getDB } from '../../db/schema.js';
import { showToast } from '../../components/toast.js';
import { renderPWALayout } from './layout.js';
import { photoPickerHTML, initPhotoPicker } from '../../components/photo-picker.js';
import { escapeHTML, sanitizeURL } from '../../utils/sanitize.js';
import { wireSearchableSelect } from '../../utils/searchable-select.js';

export async function renderInsidental() {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/login'; return; }
  
  const [events, masterWilayah] = await Promise.all([
    getAllEvents(),
    getAllMasterWilayah()
  ]);
  
  const userDesa = user.desa_id ? masterWilayah.find(w => w.id === user.desa_id) : null;
  const isKader = user?.role === 'petugas' && user?.job_type === 'kader' && userDesa;
  
  let gpsData = null;
  let photoPicker = null;
  getCurrentPosition(false).then(p => { gpsData = p; }).catch(()=>{});

  // Auto-resync legacy events to populate new columns (desa_id, weight_kg) after migration is run
  if (navigator.onLine && events.length > 0) {
    try {
      let needsResync = false;
      const db = await getDB();
      const tx = db.transaction('incidental_events', 'readwrite');
      for (const e of events) {
        if ((e.weight_kg > 0 || e.desa_id) && e.synced && !e.is_demo) {
          e.synced = false;
          await tx.store.put(e);
          needsResync = true;
        }
      }
      await tx.done;
      if (needsResync) {
        const { triggerSync } = await import('../../db/sync.js');
        triggerSync().catch(err => console.error('[Auto-Resync Error]', err));
      }
    } catch (err) {
      console.warn('[Auto-Resync Check Failed]', err);
    }
  }

  renderPWALayout('Kegiatan Insidental', `
    <div class="page-enter">
      <div class="pwa-form">
        <h3 class="pwa-form-title">${icons.alert} Catat Kegiatan</h3>
        <form id="eventForm">
          
          <!-- Location (Wilayah) -->
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
            <label class="form-label">Lokasi Spesifik (Fasilitas / RT-RW)</label>
            <input type="text" id="eventLocation" class="form-input" placeholder="Contoh: Balai Desa / RT 03" />
          </div>
          <div class="form-group">
            <label class="form-label">Jumlah Peserta</label>
            <input type="number" id="eventParticipants" class="form-input" placeholder="0" min="0" inputmode="numeric" />
          </div>
          <div class="form-group">
            <label class="form-label">Deskripsi</label>
            <textarea id="eventDesc" class="form-textarea" rows="3" placeholder="Deskripsi kegiatan..."></textarea>
          </div>
          
          <!-- Waste properties (required for volume chart calculations) -->
          <div class="form-group">
            <label class="form-label">Estimasi Sampah Terkumpul (kg) <span style="color:var(--danger-500)">*</span></label>
            <input type="number" id="eventWeight" class="form-input" placeholder="Contoh: 25" min="0.01" step="any" inputmode="decimal" required />
            <div style="display:flex;align-items:flex-start;gap:6px;margin-top:6px;padding:8px 10px;background:rgba(59,130,246,0.08);border-left:3px solid var(--info-500);border-radius:4px;font-size:var(--font-xs);color:var(--info-700)">
              <span style="flex-shrink:0;margin-top:1px">📊</span>
              <span>Data berat <strong>wajib diisi</strong> agar kegiatan ini terhitung di grafik <em>Volume per Jenis</em> pada Dashboard Eksekutif.</span>
            </div>
          </div>
          
          <div class="form-group" id="categoryGroup">
            <label class="form-label">Kategori Sampah SIPSN <span style="color:var(--danger-500)">*</span></label>
            <select id="eventCategorySipsn" class="form-select" required>
              <option value="">-- Pilih Kategori --</option>
              ${SIPSN_CATEGORIES.map(c => `<option value="${c.code}">${c.name}</option>`).join('')}
            </select>
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
          ${events.map(e => {
            const eventDesa = e.desa_id ? masterWilayah.find(w => w.id === e.desa_id) : null;
            const locationText = eventDesa 
              ? `Desa ${eventDesa.desa_kelurahan}` + (e.location_name ? `, ${e.location_name}` : '') 
              : (e.location_name || '-');
            
            return `
              <div class="record-item">
                <div class="record-icon" style="background:rgba(139,92,246,0.12)">${INCIDENTAL_TYPES.find(t=>t.id===e.type)?.icon || icons.box}</div>
                <div class="record-info">
                  <div class="record-title">${escapeHTML(e.title)}</div>
                  <div class="record-meta">${escapeHTML(locationText)} · ${formatDateTime(e.created_at)}</div>
                </div>
                <div class="record-value" style="text-align:right">
                  ${(e.photo_url || e.photo_count)
                    ? `<div style="font-size:11px;color:var(--info-500);margin-bottom:2px;cursor:pointer" onclick="${e.photo_url ? `window.open('${escapeHTML(sanitizeURL(e.photo_url))}','_blank')` : ''}" title="Lihat Foto">${icons.camera} ${e.photo_count || 1}</div>`
                    : ''
                  }
                  <div>${e.participants || '-'}<small> org</small></div>
                  ${e.weight_kg ? `<div style="font-size:11px;font-weight:600;color:var(--warning-600);margin-top:2px">${e.weight_kg} kg</div>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    </div>
  `);

  photoPicker = initPhotoPicker('insidental');

  // Wilayah autocomplete wiring
  const kecSelect = document.getElementById('kecamatanSelect');
  const desaSelectInput = document.getElementById('desaSelectInput');
  const desaSelect = document.getElementById('desaSelect');
  const desaGroup = document.getElementById('desaGroup');
  const kecFeedback = document.getElementById('kecFeedback');
  const desaFeedback = document.getElementById('desaFeedback');

  let selectKecInstance, selectDesaInstance;
  const kecHidden = { value: userDesa ? userDesa.kecamatan : '' };

  if (!isKader) {
    selectKecInstance = wireSearchableSelect({
      inputEl: kecSelect,
      dropdownEl: document.getElementById('kecDropdown'),
      hiddenEl: kecHidden,
      feedbackEl: kecFeedback,
      getOptions: () => {
        const uniqueKec = [...new Set(masterWilayah.map(w => w.kecamatan))].sort();
        return uniqueKec.map(k => ({ value: k, label: k }));
      },
      onSelect: () => {
        desaGroup.style.display = 'block';
        desaSelectInput.value = '';
        desaSelect.value = '';
      },
      onClear: () => {
        desaGroup.style.display = 'none';
        desaSelectInput.value = '';
        desaSelect.value = '';
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
      onSelect: () => {},
      onClear: () => {}
    });
  }

  const weightInput = document.getElementById('eventWeight');
  const catSelect = document.getElementById('eventCategorySipsn');

  // Type grid selection
  let selectedType = null;
  document.querySelectorAll('#eventTypeGrid .category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#eventTypeGrid .category-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedType = chip.dataset.type;
    });
  });

  // Submit form handler
  document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedType) { showToast('Pilih jenis kegiatan', 'warning'); return; }
    const weightVal = parseFloat(weightInput.value) || 0;
    if (weightVal <= 0) { showToast('Estimasi berat sampah wajib diisi dan harus lebih dari 0 kg', 'warning'); weightInput.focus(); return; }
    if (!catSelect.value) { showToast('Pilih kategori sampah SIPSN', 'warning'); catSelect.focus(); return; }
    
    const desaId = desaSelect.value;
    if (!desaId) {
      showToast('Pilih wilayah Kecamatan dan Desa terlebih dahulu', 'warning');
      return;
    }

    try {
      const photos = photoPicker?.getPhotos() || [];
      await addEvent({
        type: selectedType,
        title: document.getElementById('eventTitle').value.trim(),
        location_name: document.getElementById('eventLocation').value.trim(),
        participants: parseInt(document.getElementById('eventParticipants').value) || 0,
        description: document.getElementById('eventDesc').value.trim(),
        desa_id: desaId,
        weight_kg: parseFloat(weightInput.value) || 0,
        category_sipsn: catSelect.value || null,
        lat: gpsData?.latitude, lng: gpsData?.longitude,
        photos: photos.map(p => ({ dataUrl: p.dataUrl, name: p.name })),
        photo_count: photos.length,
        user_id: user.id, user_name: user.full_name
      }, user.id);
      showToast('Kegiatan berhasil dicatat!', 'success');
      renderInsidental();
    } catch (err) {
      showToast('Gagal: ' + err.message, 'error');
    }
  });
}
