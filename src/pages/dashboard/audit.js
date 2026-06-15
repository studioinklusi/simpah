// SIMPAH - Audit Log Viewer (Admin Only)
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatDateTime } from '../../utils/helpers.js';
import { hasPermission } from '../../utils/permissions.js';
import { showToast } from '../../components/toast.js';
import { renderDashboardLayout } from './layout.js';
import { getAuditLog } from '../../utils/audit.js';
import { getAllUsers } from '../../db/store.js';

const ENTITY_LABELS = {
  waste_records: { label: 'Data Sampah', icon: icons.trashIn, color: '#10b981' },
  complaints: { label: 'Aduan', icon: icons.messageCircle, color: '#3b82f6' },
  fleet: { label: 'Armada', icon: icons.truck, color: '#f59e0b' },
  incidental_events: { label: 'Insidental', icon: icons.alert, color: '#8b5cf6' },
  users: { label: 'Pengguna', icon: icons.users, color: '#6b7280' },
  locations: { label: 'Lokasi', icon: icons.mapPin, color: '#ef4444' },
};

const ACTION_LABELS = {
  create: { label: 'Dibuat', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  update: { label: 'Diperbarui', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  delete: { label: 'Dihapus', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  status_approved: { label: 'Disetujui', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  status_rejected: { label: 'Ditolak', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  status_pending: { label: 'Menunggu', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  login: { label: 'Login', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
};

export async function renderAuditLog() {
  const user = getCurrentUser();
  if (!user || !hasPermission(user, 'VIEW_AUDIT_LOG')) {
    window.location.hash = '#/dashboard/gis';
    return;
  }

  const [logs, users] = await Promise.all([getAuditLog(), getAllUsers()]);
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });

  // Group logs by date
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const totalToday = logs.filter(l => l.timestamp?.startsWith(today)).length;
  const totalYesterday = logs.filter(l => l.timestamp?.startsWith(yesterday)).length;
  const uniqueUsers = new Set(logs.map(l => l.user_id)).size;

  // Entity type counts
  const entityCounts = {};
  logs.forEach(l => {
    entityCounts[l.entity_type] = (entityCounts[l.entity_type] || 0) + 1;
  });

  renderDashboardLayout('Audit Log', `
    <div class="page-enter" style="max-width:1100px">
      <div class="section-header">
        <div>
          <h2 class="section-title" style="display:flex;align-items:center;gap:8px">${icons.activity} Audit Trail & Log Aktivitas</h2>
          <p class="section-subtitle">Catatan seluruh aktivitas pengguna dalam sistem SIMPAH</p>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="grid-4" style="margin-bottom:var(--space-6)">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.12);color:#10b981">${icons.activity}</div>
          <div class="stat-value" style="color:#10b981">${logs.length}</div>
          <div class="stat-label">Total Log</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:#3b82f6">${icons.clock}</div>
          <div class="stat-value" style="color:#3b82f6">${totalToday}</div>
          <div class="stat-label">Hari Ini</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b">${icons.users}</div>
          <div class="stat-value" style="color:#f59e0b">${uniqueUsers}</div>
          <div class="stat-label">User Aktif</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(139,92,246,0.12);color:#8b5cf6">${icons.shield}</div>
          <div class="stat-value" style="color:#8b5cf6">${totalYesterday}</div>
          <div class="stat-label">Kemarin</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="audit-filter" style="display:flex;gap:var(--space-3);margin-bottom:var(--space-5);flex-wrap:wrap;align-items:center">
        <select class="form-select" id="auditEntityFilter" style="max-width:200px">
          <option value="">Semua Entitas</option>
          ${Object.entries(ENTITY_LABELS).map(([id, e]) => `<option value="${id}">${e.label}</option>`).join('')}
        </select>
        <select class="form-select" id="auditUserFilter" style="max-width:200px">
          <option value="">Semua Pengguna</option>
          ${users.map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join('')}
        </select>
        <select class="form-select" id="auditDateFilter" style="max-width:180px">
          <option value="all">Semua Waktu</option>
          <option value="today">Hari Ini</option>
          <option value="7days">7 Hari Terakhir</option>
          <option value="30days">30 Hari Terakhir</option>
          <option value="custom">Kustom Tanggal...</option>
        </select>
        <div id="customDateRange" style="display:none; gap:var(--space-2); align-items:center;">
          <input type="date" class="form-input" id="startDateInput" style="max-width:140px; padding: 6px 12px;" />
          <span style="font-size:var(--font-xs);color:var(--text-muted)">s/d</span>
          <input type="date" class="form-input" id="endDateInput" style="max-width:140px; padding: 6px 12px;" />
        </div>
        <span style="font-size:var(--font-xs);color:var(--text-muted);margin-left:auto" id="auditCount">${logs.length} log ditampilkan</span>
      </div>

      <!-- Log Table -->
      <div class="card" style="overflow:hidden">
        <div class="table-container" style="border:none">
          <table class="table" id="auditTable">
            <thead>
              <tr>
                <th style="width:170px">Waktu</th>
                <th>Pengguna</th>
                <th>Entitas</th>
                <th>Aksi</th>
                <th>ID Objek</th>
                <th style="width:60px">GPS</th>
              </tr>
            </thead>
            <tbody id="auditBody">
            </tbody>
          </table>
        </div>
      </div>

      ${logs.length === 0 ? `
      <div style="text-align:center;padding:var(--space-8);color:var(--text-muted)">
        <div style="font-size:2rem;margin-bottom:var(--space-3);color:var(--primary-500)">${icons.shield}</div>
        <p>Belum ada aktivitas tercatat dalam sistem.</p>
      </div>
      ` : ''}
    </div>
  `, 'audit');

  let filteredLogs = [...logs];

  function renderTable() {
    const body = document.getElementById('auditBody');
    if (!body) return;

    const countEl = document.getElementById('auditCount');
    if (countEl) countEl.textContent = `${filteredLogs.length} log ditampilkan`;

    if (filteredLogs.length === 0) {
      body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:var(--space-6);color:var(--text-muted)">Tidak ada log untuk filter ini.</td></tr>';
      return;
    }

    body.innerHTML = filteredLogs.slice(0, 100).map(log => {
      const entity = ENTITY_LABELS[log.entity_type] || { label: log.entity_type, icon: icons.box, color: '#6b7280' };
      const action = ACTION_LABELS[log.action] || { label: log.action, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
      const userObj = userMap[log.user_id];
      let displayUser = log.user_id;
      let displaySub = log.user_id;
      
      if (log.user_id === 'system') {
        displayUser = 'Sistem / Automasi';
        displaySub = 'system';
      } else if (userObj) {
        displayUser = userObj.name || userObj.username || log.user_id;
        displaySub = userObj.username ? `${userObj.username}@simpah.dev` : log.user_id;
      }

      const time = log.timestamp ? formatDateTime(log.timestamp) : '-';
      const hasGPS = log.lat && log.lng;

      return `
        <tr>
          <td style="font-size:var(--font-xs);white-space:nowrap">${time}</td>
          <td>
            <strong style="font-size:var(--font-sm)">${displayUser}</strong>
            <div style="font-size:10px;color:var(--text-muted)">${displaySub}</div>
          </td>
          <td>
            <span style="display:inline-flex;align-items:center;gap:4px;color:${entity.color};font-weight:600;font-size:var(--font-sm)">
              ${entity.icon} ${entity.label}
            </span>
          </td>
          <td>
            <span class="badge" style="background:${action.bg};color:${action.color};font-weight:700">${action.label}</span>
          </td>
          <td style="font-size:10px;font-family:monospace;color:var(--text-muted);max-width:120px;overflow:hidden;text-overflow:ellipsis">${log.entity_id || '-'}</td>
          <td style="text-align:center">
            ${hasGPS ? `<span style="color:#10b981" title="${Number(log.lat).toFixed(5)}, ${Number(log.lng).toFixed(5)}">${icons.mapPin}</span>` : '<span style="color:var(--text-muted)">-</span>'}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Filter handlers
  document.getElementById('auditEntityFilter')?.addEventListener('change', () => applyFilters());
  document.getElementById('auditUserFilter')?.addEventListener('change', () => applyFilters());
  document.getElementById('auditDateFilter')?.addEventListener('change', () => applyFilters());
  document.getElementById('startDateInput')?.addEventListener('change', () => applyFilters());
  document.getElementById('endDateInput')?.addEventListener('change', () => applyFilters());

  function applyFilters() {
    const entityFilter = document.getElementById('auditEntityFilter')?.value;
    const userFilter = document.getElementById('auditUserFilter')?.value;
    const dateFilter = document.getElementById('auditDateFilter')?.value;
    
    // Custom date range inputs
    const customRange = document.getElementById('customDateRange');
    const startDate = document.getElementById('startDateInput')?.value;
    const endDate = document.getElementById('endDateInput')?.value;

    if (customRange) {
      customRange.style.display = dateFilter === 'custom' ? 'inline-flex' : 'none';
    }

    filteredLogs = logs.filter(l => {
      // Entity Filter
      if (entityFilter && l.entity_type !== entityFilter) return false;
      // User Filter
      if (userFilter && l.user_id !== userFilter) return false;

      // Date Filter
      if (l.timestamp) {
        const logDateStr = l.timestamp.split('T')[0];
        const logDate = new Date(l.timestamp);
        
        if (dateFilter === 'today') {
          const todayStr = new Date().toISOString().split('T')[0];
          if (logDateStr !== todayStr) return false;
        } else if (dateFilter === '7days') {
          const limit = new Date(Date.now() - 7 * 86400000);
          if (logDate < limit) return false;
        } else if (dateFilter === '30days') {
          const limit = new Date(Date.now() - 30 * 86400000);
          if (logDate < limit) return false;
        } else if (dateFilter === 'custom') {
          if (startDate && logDateStr < startDate) return false;
          if (endDate && logDateStr > endDate) return false;
        }
      }

      return true;
    });
    renderTable();
  }

  renderTable();
}
