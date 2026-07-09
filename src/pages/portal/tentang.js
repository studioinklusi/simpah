// SIMPAH - Portal Tentang Kami (About Us)
import { icons } from '../../components/icons.js';
import { renderPortalNav, renderPortalFooter, initPortalNav } from './beranda.js';

export function renderPortalTentang() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="portal-layout">
      ${renderPortalNav('tentang')}
      
      <div style="padding-top:calc(var(--navbar-height) + var(--space-8))">
        <!-- Hero Section -->
        <section class="portal-section" style="padding-bottom:var(--space-4)">
          <div class="portal-section-header" style="max-width:800px; margin:0 auto var(--space-12) auto; text-align:center">
            <div style="display:inline-flex; align-items:center; gap:var(--space-2); background:rgba(16,185,129,0.1); color:var(--primary-600); padding:var(--space-2) var(--space-4); border-radius:var(--radius-full); font-size:var(--font-sm); font-weight:600; margin-bottom:var(--space-4)">
              ${icons.leaf} Kabupaten Banjarnegara
            </div>
            <h2 style="font-size:var(--font-4xl); font-weight:800; color:var(--text-primary); margin-bottom:var(--space-3)">
              Tentang <span class="gradient-text">SIMPAH</span>
            </h2>
            <p style="font-size:var(--font-lg); line-height:1.6; color:var(--text-secondary)">
              Sistem Informasi Monitoring Pengelolaan Sampah (SIMPAH) adalah platform digital terpadu milik Kabupaten Banjarnegara untuk mewujudkan tata kelola persampahan yang modern, transparan, dan berkelanjutan.
            </p>
          </div>
        </section>

        <!-- Visi & Misi Section -->
        <section style="background:var(--bg-secondary); padding:var(--space-16) var(--space-6); border-top:1px solid var(--border-color); border-bottom:1px solid var(--border-color)">
          <div style="max-width:1100px; margin:0 auto">
            <div class="grid-2" style="gap:var(--space-10)">
              <!-- Visi Card -->
              <div class="card" style="padding:var(--space-8); background:var(--bg-primary); border-radius:var(--radius-2xl); border:1px solid var(--border-color); box-shadow:var(--shadow-sm); display:flex; flex-direction:column; justify-content:center">
                <div style="width:52px; height:52px; border-radius:var(--radius-xl); background:rgba(16,185,129,0.1); color:var(--primary-600); display:flex; align-items:center; justify-content:center; margin-bottom:var(--space-6)">
                  ${icons.globe}
                </div>
                <h3 style="font-size:var(--font-2xl); font-weight:800; color:var(--text-primary); margin-bottom:var(--space-4)">Visi Kami</h3>
                <p style="font-size:var(--font-base); line-height:1.7; color:var(--text-secondary); font-style:italic">
                  "Terwujudnya Kabupaten Banjarnegara yang bersih, sehat, ramah lingkungan, dan berkelanjutan melalui sistem monitoring pengelolaan persampahan berbasis data yang transparan dan akuntabel."
                </p>
              </div>

              <!-- Misi Card -->
              <div class="card" style="padding:var(--space-8); background:var(--bg-primary); border-radius:var(--radius-2xl); border:1px solid var(--border-color); box-shadow:var(--shadow-sm)">
                <div style="width:52px; height:52px; border-radius:var(--radius-xl); background:rgba(59,130,246,0.1); color:#2563eb; display:flex; align-items:center; justify-content:center; margin-bottom:var(--space-6)">
                  ${icons.layers}
                </div>
                <h3 style="font-size:var(--font-2xl); font-weight:800; color:var(--text-primary); margin-bottom:var(--space-4)">Misi Utama</h3>
                <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:var(--space-4)">
                  ${[
                    { icon: icons.checkCircle, color: '#10b981', text: '<strong>Digitalisasi Data Real-Time</strong>: Menyediakan platform pencatatan data persampahan dari kader lapangan secara instan, aman, dan mudah digunakan.' },
                    { icon: icons.checkCircle, color: '#10b981', text: '<strong>Transparansi Tata Kelola</strong>: Menyajikan visualisasi data timbulan sampah daerah secara transparan kepada publik.' },
                    { icon: icons.checkCircle, color: '#10b981', text: '<strong>Sinergi & Kolaborasi</strong>: Mempermudah interaksi dan pelaporan pengaduan sampah langsung dari masyarakat kepada Dinas terkait.' }
                  ].map(item => `
                    <li style="display:flex; gap:var(--space-3); align-items:flex-start">
                      <span style="color:${item.color}; flex-shrink:0; margin-top:2px">${item.icon}</span>
                      <span style="font-size:var(--font-sm); line-height:1.6; color:var(--text-secondary)">${item.text}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- Latar Belakang Section -->
        <section class="portal-section" style="padding-top:var(--space-16); padding-bottom:var(--space-16)">
          <div style="max-width:1100px; margin:0 auto">
            <div class="grid-2" style="gap:var(--space-10); align-items:center">
              <div>
                <div style="border-radius:var(--radius-2xl); overflow:hidden; box-shadow:var(--shadow-lg); border:4px solid var(--bg-secondary)">
                  <img src="/about_background_env.png" alt="Lingkungan Hijau" style="width:100%; display:block; object-fit:cover; height:350px" />
                </div>
              </div>
              <div>
                <h3 style="font-size:var(--font-2xl); font-weight:800; color:var(--text-primary); margin-bottom:var(--space-4)">Latar Belakang</h3>
                <p style="font-size:var(--font-sm); line-height:1.7; color:var(--text-secondary); margin-bottom:var(--space-4)">
                  Pertumbuhan populasi dan aktivitas perekonomian di Kabupaten Banjarnegara menuntut pengelolaan lingkungan yang lebih responsif dan cerdas. Salah satu kunci utama kesuksesan pengelolaan ini berada pada validitas data persampahan dari tingkat terkecil seperti rumah tangga, TPS3R, Bank Sampah, hingga Tempat Pemrosesan Akhir (TPA).
                </p>
                <p style="font-size:var(--font-sm); line-height:1.7; color:var(--text-secondary)">
                  SIMPAH hadir sebagai solusi inovatif untuk menjembatani pengumpulan data di lapangan oleh kader kebersihan dengan pengambilan keputusan strategis oleh Dinas Lingkungan Hidup Kabupaten. Dengan pencatatan berbasis digital, setiap data timbulan sampah dapat dimonitor secara real-time dan terintegrasi penuh untuk mendukung pelaporan SIPSN Nasional.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Kontak & Instansi Section -->
        <section style="background:linear-gradient(135deg, #0d7c3d 0%, #059669 100%); color:white; padding:var(--space-16) var(--space-6); text-align:center">
          <div style="max-width:700px; margin:0 auto">
            <h3 style="font-size:var(--font-3xl); font-weight:800; margin-bottom:var(--space-3)">Dinas Perumahan, Kawasan Permukiman, dan Lingkungan Hidup</h3>
            <p style="color:rgba(255,255,255,0.85); font-size:var(--font-base); line-height:1.6; margin-bottom:var(--space-8)">
              Pemerintah Daerah Kabupaten Banjarnegara. Mari berkolaborasi bersama demi lingkungan Banjarnegara yang lebih asri, hijau, dan lestari.
            </p>
            <div style="display:flex; justify-content:center; flex-wrap:wrap; gap:var(--space-6)">
              <div style="background:rgba(255,255,255,0.1); padding:var(--space-3) var(--space-5); border-radius:var(--radius-lg); font-size:var(--font-sm); display:flex; align-items:center; gap:8px">
                ${icons.mapPin} Jl. Selamanik No. 1, Banjarnegara
              </div>
              <a href="mailto:info@simpah.banjarnegara.go.id" style="color:white; text-decoration:none; background:rgba(255,255,255,0.1); padding:var(--space-3) var(--space-5); border-radius:var(--radius-lg); font-size:var(--font-sm); display:flex; align-items:center; gap:8px; transition:background 0.2s" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                ${icons.mail} info@simpah.banjarnegara.go.id
              </a>
            </div>
          </div>
        </section>
      </div>

      ${renderPortalFooter()}
    </div>
  `;
  
  initPortalNav();
}
