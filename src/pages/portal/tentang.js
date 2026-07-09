// SIMPAH - Portal Tentang Kami (About Us)
import { icons } from '../../components/icons.js';
import { renderPortalNav, renderPortalFooter, initPortalNav } from './beranda.js';

export function renderPortalTentang() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="portal-layout">
      ${renderPortalNav('tentang')}
      
      <div style="padding-top: var(--navbar-height); font-family: var(--font-family);">
        <!-- Hero Section -->
        <section class="portal-section" style="padding-top: var(--space-16); padding-bottom: var(--space-20); overflow: hidden; position: relative;">
          <div style="max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 var(--space-4);">
            <!-- Badge -->
            <div style="display: inline-flex; align-items: center; gap: var(--space-2); background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: var(--primary-600); padding: var(--space-2) var(--space-4); border-radius: var(--radius-full); font-size: var(--font-xs); font-weight: 600; text-transform: uppercase; margin-bottom: var(--space-6); letter-spacing: 0.05em;">
              <span style="display: flex; align-items: center;">${icons.leaf}</span> Empowering Environmental Governance
            </div>
            
            <!-- Heading -->
            <h1 style="font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; line-height: 1.15; color: var(--text-primary); max-width: 900px; margin-bottom: var(--space-6); letter-spacing: -0.03em;">
              Smart Waste Intelligence for a <span class="gradient-text" style="font-style: italic;">Sustainable Banjarnegara</span>
            </h1>
            
            <!-- Subtitle -->
            <p style="font-size: var(--font-lg); line-height: 1.6; color: var(--text-secondary); max-width: 700px; margin-bottom: var(--space-10);">
              Platform digital terintegrasi untuk monitoring pengelolaan sampah real-time, pengawasan lingkungan, visualisasi GIS, dan transparansi publik.
            </p>
            
            <!-- Buttons -->
            <div style="display: flex; flex-wrap: wrap; gap: var(--space-4); margin-bottom: var(--space-16); justify-content: center;">
              <a href="#/login" class="portal-nav-btn" style="margin: 0; padding: var(--space-4) var(--space-8); font-size: var(--font-base); border-radius: var(--radius-xl); background: var(--primary-600); color: white; border-color: var(--primary-600); display: flex; align-items: center; gap: 8px; box-shadow: var(--shadow-md); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                Masuk Sistem
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
              <button id="btnLearnMore" class="card" style="margin: 0; padding: var(--space-4) var(--space-8); font-size: var(--font-base); border-radius: var(--radius-xl); background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='var(--bg-secondary)'" onmouseout="this.style.backgroundColor='var(--bg-card)'">
                Pelajari Selengkapnya
              </button>
            </div>
            
            <!-- Teaser Dashboard -->
            <div style="position: relative; width: 100%; max-width: 960px; margin: 0 auto;">
              <div style="border-radius: 24px; border: 1px solid var(--border-color); background: var(--bg-card); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);">
                <img style="width: 100%; height: auto; display: block; object-fit: cover;" alt="GIS Waste Management Dashboard" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0KvIbTWx7DJsSjmosG4ZsdRSlAyRz6y3u4gurUfG884KAWPjqAHwDMeHxQuJiI2-AxKFZq8F-zCU_uAoAOBUrBMzo5CgyP2ySfBy7PRVf09kA0xGM75d6RZh2S5BQYKQu5XifN0w3CCoMkjg6Ok9loj3JHfPxNVA5RVjXSmdGsgsBiXksJs7fqkC5bXJgHz_n3bFLsLtC4CGa__jAe-sVzJ2F9xLOgdrIG4pVN2b8CKdmgZDQ89NvsmVpianpfqgFRnB81opiSABE" />
              </div>
              
              <!-- Floating Card 1 -->
              <div class="card" style="position: absolute; top: -30px; right: 40px; display: none; padding: var(--space-4) var(--space-5); background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-lg); align-items: center; gap: var(--space-4);" id="floatCard1">
                <div style="padding: var(--space-3); background: rgba(16, 185, 129, 0.1); color: var(--primary-600); border-radius: var(--radius-lg); display: flex; align-items: center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                </div>
                <div style="text-align: left;">
                  <p style="font-size: 10px; font-weight: 600; color: var(--text-secondary); margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.05em;">Efisiensi Rute</p>
                  <p style="font-size: var(--font-lg); font-weight: 800; color: var(--primary-600); margin: 0;">+24.8%</p>
                </div>
              </div>
              
              <!-- Floating Card 2 -->
              <div class="card" style="position: absolute; bottom: 30px; left: -40px; display: none; padding: var(--space-4) var(--space-5); background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-lg); align-items: center; gap: var(--space-4);" id="floatCard2">
                <div style="padding: var(--space-3); background: rgba(59, 130, 246, 0.1); color: #2563eb; border-radius: var(--radius-lg); display: flex; align-items: center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div style="text-align: left;">
                  <p style="font-size: 10px; font-weight: 600; color: var(--text-secondary); margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.05em;">Cakupan Wilayah</p>
                  <p style="font-size: var(--font-lg); font-weight: 800; color: #2563eb; margin: 0;">278 Desa</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- CSS for floating display on desktop -->
        <style>
          @media (min-width: 1024px) {
            #floatCard1 { display: flex !important; }
            #floatCard2 { display: flex !important; }
          }
        </style>

        <!-- Mission & Vision Section -->
        <section id="visiMisiSection" class="portal-section" style="background: var(--bg-secondary); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); padding-top: var(--space-20); padding-bottom: var(--space-20);">
          <div style="max-width: 1100px; margin: 0 auto; padding: 0 var(--space-4);">
            <div style="margin-bottom: var(--space-10); text-align: left;">
              <p style="font-size: 11px; font-weight: 600; color: var(--primary-600); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.15em;">Our North Star</p>
              <h2 style="font-size: var(--font-3xl); font-weight: 800; color: var(--text-primary); margin: 0;">Modernizing Sustainability Efforts</h2>
            </div>
            
            <div class="grid-2" style="gap: var(--gutter-grid, var(--space-8));">
              <!-- Mission Card -->
              <div class="card" style="padding: var(--space-8); background: var(--bg-primary); border-radius: 24px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-content: center;">
                <div style="width: 56px; height: 56px; border-radius: var(--radius-xl); background: rgba(16, 185, 129, 0.1); color: var(--primary-600); display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-6);">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                </div>
                <h3 style="font-size: var(--font-xl); font-weight: 800; color: var(--text-primary); margin-bottom: var(--space-3);">Misi Kami</h3>
                <p style="font-size: var(--font-sm); line-height: 1.6; color: var(--text-secondary); margin: 0;">
                  Membangun ekosistem digital tata kelola persampahan daerah yang memberikan data valid, terstruktur, serta mempermudah sinergi antara dinas lingkungan hidup, kader kebersihan desa, dan warga.
                </p>
              </div>

              <!-- Vision Card -->
              <div class="card" style="padding: var(--space-8); background: linear-gradient(135deg, #0d7c3d 0%, #059669 100%); color: white; border-radius: 24px; border: none; box-shadow: var(--shadow-md); display: flex; flex-direction: column; justify-content: center;">
                <div style="width: 56px; height: 56px; border-radius: var(--radius-xl); background: rgba(255, 255, 255, 0.2); color: white; display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-6);">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </div>
                <h3 style="font-size: var(--font-xl); font-weight: 800; color: white; margin-bottom: var(--space-3);">Visi Kami</h3>
                <p style="font-size: var(--font-sm); line-height: 1.6; color: rgba(255, 255, 255, 0.85); margin: 0;">
                  Menjadi tolak ukur transformasi digital pengelolaan lingkungan tingkat kabupaten di Indonesia, mewujudkan Kabupaten Banjarnegara yang bersih, sehat, dan lestari melalui inovasi teknologi.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Problem Story (Latar Belakang) -->
        <section class="portal-section" style="padding-top: var(--space-20); padding-bottom: var(--space-20);">
          <div style="max-width: 1100px; margin: 0 auto; padding: 0 var(--space-4);">
            <div class="grid-2" style="gap: var(--space-12); align-items: center;">
              <!-- Left: Image -->
              <div style="position: relative;">
                <div style="border-radius: 32px; overflow: hidden; box-shadow: var(--shadow-xl); border: 4px solid var(--bg-secondary);">
                  <img src="/about_background_env.png" alt="Latar Belakang SIMPAH" style="width: 100%; display: block; object-fit: cover; height: 420px; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'" />
                </div>
                <div style="position: absolute; bottom: 24px; left: 24px; padding: var(--space-4); background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px); border-radius: var(--radius-xl); border: 1px solid rgba(255,255,255,0.2); max-width: 80%; box-shadow: var(--shadow-md);">
                  <p style="font-size: 9px; font-weight: 700; color: var(--primary-600); margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.1em;">Local Impact</p>
                  <p style="font-size: var(--font-xs); font-weight: 600; color: var(--text-primary); margin: 0; line-height: 1.4;">Mengoptimalkan alur logistik persampahan daerah melalui keputusan berbasis data.</p>
                </div>
              </div>
              
              <!-- Right: Content & Stats Grid -->
              <div>
                <p style="font-size: 11px; font-weight: 600; color: var(--primary-600); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.15em;">The Challenge</p>
                <h2 style="font-size: var(--font-2xl); font-weight: 800; color: var(--text-primary); margin-bottom: var(--space-4); line-height: 1.2;">Closing the Loop with Intelligence</h2>
                <p style="font-size: var(--font-sm); line-height: 1.7; color: var(--text-secondary); margin-bottom: var(--space-8);">
                  Pencatatan manual dan sistem pelaporan yang terfragmentasi seringkali menghambat pengambilan keputusan persampahan. SIMPAH hadir untuk memangkas hambatan ini, menghubungkan data timbulan dari TPS3R desa langsung ke pusat analisis dinas kabupaten secara instan.
                </p>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4);">
                  <div style="padding: var(--space-4); background: var(--bg-secondary); border-radius: var(--radius-xl); border: 1px solid var(--border-color);">
                    <p style="font-size: var(--font-lg); font-weight: 800; color: var(--primary-600); margin-bottom: 2px;">278</p>
                    <p style="font-size: 10px; font-weight: 600; color: var(--text-secondary); margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">Desa Terkoneksi</p>
                  </div>
                  <div style="padding: var(--space-4); background: var(--bg-secondary); border-radius: var(--radius-xl); border: 1px solid var(--border-color);">
                    <p style="font-size: var(--font-lg); font-weight: 800; color: var(--primary-600); margin-bottom: 2px;">100%</p>
                    <p style="font-size: 10px; font-weight: 600; color: var(--text-secondary); margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">Laporan Digital</p>
                  </div>
                  <div style="padding: var(--space-4); background: var(--bg-secondary); border-radius: var(--radius-xl); border: 1px solid var(--border-color);">
                    <p style="font-size: var(--font-lg); font-weight: 800; color: var(--primary-600); margin-bottom: 2px;">Real-Time</p>
                    <p style="font-size: 10px; font-weight: 600; color: var(--text-secondary); margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">Monitoring Aktif</p>
                  </div>
                  <div style="padding: var(--space-4); background: var(--bg-secondary); border-radius: var(--radius-xl); border: 1px solid var(--border-color);">
                    <p style="font-size: var(--font-lg); font-weight: 800; color: var(--primary-600); margin-bottom: 2px;">Terintegrasi</p>
                    <p style="font-size: 10px; font-weight: 600; color: var(--text-secondary); margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">Peta GIS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Platform Features -->
        <section class="portal-section" style="background: var(--bg-secondary); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); padding-top: var(--space-20); padding-bottom: var(--space-20);">
          <div style="max-width: 1100px; margin: 0 auto; padding: 0 var(--space-4);">
            <div style="text-align: center; margin-bottom: var(--space-12);">
              <p style="font-size: 11px; font-weight: 600; color: var(--primary-600); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.15em;">Capabilities</p>
              <h2 style="font-size: var(--font-3xl); font-weight: 800; color: var(--text-primary); margin: 0;">Unified Environmental Suite</h2>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-6);">
              <!-- Feature 1 -->
              <div class="card" style="padding: var(--space-6); background: var(--bg-primary); border-radius: 20px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary-600)'" onmouseout="this.style.borderColor='var(--border-color)'">
                <div style="width: 48px; height: 48px; background: rgba(16, 185, 129, 0.1); color: var(--primary-600); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-4);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>
                </div>
                <h3 style="font-size: var(--font-base); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">Real-Time Monitoring</h3>
                <p style="font-size: var(--font-xs); line-height: 1.5; color: var(--text-secondary); margin: 0;">Pemantauan data timbulan dan setoran sampah dari seluruh TPS3R dan desa ke dinas secara langsung.</p>
              </div>
              
              <!-- Feature 2 -->
              <div class="card" style="padding: var(--space-6); background: var(--bg-primary); border-radius: 20px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary-600)'" onmouseout="this.style.borderColor='var(--border-color)'">
                <div style="width: 48px; height: 48px; background: rgba(16, 185, 129, 0.1); color: var(--primary-600); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-4);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                </div>
                <h3 style="font-size: var(--font-base); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">GIS Mapping</h3>
                <p style="font-size: var(--font-xs); line-height: 1.5; color: var(--text-secondary); margin: 0;">Peta interaktif sebaran sarana TPS, Bank Sampah, TPA, dan visualisasi spasial titik layanan angkutan.</p>
              </div>

              <!-- Feature 3 -->
              <div class="card" style="padding: var(--space-6); background: var(--bg-primary); border-radius: 20px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary-600)'" onmouseout="this.style.borderColor='var(--border-color)'">
                <div style="width: 48px; height: 48px; background: rgba(16, 185, 129, 0.1); color: var(--primary-600); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-4);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <h3 style="font-size: var(--font-base); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">Smart Reporting</h3>
                <p style="font-size: var(--font-xs); line-height: 1.5; color: var(--text-secondary); margin: 0;">Rekap data setoran harian/bulanan secara otomatis, siap diekspor guna pelaporan SIPSN pusat.</p>
              </div>

              <!-- Feature 4 -->
              <div class="card" style="padding: var(--space-6); background: var(--bg-primary); border-radius: 20px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary-600)'" onmouseout="this.style.borderColor='var(--border-color)'">
                <div style="width: 48px; height: 48px; background: rgba(16, 185, 129, 0.1); color: var(--primary-600); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-4);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line><line x1="2" y1="20" x2="22" y2="20"></line></svg>
                </div>
                <h3 style="font-size: var(--font-base); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">Waste Analytics</h3>
                <p style="font-size: var(--font-xs); line-height: 1.5; color: var(--text-secondary); margin: 0;">Analisis tren komposisi jenis sampah guna perancangan kebijakan pengelolaan lingkungan berkelanjutan.</p>
              </div>

              <!-- Feature 5 -->
              <div class="card" style="padding: var(--space-6); background: var(--bg-primary); border-radius: 20px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary-600)'" onmouseout="this.style.borderColor='var(--border-color)'">
                <div style="width: 48px; height: 48px; background: rgba(16, 185, 129, 0.1); color: var(--primary-600); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-4);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <h3 style="font-size: var(--font-base); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">Fitur Internal Aduan</h3>
                <p style="font-size: var(--font-xs); line-height: 1.5; color: var(--text-secondary); margin: 0;">Penerimaan dan pelacakan laporan aduan kebersihan secara tertib oleh jajaran petugas di lapangan.</p>
              </div>

              <!-- Feature 6 -->
              <div class="card" style="padding: var(--space-6); background: var(--bg-primary); border-radius: 20px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary-600)'" onmouseout="this.style.borderColor='var(--border-color)'">
                <div style="width: 48px; height: 48px; background: rgba(16, 185, 129, 0.1); color: var(--primary-600); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-4);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
                </div>
                <h3 style="font-size: var(--font-base); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">Executive Dashboard</h3>
                <p style="font-size: var(--font-xs); line-height: 1.5; color: var(--text-secondary); margin: 0;">Ikhtisar visualisasi metrik utama yang komprehensif bagi jajaran kepala daerah dan dinas.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Dashboard Showcase -->
        <section class="portal-section" style="padding-top: var(--space-20); padding-bottom: var(--space-20);">
          <div style="max-width: 1100px; margin: 0 auto; padding: 0 var(--space-4);">
            <div class="grid-2" style="gap: var(--space-12); align-items: center;">
              <!-- Left -->
              <div>
                <h2 style="font-size: var(--font-2xl); font-weight: 800; color: var(--text-primary); margin-bottom: var(--space-6); line-height: 1.2;">Governance at Your Fingertips</h2>
                <p style="font-size: var(--font-base); line-height: 1.7; color: var(--text-secondary); margin-bottom: var(--space-8);">
                  Antarmuka kami dirancang khusus demi kemudahan pengoperasian dan pembacaan data. Baik petugas lapangan maupun kepala dinas pengambil keputusan, SIMPAH menyajikan granularitas data yang akurat dan siap pakai.
                </p>
                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-4);">
                  <li style="display: flex; align-items: center; gap: var(--space-3);">
                    <span style="color: var(--primary-600); display: flex; align-items: center;">${icons.checkCircle}</span>
                    <span style="font-size: var(--font-sm); color: var(--text-secondary); font-weight: 500;">Dioptimalkan untuk Berbagai Perangkat</span>
                  </li>
                  <li style="display: flex; align-items: center; gap: var(--space-3);">
                    <span style="color: var(--primary-600); display: flex; align-items: center;">${icons.checkCircle}</span>
                    <span style="font-size: var(--font-sm); color: var(--text-secondary); font-weight: 500;">Sinkronisasi Data Real-Time & Cepat</span>
                  </li>
                  <li style="display: flex; align-items: center; gap: var(--space-3);">
                    <span style="color: var(--primary-600); display: flex; align-items: center;">${icons.checkCircle}</span>
                    <span style="font-size: var(--font-sm); color: var(--text-secondary); font-weight: 500;">Ekspor Laporan Resmi Standar SIPSN</span>
                  </li>
                </ul>
              </div>
              
              <!-- Right -->
              <div style="position: relative;">
                <div style="padding: 16px; background: var(--bg-secondary); border-radius: 32px; border: 1px solid var(--border-color); box-shadow: var(--shadow-xl); overflow: hidden;">
                  <img style="width: 100%; border-radius: 20px; display: block;" alt="SIMPAH Analytics Platform Map" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0KvIbTWx7DJsSjmosG4ZsdRSlAyRz6y3u4gurUfG884KAWPjqAHwDMeHxQuJiI2-AxKFZq8F-zCU_uAoAOBUrBMzo5CgyP2ySfBy7PRVf09kA0xGM75d6RZh2S5BQYKQu5XifN0w3CCoMkjg6Ok9loj3JHfPxNVA5RVjXSmdGsgsBiXksJs7fqkC5bXJgHz_n3bFLsLtC4CGa__jAe-sVzJ2F9xLOgdrIG4pVN2b8CKdmgZDQ89NvsmVpianpfqgFRnB81opiSABE" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="portal-section" style="padding-bottom: var(--space-20);">
          <div style="max-width: 1100px; margin: 0 auto; padding: 0 var(--space-4);">
            <div style="background: linear-gradient(135deg, #0d7c3d 0%, #059669 100%); color: white; border-radius: 40px; padding: var(--space-16) var(--space-10); text-align: center; position: relative; overflow: hidden; box-shadow: var(--shadow-lg);">
              <div style="max-width: 700px; margin: 0 auto; position: relative; z-index: 2;">
                <h2 style="font-size: var(--font-3xl); font-weight: 800; margin-bottom: var(--space-6); color: white; line-height: 1.2;">Let's Build a Cleaner Banjarnegara Together</h2>
                <p style="color: rgba(255, 255, 255, 0.85); font-size: var(--font-base); line-height: 1.6; margin-bottom: var(--space-10);">
                  Mari bergabung dalam ekosistem digital tata kelola persampahan terpadu. Masuk ke sistem monitoring untuk merekam setoran sampah desa secara akurat dan transparan.
                </p>
                <a href="#/login" class="portal-nav-btn" style="margin: 0 auto; display: inline-block; padding: var(--space-4) var(--space-8); font-size: var(--font-base); border-radius: var(--radius-xl); background: white; color: #0d7c3d; border-color: white; font-weight: 700; transition: transform 0.2s; box-shadow: var(--shadow-md);" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                  Masuk Sekarang
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      ${renderPortalFooter()}
    </div>
  `;

  // Attach smooth scroll logic
  setTimeout(() => {
    const btn = document.getElementById('btnLearnMore');
    if (btn) {
      btn.addEventListener('click', () => {
        const target = document.getElementById('visiMisiSection');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }, 50);
  
  initPortalNav();
}
