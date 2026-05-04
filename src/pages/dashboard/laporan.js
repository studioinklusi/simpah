// SIMPAH - Laporan & Export
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatDate, formatWeight } from '../../utils/helpers.js';
import { getAllWasteRecords } from '../../db/store.js';
import { exportToCSV, exportToSIPSN, exportToExcel } from '../../utils/export.js';
import { showToast } from '../../components/toast.js';
import { renderDashboardLayout } from './layout.js';

export async function renderLaporan() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') { window.location.hash = '#/dashboard/gis'; return; }

  const records = await getAllWasteRecords();
  const sorted = records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  renderDashboardLayout('Laporan & Export', `
    <div class="page-enter">
      <div class="section-header">
        <div>
          <h2 class="section-title">Laporan & Export Data</h2>
          <p class="section-subtitle">Generate laporan dan export ke format SIPSN</p>
        </div>
      </div>

      <!-- Report Controls -->
      <div class="report-controls">
        <div class="form-group" style="margin-bottom:0;min-width:140px">
          <label class="form-label" style="font-size:11px">Periode</label>
          <input type="month" id="periodInput" class="form-input" value="${new Date().toISOString().substring(0,7)}" />
        </div>
        <div class="form-group" style="margin-bottom:0;min-width:120px">
          <label class="form-label" style="font-size:11px">Jenis</label>
          <select id="typeFilter" class="form-select">
            <option value="">Semua</option>
            <option value="masuk">Sampah Masuk</option>
            <option value="campur">Sampah Campur</option>
            <option value="pilah">Terpilah</option>
            <option value="olah">Olah Sampah</option>
            <option value="residu">Residu</option>
            <option value="insidental">Insidental</option>
          </select>
        </div>
        <div class="report-actions">
          <button class="btn btn-secondary btn-sm" id="exportCSV">${icons.download} CSV</button>
          <button class="btn btn-secondary btn-sm" id="exportExcel">${icons.download} Excel</button>
          <button class="btn btn-primary btn-sm" id="exportSIPSN">${icons.download} Format SIPSN</button>
        </div>
      </div>

      <!-- Data Preview -->
      <div class="table-container" style="margin-top:var(--space-4)">
        <table class="table" id="reportTable">
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Jenis</th>
              <th>Kategori</th>
              <th>Berat</th>
              <th>Lokasi</th>
              <th>Petugas</th>
              <th>Foto</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="reportBody">
            ${renderReportRows(sorted.slice(0, 50))}
          </tbody>
        </table>
      </div>
      <div style="text-align:center;padding:var(--space-4);color:var(--text-muted);font-size:var(--font-sm)">
        Menampilkan ${Math.min(50, sorted.length)} dari ${sorted.length} data
      </div>
    </div>
  `, 'laporan');

  // Export handlers
  document.getElementById('exportCSV')?.addEventListener('click', () => {
    const filtered = getFilteredRecords(sorted);
    exportToCSV(filtered, 'simpah-data');
    showToast('CSV berhasil di-export!', 'success');
  });

  document.getElementById('exportExcel')?.addEventListener('click', async () => {
    const filtered = getFilteredRecords(sorted);
    await exportToExcel(filtered, 'simpah-report');
    showToast('Excel berhasil di-export!', 'success');
  });

  document.getElementById('exportSIPSN')?.addEventListener('click', () => {
    const period = document.getElementById('periodInput').value;
    const filtered = getFilteredRecords(sorted);
    exportToSIPSN(filtered, period);
    showToast('Data format SIPSN berhasil di-export!', 'success');
  });

  // Filter change
  const filterInputs = ['periodInput', 'typeFilter'];
  filterInputs.forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      const filtered = getFilteredRecords(sorted);
      document.getElementById('reportBody').innerHTML = renderReportRows(filtered.slice(0, 50));
    });
  });
}

function getFilteredRecords(records) {
  let filtered = [...records];
  const period = document.getElementById('periodInput')?.value;
  const type = document.getElementById('typeFilter')?.value;

  if (period) {
    filtered = filtered.filter(r => r.date_str?.startsWith(period));
  }
  if (type) {
    if (type === 'insidental') {
      filtered = filtered.filter(r => r.is_incidental);
    } else {
      filtered = filtered.filter(r => r.type === type && !r.is_incidental);
    }
  }
  return filtered;
}

function renderReportRows(records) {
  if (records.length === 0) {
    return '<tr><td colspan="8" style="text-align:center;padding:var(--space-8);color:var(--text-muted)">Tidak ada data untuk filter ini</td></tr>';
  }
  return records.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${formatDate(r.created_at)}</td>
      <td><span class="badge ${r.is_incidental ? 'badge-warning' : r.type === 'masuk' ? 'badge-success' : r.type === 'campur' ? 'badge-warning' : r.type === 'pilah' ? 'badge-info' : r.type === 'olah' ? 'badge-primary' : 'badge-danger'}">${getTypeLabel(r)}</span></td>
      <td>${r.category_sipsn || '-'}</td>
      <td style="font-weight:600">${formatWeight(r.weight_kg)}</td>
      <td>${r.location_name || '-'}</td>
      <td>${r.user_name || '-'}</td>
      <td style="text-align:center">
        ${r.photo_count > 0
          ? `<span class="badge badge-info" style="cursor:pointer" title="${r.photo_count} foto terlampir">${icons.camera} ${r.photo_count}</span>`
          : '<span style="color:var(--text-muted)">-</span>'
        }
      </td>
      <td>${r.synced ? '<span class="badge badge-success">Synced</span>' : '<span class="badge badge-warning">Pending</span>'}</td>
    </tr>
  `).join('');
}

function getTypeLabel(r) { 
  if (r && r.is_incidental) return 'Insidental';
  const t = typeof r === 'string' ? r : r.type;
  return {masuk:'Masuk',campur:'Campur',pilah:'Terpilah',olah:'Olah',residu:'Residu'}[t]||t; 
}
