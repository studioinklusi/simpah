// SIMPAH - Portal Regulasi
import { icons } from '../../components/icons.js';
import { renderPortalNav, renderPortalFooter, initPortalNav } from './beranda.js';

const REGULATIONS = [
  {
    title: 'UU Nomor 18 Tahun 2008 tentang Pengelolaan Sampah',
    type: 'Undang-Undang',
    date: '2008',
    size: '2.4 MB',
    url: 'https://jdih.kemenlh.go.id/admin/storage/dokumen_hukum/68ec491254f42.pdf'
  },
  {
    title: 'PP Nomor 81 Tahun 2012 tentang Pengelolaan Sampah Rumah Tangga Dan Sampah Sejenis Sampah Rumah Tangga',
    type: 'Peraturan Pemerintah',
    date: '2012',
    size: '1.8 MB',
    url: 'https://jdih.kehutanan.go.id/new2/uploads/files/PP%20NO%2081%20TAHUN%202012.pdf'
  },
  {
    title: 'Permen LHK Nomor P.10/MENLHK/SETJEN/PLB.0/4/2018 Tahun 2018 tentang Pedoman Penyusunan Kebijakan dan Strategi Daerah Pengelolaan Sampah Rumah Tangga dan Sampah Sejenis Sampah Rumah Tangga',
    type: 'Peraturan Menteri',
    date: '2018',
    size: '3.1 MB',
    url: 'https://jdih.kehutanan.go.id/new2/uploads/files/P.10-2018%20JAKSTRADA.pdf'
  },
  {
    title: 'Permen LHK Nomor 6 Tahun 2022 tentang Sistem Informasi Pengelolaan Sampah Nasional',
    type: 'Peraturan Menteri',
    date: '2022',
    size: '1.5 MB',
    url: 'https://jdih.kehutanan.go.id/new2/uploads/files/2022pmlhk006_menlhk_04112022103639.pdf'
  },
  {
    title: 'Perda Kabupaten Banjarnegara Nomor 7 Tahun 2014 tentang Pengelolaan Sampah',
    type: 'Peraturan Daerah',
    date: '2014',
    size: '1.3 MB',
    url: 'https://jdih.banjarnegarakab.go.id/produk_hukum/perda/LD%207%20SERI%20E%20(PENGELOLAAN%20SAMPAH).pdf'
  },
  {
    title: 'Perda Kabupaten Banjarnegara Nomor 11 Tahun 2015 tentang Perubahan atas Peraturan Daerah Kabupaten Banjarnegara Nomor 7 Tahun 2014 tentang Pengelolaan Sampah',
    type: 'Peraturan Daerah',
    date: '2015',
    size: '1.1 MB',
    url: 'https://jdih.banjarnegarakab.go.id/produk_hukum/perda/LD%2011%20(PERUBAHAN%20TTG%20PENGELOLAAN%20SAMPAH).pdf'
  },
  {
    title: 'Perbup Banjarnegara Nomor 89 Tahun 2018 tentang Kebijakan Strategi Daerah Pengelolaan Sampah Rumah Tangga Dan Sampah Sejenis Sampah Rumah Tangga',
    type: 'Peraturan Bupati',
    date: '2018',
    size: 'Link JDIH',
    url: 'https://jdih.banjarnegarakab.go.id/inventarisasi-hukum/detail/PerBup_89_th_2018'
  },
  {
    title: 'Perbup Banjarnegara Nomor 31 Tahun 2020 tentang Perubahan Tarif Retribusi Pelayanan Persampahan/Kebersihan',
    type: 'Peraturan Bupati',
    date: '2020',
    size: 'Link JDIH',
    url: 'https://jdih.banjarnegarakab.go.id/index.php/inventarisasi-hukum/detail/PerBup_31_th_2020'
  }
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
              <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="regulation-item" style="animation:fadeInUp 0.3s ease ${i*0.06}s both; text-decoration: none; color: inherit;">
                <div class="regulation-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div class="regulation-info" style="flex: 1;">
                  <div class="regulation-title" style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${r.title}</div>
                  <div class="regulation-meta" style="font-size: var(--font-xs); color: var(--text-muted);">${r.type} · ${r.date} · ${r.size}</div>
                </div>
                <div class="btn btn-ghost btn-sm" style="flex-shrink: 0;">${icons.download}</div>
              </a>
            `).join('')}
          </div>
        </section>
      </div>
      ${renderPortalFooter()}
    </div>
  `;
  initPortalNav();
}
