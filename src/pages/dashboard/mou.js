// SIMPAH - MoU Management
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatDate } from '../../utils/helpers.js';
import { getAllMou, addMou, updateMouStatus } from '../../db/store.js';
import { showToast } from '../../components/toast.js';
import { renderDashboardLayout } from './layout.js';

export async function renderMou() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') { window.location.hash = '#/dashboard/gis'; return; }

  const mous = await getAllMou();

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
              <span class="badge ${m.status === 'active' ? 'badge-success' : m.status === 'expiring' ? 'badge-warning' : 'badge-danger'}">
                ${m.status === 'active' ? `${icons.checkCircle} Aktif` : m.status === 'expiring' ? `${icons.alert} Segera Habis` : `${icons.xCircle} Kadaluarsa`}
              </span>
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
  `, 'mou');

  document.getElementById('addMouBtn')?.addEventListener('click', () => {
    showToast('Form tambah MoU akan tersedia dalam versi lengkap', 'info');
  });
}
