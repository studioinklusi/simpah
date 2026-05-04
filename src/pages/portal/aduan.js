// SIMPAH - Portal Aduan (Public Complaint Form)
import { icons } from '../../components/icons.js';
import { getCurrentPosition } from '../../utils/gps.js';
import { addComplaint } from '../../db/store.js';
import { showToast } from '../../components/toast.js';
import { getCurrentUser } from '../../utils/helpers.js';
import { renderPortalNav, renderPortalFooter, initPortalNav } from './beranda.js';

export function renderAduan() {
  let gpsData = null;
  getCurrentPosition(false).then(p => {
    gpsData = p;
    const el = document.getElementById('aduanGps');
    if (el) {
      el.className = 'gps-indicator active';
      el.querySelector('span:last-child').textContent = `Lokasi terdeteksi: ${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}`;
    }
  }).catch(() => {
    const el = document.getElementById('aduanGps');
    if (el) el.querySelector('span:last-child').textContent = 'Lokasi tidak terdeteksi';
  });

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="portal-layout">
      ${renderPortalNav('aduan')}
      <div style="padding-top:calc(var(--navbar-height) + var(--space-8))">
        <section class="portal-section">
          <div class="portal-section-header">
            <h2>Form <span class="gradient-text">Aduan Masyarakat</span></h2>
            <p>Laporkan masalah terkait sampah di sekitar Anda. Tidak perlu daftar atau login.</p>
          </div>

          <div class="complaint-form" id="complaintFormCard">
            <div class="gps-indicator pending" id="aduanGps">
              ${icons.mapPin}
              <span>Mendeteksi lokasi otomatis...</span>
            </div>

            <form id="complaintForm">
              <div class="form-group">
                <label class="form-label">Nama Pelapor</label>
                <input type="text" id="reporterName" class="form-input" placeholder="Nama Anda (opsional)" />
                <div class="form-hint">Nama tidak wajib diisi</div>
              </div>

              <div class="form-group">
                <label class="form-label">No. Telepon</label>
                <input type="tel" id="reporterPhone" class="form-input" placeholder="08xxxxxxxxxx" />
              </div>

              <div class="form-group" style="display:flex;align-items:center;gap:8px;background:rgba(107,114,128,0.05);padding:var(--space-3);border-radius:var(--radius-md);">
                <input type="checkbox" id="isAnonymous" style="width:18px;height:18px;accent-color:var(--primary-500)" />
                <label for="isAnonymous" style="margin:0;font-size:var(--font-sm);color:var(--text-primary);cursor:pointer">
                  Kirim sebagai Anonim (sembunyikan nama & nomor kontak)
                </label>
              </div>

              <div class="form-group">
                <label class="form-label">Kategori Masalah <span style="color:var(--danger-500)">*</span></label>
                <select id="complaintCategory" class="form-select" required>
                  <option value="">Pilih kategori...</option>
                  <option value="Sampah menumpuk">Sampah menumpuk</option>
                  <option value="Pembuangan liar">Pembuangan liar</option>
                  <option value="Bau tidak sedap">Bau tidak sedap</option>
                  <option value="Sampah di sungai">Sampah di sungai</option>
                  <option value="TPS rusak">TPS rusak / tidak terawat</option>
                  <option value="Pengangkutan terlambat">Pengangkutan terlambat</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Deskripsi <span style="color:var(--danger-500)">*</span></label>
                <textarea id="complaintDesc" class="form-textarea" rows="4" placeholder="Jelaskan permasalahan yang Anda temui..." required></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Alamat Lokasi</label>
                <input type="text" id="complaintAddress" class="form-input" placeholder="Alamat atau patokan lokasi" />
              </div>

              <div class="form-group">
                <label class="form-label">Foto (Opsional)</label>
                <div class="photo-upload" id="photoUploadArea">
                  ${icons.upload}
                  <p>Klik atau seret foto ke sini</p>
                  <div class="upload-hint">Format: JPG, PNG. Maks 5MB</div>
                  <input type="file" id="photoInput" accept="image/*" capture="environment" style="display:none" />
                </div>
                <div id="photoPreview" style="margin-top:var(--space-3);display:none">
                  <img id="photoPreviewImg" style="max-width:100%;border-radius:var(--radius-lg);max-height:200px" />
                  <button type="button" class="btn btn-ghost btn-sm" id="removePhoto" style="margin-top:var(--space-2)">Hapus foto</button>
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-lg btn-block" id="submitComplaint">
                ${icons.messageCircle} Kirim Laporan
              </button>
            </form>
          </div>

          <!-- Success State -->
          <div class="complaint-form" id="complaintSuccess" style="display:none;text-align:center;padding:var(--space-12) var(--space-8)">
            <div style="color:var(--primary-500);margin-bottom:var(--space-4)">${icons.checkCircle}</div>
            <h3 style="font-size:var(--font-2xl);font-weight:800;margin-bottom:var(--space-3)">Laporan Terkirim!</h3>
            <p style="color:var(--text-secondary);margin-bottom:var(--space-4)">Terima kasih atas partisipasi Anda.</p>
            <div style="background:var(--bg-secondary);border-radius:var(--radius-lg);padding:var(--space-4);margin-bottom:var(--space-6)">
              <p style="font-size:var(--font-xs);color:var(--text-muted)">Nomor Tracking Anda:</p>
              <p style="font-size:var(--font-xl);font-weight:800;color:var(--primary-600)" id="trackingNumber">-</p>
            </div>
            <button class="btn btn-primary" id="trackNowBtn">Lacak Aduan Ini</button>
            <button class="btn btn-ghost" onclick="window.location.hash='#/portal'" style="margin-top:var(--space-2)">Kembali ke Beranda</button>
          </div>
        </section>
      </div>
      ${renderPortalFooter()}
    </div>
  `;
  initPortalNav();

  // Photo upload handling
  const uploadArea = document.getElementById('photoUploadArea');
  const photoInput = document.getElementById('photoInput');
  const preview = document.getElementById('photoPreview');
  const previewImg = document.getElementById('photoPreviewImg');

  uploadArea?.addEventListener('click', () => photoInput?.click());
  uploadArea?.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = 'var(--primary-400)'; });
  uploadArea?.addEventListener('dragleave', () => { uploadArea.style.borderColor = ''; });
  uploadArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) handlePhoto(file);
  });

  photoInput?.addEventListener('change', (e) => {
    if (e.target.files[0]) handlePhoto(e.target.files[0]);
  });

  document.getElementById('removePhoto')?.addEventListener('click', () => {
    preview.style.display = 'none';
    uploadArea.style.display = '';
    photoInput.value = '';
  });

  function handlePhoto(file) {
    if (file.size > 5 * 1024 * 1024) { showToast('Ukuran foto maksimal 5MB', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      preview.style.display = 'block';
      uploadArea.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  // Submit
  document.getElementById('complaintForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitComplaint');
    btn.innerHTML = '<div class="spinner" style="margin:0 auto"></div>';
    btn.disabled = true;

    try {
      const user = getCurrentUser();
      const result = await addComplaint({
        reporter_name: document.getElementById('reporterName').value.trim() || 'Anonim',
        reporter_phone: document.getElementById('reporterPhone').value.trim(),
        is_anonymous: document.getElementById('isAnonymous').checked,
        category: document.getElementById('complaintCategory').value,
        description: document.getElementById('complaintDesc').value.trim(),
        address: document.getElementById('complaintAddress').value.trim(),
        lat: gpsData?.latitude || null,
        lng: gpsData?.longitude || null,
        photo_url: previewImg?.src || null
      }, user?.id || null);

      document.getElementById('complaintFormCard').style.display = 'none';
      document.getElementById('complaintSuccess').style.display = 'block';
      document.getElementById('trackingNumber').textContent = result.tracking_number;
      
      document.getElementById('trackNowBtn').addEventListener('click', () => {
        window.location.hash = `#/portal/cek-aduan?resi=${result.tracking_number}`;
      });
    } catch (err) {
      showToast('Gagal mengirim laporan: ' + err.message, 'error');
      btn.innerHTML = `${icons.messageCircle} Kirim Laporan`;
      btn.disabled = false;
    }
  });
}
