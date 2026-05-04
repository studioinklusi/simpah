// SIMPAH - Cek Status Aduan (Public Tracking Page)
import { icons } from '../../components/icons.js';
import { getComplaintByTracking } from '../../db/store.js';
import { renderPortalNav, renderPortalFooter, initPortalNav } from './beranda.js';

const STATUS_CONFIG = {
  baru: { label: 'Baru Diterima', color: '#3b82f6', icon: icons.download, bg: 'rgba(59,130,246,0.1)', step: 1 },
  diproses: { label: 'Sedang Diproses', color: '#f59e0b', icon: icons.clock, bg: 'rgba(245,158,11,0.1)', step: 2 },
  ditindaklanjuti: { label: 'Ditindaklanjuti', color: '#8b5cf6', icon: icons.tool, bg: 'rgba(139,92,246,0.1)', step: 3 },
  selesai: { label: 'Selesai', color: '#10b981', icon: icons.checkCircle, bg: 'rgba(16,185,129,0.1)', step: 4 },
  ditolak: { label: 'Ditolak', color: '#ef4444', icon: icons.xCircle, bg: 'rgba(239,68,68,0.1)', step: 0 }
};

export function renderCekAduan() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="portal-layout">
      ${renderPortalNav('cek-aduan')}
      <div style="padding-top:calc(var(--navbar-height) + var(--space-8))">
        <section class="portal-section">
          <div class="portal-section-header">
            <h2>Cek Status <span class="gradient-text">Aduan</span></h2>
            <p>Masukkan nomor resi yang Anda terima saat mengirim laporan untuk melacak statusnya.</p>
          </div>

          <!-- Search Box -->
          <div class="tracking-search" id="trackingSearch">
            <div class="tracking-input-wrap">
              ${icons.search}
              <input type="text" id="trackingInput" class="tracking-input" placeholder="Contoh: ADU-260401-1234" maxlength="20" autocomplete="off" />
              <button class="btn btn-primary" id="trackBtn">Lacak</button>
            </div>
            <p class="tracking-hint">Nomor resi diberikan setelah berhasil mengirim laporan aduan.</p>
          </div>

          <!-- Result Container -->
          <div id="trackingResult"></div>
        </section>
      </div>
      ${renderPortalFooter()}
    </div>

    <style>
      .tracking-search { max-width:600px; margin:0 auto var(--space-8); }
      .tracking-input-wrap { display:flex; align-items:center; gap:var(--space-3); background:var(--bg-secondary); border:2px solid var(--border-color); border-radius:var(--radius-xl); padding:var(--space-3) var(--space-4); transition:border-color 0.2s; }
      .tracking-input-wrap:focus-within { border-color:var(--primary-400); }
      .tracking-input-wrap svg { color:var(--text-muted); flex-shrink:0; }
      .tracking-input { flex:1; border:none; background:none; font-size:var(--font-base); font-weight:600; letter-spacing:0.05em; color:var(--text-primary); outline:none; text-transform:uppercase; }
      .tracking-input::placeholder { text-transform:none; font-weight:400; color:var(--text-muted); letter-spacing:0; }
      .tracking-hint { font-size:var(--font-xs); color:var(--text-muted); text-align:center; margin-top:var(--space-3); }

      .track-card { max-width:600px; margin:0 auto; background:var(--bg-secondary); border-radius:var(--radius-xl); border:1px solid var(--border-color); overflow:hidden; animation:scaleIn 0.3s ease; }
      .track-header { padding:var(--space-5) var(--space-6); display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); }
      .track-resi { font-size:var(--font-xs); color:var(--text-muted); }
      .track-resi strong { font-size:var(--font-base); color:var(--text-primary); display:block; letter-spacing:0.08em; margin-top:var(--space-1); }
      .track-status-badge { display:inline-flex; align-items:center; gap:var(--space-2); padding:var(--space-2) var(--space-4); border-radius:var(--radius-full); font-size:var(--font-sm); font-weight:700; }

      .track-progress { padding:var(--space-6); }
      .track-steps { display:flex; justify-content:space-between; position:relative; margin-bottom:var(--space-6); }
      .track-steps::before { content:''; position:absolute; top:16px; left:28px; right:28px; height:3px; background:var(--gray-200); z-index:0; }
      .track-steps::after { content:''; position:absolute; top:16px; left:28px; height:3px; background:var(--primary-500); z-index:1; transition:width 0.5s ease; }
      .track-step { display:flex; flex-direction:column; align-items:center; gap:var(--space-2); z-index:2; }
      .track-dot { width:32px; height:32px; border-radius:50%; background:var(--gray-200); display:flex; align-items:center; justify-content:center; font-size:14px; color:var(--text-muted); transition:all 0.3s; }
      .track-dot.active { background:var(--primary-500); color:#fff; box-shadow:0 0 0 4px rgba(16,185,129,0.2); }
      .track-dot.done { background:var(--primary-500); color:#fff; }
      .track-step-label { font-size:10px; color:var(--text-muted); text-align:center; max-width:70px; font-weight:600; }
      .track-step.active .track-step-label { color:var(--primary-600); }

      .track-detail { border-top:1px solid var(--border-color); padding:var(--space-5) var(--space-6); }
      .track-row { display:flex; justify-content:space-between; padding:var(--space-2) 0; font-size:var(--font-sm); }
      .track-row-label { color:var(--text-muted); }
      .track-row-value { font-weight:600; text-align:right; max-width:55%; }
      .track-desc { background:var(--bg-primary); border-radius:var(--radius-lg); padding:var(--space-4); margin-top:var(--space-3); font-size:var(--font-sm); color:var(--text-secondary); line-height:1.6; border:1px solid var(--border-color); }
      .track-response { margin-top:var(--space-4); padding:var(--space-4); border-radius:var(--radius-lg); background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.15); }
      .track-response-title { font-size:var(--font-xs); font-weight:700; color:var(--primary-600); margin-bottom:var(--space-2); }
      .track-response p { font-size:var(--font-sm); color:var(--text-secondary); line-height:1.6; }

      .track-empty { max-width:400px; margin:0 auto; text-align:center; padding:var(--space-8); }
      .track-empty-icon { font-size:48px; margin-bottom:var(--space-4); }
      .track-empty h4 { font-size:var(--font-lg); font-weight:700; margin-bottom:var(--space-2); }
      .track-empty p { font-size:var(--font-sm); color:var(--text-muted); }
    </style>
  `;
  initPortalNav();

  const input = document.getElementById('trackingInput');
  const btn = document.getElementById('trackBtn');

  async function doSearch() {
    const q = input.value.trim().toUpperCase();
    if (!q) return;
    btn.innerHTML = '<div class="spinner" style="margin:0 auto;width:20px;height:20px"></div>';
    btn.disabled = true;
    try {
      const complaint = await getComplaintByTracking(q);
      renderResult(complaint, q);
    } catch (e) {
      renderResult(null, q);
    }
    btn.innerHTML = 'Lacak';
    btn.disabled = false;
  }

  btn?.addEventListener('click', doSearch);
  input?.addEventListener('keypress', (e) => { if (e.key === 'Enter') doSearch(); });

  // Check if tracking number passed via hash params
  const hashParts = window.location.hash.split('?');
  if (hashParts[1]) {
    const params = new URLSearchParams(hashParts[1]);
    const resi = params.get('resi');
    if (resi) {
      input.value = resi;
      setTimeout(doSearch, 300);
    }
  }

  function renderResult(complaint, query) {
    const container = document.getElementById('trackingResult');
    if (!complaint) {
      container.innerHTML = `
        <div class="track-empty">
          <div class="track-empty-icon" style="color:var(--text-muted)">${icons.search}</div>
          <h4>Aduan Tidak Ditemukan</h4>
          <p>Nomor resi <strong>${query}</strong> tidak ditemukan. Pastikan nomor resi yang Anda masukkan benar.</p>
        </div>
      `;
      return;
    }

    const cfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.baru;
    const steps = [
      { label: 'Diterima', icon: icons.download },
      { label: 'Diproses', icon: icons.clock },
      { label: 'Tindak Lanjut', icon: icons.tool },
      { label: 'Selesai', icon: icons.checkCircle }
    ];
    const currentStep = cfg.step;
    const progressWidth = currentStep === 0 ? 0 : ((currentStep - 1) / (steps.length - 1)) * 100;
    const date = new Date(complaint.created_at);
    const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    container.innerHTML = `
      <div class="track-card">
        <div class="track-header">
          <div class="track-resi">Nomor Resi<br/><strong>${complaint.tracking_number}</strong></div>
          <span class="track-status-badge" style="background:${cfg.bg};color:${cfg.color}">${cfg.icon} ${cfg.label}</span>
        </div>

        ${complaint.status !== 'ditolak' ? `
        <div class="track-progress">
          <div class="track-steps" style="--progress:${progressWidth}%">
            ${steps.map((s, i) => {
              const isActive = (i + 1) === currentStep;
              const isDone = (i + 1) < currentStep;
              return `<div class="track-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}">
                <div class="track-dot ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}">${isDone ? icons.checkCircle : s.icon}</div>
                <span class="track-step-label">${s.label}</span>
              </div>`;
            }).join('')}
          </div>
          <style>.track-steps::after { width: var(--progress) !important; }</style>
        </div>` : ''}

        <div class="track-detail">
          <div class="track-row"><span class="track-row-label">Kategori</span><span class="track-row-value">${complaint.category}</span></div>
          <div class="track-row"><span class="track-row-label">Pelapor</span><span class="track-row-value">${complaint.reporter_name || 'Anonim'}</span></div>
          <div class="track-row"><span class="track-row-label">Tanggal Lapor</span><span class="track-row-value">${dateStr}</span></div>
          <div class="track-row"><span class="track-row-label">Lokasi</span><span class="track-row-value">${complaint.address || '-'}</span></div>

          <div class="track-desc">${complaint.description}</div>

          ${complaint.response ? `
          <div class="track-response">
            <div class="track-response-title" style="display:flex;align-items:center;gap:4px;">${icons.messageCircle} Tanggapan Dinas</div>
            <p>${complaint.response}</p>
          </div>` : ''}
        </div>
      </div>
    `;
  }
}
