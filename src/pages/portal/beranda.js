// SIMPAH - Portal Beranda (Public Home)
import { icons } from '../../components/icons.js';
import { getWasteStats } from '../../db/store.js';
import { formatNumber, formatWeight, toggleTheme, getState } from '../../utils/helpers.js';

export async function renderPortalBeranda() {
  const stats = await getWasteStats();
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="portal-layout">
      ${renderPortalNav('beranda')}

      <!-- Hero -->
      <section class="portal-hero">
        <div class="portal-hero-content">
          <div class="portal-hero-badge">
            <span style="font-size:14px">${icons.leaf}</span> Kabupaten Banjarnegara
          </div>
          <h1>
            Bersama Wujudkan<br>
            <span class="highlight">Banjarnegara Bersih</span><br>
            dan Berkelanjutan
          </h1>
          <p>
            SIMPAH adalah sistem informasi terpadu untuk monitoring dan pengelolaan sampah
            secara transparan, akuntabel, dan berbasis data dari masyarakat hingga dinas.
          </p>
          <div class="portal-hero-actions">
            <a href="#/login" class="btn btn-primary btn-lg" style="padding:var(--space-4) var(--space-8)">
              ${icons.activity} Masuk Sistem
            </a>
            <a href="#/portal/aduan" class="btn btn-secondary btn-lg" style="padding:var(--space-4) var(--space-8);background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);color:white">
              ${icons.messageCircle} Laporkan Masalah
            </a>
          </div>
          <div class="portal-hero-stats">
            <div class="portal-hero-stat">
              <div class="stat-number">${formatWeight(stats.totalWeight)}</div>
              <div class="stat-text">Total Terkelola</div>
            </div>
            <div class="portal-hero-stat">
              <div class="stat-number">${stats.recycleRate}%</div>
              <div class="stat-text">Daur Ulang</div>
            </div>
            <div class="portal-hero-stat">
              <div class="stat-number">${formatNumber(stats.totalRecords)}</div>
              <div class="stat-text">Data Tercatat</div>
            </div>
            <div class="portal-hero-stat">
              <div class="stat-number">10+</div>
              <div class="stat-text">Titik Lokasi</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="portal-section" style="padding-bottom:var(--space-8)">
        <div class="portal-section-header">
          <h2>Mengapa <span class="gradient-text">SIMPAH</span> Penting?</h2>
          <p>Sistem kendali pengelolaan sampah kabupaten secara real-time dan terintegrasi</p>
        </div>
        <div class="grid-3">
          ${[
            { icon: icons.map, title: 'Monitoring Berbasis Peta', desc: 'Visualisasi GIS interaktif untuk memonitor lokasi TPS, Bank Sampah, dan alur distribusi sampah secara real-time.' },
            { icon: icons.chart, title: 'Data Standar SIPSN', desc: 'Pencatatan dan pelaporan sesuai standar nasional SIPSN. Data siap export untuk upload ke sistem pusat.' },
            { icon: icons.shield, title: 'Transparan & Akuntabel', desc: 'Setiap data dilengkapi audit trail lengkap: timestamp, user ID, dan lokasi GPS otomatis.' },
            { icon: icons.activity, title: 'Input Cepat <10 Detik', desc: 'Aplikasi PWA ringan yang dioptimalkan untuk penggunaan lapangan dengan satu tangan pada HP low-end.' },
            { icon: icons.globe, title: 'Partisipasi Masyarakat', desc: 'Portal publik dengan form aduan tanpa login, edukasi, dan transparansi data pengelolaan sampah.' },
            { icon: icons.layers, title: 'Siap Replikasi', desc: 'Arsitektur modular yang dapat direplikasi ke kabupaten/kota lain dengan penyesuaian minimal.' }
          ].map((f, i) => `
            <div class="card" style="text-align:center;padding:var(--space-8) var(--space-5);animation:fadeInUp 0.5s ease ${i*0.1}s both">
              <div style="width:56px;height:56px;border-radius:var(--radius-xl);background:rgba(16,185,129,0.1);color:var(--primary-600);display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-4)">${f.icon}</div>
              <h3 style="font-size:var(--font-base);font-weight:700;margin-bottom:var(--space-2)">${f.title}</h3>
              <p style="font-size:var(--font-sm);color:var(--text-secondary);line-height:1.6">${f.desc}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Quick CTA -->
      <section style="background:linear-gradient(135deg, var(--primary-800), var(--primary-600));padding:var(--space-16) var(--space-6);text-align:center">
        <div style="max-width:600px;margin:0 auto">
          <h2 style="font-size:var(--font-3xl);font-weight:800;color:white;margin-bottom:var(--space-4)">Temukan Masalah Sampah?</h2>
          <p style="color:rgba(255,255,255,0.8);margin-bottom:var(--space-6);font-size:var(--font-lg)">Laporkan langsung tanpa perlu daftar atau login</p>
          <a href="#/portal/aduan" class="btn btn-lg" style="background:white;color:var(--primary-700);font-weight:700;padding:var(--space-4) var(--space-8)">
            ${icons.messageCircle} Buat Laporan Sekarang
          </a>
        </div>
      </section>

      ${renderPortalFooter()}
    </div>
  `;
}

export function renderPortalNav(active = '') {
  return `
    <nav class="portal-nav">
      <div class="portal-nav-inner">
        <a href="#/portal" class="portal-nav-brand">
          <div class="portal-nav-brand-icon">S</div>
          <h1>SIMPAH</h1>
        </a>
        <div class="portal-nav-links" id="portalNavLinks">
          <a href="#/portal" class="portal-nav-link ${active==='beranda'?'active':''}">Beranda</a>
          <a href="#/portal/edukasi" class="portal-nav-link ${active==='edukasi'?'active':''}">Edukasi</a>
          <a href="#/portal/galeri" class="portal-nav-link ${active==='galeri'?'active':''}">Galeri</a>
          <a href="#/portal/regulasi" class="portal-nav-link ${active==='regulasi'?'active':''}">Regulasi</a>
          <a href="#/portal/aduan" class="portal-nav-link ${active==='aduan'?'active':''}">Lapor Baru</a>
          <a href="#/portal/cek-aduan" class="portal-nav-link ${active==='cek-aduan'?'active':''}">Cek Resi</a>
          <a href="#/login" class="btn btn-primary portal-nav-cta">Masuk</a>
        </div>
        <button class="portal-mobile-toggle" id="portalMenuToggle">${icons.menu}</button>
      </div>
    </nav>
  `;
}

export function renderPortalFooter() {
  return `
    <footer class="portal-footer">
      <div class="portal-footer-inner">
        <div class="portal-footer-brand">
          <h3>SIMPAH</h3>
          <p>Sistem Informasi Monitoring Pengelolaan Sampah Kabupaten Banjarnegara. Platform digital untuk transparansi dan akuntabilitas data sampah.</p>
        </div>
        <div>
          <h4>Menu</h4>
          <div class="portal-footer-links">
            <a href="#/portal">Beranda</a>
            <a href="#/portal/edukasi">Edukasi</a>
            <a href="#/portal/galeri">Galeri</a>
            <a href="#/portal/regulasi">Regulasi</a>
          </div>
        </div>
        <div>
          <h4>Layanan</h4>
          <div class="portal-footer-links">
            <a href="#/portal/aduan">Form Aduan</a>
            <a href="#/portal/cek-aduan">Cek Status Aduan</a>
            <a href="#/login">Login Petugas</a>
            <a href="#/dashboard/gis">Peta GIS</a>
          </div>
        </div>
        <div>
          <h4>Kontak</h4>
          <div class="portal-footer-links">
            <a href="#">DPPKPLH Banjarnegara</a>
            <a href="#">Jl. Selamanik No. 1</a>
            <a href="#">info@simpah.banjarnegara.go.id</a>
          </div>
        </div>
      </div>
      <div class="portal-footer-bottom">
        <p>&copy; ${new Date().getFullYear()} SIMPAH - Kabupaten Banjarnegara. Sistem Monitoring Pengelolaan Sampah.</p>
      </div>
    </footer>
  `;
}

export function initPortalNav() {
  setTimeout(() => {
    const toggle = document.getElementById('portalMenuToggle');
    const links = document.getElementById('portalNavLinks');
    if (toggle && links) {
      toggle.addEventListener('click', () => links.classList.toggle('open'));
    }
  }, 50);
}
