// SIMPAH - Executive Dashboard
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatWeight, formatNumber, formatPercent, getLast30Days } from '../../utils/helpers.js';
import { getWasteStats, getAllWasteRecords, getAllLocations, getAllMou } from '../../db/store.js';
import { SIPSN_CATEGORIES } from '../../utils/sipsn.js';
import { renderDashboardLayout } from './layout.js';

export async function renderEksekutif() {
  const user = getCurrentUser();
  if (!user || !['admin', 'eksekutif'].includes(user.role)) { window.location.hash = '#/dashboard/gis'; return; }

  const stats = await getWasteStats();
  const mous = await getAllMou();
  const locations = await getAllLocations();
  const activeMou = mous.filter(m => m.status === 'active').length;

  renderDashboardLayout('Eksekutif', `
    <div class="page-enter">
      <div class="section-header">
        <div>
          <h2 class="section-title">Dashboard Eksekutif</h2>
          <p class="section-subtitle">Ringkasan data pengelolaan sampah Kabupaten Banjarnegara</p>
        </div>
        <div class="tabs" id="periodTabs">
          <button class="tab active" data-period="daily">Harian</button>
          <button class="tab" data-period="weekly">Mingguan</button>
          <button class="tab" data-period="monthly">Bulanan</button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid-4" style="margin-bottom:var(--space-6)">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.12);color:var(--primary-600)">
            ${icons.trashIn}
          </div>
          <div class="stat-value" style="color:var(--primary-600)">${formatWeight(stats.totalWeight)}</div>
          <div class="stat-label">Total Volume Sampah</div>
          <div class="stat-trend up">${icons.trendUp} +12.5%</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:var(--info-600)">
            ${icons.recycle}
          </div>
          <div class="stat-value" style="color:var(--info-600)">${formatPercent(stats.recycleRate)}</div>
          <div class="stat-label">Pengurangan Sampah</div>
          <div class="stat-trend up">${icons.trendUp} +3.2%</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,0.12);color:var(--danger-600)">
            ${icons.residue}
          </div>
          <div class="stat-value" style="color:var(--danger-500)">${formatWeight(stats.residuWeight)}</div>
          <div class="stat-label">Total Residu</div>
          <div class="stat-trend down">${icons.trendDown} -5.1%</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.12);color:var(--accent-600)">
            ${icons.clipboard}
          </div>
          <div class="stat-value" style="color:var(--accent-600)">${activeMou}</div>
          <div class="stat-label">MoU Aktif</div>
          <div class="stat-trend up">${icons.trendUp} Stabil</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="dashboard-grid dashboard-grid-3" style="margin-bottom:var(--space-6)">
        <div class="chart-card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Tren Volume Sampah (30 Hari)</h3>
          </div>
          <div class="chart-container"><canvas id="trendChart"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Komposisi SIPSN</h3>
          </div>
          <div class="chart-container"><canvas id="compositionChart"></canvas></div>
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="dashboard-grid dashboard-grid-2">
        <div class="chart-card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Volume per Jenis</h3>
          </div>
          <div class="chart-container" style="height:250px"><canvas id="typeChart"></canvas></div>
        </div>
        <div class="card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Top 5 Lokasi (Volume Tertinggi)</h3>
          </div>
          <div class="table-container" style="border:none">
            <table class="table">
              <thead><tr><th>Lokasi</th><th>Tipe</th><th style="text-align:right">Volume</th></tr></thead>
              <tbody id="topLocationsBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `, 'eksekutif');

  // Render charts
  setTimeout(() => renderCharts(stats), 100);
  renderTopLocations(stats.records, locations);
}

async function renderCharts(stats) {
  const Chart = (await import('chart.js')).Chart;
  const { registerables } = await import('chart.js');
  Chart.register(...registerables);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#9ca3af' : '#6b7280';

  // Trend chart (line)
  const days = getLast30Days();
  const dailyData = days.map(day => {
    const dayRecords = stats.records.filter(r => r.date_str === day);
    return dayRecords.reduce((s, r) => s + (r.weight_kg || 0), 0);
  });

  const trendCtx = document.getElementById('trendChart');
  if (trendCtx) {
    new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: days.map(d => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth()+1}`; }),
        datasets: [{
          label: 'Volume (kg)',
          data: dailyData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, maxTicksLimit: 10, font: { size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } }, beginAtZero: true }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });
  }

  // Composition doughnut
  const compCtx = document.getElementById('compositionChart');
  if (compCtx) {
    const catLabels = SIPSN_CATEGORIES.filter(c => stats.byCategory[c.code] > 0);
    new Chart(compCtx, {
      type: 'doughnut',
      data: {
        labels: catLabels.map(c => c.name),
        datasets: [{
          data: catLabels.map(c => stats.byCategory[c.code] || 0),
          backgroundColor: catLabels.map(c => c.color),
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: { color: textColor, font: { size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 10 }
          }
        }
      }
    });
  }

  // Type bar chart
  const typeCtx = document.getElementById('typeChart');
  if (typeCtx) {
    new Chart(typeCtx, {
      type: 'bar',
      data: {
        labels: ['Sampah Masuk', 'Campur', 'Terpilah', 'Olah Sampah', 'Residu', 'Insidental'],
        datasets: [{
          data: [stats.masukWeight, stats.campurWeight, stats.pilahWeight, stats.olahWeight, stats.residuWeight, stats.insidentalWeight],
          backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#d97706'],
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { size: 12 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } }, beginAtZero: true }
        }
      }
    });
  }
}

function renderTopLocations(records, locations) {
  const locVolume = {};
  records.forEach(r => {
    if (r.location_id) {
      locVolume[r.location_id] = (locVolume[r.location_id] || 0) + (r.weight_kg || 0);
    }
  });

  const sorted = Object.entries(locVolume)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const body = document.getElementById('topLocationsBody');
  if (!body) return;

  body.innerHTML = sorted.map(([id, vol]) => {
    const loc = locations.find(l => l.id === id);
    return `
      <tr>
        <td><strong style="font-size:var(--font-sm)">${loc?.name || id}</strong></td>
        <td><span class="badge badge-neutral">${loc?.type?.toUpperCase() || '-'}</span></td>
        <td style="text-align:right;font-weight:600">${formatWeight(vol)}</td>
      </tr>
    `;
  }).join('');
}
