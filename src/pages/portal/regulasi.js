// SIMPAH - Portal Regulasi
import { icons } from '../../components/icons.js';
import { renderPortalNav, renderPortalFooter, initPortalNav } from './beranda.js';

const REGULATIONS = [
  { title: 'UU No. 18 Tahun 2008 tentang Pengelolaan Sampah', type: 'Undang-Undang', date: '2008', size: '2.4 MB' },
  { title: 'PP No. 81 Tahun 2012 tentang Pengelolaan Sampah Rumah Tangga', type: 'Peraturan Pemerintah', date: '2012', size: '1.8 MB' },
  { title: 'Permen LHK No. P.10/2018 tentang Pedoman Penyusunan Kebijakan dan Strategi Daerah', type: 'Peraturan Menteri', date: '2018', size: '3.1 MB' },
  { title: 'Perda Kab. Banjarnegara No. 5 Tahun 2020 tentang Pengelolaan Sampah', type: 'Peraturan Daerah', date: '2020', size: '1.2 MB' },
  { title: 'Perbup Banjarnegara tentang Retribusi Pelayanan Persampahan', type: 'Peraturan Bupati', date: '2021', size: '956 KB' },
  { title: 'Panduan Teknis Operasional TPS3R', type: 'Panduan Teknis', date: '2022', size: '5.3 MB' },
  { title: 'SOP Pengangkutan Sampah ke TPA', type: 'SOP', date: '2023', size: '1.1 MB' },
  { title: 'Panduan Pelaporan SIPSN untuk Kabupaten/Kota', type: 'Panduan', date: '2024', size: '2.7 MB' }
];

export function renderRegulasi() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="portal-layout">
      ${renderPortalNav('regulasi')}
      <div style="padding-top:calc(var(--navbar-height) + var(--space-8))">
        <section class="portal-section">
          <div class="portal-section-header">
            <h2>Regulasi & <span class="gradient-text">Kebijakan</span></h2>
            <p>Dokumen peraturan dan kebijakan daerah terkait pengelolaan sampah</p>
          </div>
          <div class="regulation-list">
            ${REGULATIONS.map((r, i) => `
              <div class="regulation-item" style="animation:fadeInUp 0.3s ease ${i*0.06}s both">
                <div class="regulation-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div class="regulation-info">
                  <div class="regulation-title">${r.title}</div>
                  <div class="regulation-meta">${r.type} · ${r.date} · ${r.size}</div>
                </div>
                <button class="btn btn-ghost btn-sm">${icons.download}</button>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
      ${renderPortalFooter()}
    </div>
  `;
  initPortalNav();
}
