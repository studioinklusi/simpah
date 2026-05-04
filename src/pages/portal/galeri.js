// SIMPAH - Portal Galeri
import { icons } from '../../components/icons.js';
import { renderPortalNav, renderPortalFooter, initPortalNav } from './beranda.js';

const GALLERY_ITEMS = [
  { title: 'Kerja Bakti Bersih Desa Semampir', category: 'Kegiatan', color: '#10b981', image: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&q=80&w=600' },
  { title: 'Sosialisasi Pilah Sampah RT/RW', category: 'Edukasi', color: '#3b82f6', image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600' },
  { title: 'Operasional TPS3R Banjarnegara', category: 'Operasional', color: '#f59e0b', image: 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&q=80&w=600' },
  { title: 'Pelatihan Kader Lingkungan', category: 'Pelatihan', color: '#8b5cf6', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=600' },
  { title: 'Bank Sampah Berseri - Penimbangan', category: 'Bank Sampah', color: '#0d9488', image: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&q=80&w=600' },
  { title: 'Pengangkutan Sampah ke TPA Winong', category: 'Operasional', color: '#ef4444', image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600' },
  { title: 'Pembuatan Kompos di TPS3R', category: 'Daur Ulang', color: '#22c55e', image: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?auto=format&fit=crop&q=80&w=600' },
  { title: 'Monitoring Lapangan Oleh Dinas', category: 'Monitoring', color: '#6366f1', image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600' },
  { title: 'Penyerahan Hasil Daur Ulang ke Pengepul', category: 'Bank Sampah', color: '#f97316', image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=600' }
];

export function renderGaleri() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="portal-layout">
      ${renderPortalNav('galeri')}
      <div style="padding-top:calc(var(--navbar-height) + var(--space-8))">
        <section class="portal-section">
          <div class="portal-section-header">
            <h2>Galeri <span class="gradient-text">Kegiatan</span></h2>
            <p>Dokumentasi kegiatan pengelolaan sampah di Kabupaten Banjarnegara</p>
          </div>
          <div class="gallery-grid">
            ${GALLERY_ITEMS.map((item, i) => `
              <div class="gallery-item" style="animation:fadeInUp 0.4s ease ${i*0.06}s both; overflow:hidden;">
                <img src="${item.image}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;animation: kenBurns 15s ease-in-out infinite alternate;" />
                <div class="gallery-item-overlay">
                  <div>
                    <p style="font-weight:600">${item.title}</p>
                    <p style="font-size:12px;opacity:0.8;margin-top:4px">${item.category}</p>
                  </div>
                </div>
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
