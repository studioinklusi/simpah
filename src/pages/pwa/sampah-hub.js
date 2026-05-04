// SIMPAH - Sampah Masuk Hub Page (Parent Menu)
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatWeight } from '../../utils/helpers.js';
import { getWasteStats } from '../../db/store.js';
import { getAllowedInputTypes } from '../../utils/permissions.js';
import { renderPWALayout } from './layout.js';

export async function renderSampahHub() {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/login'; return; }

  const stats = await getWasteStats();
  const allowed = getAllowedInputTypes(user);

  // Today's breakdown
  const todayRecords = stats.records.filter(r => r.date_str === new Date().toISOString().split('T')[0]);
  const todayCampur = todayRecords.filter(r => r.type === 'campur').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const todayPilah = todayRecords.filter(r => r.type === 'pilah').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const todayOlah = todayRecords.filter(r => r.type === 'olah').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const todayResidu = todayRecords.filter(r => r.type === 'residu').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const todayMasuk = todayRecords.filter(r => r.type === 'masuk').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const todayTotal = todayCampur + todayPilah + todayOlah + todayMasuk;

  renderPWALayout('Sampah Masuk', `
    <div class="page-enter">
      <!-- Info Banner -->
      <div class="hub-info-banner">
        <span class="hub-info-icon">${icons.trashIn}</span>
        <div>
          <strong>Catat Penerimaan Sampah</strong>
          <p>Pilih jenis penerimaan sesuai kondisi sampah yang masuk.</p>
        </div>
      </div>

      <!-- Sub-Menu Cards -->
      <div class="hub-cards">
        ${allowed.includes('masuk') ? `
        <a href="#/pwa/input-sampah" class="hub-card hub-card-campur">
          <div class="hub-card-icon-wrap campur">
            <span class="hub-card-icon">🔀</span>
          </div>
          <div class="hub-card-content">
            <h3>Campur</h3>
            <p>Sampah tidak dipilah, langsung ke TPA</p>
          </div>
          <div class="hub-card-arrow">${icons.chevronRight}</div>
        </a>` : ''}

        ${allowed.includes('pilah') ? `
        <a href="#/pwa/input-pilah" class="hub-card hub-card-pilah">
          <div class="hub-card-icon-wrap pilah">
            <span class="hub-card-icon">♻️</span>
          </div>
          <div class="hub-card-content">
            <h3>Pilah</h3>
            <p>Pemilahan per kategori SIPSN + Residu</p>
          </div>
          <div class="hub-card-arrow">${icons.chevronRight}</div>
        </a>` : ''}

        ${allowed.includes('olah') ? `
        <a href="#/pwa/input-olah" class="hub-card hub-card-olah">
          <div class="hub-card-icon-wrap olah">
            <span class="hub-card-icon">🔄</span>
          </div>
          <div class="hub-card-content">
            <h3>Olah</h3>
            <p>Pengolahan mandiri (kompos, maggot, dll)</p>
          </div>
          <div class="hub-card-arrow">${icons.chevronRight}</div>
        </a>` : ''}

        ${allowed.includes('residu') ? `
        <a href="#/pwa/input-residu" class="hub-card hub-card-residu">
          <div class="hub-card-icon-wrap residu">
            <span class="hub-card-icon">🗑️</span>
          </div>
          <div class="hub-card-content">
            <h3>Residu (Shortcut)</h3>
            <p>Sisa pemilahan yang terlambat dicatat</p>
          </div>
          <div class="hub-card-arrow">${icons.chevronRight}</div>
        </a>` : ''}
      </div>

      <!-- Mini Dashboard -->
      <div class="hub-summary">
        <h4>Ringkasan Hari Ini</h4>
        <div class="hub-summary-grid">
          <div class="hub-summary-item">
            <span class="hub-dot campur"></span>
            <span class="hub-summary-label">Campur</span>
            <strong>${formatWeight(todayCampur + todayMasuk)}</strong>
          </div>
          <div class="hub-summary-item">
            <span class="hub-dot pilah"></span>
            <span class="hub-summary-label">Pilah</span>
            <strong>${formatWeight(todayPilah)}</strong>
          </div>
          <div class="hub-summary-item">
            <span class="hub-dot olah"></span>
            <span class="hub-summary-label">Olah</span>
            <strong>${formatWeight(todayOlah)}</strong>
          </div>
          <div class="hub-summary-item">
            <span class="hub-dot residu"></span>
            <span class="hub-summary-label">Residu</span>
            <strong>${formatWeight(todayResidu)}</strong>
          </div>
        </div>
        <div class="hub-total">
          <span>Total Masuk Hari Ini</span>
          <strong>${formatWeight(todayTotal)}</strong>
        </div>
      </div>
    </div>
    <style>
      .hub-info-banner { display:flex; gap:var(--space-3); align-items:flex-start; padding:var(--space-4); border-radius:var(--radius-xl); background:linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.12)); border:1px solid rgba(16,185,129,0.15); margin-bottom:var(--space-5); }
      .hub-info-icon { font-size:28px; flex-shrink:0; }
      .hub-info-banner p { font-size:var(--font-xs); color:var(--text-secondary); margin-top:var(--space-1); line-height:1.4; }
      .hub-info-banner strong { font-size:var(--font-sm); color:var(--primary-600); }
      .hub-cards { display:flex; flex-direction:column; gap:var(--space-3); margin-bottom:var(--space-6); }
      .hub-card { display:flex; align-items:center; gap:var(--space-4); padding:var(--space-4) var(--space-5); border-radius:var(--radius-xl); border:2px solid var(--border-color); background:var(--bg-primary); text-decoration:none; color:inherit; transition:all 0.2s ease; }
      .hub-card:active { transform:scale(0.98); }
      .hub-card-icon-wrap { width:56px; height:56px; border-radius:var(--radius-xl); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .hub-card-icon-wrap.campur { background:rgba(245,158,11,0.12); }
      .hub-card-icon-wrap.pilah { background:rgba(59,130,246,0.12); }
      .hub-card-icon-wrap.olah { background:rgba(168,85,247,0.12); }
      .hub-card-icon-wrap.residu { background:rgba(239,68,68,0.12); }
      .hub-card-icon { font-size:28px; }
      .hub-card-content { flex:1; }
      .hub-card-content h3 { font-size:var(--font-lg); font-weight:700; color:var(--text-primary); margin-bottom:2px; }
      .hub-card-content p { font-size:var(--font-xs); color:var(--text-muted); line-height:1.3; }
      .hub-card-arrow { color:var(--text-muted); opacity:0.5; }
      .hub-card-campur:hover, .hub-card-campur:focus { border-color:#f59e0b; background:rgba(245,158,11,0.03); }
      .hub-card-pilah:hover, .hub-card-pilah:focus { border-color:#3b82f6; background:rgba(59,130,246,0.03); }
      .hub-card-olah:hover, .hub-card-olah:focus { border-color:#8b5cf6; background:rgba(168,85,247,0.03); }
      .hub-card-residu:hover, .hub-card-residu:focus { border-color:#ef4444; background:rgba(239,68,68,0.03); }

      .hub-summary { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-xl); padding:var(--space-5); }
      .hub-summary h4 { font-size:var(--font-sm); font-weight:700; color:var(--text-primary); margin-bottom:var(--space-4); text-transform:uppercase; letter-spacing:0.05em; }
      .hub-summary-grid { display:grid; grid-template-columns:1fr 1fr; gap:var(--space-3); margin-bottom:var(--space-4); }
      .hub-summary-item { display:flex; align-items:center; gap:var(--space-2); padding:var(--space-3); border-radius:var(--radius-lg); background:var(--bg-primary); }
      .hub-summary-item .hub-summary-label { flex:1; font-size:var(--font-xs); color:var(--text-muted); font-weight:500; }
      .hub-summary-item strong { font-size:var(--font-sm); font-weight:700; color:var(--text-primary); }
      .hub-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
      .hub-dot.campur { background:#f59e0b; }
      .hub-dot.pilah { background:#3b82f6; }
      .hub-dot.olah { background:#8b5cf6; }
      .hub-dot.residu { background:#ef4444; }
      .hub-total { display:flex; justify-content:space-between; align-items:center; padding:var(--space-4); border-radius:var(--radius-lg); background:linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.15)); border:1px solid rgba(16,185,129,0.2); }
      .hub-total span { font-size:var(--font-sm); font-weight:600; color:var(--primary-600); }
      .hub-total strong { font-size:var(--font-xl); font-weight:800; color:var(--primary-600); }
    </style>
  `);
}
