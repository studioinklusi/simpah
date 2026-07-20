// SIMPAH - Laporan & Export
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatDate, formatWeight } from '../../utils/helpers.js';
import { getAllWasteRecords, getAllLocations, getAllEvents, getAllMasterWilayah, getAllUsers } from '../../db/store.js';
import { exportToCSV, exportToSIPSN, exportToExcel } from '../../utils/export.js';
import { showToast } from '../../components/toast.js';
import { renderDashboardLayout } from './layout.js';
import { hasPermission } from '../../utils/permissions.js';
import { escapeHTML, sanitizeURL } from '../../utils/sanitize.js';
import { SIPSN_CATEGORIES, getCategoryByCode } from '../../utils/sipsn.js';

export async function renderLaporan() {
  const user = getCurrentUser();
  if (!user || !hasPermission(user, 'EXPORT_REPORTS')) { window.location.hash = '#/dashboard/gis'; return; }

  const [wasteRecords, incidentalEvents, masterLocations, masterWilayah, allUsers] = await Promise.all([
    getAllWasteRecords(),
    getAllEvents(),
    getAllLocations(),
    getAllMasterWilayah(),
    getAllUsers()
  ]);

  // Normalize incidental events to match waste records format
  const normalizedEvents = incidentalEvents.map(e => {
    const eventDesa = e.desa_id ? masterWilayah.find(w => w.id === e.desa_id) : null;
    const locationText = eventDesa 
      ? `Desa ${eventDesa.desa_kelurahan}` + (e.location_name ? `, ${e.location_name}` : '') 
      : (e.location_name || '-');
    return {
      ...e,
      is_incidental: true,
      location_name: locationText,
      date_str: e.created_at ? e.created_at.split('T')[0] : null,
      verification_status: 'approved'
    };
  });

  const records = [...wasteRecords, ...normalizedEvents];
  const sorted = records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Use master locations (active only) — deleted locations won't appear
  const locations = masterLocations.sort((a, b) => (a.name || '').localeCompare(b.name || ''));


  // Get default dates (first and last day of current month)
  const defaultStartDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const defaultEndDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

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
        <div class="form-group" style="margin-bottom:0;min-width:120px">
          <label class="form-label" style="font-size:11px">Tanggal Mulai</label>
          <input type="date" id="startDateInput" class="form-input" value="${defaultStartDate}" />
        </div>
        <div class="form-group" style="margin-bottom:0;min-width:120px">
          <label class="form-label" style="font-size:11px">Tanggal Selesai</label>
          <input type="date" id="endDateInput" class="form-input" value="${defaultEndDate}" />
        </div>
        <div class="form-group" style="margin-bottom:0;min-width:120px">
          <label class="form-label" style="font-size:11px">Jenis</label>
          <select id="typeFilter" class="form-select">
            <option value="">Semua Jenis</option>
            <option value="campur">Sampah Campur</option>
            <option value="pilah">Terpilah</option>
            <option value="olah">Olah Sampah</option>
            <option value="residu">Residu</option>
            <option value="insidental">Insidental</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;min-width:120px">
          <label class="form-label" style="font-size:11px">Lokasi</label>
          <select id="locationFilter" class="form-select">
            <option value="">Semua Lokasi</option>
            ${locations.map(loc => `<option value="${escapeHTML(loc.id)}">${escapeHTML(loc.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;min-width:120px">
          <label class="form-label" style="font-size:11px">Tipe Petugas</label>
          <select id="userFilter" class="form-select">
            <option value="">Semua Tipe</option>
            <option value="kader">Kader Lingkungan</option>
            <option value="angkut">Petugas Angkut</option>
            <option value="operator_tps">Operator TPS3R</option>
            <option value="admin">Administrator / Dinas</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;min-width:120px">
          <label class="form-label" style="font-size:11px">Kategori</label>
          <select id="categoryFilter" class="form-select">
            <option value="">Semua Kategori</option>
            ${SIPSN_CATEGORIES.map(cat => `<option value="${cat.code}">${cat.name} (${cat.code})</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Export Options Card -->
      <div class="export-options-card">
        <h3 class="export-section-title">Pilih Format Unduhan & Pelaporan</h3>
        <div class="export-options-grid">
          
          <div class="export-option-item">
            <button class="btn btn-secondary btn-sm" id="exportExcel">
              ${icons.download} Unduh Excel (.xlsx)
            </button>
            <p class="export-option-desc">Data detail transaksi terformat rapi untuk dibuka di Microsoft Excel atau Google Sheets.</p>
          </div>

          <div class="export-option-item">
            <button class="btn btn-secondary btn-sm" id="exportCSV">
              ${icons.download} Unduh CSV (.csv)
            </button>
            <p class="export-option-desc">Data transaksi dalam bentuk teks mentah (CSV). Cocok untuk integrasi dengan sistem database.</p>
          </div>

          <div class="export-option-item sipsn-highlight">
            <button class="btn btn-primary btn-sm" id="exportSIPSN">
              ${icons.download} Unduh Format SIPSN (.xlsx)
            </button>
            <p class="export-option-desc">Data rekapitulasi bulanan kumulatif. Kolom disesuaikan agar bisa langsung di-upload ke sistem SIPSN Kementerian LHK.</p>
          </div>

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
            <!-- Rendered dynamically -->
          </tbody>
        </table>
      </div>
      <div id="reportInfo" style="text-align:center;padding:var(--space-4) var(--space-4) 0;color:var(--text-muted);font-size:var(--font-sm)"></div>
      <div id="reportPagination" style="display:flex; justify-content:center; align-items:center; gap:var(--space-2); margin-top:var(--space-4); margin-bottom:var(--space-6);"></div>
    </div>
  `, 'laporan');

  // Export handlers
  document.getElementById('exportCSV')?.addEventListener('click', () => {
    const filtered = getFilteredRecords(sorted, allUsers);
    exportToCSV(filtered, 'simpah-data');
    showToast('CSV berhasil di-export!', 'success');
  });

  document.getElementById('exportExcel')?.addEventListener('click', async () => {
    const filtered = getFilteredRecords(sorted, allUsers);
    await exportToExcel(filtered, 'simpah-report');
    showToast('Excel berhasil di-export!', 'success');
  });

  document.getElementById('exportSIPSN')?.addEventListener('click', () => {
    const startDate = document.getElementById('startDateInput').value;
    const period = startDate ? startDate.substring(0, 7) : new Date().toISOString().substring(0, 7);
    const filtered = getFilteredRecords(sorted, allUsers);
    exportToSIPSN(filtered, period);
    showToast('Data format SIPSN berhasil di-export!', 'success');
  });

  let currentPage = 1;
  const itemsPerPage = 50;

  const updateTable = () => {
    const filtered = getFilteredRecords(sorted, allUsers);
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const isMobile = window.innerWidth <= 768;
    const limit = isMobile ? (currentPage * itemsPerPage) : itemsPerPage;
    const startIndex = isMobile ? 0 : (currentPage - 1) * itemsPerPage;
    const endIndex = isMobile ? limit : (currentPage * itemsPerPage);
    
    const paginatedItems = filtered.slice(startIndex, endIndex);

    const tbody = document.getElementById('reportBody');
    if (tbody) {
      tbody.innerHTML = renderReportRows(paginatedItems, startIndex);
    }

    const infoEl = document.getElementById('reportInfo');
    if (infoEl) {
      infoEl.textContent = `Menampilkan ${Math.min(endIndex, totalItems)} dari ${totalItems} data`;
    }

    const paginationContainer = document.getElementById('reportPagination');
    if (paginationContainer) {
      if (totalItems <= itemsPerPage) {
        paginationContainer.innerHTML = '';
        return;
      }

      if (isMobile) {
        if (totalItems > limit) {
          paginationContainer.innerHTML = `
            <button class="btn btn-ghost btn-sm" id="loadMoreReportsBtn" style="font-weight:600; padding:8px 16px; margin:12px 0; border:1px solid var(--border-color); border-radius:var(--radius-md);">
              Muat Lebih Banyak (${totalItems - limit} data tersisa)
            </button>
          `;
          document.getElementById('loadMoreReportsBtn')?.addEventListener('click', () => {
            currentPage++;
            updateTable();
          });
        } else {
          paginationContainer.innerHTML = '';
        }
      } else {
        let html = '';
        // Prev button
        html += `
          <button class="btn btn-ghost btn-sm pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} style="padding:4px 8px; min-width:32px;">
            ${icons.chevronLeft || '◀'}
          </button>
        `;
        
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) {
          startPage = Math.max(1, endPage - 4);
        }
        
        if (startPage > 1) {
          html += `
            <button class="btn btn-sm btn-ghost pagination-btn" data-page="1" style="min-width:32px;">1</button>
            ${startPage > 2 ? '<span style="color:var(--text-muted); padding:0 4px;">...</span>' : ''}
          `;
        }
        
        for (let i = startPage; i <= endPage; i++) {
          const isActive = i === currentPage;
          html += `
            <button class="btn btn-sm pagination-btn ${isActive ? 'btn-primary' : 'btn-ghost'}" data-page="${i}" style="min-width:32px; height:32px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-md); font-weight:${isActive ? '700' : '500'};">
              ${i}
            </button>
          `;
        }
        
        if (endPage < totalPages) {
          html += `
            ${endPage < totalPages - 1 ? '<span style="color:var(--text-muted); padding:0 4px;">...</span>' : ''}
            <button class="btn btn-sm btn-ghost pagination-btn" data-page="${totalPages}" style="min-width:32px;">${totalPages}</button>
          `;
        }
        
        // Next button
        html += `
          <button class="btn btn-ghost btn-sm pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''} style="padding:4px 8px; min-width:32px;">
            ${icons.chevronRight || '▶'}
          </button>
        `;
        
        paginationContainer.innerHTML = html;
        
        paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (btn.disabled) return;
            currentPage = parseInt(btn.dataset.page);
            updateTable();
            document.querySelector('.table-container')?.scrollIntoView({ behavior: 'smooth' });
          });
        });
      }
    }
  };

  // Filter change
  const filterInputs = ['startDateInput', 'endDateInput', 'typeFilter', 'locationFilter', 'userFilter', 'categoryFilter'];
  filterInputs.forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      currentPage = 1;
      updateTable();
    });
  });

  // Initial render
  updateTable();
}

function getFilteredRecords(records, allUsers) {
  let filtered = [...records];
  const startDate = document.getElementById('startDateInput')?.value;
  const endDate = document.getElementById('endDateInput')?.value;
  const type = document.getElementById('typeFilter')?.value;
  const location = document.getElementById('locationFilter')?.value;
  const userType = document.getElementById('userFilter')?.value;
  const category = document.getElementById('categoryFilter')?.value;

  if (startDate) {
    filtered = filtered.filter(r => r.date_str && r.date_str >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(r => r.date_str && r.date_str <= endDate);
  }
  if (type) {
    if (type === 'insidental') {
      filtered = filtered.filter(r => r.is_incidental);
    } else if (type === 'campur') {
      filtered = filtered.filter(r => (r.type === 'campur' || r.type === 'masuk') && !r.is_incidental);
    } else {
      filtered = filtered.filter(r => r.type === type && !r.is_incidental);
    }
  }
  if (location) {
    filtered = filtered.filter(r => r.location_id === location);
  }
  if (userType) {
    filtered = filtered.filter(r => getRecordUserType(r, allUsers) === userType);
  }
  if (category) {
    filtered = filtered.filter(r => r.category_sipsn === category);
  }
  return filtered;
}

function getRecordUserType(r, allUsers) {
  const profile = allUsers.find(u => u.id === r.user_id || u.id === r.created_by);
  if (profile) {
    if (profile.role === 'admin') return 'admin';
    if (profile.role === 'petugas') return profile.job_type || '';
    return '';
  }
  
  // Fallback based on name for seeded/legacy data
  const name = (r.user_name || '').toLowerCase();
  if (name.includes('admin')) return 'admin';
  if (name.includes('kader')) return 'kader';
  if (name.includes('angkut') || name.includes('pengangkut')) return 'angkut';
  if (name.includes('operator')) return 'operator_tps';
  if (name.includes('koordinator')) return 'koordinator';
  return '';
}

function renderReportRows(records, startIndex = 0) {
  if (records.length === 0) {
    return '<tr><td colspan="9" style="text-align:center;padding:var(--space-8);color:var(--text-muted)">Tidak ada data untuk filter ini</td></tr>';
  }
  return records.map((r, i) => `
    <tr>
      <td>${startIndex + i + 1}</td>
      <td>${formatDate(r.created_at)}</td>
      <td><span class="badge ${r.is_incidental ? 'badge-warning' : (r.type === 'masuk' || r.type === 'campur') ? 'badge-warning' : r.type === 'pilah' ? 'badge-info' : r.type === 'olah' ? 'badge-primary' : 'badge-danger'}">${getTypeLabel(r)}</span></td>
      <td>${r.category_sipsn ? ((getCategoryByCode(r.category_sipsn) || {}).name || r.category_sipsn) : '-'}</td>
      <td style="font-weight:600">${formatWeight(r.weight_kg)}</td>
      <td>${r.location_name || '-'}</td>
      <td>${r.user_name || '-'}</td>
      <td style="text-align:center;vertical-align:middle">
        ${r.photo_url
          ? `<img src="${escapeHTML(sanitizeURL(r.photo_url))}" style="width:36px;height:36px;border-radius:4px;object-fit:cover;cursor:pointer;border:1px solid var(--border-color);" onclick="window.open('${escapeHTML(sanitizeURL(r.photo_url))}','_blank')" title="Klik untuk memperbesar">`
          : r.photo_count > 0
            ? `<span class="badge badge-info" style="cursor:pointer" title="${r.photo_count} foto terlampir">${icons.camera} ${r.photo_count}</span>`
            : '<span style="color:var(--text-muted)">-</span>'
        }
      </td>
      <td style="vertical-align:middle">
        ${r.verification_status === 'approved'
          ? '<span class="badge badge-success">Disetujui</span>'
          : r.verification_status === 'rejected'
            ? '<span class="badge badge-danger">Ditolak</span>'
            : '<span class="badge badge-warning">Pending</span>'
        }
        ${!r.synced ? `<div style="font-size:10px;color:var(--text-muted);margin-top:4px;display:flex;align-items:center;gap:4px;">${icons.clock.replace('width="20" height="20"', 'width="12" height="12"')} Belum Sinkron</div>` : ''}
      </td>
    </tr>
  `).join('');
}

function getTypeLabel(r) { 
  if (r && r.is_incidental) return 'Insidental';
  const t = typeof r === 'string' ? r : r.type;
  return {masuk:'Campur',campur:'Campur',pilah:'Terpilah',olah:'Olah',residu:'Residu'}[t]||t; 
}
