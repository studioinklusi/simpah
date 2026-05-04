// SIMPAH - Halaman Intervensi Desa
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatWeight, formatDate } from '../../utils/helpers.js';
import { getVillageProfiles } from '../../utils/village-stats.js';
import { getScoreStatus, getUrgencyLabel, getUrgencyColor, BENCHMARKS } from '../../utils/intervention-rules.js';
import { SIPSN_CATEGORIES } from '../../utils/sipsn.js';
import { showToast } from '../../components/toast.js';
import { renderDashboardLayout } from './layout.js';

let villageProfiles = [];
let selectedVillage = null;

export async function renderIntervensi() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') { window.location.hash = '#/dashboard/gis'; return; }

  villageProfiles = await getVillageProfiles();
  selectedVillage = null;

  renderRankingView();
}

// ===========================
// VIEW 1: RANKING TABLE
// ===========================
function renderRankingView() {
  const now = new Date();
  const periodLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  renderDashboardLayout('Intervensi Desa', `
    <div class="page-enter">
      <div class="section-header">
        <div>
          <h2 class="section-title">Ranking Wilayah Prioritas</h2>
          <p class="section-subtitle">Analisis performa pengelolaan sampah per wilayah — Periode ${periodLabel}</p>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid-4" style="margin-bottom:var(--space-6)">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444">${icons.alert}</div>
          <div class="stat-value" style="color:#ef4444">${villageProfiles.filter(v => v.skor < 45).length}</div>
          <div class="stat-label">Wilayah Prioritas</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b">${icons.alert}</div>
          <div class="stat-value" style="color:#f59e0b">${villageProfiles.filter(v => v.skor >= 45 && v.skor < 70).length}</div>
          <div class="stat-label">Perlu Perhatian</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.12);color:#10b981">${icons.shield}</div>
          <div class="stat-value" style="color:#10b981">${villageProfiles.filter(v => v.skor >= 70).length}</div>
          <div class="stat-label">Wilayah Baik</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:#3b82f6">${icons.activity}</div>
          <div class="stat-value" style="color:#3b82f6">${villageProfiles.reduce((s, v) => s + v.recommendations.length, 0)}</div>
          <div class="stat-label">Total Rekomendasi</div>
        </div>
      </div>

      <!-- Ranking Table -->
      <div class="table-container">
        <table class="table" id="rankingTable">
          <thead>
            <tr>
              <th style="width:60px">Rank</th>
              <th>Wilayah</th>
              <th style="width:200px">Skor Performa</th>
              <th>Recycling</th>
              <th>Residu</th>
              <th>Aduan</th>
              <th>Infrastruktur</th>
              <th style="width:100px">Status</th>
            </tr>
          </thead>
          <tbody>
            ${villageProfiles.map((v, i) => {
              const status = getScoreStatus(v.skor);
              return `
              <tr class="ranking-row" data-wilayah="${v.wilayah}" style="cursor:pointer">
                <td style="text-align:center">
                  <span class="rank-badge ${i < 3 ? 'rank-top' : ''}">${i + 1}</span>
                </td>
                <td>
                  <strong>${v.wilayah}</strong>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px">
                    ${v.recommendations.filter(r => r.urgency === 'kritis').length} isu kritis
                  </div>
                </td>
                <td>
                  <div class="score-bar-container">
                    <div class="score-bar" style="width:${v.skor}%;background:${status.color}"></div>
                  </div>
                  <span style="font-size:12px;font-weight:700;color:${status.color}">${v.skor}/100</span>
                </td>
                <td>
                  <span style="font-weight:600;color:${v.recycling_rate < 10 ? '#ef4444' : v.recycling_rate < 25 ? '#f59e0b' : '#10b981'}">${v.recycling_rate.toFixed(1)}%</span>
                </td>
                <td>
                  <span style="font-weight:600;color:${v.residu_rate > 60 ? '#ef4444' : v.residu_rate > 40 ? '#f59e0b' : '#10b981'}">${v.residu_rate.toFixed(1)}%</span>
                </td>
                <td>
                  ${v.complaint_count > 0
                    ? `<span class="badge ${v.complaint_count > 5 ? 'badge-danger' : 'badge-warning'}">${v.complaint_count} aduan</span>`
                    : '<span class="badge badge-success">0</span>'
                  }
                </td>
                <td style="font-size:12px">
                  ${v.tps3r_count > 0 ? `<span class="badge badge-success" style="margin:1px">${icons.recycle} ${v.tps3r_count}</span>` : ''}
                  ${v.tps_count > 0 ? `<span class="badge badge-info" style="margin:1px">${icons.mapPin} ${v.tps_count}</span>` : ''}
                  ${v.bank_sampah_count > 0 ? `<span class="badge badge-neutral" style="margin:1px">${icons.landmark} ${v.bank_sampah_count}</span>` : ''}
                  ${v.total_infrastruktur === 0 ? '<span class="badge badge-danger">Tidak ada</span>' : ''}
                </td>
                <td>
                  <span class="status-pill" style="background:${status.bg};color:${status.color}">${status.label}</span>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="text-align:center;padding:var(--space-4);color:var(--text-muted);font-size:var(--font-sm)">
        Klik baris wilayah untuk melihat profil detail dan rekomendasi intervensi
      </div>
    </div>
  `, 'intervensi');

  // Bind row clicks
  document.querySelectorAll('.ranking-row').forEach(row => {
    row.addEventListener('click', () => {
      const wilayah = row.dataset.wilayah;
      selectedVillage = villageProfiles.find(v => v.wilayah === wilayah);
      if (selectedVillage) renderProfilView();
    });
  });
}

// ===========================
// VIEW 2: VILLAGE PROFILE
// ===========================
function renderProfilView() {
  const v = selectedVillage;
  if (!v) return;
  const status = getScoreStatus(v.skor);
  const now = new Date();
  const periodLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Group recommendations by urgency
  const recsKritis = v.recommendations.filter(r => r.urgency === 'kritis');
  const recsPerhatian = v.recommendations.filter(r => r.urgency === 'perhatian');
  const recsPengembangan = v.recommendations.filter(r => r.urgency === 'pengembangan');

  renderDashboardLayout('Intervensi Desa', `
    <div class="page-enter intervensi-profil" id="profilContainer">
      <!-- Back button -->
      <button class="btn btn-secondary btn-sm" id="backToRanking" style="margin-bottom:var(--space-4)">
        ${icons.chevronLeft} Kembali ke Ranking
      </button>

      <!-- Print Header (hidden on screen, shown on print) -->
      <div class="print-header-block">
        <div class="print-header-logo">SIMPAH</div>
        <h1>Laporan Profil Intervensi Desa</h1>
        <p>Sistem Informasi Monitoring Pengelolaan Sampah — Kabupaten Banjarnegara</p>
      </div>

      <!-- Section 1: Identity Card -->
      <div class="profil-identity-card">
        <div class="profil-identity-left">
          <h2 style="margin-bottom:var(--space-2)">Wilayah ${v.wilayah}</h2>
          <p style="color:var(--text-muted);font-size:var(--font-sm)">Kabupaten Banjarnegara, Jawa Tengah</p>
          <div class="profil-meta-grid">
            <div class="profil-meta-item">
              <span class="profil-meta-label">Periode Analisis</span>
              <span class="profil-meta-value">${periodLabel}</span>
            </div>
            <div class="profil-meta-item">
              <span class="profil-meta-label">Total Data Entri</span>
              <span class="profil-meta-value">${v.record_count} record</span>
            </div>
            <div class="profil-meta-item">
              <span class="profil-meta-label">Jumlah Fasilitas</span>
              <span class="profil-meta-value">${v.total_infrastruktur} unit</span>
            </div>
            <div class="profil-meta-item">
              <span class="profil-meta-label">Rekomendasi</span>
              <span class="profil-meta-value">${v.recommendations.length} item</span>
            </div>
          </div>
        </div>
        <div class="profil-identity-score">
          <div class="score-ring" style="--score-color:${status.color};--score-pct:${v.skor}%">
            <div class="score-ring-inner">
              <span class="score-ring-value">${v.skor}</span>
              <span class="score-ring-label">Skor</span>
            </div>
          </div>
          <span class="status-pill" style="background:${status.bg};color:${status.color};margin-top:var(--space-3)">${status.label}</span>
        </div>
      </div>

      <!-- Section 2: Traffic Light Indicators -->
      <div class="profil-section">
        <h3 class="profil-section-title">${icons.chart} Indikator Performa</h3>
        <div class="traffic-grid">
          ${renderTrafficItem('Recycling Rate', `${v.recycling_rate.toFixed(1)}%`, '≥ 25%', getTrafficColor(v.recycling_rate, 10, 25, true))}
          ${renderTrafficItem('Residu ke TPA', `${v.residu_rate.toFixed(1)}%`, '< 40%', getTrafficColor(v.residu_rate, 60, 40, false))}
          ${renderTrafficItem('Aduan Aktif', `${v.complaint_count}`, '< 2', getTrafficColor(v.complaint_count, 10, 5, false))}
          ${renderTrafficItem('Infrastruktur', `${v.total_infrastruktur} unit`, '≥ 2', getTrafficColor(v.total_infrastruktur, 1, 2, true))}
          ${renderTrafficItem('Konsistensi Data', `${v.avg_entries_per_month.toFixed(0)}x/bln`, '≥ 8x', getTrafficColor(v.avg_entries_per_month, 4, 8, true))}
          ${renderTrafficItem('Kelengkapan GPS', `${(100 - v.pct_tanpa_gps).toFixed(0)}%`, '≥ 70%', getTrafficColor(100 - v.pct_tanpa_gps, 50, 70, true))}
        </div>
      </div>

      <!-- Section 3: Volume Trend -->
      <div class="profil-section">
        <h3 class="profil-section-title">${icons.activity} Tren Volume Sampah</h3>
        <div class="mini-chart-container">
          ${renderMiniBarChart(v.monthly_volumes_sorted)}
        </div>
        <div style="display:flex;gap:var(--space-6);margin-top:var(--space-4);flex-wrap:wrap">
          <div class="profil-summary-item">
            <span style="color:var(--text-muted);font-size:12px">Total Masuk</span>
            <strong style="color:#10b981">${formatWeight(v.total_masuk_kg)}</strong>
          </div>
          <div class="profil-summary-item">
            <span style="color:var(--text-muted);font-size:12px">Total Terpilah</span>
            <strong style="color:#3b82f6">${formatWeight(v.total_pilah_kg)}</strong>
          </div>
          <div class="profil-summary-item">
            <span style="color:var(--text-muted);font-size:12px">Total Residu</span>
            <strong style="color:#ef4444">${formatWeight(v.total_residu_kg)}</strong>
          </div>
          <div class="profil-summary-item">
            <span style="color:var(--text-muted);font-size:12px">Tren 3 Bulan</span>
            <strong style="color:${v.tren_3_bulan === 'naik' ? '#ef4444' : v.tren_3_bulan === 'turun' ? '#10b981' : '#f59e0b'}">
              ${v.tren_3_bulan === 'naik' ? `${icons.trendUp} Naik` : v.tren_3_bulan === 'turun' ? `${icons.trendDown} Turun` : `${icons.arrowRight} Stabil`}
            </strong>
          </div>
        </div>
      </div>

      <!-- Section 4: SIPSN Composition -->
      ${Object.keys(v.by_category).length > 0 ? `
      <div class="profil-section">
        <h3 class="profil-section-title">${icons.layers} Komposisi Sampah (SIPSN)</h3>
        <div class="sipsn-breakdown">
          ${renderSIPSNBreakdown(v.by_category, v.total_all_kg)}
        </div>
      </div>` : ''}

      <!-- Section 5: Infrastructure -->
      <div class="profil-section">
        <h3 class="profil-section-title">${icons.mapPin} Infrastruktur Pengelolaan</h3>
        <div class="infra-list">
          ${v.location_names.length > 0
            ? v.location_names.map(l => `
              <div class="infra-item">
                <span class="infra-icon">${getLocIcon(l.type)}</span>
                <span class="infra-name">${l.name}</span>
                <span class="badge badge-neutral">${l.type.replace('_', ' ').toUpperCase()}</span>
              </div>
            `).join('')
            : '<p style="color:var(--text-muted);font-size:var(--font-sm);padding:var(--space-4)">Tidak ada fasilitas pengelolaan sampah tercatat di wilayah ini.</p>'
          }
        </div>
      </div>

      <!-- Section 6: Complaints -->
      ${v.complaints.length > 0 ? `
      <div class="profil-section">
        <h3 class="profil-section-title">${icons.messageCircle} Aduan Masyarakat (${v.complaint_count})</h3>
        <div class="table-container" style="border:none">
          <table class="table">
            <thead>
              <tr><th>Tanggal</th><th>Kategori</th><th>Deskripsi</th><th>Lokasi</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${v.complaints.map(c => `
                <tr>
                  <td style="white-space:nowrap">${formatDate(c.created_at)}</td>
                  <td><span class="badge badge-neutral">${c.category || '-'}</span></td>
                  <td style="max-width:300px;font-size:12px">${c.description || '-'}</td>
                  <td style="font-size:12px">${c.address || '-'}</td>
                  <td><span class="badge ${c.status === 'selesai' ? 'badge-success' : c.status === 'diproses' ? 'badge-warning' : 'badge-danger'}">${c.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>` : ''}

      <!-- Section 7: Recommendations (Auto-Generated) -->
      <div class="profil-section" id="recsSection">
        <h3 class="profil-section-title">${icons.clipboard} Rekomendasi Intervensi</h3>
        
        ${recsKritis.length > 0 ? `
        <div class="recs-group">
          <div class="recs-group-header" style="border-left-color:#ef4444">
            <span><svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill="#ef4444"/></svg> Kritis — Perlu Tindakan Segera</span>
            <span class="recs-count">${recsKritis.length}</span>
          </div>
          ${recsKritis.map((r, i) => renderRecItem(r, i, 'kritis')).join('')}
        </div>` : ''}

        ${recsPerhatian.length > 0 ? `
        <div class="recs-group">
          <div class="recs-group-header" style="border-left-color:#f59e0b">
            <span><svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill="#f59e0b"/></svg> Perlu Perhatian</span>
            <span class="recs-count">${recsPerhatian.length}</span>
          </div>
          ${recsPerhatian.map((r, i) => renderRecItem(r, i, 'perhatian')).join('')}
        </div>` : ''}

        ${recsPengembangan.length > 0 ? `
        <div class="recs-group">
          <div class="recs-group-header" style="border-left-color:#10b981">
            <span><svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill="#10b981"/></svg> Pengembangan</span>
            <span class="recs-count">${recsPengembangan.length}</span>
          </div>
          ${recsPengembangan.map((r, i) => renderRecItem(r, i, 'pengembangan')).join('')}
        </div>` : ''}

        ${v.recommendations.length === 0 ? `
        <div style="text-align:center;padding:var(--space-8);color:var(--text-muted)">
          <div style="font-size:2rem;margin-bottom:var(--space-3);color:var(--primary-500)">${icons.checkCircle}</div>
          <p>Tidak ada rekomendasi intervensi — wilayah ini dalam kondisi baik.</p>
        </div>` : ''}
      </div>

      <!-- Print Button -->
      <div class="profil-actions no-print">
        <button class="btn btn-primary btn-lg" id="printReportBtn">
          ${icons.download} Cetak / Simpan PDF
        </button>
        <button class="btn btn-secondary btn-lg" id="backToRanking2">
          ${icons.chevronLeft} Kembali ke Ranking
        </button>
      </div>

      <!-- Print Footer -->
      <div class="print-footer-block">
        <p>Dicetak dari SIMPAH — Sistem Informasi Monitoring Pengelolaan Sampah</p>
        <p>Kabupaten Banjarnegara • Tanggal cetak: ${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • Dokumen ini di-generate secara otomatis oleh sistem</p>
      </div>
    </div>
  `, 'intervensi');

  // Event listeners
  document.getElementById('backToRanking')?.addEventListener('click', () => renderRankingView());
  document.getElementById('backToRanking2')?.addEventListener('click', () => renderRankingView());
  document.getElementById('printReportBtn')?.addEventListener('click', () => {
    window.print();
    showToast('Dialog cetak dibuka — pilih "Save as PDF" untuk menyimpan', 'info');
  });
}

// ===========================
// HELPER RENDERERS
// ===========================

function renderTrafficItem(label, value, benchmark, color) {
  return `
    <div class="traffic-item">
      <div class="traffic-light" style="background:${color}20;border-color:${color}">
        <div class="traffic-dot" style="background:${color}"></div>
      </div>
      <div class="traffic-info">
        <div class="traffic-value" style="color:${color}">${value}</div>
        <div class="traffic-label">${label}</div>
        <div class="traffic-benchmark">Target: ${benchmark}</div>
      </div>
    </div>`;
}

function getTrafficColor(value, kritisThreshold, baikThreshold, higherIsBetter) {
  if (higherIsBetter) {
    if (value < kritisThreshold) return '#ef4444';
    if (value < baikThreshold) return '#f59e0b';
    return '#10b981';
  } else {
    if (value > kritisThreshold) return '#ef4444';
    if (value > baikThreshold) return '#f59e0b';
    return '#10b981';
  }
}

function renderMiniBarChart(monthlyData) {
  if (!monthlyData || monthlyData.length === 0) {
    return '<p style="color:var(--text-muted);text-align:center;padding:var(--space-6)">Belum ada data tren tersedia</p>';
  }
  const maxVol = Math.max(...monthlyData.map(m => m.volume), 1);
  return `
    <div class="mini-bar-chart">
      ${monthlyData.map(m => {
        const pct = (m.volume / maxVol) * 100;
        const monthName = new Date(m.month + '-01').toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        return `
          <div class="mini-bar-col">
            <div class="mini-bar-value">${formatWeight(m.volume)}</div>
            <div class="mini-bar" style="height:${Math.max(pct, 5)}%"></div>
            <div class="mini-bar-label">${monthName}</div>
          </div>`;
      }).join('')}
    </div>`;
}

function renderSIPSNBreakdown(byCategory, totalKg) {
  const total = totalKg || 1;
  return Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([code, kg]) => {
      const cat = SIPSN_CATEGORIES.find(c => c.code === code);
      const pct = ((kg / total) * 100).toFixed(1);
      return `
        <div class="sipsn-bar-item">
          <div class="sipsn-bar-header">
            <span>${cat?.icon || icons.box} ${cat?.name || code}</span>
            <span style="font-weight:600">${formatWeight(kg)} (${pct}%)</span>
          </div>
          <div class="sipsn-bar-track">
            <div class="sipsn-bar-fill" style="width:${pct}%;background:${cat?.color || '#6b7280'}"></div>
          </div>
        </div>`;
    }).join('');
}

function renderRecItem(rule, index, urgencyClass) {
  return `
    <div class="rec-item">
      <div class="rec-item-header">
        <span class="rec-item-code">${rule.id}</span>
        <strong class="rec-item-title">${rule.title}</strong>
        <span class="rec-item-meta">${icons[rule.groupIcon] || icons.box} ${rule.group}</span>
      </div>
      <p class="rec-item-text">${rule.recommendation}</p>
      <div class="rec-item-footer">
        <span class="rec-tag">${icons.target} PJ: ${rule.pic}</span>
        <span class="rec-tag">${icons.clock} ${rule.horizon}</span>
      </div>
    </div>`;
}

function getLocIcon(type) {
  const map = { tps: icons.mapPin, tps3r: icons.recycle, bank_sampah: icons.landmark, pengepul: icons.store, tpa: icons.factory };
  return map[type] || icons.mapPin;
}
