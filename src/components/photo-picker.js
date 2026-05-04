// SIMPAH - Photo Picker Component
// Handles camera capture & gallery upload, compresses to JPEG base64
import { icons } from './icons.js';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB raw
const TARGET_WIDTH  = 1024;              // max output width
const JPEG_QUALITY  = 0.75;

/**
 * Render a photo picker section HTML string.
 * @param {string} id - unique prefix for element IDs (e.g. 'form1')
 * @param {boolean} required - whether at least one photo is required
 * @param {number}  maxPhotos - maximum number of photos allowed
 */
export function photoPickerHTML(id = 'photo', required = false, maxPhotos = 3) {
  return `
    <div class="photo-picker" data-id="${id}" data-max="${maxPhotos}">
      <div class="photo-picker-header">
        <label class="form-label">
          Foto Bukti ${required ? '<span style="color:var(--danger-500)">*</span>' : '(Opsional)'}
        </label>
        <span class="photo-counter" id="${id}-counter">0 / ${maxPhotos}</span>
      </div>

      <div class="photo-preview-grid" id="${id}-preview"></div>

      <div class="photo-actions" id="${id}-actions">
        <button type="button" class="photo-action-btn" id="${id}-camera">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
          Ambil Foto
        </button>
        <button type="button" class="photo-action-btn" id="${id}-gallery">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          Galeri
        </button>
      </div>

      <!-- hidden inputs -->
      <input type="file" id="${id}-input-camera"  accept="image/*" capture="environment" style="display:none" />
      <input type="file" id="${id}-input-gallery" accept="image/*" multiple style="display:none" />
    </div>

    <style>
      .photo-picker { margin-bottom: var(--space-5); }
      .photo-picker-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-3); }
      .photo-counter { font-size:var(--font-xs); color:var(--text-muted); background:var(--bg-secondary); padding:2px 8px; border-radius:var(--radius-full); }
      .photo-preview-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:var(--space-2); margin-bottom:var(--space-3); }
      .photo-thumb { position:relative; aspect-ratio:1; border-radius:var(--radius-lg); overflow:hidden; background:var(--bg-secondary); }
      .photo-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
      .photo-thumb-remove { position:absolute; top:4px; right:4px; width:22px; height:22px; border-radius:50%; background:rgba(0,0,0,0.55); border:none; color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; line-height:1; transition:background var(--transition-fast); }
      .photo-thumb-remove:hover { background:var(--danger-600); }
      .photo-actions { display:grid; grid-template-columns:1fr 1fr; gap:var(--space-2); }
      .photo-action-btn { display:flex; align-items:center; justify-content:center; gap:var(--space-2); padding:var(--space-3) var(--space-4); border-radius:var(--radius-lg); border:1.5px dashed var(--border-color); background:var(--bg-secondary); color:var(--text-secondary); font-size:var(--font-sm); font-weight:500; cursor:pointer; transition:all var(--transition-fast); }
      .photo-action-btn:hover { border-color:var(--primary-400); color:var(--primary-500); background:rgba(16,185,129,0.06); }
      .photo-action-btn:disabled { opacity:0.4; cursor:not-allowed; }
    </style>
  `;
}

/**
 * Initialise event listeners for a given photo picker.
 * Returns a { getPhotos, reset } controller object.
 */
export function initPhotoPicker(id, { onUpdate } = {}) {
  const photos = [];
  const maxPhotos = parseInt(document.querySelector(`[data-id="${id}"]`)?.dataset.max || 3);

  const cameraInput  = document.getElementById(`${id}-input-camera`);
  const galleryInput = document.getElementById(`${id}-input-gallery`);
  const cameraBtn   = document.getElementById(`${id}-camera`);
  const galleryBtn  = document.getElementById(`${id}-gallery`);

  cameraBtn?.addEventListener('click', () => cameraInput?.click());
  galleryBtn?.addEventListener('click', () => galleryInput?.click());

  cameraInput?.addEventListener('change', e => handleFiles(e.target.files));
  galleryInput?.addEventListener('change', e => handleFiles(e.target.files));

  async function handleFiles(fileList) {
    for (const file of Array.from(fileList)) {
      if (photos.length >= maxPhotos) break;
      if (!file.type.startsWith('image/')) continue;
      if (file.size > MAX_SIZE_BYTES) {
        const { showToast } = await import('../components/toast.js');
        showToast(`${file.name} terlalu besar (maks 5 MB)`, 'warning');
        continue;
      }
      const dataUrl = await compressImage(file);
      photos.push({ name: file.name, dataUrl, size: file.size });
      renderThumbs();
      if (onUpdate) onUpdate(photos);
    }
    // reset file input so the same file can be re-selected
    cameraInput.value = '';
    galleryInput.value = '';
  }

  function renderThumbs() {
    const grid    = document.getElementById(`${id}-preview`);
    const counter = document.getElementById(`${id}-counter`);
    const actions = document.getElementById(`${id}-actions`);
    if (!grid) return;

    grid.innerHTML = photos.map((p, i) => `
      <div class="photo-thumb">
        <img src="${p.dataUrl}" alt="Foto ${i+1}" />
        <button type="button" class="photo-thumb-remove" data-idx="${i}" title="Hapus foto">${icons.close}</button>
      </div>
    `).join('');

    // wire remove buttons
    grid.querySelectorAll('.photo-thumb-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        photos.splice(parseInt(btn.dataset.idx), 1);
        renderThumbs();
        if (onUpdate) onUpdate(photos);
      });
    });

    if (counter) counter.textContent = `${photos.length} / ${maxPhotos}`;

    // hide/disable action buttons when full
    const full = photos.length >= maxPhotos;
    [cameraBtn, galleryBtn].forEach(b => { if (b) b.disabled = full; });
    if (actions) actions.style.display = full ? 'none' : '';
  }

  return {
    getPhotos: () => photos,
    reset: () => { photos.length = 0; renderThumbs(); }
  };
}

// ─── Image Compression ───────────────────────────────────────────────────────
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, TARGET_WIDTH / img.width);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
