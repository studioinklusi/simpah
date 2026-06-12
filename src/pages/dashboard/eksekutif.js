// SIMPAH - Executive Dashboard
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatWeight, formatNumber, formatPercent, getLast30Days } from '../../utils/helpers.js';
import { getWasteStats, getAllWasteRecords, getAllLocations, getAllMou, getAllUsers } from '../../db/store.js';
import { SIPSN_CATEGORIES } from '../../utils/sipsn.js';
import { renderDashboardLayout } from './layout.js';
import { supabase } from '../../lib/supabase.js';
import { canViewExecutive } from '../../utils/permissions.js';

export async function renderEksekutif() {
  const user = getCurrentUser();
  if (!user || !canViewExecutive(user)) { window.location.hash = '#/dashboard/gis'; return; }

  const stats = await getWasteStats();
  const mous = await getAllMou();
  const locations = await getAllLocations();
  const users = await getAllUsers();
  const activeMou = mous.filter(m => m.status === 'active').length;

  // ── Dynamic KPI Trend Calculation ──
  const now = new Date();
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now); sixtyDaysAgo.setDate(now.getDate() - 60);

  const currentRecords = stats.records.filter(r => new Date(r.date_str || r.created_at) >= thirtyDaysAgo);
  const prevRecords = stats.records.filter(r => {
    const d = new Date(r.date_str || r.created_at);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  });

  const curWeight = currentRecords.reduce((s, r) => s + (r.weight_kg || 0), 0);
  const prevWeight = prevRecords.reduce((s, r) => s + (r.weight_kg || 0), 0);
  const weightTrend = prevWeight > 0 ? ((curWeight - prevWeight) / prevWeight * 100) : 0;

  const curPilahOlah = currentRecords.filter(r => r.type === 'pilah' || r.type === 'olah').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const curMasukCampur = currentRecords.filter(r => r.type === 'masuk' || r.type === 'campur').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const prevPilahOlah = prevRecords.filter(r => r.type === 'pilah' || r.type === 'olah').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const prevMasukCampur = prevRecords.filter(r => r.type === 'masuk' || r.type === 'campur').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const curRecycleRate = curMasukCampur > 0 ? (curPilahOlah / curMasukCampur * 100) : 0;
  const prevRecycleRate = prevMasukCampur > 0 ? (prevPilahOlah / prevMasukCampur * 100) : 0;
  const recycleTrend = prevRecycleRate > 0 ? (curRecycleRate - prevRecycleRate) : 0;

  const curResidu = currentRecords.filter(r => r.type === 'residu').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const prevResidu = prevRecords.filter(r => r.type === 'residu').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const residuTrend = prevResidu > 0 ? ((curResidu - prevResidu) / prevResidu * 100) : 0;

  const formatTrend = (val) => {
    const abs = Math.abs(val).toFixed(1);
    if (val > 0) return { text: `+${abs}%`, dir: 'up', icon: icons.trendUp };
    if (val < 0) return { text: `-${abs}%`, dir: 'down', icon: icons.trendDown };
    return { text: 'Stabil', dir: 'neutral', icon: icons.arrowRight };
  };

  const volTrend = formatTrend(weightTrend);
  const recTrend = formatTrend(recycleTrend);
  const resTrend = formatTrend(residuTrend);
  const expiringMou = mous.filter(m => m.status === 'expiring').length;

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
          <button class="tab" data-period="yearly">Tahunan</button>
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
          <div class="stat-trend ${volTrend.dir}">${volTrend.icon} ${volTrend.text}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:var(--info-600)">
            ${icons.recycle}
          </div>
          <div class="stat-value" style="color:var(--info-600)">${formatPercent(stats.recycleRate)}</div>
          <div class="stat-label">Pengurangan Sampah</div>
          <div class="stat-trend ${recTrend.dir}">${recTrend.icon} ${recTrend.text}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,0.12);color:var(--danger-600)">
            ${icons.residue}
          </div>
          <div class="stat-value" style="color:var(--danger-500)">${formatWeight(stats.residuWeight)}</div>
          <div class="stat-label">Total Residu</div>
          <div class="stat-trend ${resTrend.dir}">${resTrend.icon} ${resTrend.text}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.12);color:var(--accent-600)">
            ${icons.clipboard}
          </div>
          <div class="stat-value" style="color:var(--accent-600)">${activeMou}</div>
          <div class="stat-label">MoU Aktif</div>
          <div class="stat-trend ${expiringMou > 0 ? 'down' : 'up'}">${expiringMou > 0 ? icons.alert + ' ' + expiringMou + ' segera habis' : icons.checkCircle + ' Semua aman'}</div>
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
      <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))">
        <div class="chart-card" style="grid-column: span 2">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Volume per Jenis</h3>
          </div>
          <div class="chart-container" style="height:250px"><canvas id="typeChart"></canvas></div>
        </div>
        <div class="card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Top Lokasi (Volume)</h3>
          </div>
          <div class="table-container" style="border:none">
            <table class="table">
              <thead><tr><th>Lokasi</th><th style="text-align:right">Volume</th></tr></thead>
              <tbody id="topLocationsBody"></tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Kader Teraktif</h3>
          </div>
          <div class="table-container" style="border:none">
            <table class="table">
              <thead><tr><th>Nama</th><th style="text-align:right">Entri</th></tr></thead>
              <tbody id="topKaderBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `, 'eksekutif');

  // Render charts
  setTimeout(() => {
    renderCharts(stats, 'daily');
    
    // Tab Listeners
    const periodTabs = document.getElementById('periodTabs');
    if (periodTabs) {
      periodTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab')) {
          document.querySelectorAll('#periodTabs .tab').forEach(t => t.classList.remove('active'));
          e.target.classList.add('active');
          renderCharts(stats, e.target.dataset.period);
        }
      });
    }
  }, 100);
  
  renderTopLocations(stats.records, locations);
  renderTopKader(stats.records, users);
}

async function renderCharts(stats, period = 'daily') {
  const Chart = (await import('chart.js')).Chart;
  const { registerables } = await import('chart.js');
  Chart.register(...registerables);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#9ca3af' : '#6b7280';

  // Helper to destroy existing charts
  const destroyChart = (id) => {
    const existingChart = Chart.getChart(id);
    if (existingChart) existingChart.destroy();
  };

  // Trend chart (line)
  const trendCtx = document.getElementById('trendChart');
  if (trendCtx) {
    destroyChart('trendChart');
    
    let labels = [];
    let trendData = [];
    let titleStr = 'Tren Volume Sampah';
    
    if (period === 'daily') {
      titleStr = 'Tren Volume Sampah (30 Hari)';
      const days = getLast30Days();
      labels = days.map(d => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth()+1}`; });
      trendData = days.map(day => {
        return stats.records.filter(r => r.date_str === day).reduce((s, r) => s + (r.weight_kg || 0), 0);
      });
    } else if (period === 'weekly') {
      titleStr = 'Tren Volume Sampah (8 Minggu)';
      // Generate last 8 weeks
      for(let i = 7; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - (i * 7));
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay()); // Sunday
        labels.push(`Mg ${i===0?'Ini':'-'+i}`);
        
        // aggregate records for this week
        let weekTotal = 0;
        stats.records.forEach(r => {
          const rDate = new Date(r.date_str);
          const diffTime = Math.abs(rDate - weekStart);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if(rDate >= weekStart && diffDays <= 7) {
            weekTotal += (r.weight_kg || 0);
          }
        });
        trendData.push(weekTotal);
      }
    } else if (period === 'monthly') {
      titleStr = 'Tren Volume Sampah (6 Bulan)';
      // Generate last 6 months
      for(let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        labels.push(d.toLocaleString('default', { month: 'short' }));
        const monthPrefix = d.toISOString().substring(0, 7);
        trendData.push(
          stats.records.filter(r => r.date_str?.startsWith(monthPrefix)).reduce((s, r) => s + (r.weight_kg || 0), 0)
        );
      }
    } else if (period === 'yearly') {
      titleStr = 'Tren Volume Sampah (3 Tahun)';
      // Generate last 3 years by month
      for(let i = 2; i >= 0; i--) {
        const year = new Date().getFullYear() - i;
        labels.push(String(year));
        const yearPrefix = String(year);
        trendData.push(
          stats.records.filter(r => r.date_str?.startsWith(yearPrefix)).reduce((s, r) => s + (r.weight_kg || 0), 0)
        );
      }
    }

    // Update title
    const titleEl = document.querySelector('#trendChart').closest('.chart-card').querySelector('.chart-card-title');
    if (titleEl) titleEl.textContent = titleStr;
    
    // --- Algoritma Forecasting (ML Prophet Backend / Fallback Regresi Linier) ---
    const n = trendData.length;
    let futureLabels = [];
    let forecastData = Array(n).fill(null); 
    forecastData[n - 1] = trendData[n - 1]; // Sambung garis chart
    
    let useML = false;

    if (period === 'daily') {
      try {
        const fetchDays = getLast30Days();
        const { data: mlResult, error: mlError } = await supabase.functions.invoke('simpah-forecast', {
          body: { 
            days: 7,
            historical_data: trendData,
            start_date: fetchDays[0] 
          }
        });
        
        if (!mlError && mlResult && mlResult.status === 'success' && mlResult.data) {
          mlResult.data.forEach((item) => {
            const d = new Date(item.date);
            futureLabels.push(`${d.getDate()}/${d.getMonth()+1} (AI)`);
            forecastData.push(item.predicted_weight_kg);
          });
          useML = true;
          console.log(`[Forecast] ${mlResult.method} — ${mlResult.historical_days_used} data points → ${mlResult.forecast_days} day forecast`);
        }
      } catch (err) {
        console.warn('Edge Function forecast gagal, fallback ke Linear Regression', err);
      }
    }

    // Fallback ke Regresi Linier Sederhana jika ML gagal atau bukan 'daily'
    if (!useML) {
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += trendData[i];
        sumXY += i * trendData[i];
        sumXX += i * i;
      }
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
      const intercept = (sumY - slope * sumX) / n || 0;
      
      // Proyeksi ke depan (2 titik)
      for (let i = 0; i < 2; i++) {
        if (period === 'daily') futureLabels.push(`+${i+1}h`);
        if (period === 'weekly') futureLabels.push(`+${i+1}m`);
        if (period === 'monthly') futureLabels.push(`+${i+1}b`);
        if (period === 'yearly') futureLabels.push(`+${i+1}th`);
        
        const predicted = slope * (n + i) + intercept;
        forecastData.push(Math.max(0, predicted));
      }
    }

    const allLabels = [...labels, ...futureLabels];
    const historicalPadded = [...trendData, null, null];

    new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          {
            label: 'Volume Historis (kg)',
            data: historicalPadded,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            borderWidth: 2
          },
          {
            label: 'Proyeksi/Forecasting (kg)',
            data: forecastData,
            borderColor: '#f59e0b',
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            display: true, 
            position: 'top', 
            labels: { color: textColor, font: { size: 11 }, boxWidth: 12, usePointStyle: true }
          } 
        },
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
    destroyChart('compositionChart');
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
    destroyChart('typeChart');
    new Chart(typeCtx, {
      type: 'bar',
      data: {
        labels: ['Campur', 'Terpilah', 'Olah Sampah', 'Residu', 'Insidental'],
        datasets: [{
          data: [stats.campurWeight, stats.pilahWeight, stats.olahWeight, stats.residuWeight, stats.insidentalWeight],
          backgroundColor: ['#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#d97706'],
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
        <td>
          <strong style="font-size:var(--font-sm)">${loc?.name || id}</strong>
          <div style="font-size:10px;color:var(--text-muted)">${loc?.type?.toUpperCase() || '-'}</div>
        </td>
        <td style="text-align:right;font-weight:600">${formatWeight(vol)}</td>
      </tr>
    `;
  }).join('');
}

function renderTopKader(records, users) {
  const kaderStats = {};
  records.forEach(r => {
    if (r.created_by && r.created_by !== 'system') {
      kaderStats[r.created_by] = (kaderStats[r.created_by] || 0) + 1;
    }
  });

  const sorted = Object.entries(kaderStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const body = document.getElementById('topKaderBody');
  if (!body) return;

  body.innerHTML = sorted.map(([id, count]) => {
    const user = users.find(u => u.id === id);
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:24px;height:24px;border-radius:50%;background:var(--primary-100);color:var(--primary-600);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold">
              ${user ? user.full_name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <strong style="font-size:var(--font-sm)">${user?.full_name || id}</strong>
              <div style="font-size:10px;color:var(--text-muted)">${user?.role || 'Kader'}</div>
            </div>
          </div>
        </td>
        <td style="text-align:right;font-weight:600">${count}x</td>
      </tr>
    `;
  }).join('');
}
