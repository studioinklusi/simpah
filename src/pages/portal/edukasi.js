// SIMPAH - Portal Edukasi
import { icons } from '../../components/icons.js';
import { renderPortalNav, renderPortalFooter, initPortalNav } from './beranda.js';
import { supabase } from '../../lib/supabase.js';
import { formatDate } from '../../utils/helpers.js';

// Static fallback articles
const FALLBACK_ARTICLES = [
  {
    id: 'a1111111-1111-1111-1111-111111111111', 
    category: 'Pemilahan', 
    title: 'Panduan Praktis Memilah Sampah Rumah Tangga',
    excerpt: 'Langkah mudah memulai pilah sampah dari dapur Anda untuk mengurangi volume sampah ke TPA.',
    content: `
      <h2>Pentingnya Memilah Sampah dari Rumah</h2>
      <p>Memilah sampah adalah langkah pertama yang paling krusial dalam siklus pengelolaan sampah modern. Dengan memisahkan sampah organik dan anorganik di tingkat rumah tangga, kita dapat meningkatkan tingkat daur ulang hingga 80% dan mencegah pencemaran lingkungan.</p>
      <h3>Langkah Praktis Memulai:</h3>
      <ol>
        <li><strong>Siapkan Wadah Terpisah:</strong> Sediakan minimal dua tempat sampah di rumah, satu untuk sampah organik (sisa makanan, dedaunan) dan satu untuk anorganik (plastik, kertas, logam).</li>
        <li><strong>Bersihkan Sampah Anorganik:</strong> Sebelum membuang botol plastik atau wadah bekas makanan, bilas terlebih dahulu dengan air agar tidak mengundang lalat dan mempermudah proses daur ulang.</li>
        <li><strong>Konsistensi:</strong> Jadikan memilah sampah sebagai kebiasaan sehari-hari seluruh anggota keluarga.</li>
      </ol>
    `,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
    color: '#10b981', 
    image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222', 
    category: 'Kompos', 
    title: 'Membuat Kompos Organik dengan Metode Takakura',
    excerpt: 'Metode praktis pembuatan kompos skala rumah tangga tanpa bau dan tidak memerlukan lahan luas.',
    content: `
      <h2>Mengenal Metode Kompos Takakura</h2>
      <p>Metode Takakura dikembangkan oleh Koji Takakura dari Jepang. Metode ini sangat cocok untuk daerah perkotaan atau rumah tangga dengan lahan terbatas karena prosesnya kering, tidak berbau, dan cepat menghasilkan kompos.</p>
      <h3>Persiapan Alat & Bahan:</h3>
      <ul>
        <li>Keranjang plastik berlubang udara (keranjang baju)</li>
        <li>Bantalan sekam padi</li>
        <li>Starter bakteri/kompos matang</li>
        <li>Kain penutup hitam</li>
      </ul>
      <h3>Cara Pembuatan:</h3>
      <ol>
        <li>Letakkan bantalan sekam di dasar keranjang untuk menyerap kelebihan air.</li>
        <li>Masukkan starter bakteri atau kompos matang ke dalam keranjang.</li>
        <li>Masukkan sampah organik dapur yang sudah dipotong kecil-kecil.</li>
        <li>Aduk rata dengan starter.</li>
        <li>Tutup dengan bantalan sekam kedua dan kain hitam untuk menjaga kelembapan dan panas.</li>
      </ol>
    `,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), 
    color: '#f59e0b', 
    image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333', 
    category: 'Daur Ulang', 
    title: 'Daur Ulang Plastik PET: Jenis dan Prosesnya',
    excerpt: 'Mengenal kode plastik nomor 1 (PET/PETE) dan bagaimana kontribusi Anda menyelamatkan laut.',
    content: `
      <h2>Apa itu Plastik PET?</h2>
      <p>PET (Polyethylene Terephthalate) adalah jenis plastik yang paling umum digunakan untuk botol minuman sekali pakai. Plastik ini ditandai dengan kode angka 1 di dalam segitiga daur ulang.</p>
      <h3>Proses Daur Ulang PET:</h3>
      <p>Plastik PET 100% dapat didaur ulang menjadi serat poliester untuk pakaian, tas belanja, hingga botol minuman baru. Pengurangan limbah PET sangat krusial karena plastik ini membutuhkan waktu hingga 450 tahun untuk terurai di alam bebas.</p>
      <h3>Cara Membantu Daur Ulang:</h3>
      <ol>
        <li>Kosongkan isi botol sepenuhnya.</li>
        <li>Remas botol untuk menghemat ruang penyimpanan.</li>
        <li>Buang ke bank sampah terdekat.</li>
      </ol>
    `,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), 
    color: '#3b82f6', 
    image_url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80'
  }
];

const CATEGORY_STYLES = {
  Pemilahan: { color: '#10b981', icon: icons.recycle },
  'Daur Ulang': { color: '#3b82f6', icon: icons.refreshCw },
  Kompos: { color: '#f59e0b', icon: icons.leaf },
  Regulasi: { color: '#8b5cf6', icon: icons.clipboard },
  '3R': { color: '#0d9488', icon: icons.globe },
  TPS3R: { color: '#ef4444', icon: icons.factory },
  Umum: { color: '#10b981', icon: icons.book }
};

export async function renderEdukasi() {
  const app = document.getElementById('app');
  
  // Render layout structure first with loading skeleton
  app.innerHTML = `
    <div class="portal-layout">
      ${renderPortalNav('edukasi')}
      <div style="padding-top:calc(var(--navbar-height) + var(--space-8))">
        <section class="portal-section" style="min-height:70vh">
          <div class="portal-section-header">
            <h2>Edukasi ${`<span class="gradient-text">Pengelolaan Sampah</span>`}</h2>
            <p>Artikel dan informasi untuk meningkatkan kesadaran masyarakat dalam pengelolaan sampah</p>
          </div>
          
          <!-- Loading skeleton -->
          <div class="grid-auto" id="edukasiArticlesGrid">
            ${[1, 2, 3].map(() => `
              <div class="portal-card skeleton-loading" style="height:350px; border-radius:var(--radius-lg); opacity:0.6"></div>
            `).join('')}
          </div>
        </section>
      </div>

      <!-- Article Detail Modal -->
      <div class="art-detail-overlay" id="articleDetailModal" style="display:none">
        <div class="art-detail-modal">
          <div style="position:relative">
            <img id="modalCover" src="" style="width:100%; height:280px; object-fit:cover" />
            <div style="position:absolute; inset:0; background:linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7))"></div>
            <button class="art-detail-close" id="modalCloseBtn">${icons.close}</button>
            <div style="position:absolute; bottom:var(--space-4); left:var(--space-6); right:var(--space-6); color:#fff">
              <span class="portal-card-tag" id="modalTag" style="color:#fff; background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.4)"></span>
              <h2 id="modalTitle" style="font-size:var(--font-xl); font-weight:800; text-shadow:0 2px 4px rgba(0,0,0,0.5); margin-top:var(--space-2)"></h2>
            </div>
          </div>
          <div class="art-detail-body">
            <div style="font-size:var(--font-xs); color:var(--text-muted); margin-bottom:var(--space-4); display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:12px">
              <span>Diterbitkan: <strong id="modalDate"></strong></span>
              <span>SIMPAH Smart Intelligence</span>
            </div>
            <div id="modalContent" class="article-rich-text"></div>
          </div>
        </div>
      </div>

      <style>
        .skeleton-loading {
          background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--border-color) 50%, var(--bg-secondary) 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.5s infinite;
        }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .art-detail-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(10,15,26,0.75); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
        .art-detail-modal { background:var(--bg-primary); border-radius:var(--radius-xl); width:95%; max-width:650px; max-height:90vh; overflow-y:auto; box-shadow:0 25px 50px -12px rgba(0, 0, 0, 0.4); overflow-hidden:hidden; border:1px solid var(--border-color); animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .art-detail-close { position:absolute; top:16px; right:16px; width:36px; height:36px; border-radius:50%; border:none; background:rgba(0,0,0,0.5); color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px); transition:all 0.15s; }
        .art-detail-close:hover { background:var(--danger-600); transform:scale(1.05); }
        .art-detail-body { padding:var(--space-6) var(--space-8); }
        .article-rich-text h2 { font-size:var(--font-lg); font-weight:700; color:var(--text-primary); margin-top:var(--space-5); margin-bottom:var(--space-3); }
        .article-rich-text h3 { font-size:var(--font-md); font-weight:700; color:var(--text-primary); margin-top:var(--space-4); margin-bottom:var(--space-2); }
        .article-rich-text p { font-size:var(--font-sm); line-height:1.6; color:var(--text-secondary); margin-bottom:var(--space-4); }
        .article-rich-text ul, .article-rich-text ol { margin-bottom:var(--space-4); padding-left:20px; font-size:var(--font-sm); color:var(--text-secondary); }
        .article-rich-text li { margin-bottom:6px; line-height:1.5 }
      </style>
      ${renderPortalFooter()}
    </div>
  `;
  initPortalNav();

  // 2. Fetch published articles from database
  let articles = [];
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    articles = data || [];
  } catch (err) {
    console.warn('Database fetch failed for portal articles, using fallback data.', err);
  }

  // Fallback to static if empty or error
  if (articles.length === 0) {
    articles = FALLBACK_ARTICLES;
  }

  // 3. Render cards
  const grid = document.getElementById('edukasiArticlesGrid');
  if (grid) {
    grid.innerHTML = articles.map((a, i) => {
      const style = CATEGORY_STYLES[a.category] || CATEGORY_STYLES.Umum;
      return `
        <div class="portal-card" data-article-id="${a.id}" style="animation:fadeInUp 0.4s ease ${i * 0.08}s both; cursor:pointer">
          <div class="portal-card-image" style="position:relative; overflow:hidden; padding:0;">
            <img src="${a.image_url || 'https://placehold.co/600x400?text=No+Image'}" alt="${a.title}" style="width:100%; height:100%; object-fit:cover; transition: transform 0.3s ease;" />
            <div style="position:absolute; inset:0; background:linear-gradient(to bottom, transparent 40%, ${style.color}dd 100%); opacity:0.6; mix-blend-mode:multiply;"></div>
            <div style="position:absolute; bottom:var(--space-3); right:var(--space-3); background:rgba(255,255,255,0.9); padding:var(--space-2); border-radius:50%; color:${style.color}; box-shadow:var(--shadow-sm);">
              ${style.icon}
            </div>
          </div>
          <div class="portal-card-body">
            <span class="portal-card-tag" style="background:${style.color}15; color:${style.color}">${a.category}</span>
            <h3 class="portal-card-title">${a.title}</h3>
            <p class="portal-card-excerpt">${a.excerpt}</p>
            <p style="font-size:var(--font-xs); color:var(--text-muted); margin-top:var(--space-3)">${formatDate(a.created_at)}</p>
          </div>
        </div>
      `;
    }).join('');

    // Hover effect animation on cards
    grid.querySelectorAll('.portal-card').forEach(card => {
      const img = card.querySelector('img');
      card.addEventListener('mouseenter', () => { if (img) img.style.transform = 'scale(1.05)'; });
      card.addEventListener('mouseleave', () => { if (img) img.style.transform = 'scale(1)'; });

      // Click to open detail modal
      card.addEventListener('click', () => {
        const id = card.dataset.articleId;
        const art = articles.find(x => x.id === id);
        if (art) openArticleDetail(art);
      });
    });
  }

  // 4. Modal actions
  const modal = document.getElementById('articleDetailModal');
  const closeBtn = document.getElementById('modalCloseBtn');
  
  if (closeBtn) {
    closeBtn.onclick = () => { if (modal) modal.style.display = 'none'; };
  }
  
  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = 'none';
    };
  }

  function openArticleDetail(art) {
    const modal = document.getElementById('articleDetailModal');
    const mCover = document.getElementById('modalCover');
    const mTag = document.getElementById('modalTag');
    const mTitle = document.getElementById('modalTitle');
    const mDate = document.getElementById('modalDate');
    const mContent = document.getElementById('modalContent');
    const style = CATEGORY_STYLES[art.category] || CATEGORY_STYLES.Umum;

    if (!modal) return;

    mCover.src = art.image_url || 'https://placehold.co/600x400?text=No+Image';
    mTag.textContent = art.category;
    mTag.style.backgroundColor = style.color;
    mTitle.textContent = art.title;
    mDate.textContent = formatDate(art.created_at);

    // Render HTML content safely inside detail page
    mContent.innerHTML = art.content || `<p>${art.excerpt}</p>`;

    modal.style.display = 'flex';
  }
}
