// SIMPAH - Portal Edukasi
import { icons } from '../../components/icons.js';
import { renderPortalNav, renderPortalFooter, initPortalNav } from './beranda.js';
import { supabase } from '../../lib/supabase.js';
import { formatDate } from '../../utils/helpers.js';
import { showToast } from '../../components/toast.js';

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
  
  // Render layout structure with skeleton loading
  app.innerHTML = `
    <div class="portal-layout">
      ${renderPortalNav('edukasi')}
      <div style="padding-top:var(--navbar-height)">
        <!-- Grid View Content -->
        <section class="portal-section" id="edukasiGridViewSection" style="min-height:70vh; padding-top:40px">
          <div class="portal-section-header">
            <h2>Edukasi ${`<span class="gradient-text">Pengelolaan Sampah</span>`}</h2>
            <p>Artikel dan informasi untuk meningkatkan kesadaran masyarakat dalam pengelolaan sampah</p>
          </div>
          
          <div class="grid-auto" id="edukasiArticlesGrid">
            ${[1, 2, 3].map(() => `
              <div class="portal-card skeleton-loading" style="height:350px; border-radius:var(--radius-lg); opacity:0.6"></div>
            `).join('')}
          </div>
        </section>

        <!-- Dynamic Article Reading View (Two-Column Layout) -->
        <section class="portal-section" id="edukasiReadingViewSection" style="display:none; max-width:1200px; margin:0 auto; padding-top:24px; padding-bottom:80px; min-height:70vh">
          <div class="read-layout-grid">
            
            <!-- Left Column: Main Article Content -->
            <div class="read-main-col">
              <!-- Back button -->
              <button id="backToGridBtn" style="display:inline-flex; align-items:center; gap:8px; border:none; background:rgba(16,185,129,0.08); color:var(--primary-600); font-weight:700; padding:10px 20px; border-radius:24px; cursor:pointer; font-size:var(--font-sm); margin-bottom:24px; transition:all 0.2s">
                ${icons.chevronLeft} Kembali ke Edukasi
              </button>

              <!-- Article Header -->
              <div style="margin-bottom:24px">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px">
                  <span id="readCategoryBadge" class="portal-card-tag" style="padding:4px 12px; border-radius:12px; font-weight:700; font-size:var(--font-xs)"></span>
                  <span id="readDate" style="font-size:var(--font-sm); color:var(--text-muted)"></span>
                </div>
                <h1 id="readTitle" style="font-size:clamp(1.5rem, 3.5vw, 2.25rem); font-weight:800; line-height:1.25; color:var(--text-primary); letter-spacing:-0.02em; margin:0 0 16px 0"></h1>
                <p id="readExcerpt" style="font-size:var(--font-sm); line-height:1.6; color:var(--text-secondary); font-style:italic; margin:0; padding-left:16px; border-left:4px solid var(--primary-500)"></p>
              </div>

              <!-- Cover Image -->
              <div style="border-radius:var(--radius-xl); overflow:hidden; margin-bottom:32px; box-shadow:var(--shadow-md); height:clamp(200px, 35vw, 380px)">
                <img id="readCoverImage" src="" style="width:100%; height:100%; object-fit:cover" />
              </div>

              <!-- Rich Text Content Body -->
              <div id="readContentBody" class="article-rich-text"></div>
            </div>

            <!-- Right Column: Sidebar (Platform Info & Related Articles) -->
            <div class="read-sidebar-col">
              <!-- Platform About Card -->
              <div class="sidebar-card">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px">
                  <div style="width:36px; height:36px; border-radius:50%; background:rgba(16,185,129,0.1); color:var(--primary-600); display:flex; align-items:center; justify-content:center">
                    ${icons.leaf}
                  </div>
                  <strong style="color:var(--text-primary); font-size:15px">SIMPAH Intelligence</strong>
                </div>
                <p style="font-size:13px; color:var(--text-secondary); line-height:1.5; margin:0">Platform digital terintegrasi untuk pengelolaan sampah cerdas, visualisasi data, dan pelaporan transparansi lingkungan di Kabupaten Banjarnegara.</p>
              </div>

              <!-- Related Articles Card -->
              <div class="sidebar-card">
                <h4 style="font-size:14px; font-weight:700; color:var(--text-primary); margin:0 0 16px 0; border-bottom:1px solid var(--border-color); padding-bottom:8px">Artikel Edukasi Lainnya</h4>
                <div id="relatedArticlesList" style="display:flex; flex-direction:column; gap:16px"></div>
              </div>
            </div>

          </div>
        </section>
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
        .read-layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
        }
        @media (min-width: 992px) {
          .read-layout-grid {
            grid-template-columns: 8fr 4fr;
          }
        }
        .read-main-col {
          min-width: 0;
        }
        .read-sidebar-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        @media (min-width: 992px) {
          .read-sidebar-col {
            position: sticky;
            top: 120px;
            align-self: flex-start;
          }
        }
        .sidebar-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 20px;
        }
        .article-rich-text {
          font-size: 1.05rem;
          line-height: 1.8;
          color: var(--text-secondary);
        }
        .article-rich-text h2 { font-size:var(--font-lg); font-weight:800; color:var(--text-primary); margin-top:36px; margin-bottom:16px; letter-spacing:-0.01em; }
        .article-rich-text h3 { font-size:var(--font-md); font-weight:700; color:var(--text-primary); margin-top:24px; margin-bottom:12px; }
        .article-rich-text p { margin-bottom:20px; text-align:justify; }
        .article-rich-text ul, .article-rich-text ol { margin-bottom:24px; padding-left:24px; }
        .article-rich-text li { margin-bottom:8px; line-height:1.6; }
        .article-rich-text strong { color:var(--text-primary); }
        
        .related-art-item {
          transition: all 0.15s ease;
        }
        .related-art-item:hover h5 {
          color: var(--primary-600) !important;
        }
      </style>
      ${renderPortalFooter()}
    </div>
  `;
  initPortalNav();

  // Fetch articles from Supabase
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
    console.warn('Database fetch failed for portal articles.', err);
  }

  // Parse active article from URL hash
  const currentHash = window.location.hash.slice(1) || '/portal/edukasi';
  const hashParts = currentHash.split('/');
  const activeArticleId = hashParts.length > 3 ? hashParts[3] : null;

  // Render grids
  const grid = document.getElementById('edukasiArticlesGrid');
  const gridSection = document.getElementById('edukasiGridViewSection');
  const readingSection = document.getElementById('edukasiReadingViewSection');

  if (grid) {
    if (articles.length === 0) {
      grid.className = "";
      grid.style.display = "flex";
      grid.style.justifyContent = "center";
      grid.style.alignItems = "center";
      grid.style.minHeight = "280px";
      grid.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); max-width: 400px; width: 100%;">
          <div style="font-size: 48px; margin-bottom: 16px; color: var(--primary-500); opacity: 0.8; display: flex; justify-content: center;">
            ${icons.book}
          </div>
          <h4 style="font-size: var(--font-md); font-weight: 700; color: var(--text-primary); margin: 0 0 8px 0;">Belum Ada Artikel</h4>
          <p style="font-size: var(--font-sm); margin: 0; line-height: 1.5;">Belum ada artikel edukasi yang diterbitkan saat ini. Silakan kembali lagi nanti.</p>
        </div>
      `;
    } else {
      grid.className = "grid-auto";
      grid.style.display = "";
      grid.style.justifyContent = "";
      grid.style.alignItems = "";
      grid.style.minHeight = "";
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

      // Setup interactive events
      grid.querySelectorAll('.portal-card').forEach(card => {
        const img = card.querySelector('img');
        card.addEventListener('mouseenter', () => { if (img) img.style.transform = 'scale(1.05)'; });
        card.addEventListener('mouseleave', () => { if (img) img.style.transform = 'scale(1)'; });

        card.addEventListener('click', () => {
          const id = card.dataset.articleId;
          window.location.hash = `#/portal/edukasi/${id}`;
        });
      });
    }
  }

  // Rerender state dynamically based on active ID
  if (activeArticleId && articles.length > 0) {
    const activeArt = articles.find(x => x.id === activeArticleId);
    if (activeArt) {
      switchToReadingMode(activeArt);
    } else {
      showToast('Artikel tidak ditemukan atau telah dihapus.', 'warning');
      window.location.hash = '#/portal/edukasi';
    }
  } else {
    if (readingSection) readingSection.style.display = 'none';
    if (gridSection) gridSection.style.display = '';
  }

  // Back button functionality
  const backBtn = document.getElementById('backToGridBtn');
  backBtn?.addEventListener('click', () => {
    window.location.hash = '#/portal/edukasi';
  });

  // Switch display mode helper
  function switchToReadingMode(art) {
    if (!gridSection || !readingSection) return;

    const style = CATEGORY_STYLES[art.category] || CATEGORY_STYLES.Umum;

    // Fill reading mode data
    document.getElementById('readCategoryBadge').textContent = art.category;
    document.getElementById('readCategoryBadge').style.backgroundColor = style.color + '15';
    document.getElementById('readCategoryBadge').style.color = style.color;
    document.getElementById('readDate').textContent = formatDate(art.created_at);
    document.getElementById('readTitle').textContent = art.title;
    document.getElementById('readExcerpt').textContent = art.excerpt;
    document.getElementById('readCoverImage').src = art.image_url || 'https://placehold.co/800x450?text=No+Image';
    document.getElementById('readContentBody').innerHTML = art.content || `<p>${art.excerpt}</p>`;

    // Render related articles in the sidebar
    const related = articles.filter(x => x.id !== art.id).slice(0, 3);
    const relatedList = document.getElementById('relatedArticlesList');
    if (relatedList) {
      if (related.length === 0) {
        relatedList.innerHTML = '<p style="font-size:12px; color:var(--text-muted); margin:0">Tidak ada artikel lain.</p>';
      } else {
        relatedList.innerHTML = related.map(rel => {
          const relStyle = CATEGORY_STYLES[rel.category] || CATEGORY_STYLES.Umum;
          return `
            <div class="related-art-item" data-rel-id="${rel.id}" style="display:flex; gap:12px; cursor:pointer; align-items:flex-start">
              <img src="${rel.image_url || 'https://placehold.co/100x60?text=No+Image'}" style="width:64px; height:48px; object-fit:cover; border-radius:6px; border:1px solid var(--border-color); flex-shrink:0" />
              <div style="flex:1; min-width:0">
                <span style="font-size:9px; font-weight:700; color:${relStyle.color}; background:${relStyle.color}15; padding:2px 6px; border-radius:4px">${rel.category}</span>
                <h5 style="font-size:13px; font-weight:700; color:var(--text-primary); margin:4px 0 0 0; line-height:1.4; text-overflow:ellipsis; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical">${rel.title}</h5>
              </div>
            </div>
          `;
        }).join('');

        // Attach click listeners to related articles
        relatedList.querySelectorAll('.related-art-item').forEach(item => {
          item.addEventListener('click', () => {
            const relId = item.dataset.relId;
            window.location.hash = `#/portal/edukasi/${relId}`;
          });
        });
      }
    }

    // Hide grid, show reading mode
    gridSection.style.display = 'none';
    readingSection.style.display = '';

    // Scroll window smoothly to the top of reading mode
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
