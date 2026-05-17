// SIMPAH - MoU Management
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatDate } from '../../utils/helpers.js';
import { getAllMou, addMou, updateMou, deleteMou } from '../../db/store.js';
import { showToast } from '../../components/toast.js';
import { renderDashboardLayout } from './layout.js';

export async function renderMou() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') { window.location.hash = '#/dashboard/gis'; return; }

  let mous = await getAllMou();

  // Kalkulasi status MoU secara dinamis berdasarkan tanggal hari ini
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  mous = mous.map(m => {
    const endDate = new Date(m.end_date);
    let computedStatus = 'active';
    if (endDate < today) {
      computedStatus = 'expired';
    } else if (endDate <= thirtyDaysFromNow) {
      computedStatus = 'expiring';
    }
    return { ...m, status: computedStatus };
  });

  renderDashboardLayout('Manajemen MoU', `
    <div class="page-enter">
      <div class="section-header">
        <div>
          <h2 class="section-title">Manajemen MoU Transporter</h2>
          <p class="section-subtitle">Kelola perjanjian kerjasama pengangkutan sampah</p>
        </div>
        <button class="btn btn-primary" id="addMouBtn">${icons.plus} Tambah MoU</button>
      </div>

      <!-- Stats -->
      <div class="grid-3" style="margin-bottom:var(--space-6)">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.12);color:var(--primary-600)">${icons.shield}</div>
          <div class="stat-value" style="color:var(--primary-600)">${mous.filter(m=>m.status==='active').length}</div>
          <div class="stat-label">MoU Aktif</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.12);color:var(--accent-600)">${icons.alert}</div>
          <div class="stat-value" style="color:var(--accent-600)">${mous.filter(m=>m.status==='expiring').length}</div>
          <div class="stat-label">Segera Habis</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,0.12);color:var(--danger-600)">${icons.x}</div>
          <div class="stat-value" style="color:var(--danger-500)">${mous.filter(m=>m.status==='expired').length}</div>
          <div class="stat-label">Kadaluarsa</div>
        </div>
      </div>

      <!-- MoU List -->
      <div class="mou-list">
        ${mous.map(m => `
          <div class="card" style="margin-bottom:var(--space-4)">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:var(--space-3)">
              <div>
                <h3 style="font-size:var(--font-lg);font-weight:700;margin-bottom:var(--space-1)">${m.transporter_name}</h3>
                <p style="font-size:var(--font-sm);color:var(--text-secondary)">${m.contract_number}</p>
              </div>
              <div style="display:flex;align-items:center;gap:var(--space-2)">
                <span class="badge ${m.status === 'active' ? 'badge-success' : m.status === 'expiring' ? 'badge-warning' : 'badge-danger'}">
                  ${m.status === 'active' ? `${icons.checkCircle} Aktif` : m.status === 'expiring' ? `${icons.alert} Segera Habis` : `${icons.xCircle} Kadaluarsa`}
                </span>
                <button class="md-btn-icon" style="border:none;background:transparent;cursor:pointer" title="Edit" data-edit-mou="${m.id}">${icons.edit}</button>
                <button class="md-btn-icon" style="border:none;background:transparent;cursor:pointer;color:var(--danger-500)" title="Hapus" data-del-mou="${m.id}">${icons.trash}</button>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--space-4);margin-top:var(--space-4);padding-top:var(--space-4);border-top:1px solid var(--border-color)">
              <div>
                <div style="font-size:var(--font-xs);color:var(--text-muted);margin-bottom:2px">Mulai</div>
                <div style="font-size:var(--font-sm);font-weight:600">${formatDate(m.start_date)}</div>
              </div>
              <div>
                <div style="font-size:var(--font-xs);color:var(--text-muted);margin-bottom:2px">Berakhir</div>
                <div style="font-size:var(--font-sm);font-weight:600">${formatDate(m.end_date)}</div>
              </div>
              <div>
                <div style="font-size:var(--font-xs);color:var(--text-muted);margin-bottom:2px">Kontak</div>
                <div style="font-size:var(--font-sm);font-weight:600">${m.contact_person || '-'}</div>
              </div>
              <div>
                <div style="font-size:var(--font-xs);color:var(--text-muted);margin-bottom:2px">Telepon</div>
                <div style="font-size:var(--font-sm);font-weight:600">${m.phone || '-'}</div>
              </div>
            </div>
            ${m.fleet_ids?.length ? `
              <div style="margin-top:var(--space-3)">
                <span style="font-size:var(--font-xs);color:var(--text-muted)">Kendaraan terkait: </span>
                ${m.fleet_ids.map(fid => `<span class="badge badge-neutral" style="margin-right:4px">${fid}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
        ${mous.length === 0 ? '<div class="empty-state"><h3>Belum ada MoU</h3><p>Tambahkan MoU transporter pertama</p></div>' : ''}
      </div>
    </div>

    <!-- Modal Overlay -->
    <div class="md-modal-overlay" id="mouModal" style="display:none">
      <div class="md-modal">
        <div class="md-modal-header">
          <h3 id="mouModalTitle">Form MoU</h3>
          <button class="md-modal-close" id="mouModalClose">${icons.close}</button>
        </div>
        <div class="md-modal-body" id="mouModalBody"></div>
      </div>
    </div>

    <style>
      .md-modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:1000; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s ease; }
      .md-modal { background:var(--bg-primary); border-radius:var(--radius-xl); width:90%; max-width:520px; max-height:85vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.2); animation:scaleIn 0.2s ease; }
      .md-modal-header { display:flex; justify-content:space-between; align-items:center; padding:var(--space-5) var(--space-6); border-bottom:1px solid var(--border-color); }
      .md-modal-header h3 { font-size:var(--font-lg); font-weight:700; }
      .md-modal-close { width:32px; height:32px; border-radius:var(--radius-full); border:none; background:var(--gray-100); cursor:pointer; display:flex; align-items:center; justify-content:center; }
      .md-modal-body { padding:var(--space-5) var(--space-6); }
      .md-modal-body .form-group { margin-bottom:var(--space-4); }
      .md-modal-body .form-label { display:block; font-size:var(--font-sm); font-weight:600; margin-bottom:var(--space-2); }
      .md-modal-body .form-actions { display:flex; gap:var(--space-3); justify-content:flex-end; margin-top:var(--space-5); padding-top:var(--space-4); border-top:1px solid var(--border-color); }
    </style>
  `, 'mou');

  function openMouModal(title, bodyHTML) {
    document.getElementById('mouModalTitle').textContent = title;
    document.getElementById('mouModalBody').innerHTML = bodyHTML;
    document.getElementById('mouModal').style.display = 'flex';
  }

  function closeMouModal() {
    document.getElementById('mouModal').style.display = 'none';
  }

  document.getElementById('mouModalClose')?.addEventListener('click', closeMouModal);
  document.getElementById('mouModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'mouModal') closeMouModal();
  });

  document.querySelectorAll('[data-edit-mou]').forEach(btn => btn.addEventListener('click', () => {
    const mou = mous.find(x => x.id === btn.dataset.editMou);
    if (mou) openMouForm(mou);
  }));

  document.querySelectorAll('[data-del-mou]').forEach(btn => btn.addEventListener('click', async () => {
    if (confirm('Yakin ingin menghapus MoU ini?')) {
      try {
        await deleteMou(btn.dataset.delMou);
        showToast('MoU berhasil dihapus', 'success');
        renderMou();
      } catch (err) {
        showToast('Gagal: ' + err.message, 'error');
      }
    }
  }));

  document.getElementById('addMouBtn')?.addEventListener('click', () => openMouForm());

  function openMouForm(existing = null) {
    const isEdit = !!existing;
    openMouModal(isEdit ? 'Edit MoU' : 'Tambah MoU Baru', `
      <form id="mouForm">
        <div class="form-group">
          <label class="form-label">Nama Transporter / Rekanan</label>
          <input class="form-input" id="mouName" required value="${existing?.transporter_name || ''}" placeholder="Misal: PT Bersih Lingkungan" />
        </div>
        <div class="form-group">
          <label class="form-label">Nomor Kontrak</label>
          <input class="form-input" id="mouContract" required value="${existing?.contract_number || ''}" placeholder="Misal: MOU-2023-001" />
        </div>
        <div style="display:flex;gap:var(--space-3)">
          <div class="form-group" style="flex:1">
            <label class="form-label">Tanggal Mulai</label>
            <input class="form-input" id="mouStart" type="date" required value="${existing?.start_date?.split('T')[0] || ''}" />
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Tanggal Berakhir</label>
            <input class="form-input" id="mouEnd" type="date" required value="${existing?.end_date?.split('T')[0] || ''}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Nama Kontak (Opsional)</label>
          <input class="form-input" id="mouContact" value="${existing?.contact_person || ''}" placeholder="Misal: Budi Santoso" />
        </div>
        <div class="form-group">
          <label class="form-label">No. Telepon (Opsional)</label>
          <input class="form-input" id="mouPhone" type="tel" value="${existing?.phone || ''}" placeholder="Misal: 08123456789" />
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="mouStatus">
            <option value="active" ${existing?.status === 'active' || !existing ? 'selected' : ''}>Aktif</option>
            <option value="expiring" ${existing?.status === 'expiring' ? 'selected' : ''}>Segera Habis</option>
            <option value="expired" ${existing?.status === 'expired' ? 'selected' : ''}>Kadaluarsa</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" onclick="document.getElementById('mouModal').style.display='none'">Batal</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Simpan Perubahan' : 'Simpan MoU'}</button>
        </div>
      </form>
    `);

    document.getElementById('mouForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const data = {
        transporter_name: document.getElementById('mouName').value.trim(),
        contract_number: document.getElementById('mouContract').value.trim(),
        start_date: document.getElementById('mouStart').value,
        end_date: document.getElementById('mouEnd').value,
        contact_person: document.getElementById('mouContact').value.trim() || null,
        phone: document.getElementById('mouPhone').value.trim() || null,
        status: document.getElementById('mouStatus').value,
      };

      try {
        if (isEdit) {
          await updateMou(existing.id, data);
          showToast('MoU berhasil diperbarui', 'success');
        } else {
          data.created_at = new Date().toISOString();
          await addMou(data);
          showToast('MoU baru berhasil ditambahkan', 'success');
        }
        closeMouModal();
        renderMou(); // reload page
      } catch (err) {
        showToast('Gagal: ' + err.message, 'error');
      }
    });
  }
}
