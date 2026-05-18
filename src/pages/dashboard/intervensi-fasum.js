// SIMPAH - Intervensi Fasilitas Umum (Fasum)
import { icons } from '../../components/icons.js';
import { getCurrentUser } from '../../utils/helpers.js';
import { getAllPublicFacilities } from '../../db/store.js';
import { renderDashboardLayout } from './layout.js';

export async function renderIntervensiFasum() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') { window.location.hash = '#/dashboard/gis'; return; }

  const facilities = await getAllPublicFacilities();
  
  // Kalkulasi dan urutkan berdasarkan potensi sampah
  const ranked = facilities.map(f => {
    const potensi_harian = (f.capacity_value || 0) * (f.timbulan_per_unit || 0);
    return { ...f, potensi_harian };
  }).sort((a, b) => b.potensi_harian - a.potensi_harian);

  const totalPotensi = ranked.reduce((s, f) => s + f.potensi_harian, 0);

  renderDashboardLayout('Intervensi Fasum', `
    <div class="page-enter">
      <div class="section-header">
        <div>
          <h2 class="section-title">Kinerja Fasilitas Publik</h2>
          <p class="section-subtitle">Analisis potensi timbulan sampah dari fasilitas umum penyumbang terbesar.</p>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid-3" style="margin-bottom:var(--space-6)">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:#3b82f6">${icons.grid}</div>
          <div class="stat-value" style="color:#3b82f6">${ranked.length}</div>
          <div class="stat-label">Fasilitas Terdata</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444">${icons.trashIn}</div>
          <div class="stat-value" style="color:#ef4444">${totalPotensi.toFixed(1)} kg</div>
          <div class="stat-label">Total Potensi Harian Fasum</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b">${icons.alert}</div>
          <div class="stat-value" style="color:#f59e0b">${ranked.filter(f => f.potensi_harian > 200).length}</div>
          <div class="stat-label">Fasilitas Perlu Perhatian (>200 kg)</div>
        </div>
      </div>

      <!-- Ranking Table -->
      <div class="card">
        <div class="table-container" style="border:none">
          <table class="table">
            <thead>
              <tr>
                <th style="width:60px;text-align:center">Rank</th>
                <th>Nama Fasilitas</th>
                <th>Kategori</th>
                <th>Wilayah</th>
                <th style="text-align:right">Kapasitas</th>
                <th style="text-align:right">Potensi Harian</th>
                <th style="text-align:center">Tingkat Urgensi</th>
              </tr>
            </thead>
            <tbody>
              ${ranked.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">Belum ada data fasilitas</td></tr>' : ''}
              ${ranked.map((f, i) => {
                const isKritis = f.potensi_harian >= 500;
                const isPerhatian = f.potensi_harian >= 200 && f.potensi_harian < 500;
                const badgeColor = isKritis ? 'danger' : (isPerhatian ? 'warning' : 'success');
                const label = isKritis ? 'Kritis' : (isPerhatian ? 'Perhatian' : 'Aman');
                return \`
                <tr>
                  <td style="text-align:center"><span class="rank-badge \${i < 3 ? 'rank-top' : ''}">\${i + 1}</span></td>
                  <td>
                    <strong>\${f.name}</strong>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:2px">\${f.address || 'Alamat belum disetel'}</div>
                  </td>
                  <td><span class="badge badge-neutral">\${f.category}</span></td>
                  <td>\${f.kecamatan || '-'}</td>
                  <td style="text-align:right">\${f.capacity_value} \${f.capacity_unit}</td>
                  <td style="text-align:right;font-weight:600;color:\${isKritis ? 'var(--danger-600)' : 'inherit'}">\${f.potensi_harian.toFixed(1)} kg</td>
                  <td style="text-align:center"><span class="badge badge-\${badgeColor}">\${label}</span></td>
                </tr>
                \`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `, 'intervensi-fasum');
}
