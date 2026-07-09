// SIMPAH - Article / Edukasi Management (Admin Dashboard)
import { icons } from '../../components/icons.js';
import { getCurrentUser, formatDate } from '../../utils/helpers.js';
import { showToast } from '../../components/toast.js';
import { renderDashboardLayout } from './layout.js';
import { hasPermission } from '../../utils/permissions.js';
import { supabase } from '../../lib/supabase.js';
import { uploadBase64Image } from '../../lib/storage.js';
import { compressImage } from '../../components/photo-picker.js';

// Static fallback articles in case database table is not created yet
const STATIC_ARTICLES = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    title: 'Panduan Praktis Memilah Sampah Rumah Tangga',
    excerpt: 'Langkah mudah memulai pilah sampah dari dapur Anda untuk mengurangi volume sampah ke TPA.',
    content: '<h2>Pentingnya Memilah Sampah dari Rumah</h2><p>Memilah sampah adalah langkah pertama yang paling krusial dalam siklus pengelolaan sampah...</p>',
    category: 'Pemilahan',
    image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    is_published: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    title: 'Membuat Kompos Organik dengan Metode Takakura',
    excerpt: 'Metode praktis pembuatan kompos skala rumah tangga tanpa bau dan tidak memerlukan lahan luas.',
    content: '<h2>Mengenal Metode Kompos Takakura</h2><p>Metode Takakura dikembangkan oleh Koji Takakura...</p>',
    category: 'Kompos',
    image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=600&q=80',
    is_published: true,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export async function renderDashboardEdukasi() {
  const user = getCurrentUser();
  if (!user || !hasPermission(user, 'MANAGE_ARTICLES')) {
    window.location.hash = '#/dashboard/gis';
    return;
  }

  let articles = [];
  let isDbConnected = true;
  let dbErrorMsg = '';

  // 1. Fetch from Supabase
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Table might not exist yet
      if (error.code === 'P0001' || error.message.includes('relation') || error.message.includes('does not exist')) {
        isDbConnected = false;
        dbErrorMsg = 'Tabel \'articles\' tidak ditemukan di database. Menggunakan data simulasi statis.';
      } else {
        throw error;
      }
    }
    articles = !isDbConnected ? STATIC_ARTICLES : (data || []);
  } catch (err) {
    console.error('Fetch articles error:', err);
    isDbConnected = false;
    dbErrorMsg = 'Gagal memuat artikel dari database: ' + err.message;
    articles = STATIC_ARTICLES;
  }

  // State in-memory
  let currentArticles = [...articles];
  let searchQuery = '';
  let filterCategory = '';
  let filterStatus = '';

  // Render main layout
  function renderView() {
    // Filter logic
    const filtered = currentArticles.filter(art => {
      const matchSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = filterCategory === '' || art.category === filterCategory;
      const matchStatus = filterStatus === '' || 
                          (filterStatus === 'published' && art.is_published) ||
                          (filterStatus === 'draft' && !art.is_published);
      return matchSearch && matchCategory && matchStatus;
    });

    const categories = ['Pemilahan', 'Daur Ulang', 'Kompos', 'Regulasi', '3R', 'TPS3R', 'Umum'];

    renderDashboardLayout('Kelola Edukasi', `
      <div class="page-enter">
        ${!isDbConnected ? `
          <div class="alert alert-warning" style="margin-bottom:var(--space-6); display:flex; align-items:center; gap:var(--space-3); border-radius:var(--radius-lg); background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); padding:var(--space-4); color:var(--warning-800)">
            <span style="font-size:24px">${icons.alert}</span>
            <div>
              <strong>Database Warning:</strong> ${dbErrorMsg}<br/>
              <span style="font-size:var(--font-xs);opacity:0.85">Silakan eksekusi berkas <code>src/db/articles_schema.sql</code> di Supabase SQL Editor Anda untuk mengaktifkan manajemen artikel yang dinamis.</span>
            </div>
          </div>
        ` : ''}

        <div class="section-header">
          <div>
            <h2 class="section-title">Kelola Artikel Edukasi</h2>
            <p class="section-subtitle">Tulis, edit, dan publikasikan konten edukasi untuk aplikasi warga</p>
          </div>
          <button class="btn btn-primary" id="addArticleBtn" style="border-radius:24px">${icons.plus} Tambah Artikel</button>
        </div>

        <!-- Stats Row -->
        <div class="grid-3" style="margin-bottom:var(--space-6)">
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(16,185,129,0.12);color:var(--primary-600)">${icons.book}</div>
            <div class="stat-value" style="color:var(--primary-600)">${filtered.length}</div>
            <div class="stat-label">Total Artikel Terfilter</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:#2563eb">${icons.checkCircle}</div>
            <div class="stat-value" style="color:#2563eb">${filtered.filter(a => a.is_published).length}</div>
            <div class="stat-label">Diterbitkan (Published)</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(156,163,175,0.12);color:#4b5563">${icons.file}</div>
            <div class="stat-value" style="color:#4b5563">${filtered.filter(a => !a.is_published).length}</div>
            <div class="stat-label">Draft</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="card" style="margin-bottom:var(--space-6); padding:var(--space-4)">
          <div style="display:flex; flex-wrap:wrap; gap:var(--space-3); align-items:center">
            <div class="form-group" style="flex:1; min-width:260px; margin-bottom:0">
              <div style="position:relative; display:flex; align-items:center">
                <span style="position:absolute; left:14px; color:var(--text-muted); display:flex; align-items:center">${icons.search}</span>
                <input type="text" id="artSearch" class="form-input" placeholder="Cari judul atau ringkasan..." value="${searchQuery}" style="padding-left:42px" />
              </div>
            </div>
            <div class="form-group" style="width:180px; margin-bottom:0">
              <select id="artFilterCategory" class="form-select">
                <option value="">Semua Kategori</option>
                ${categories.map(c => `<option value="${c}" ${filterCategory === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="width:160px; margin-bottom:0">
              <select id="artFilterStatus" class="form-select">
                <option value="">Semua Status</option>
                <option value="published" ${filterStatus === 'published' ? 'selected' : ''}>Diterbitkan</option>
                <option value="draft" ${filterStatus === 'draft' ? 'selected' : ''}>Draft</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table View -->
        <div class="card" style="padding:0; overflow:hidden">
          <div style="overflow-x:auto">
            <table class="table" style="width:100%; border-collapse:collapse; margin:0">
              <thead>
                <tr style="background:var(--bg-secondary); border-bottom:1px solid var(--border-color); text-align:left">
                  <th style="padding:var(--space-4)">Cover</th>
                  <th style="padding:var(--space-4)">Judul Artikel</th>
                  <th style="padding:var(--space-4)">Kategori</th>
                  <th style="padding:var(--space-4)">Status</th>
                  <th style="padding:var(--space-4)">Tanggal Dibuat</th>
                  <th style="padding:var(--space-4); text-align:right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(art => `
                  <tr style="border-bottom:1px solid var(--border-color)">
                    <td style="padding:var(--space-4); vertical-align:middle">
                      <img src="${art.image_url || 'https://placehold.co/100x60?text=No+Cover'}" alt="Cover" style="width:70px; height:45px; object-fit:cover; border-radius:4px; border:1px solid var(--border-color)" />
                    </td>
                    <td style="padding:var(--space-4); vertical-align:middle">
                      <div style="font-weight:700; color:var(--text-primary); margin-bottom:2px">${art.title}</div>
                      <div style="font-size:var(--font-xs); color:var(--text-muted); max-width:320px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap">${art.excerpt}</div>
                    </td>
                    <td style="padding:var(--space-4); vertical-align:middle">
                      <span class="badge badge-neutral" style="font-size:var(--font-xs)">${art.category}</span>
                    </td>
                    <td style="padding:var(--space-4); vertical-align:middle">
                      <span class="badge ${art.is_published ? 'badge-success' : 'badge-neutral'}" style="cursor:pointer" data-toggle-status="${art.id}">
                        ${art.is_published ? `${icons.checkCircle} Published` : 'Draft'}
                      </span>
                    </td>
                    <td style="padding:var(--space-4); vertical-align:middle; font-size:var(--font-sm)">
                      ${formatDate(art.created_at)}
                    </td>
                    <td style="padding:var(--space-4); vertical-align:middle; text-align:right">
                      <div style="display:flex; justify-content:flex-end; gap:var(--space-1)">
                        <button class="btn btn-ghost btn-sm" style="padding:4px; border:none" title="Ubah" data-edit-art="${art.id}">
                          ${icons.edit}
                        </button>
                        <button class="btn btn-ghost btn-sm" style="padding:4px; border:none; color:var(--danger-500)" title="Hapus" data-delete-art="${art.id}">
                          ${icons.trash}
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
                ${filtered.length === 0 ? `
                  <tr>
                    <td colspan="6" style="padding:var(--space-8); text-align:center; color:var(--text-muted)">
                      ${icons.info || ''} Belum ada artikel yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Overlay -->
      <div class="md-modal-overlay" id="articleModal" style="display:none">
        <div class="md-modal" style="max-width:680px">
          <div class="md-modal-header">
            <h3 id="artModalTitle">Form Artikel</h3>
            <button class="md-modal-close" id="artModalClose">${icons.close}</button>
          </div>
          <form id="articleForm">
            <div class="md-modal-body">
              <input type="hidden" id="artId" value="" />
              
              <div class="form-group">
                <label class="form-label">Judul Artikel <span style="color:var(--danger-500)">*</span></label>
                <input type="text" id="artTitle" class="form-input" placeholder="Masukkan judul menarik..." required />
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-4)">
                <div class="form-group">
                  <label class="form-label">Kategori <span style="color:var(--danger-500)">*</span></label>
                  <select id="artCategory" class="form-select" required>
                    ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group" style="display:flex; align-items:center; margin-top:28px">
                  <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-weight:600; font-size:var(--font-sm)">
                    <input type="checkbox" id="artIsPublished" checked style="width:16px; height:16px; border-radius:4px" />
                    Terbitkan langsung ke Publik
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Cover Gambar (Format JPG/PNG, Akan Dikompres Otomatis) <span style="color:var(--danger-500)">*</span></label>
                <div class="photo-upload" id="artCoverArea" style="border:2px dashed var(--border-color); border-radius:var(--radius-lg); padding:var(--space-4); text-align:center; cursor:pointer; transition:all 0.15s; background:var(--bg-secondary)">
                  <div style="font-size:24px; margin-bottom:8px; color:var(--text-muted)">${icons.image}</div>
                  <div id="artCoverHint" style="font-size:var(--font-sm); font-weight:600; color:var(--text-secondary)">Klik atau seret gambar cover ke sini</div>
                  <div style="font-size:var(--font-xs); color:var(--text-muted); margin-top:4px">Ukuran maks 5MB. Lebar gambar otomatis dikompres ke 1024px</div>
                </div>
                <input type="file" id="artCoverFileInput" accept="image/*" style="display:none" />
                <div id="artCoverPreviewArea" style="display:none; margin-top:var(--space-3); position:relative; border-radius:var(--radius-lg); overflow:hidden">
                  <img id="artCoverPreview" src="" style="width:100%; height:180px; object-fit:cover" />
                  <button type="button" id="artCoverRemoveBtn" style="position:absolute; top:8px; right:8px; width:28px; height:28px; border-radius:50%; background:rgba(0,0,0,0.6); border:none; color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer">
                    ${icons.close}
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Ringkasan Singkat (Excerpt) <span style="color:var(--danger-500)">*</span></label>
                <textarea id="artExcerpt" class="form-textarea" rows="2" placeholder="Tulis deskripsi singkat 1-2 kalimat..." required></textarea>
              </div>

              <div class="form-group">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-2)">
                  <label class="form-label" style="margin-bottom:0">Isi Lengkap Artikel <span style="color:var(--danger-500)">*</span></label>
                  <!-- Formatter toolbar -->
                  <div class="editor-toolbar" style="display:flex; gap:4px">
                    <button type="button" class="btn btn-sm btn-ghost" data-editor-cmd="b" title="Bold" style="padding:2px 8px; font-weight:bold">B</button>
                    <button type="button" class="btn btn-sm btn-ghost" data-editor-cmd="i" title="Italic" style="padding:2px 8px; font-style:italic">I</button>
                    <button type="button" class="btn btn-sm btn-ghost" data-editor-cmd="h2" title="Heading 2" style="padding:2px 6px">H2</button>
                    <button type="button" class="btn btn-sm btn-ghost" data-editor-cmd="h3" title="Heading 3" style="padding:2px 6px">H3</button>
                    <button type="button" class="btn btn-sm btn-ghost" data-editor-cmd="ul" title="Unordered List" style="padding:2px 6px">• List</button>
                    <button type="button" class="btn btn-sm btn-ghost" data-editor-cmd="ol" title="Ordered List" style="padding:2px 6px">1. List</button>
                  </div>
                </div>
                <textarea id="artContent" class="form-textarea" rows="8" placeholder="Tulis isi lengkap artikel menggunakan HTML atau ketik teks biasa..." required style="font-family:monospace"></textarea>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-ghost" id="artFormCancel">Batal</button>
                <button type="submit" class="btn btn-primary" id="artFormSubmit" style="border-radius:24px">Simpan Artikel</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>
        .md-modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:1000; display:flex; align-items:center; justify-content:center; }
        .md-modal { background:var(--bg-primary); border-radius:var(--radius-xl); width:95%; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.25); border:1px solid var(--border-color); }
        .md-modal-header { display:flex; justify-content:space-between; align-items:center; padding:var(--space-4) var(--space-6); border-bottom:1px solid var(--border-color); }
        .md-modal-header h3 { font-size:var(--font-md); font-weight:700; margin:0; }
        .md-modal-close { width:32px; height:32px; border-radius:50%; border:none; background:var(--bg-secondary); cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--text-secondary); transition:all 0.15s; }
        .md-modal-close:hover { background:var(--border-color); color:var(--text-primary); }
        .md-modal-body { padding:var(--space-5) var(--space-6); }
        .md-modal-body .form-group { margin-bottom:var(--space-4); }
        .md-modal-body .form-label { display:block; font-size:var(--font-sm); font-weight:600; margin-bottom:var(--space-2); color:var(--text-primary) }
        .md-modal-body .form-actions { display:flex; gap:var(--space-3); justify-content:flex-end; margin-top:var(--space-5); padding-top:var(--space-4); border-top:1px solid var(--border-color); }
        .editor-toolbar button { font-size:var(--font-xs); border:1px solid var(--border-color); background:var(--bg-secondary); border-radius:4px; cursor:pointer }
        .editor-toolbar button:hover { background:var(--border-color) }
      </style>
    `, 'edukasi');

    // Attach listeners
    // Search query
    document.getElementById('artSearch')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderView();
    });

    // Filter Category
    document.getElementById('artFilterCategory')?.addEventListener('change', (e) => {
      filterCategory = e.target.value;
      renderView();
    });

    // Filter Status
    document.getElementById('artFilterStatus')?.addEventListener('change', (e) => {
      filterStatus = e.target.value;
      renderView();
    });

    // Add button
    document.getElementById('addArticleBtn')?.addEventListener('click', () => {
      openForm();
    });

    // Toggle status badge
    document.querySelectorAll('[data-toggle-status]').forEach(badge => {
      badge.addEventListener('click', async () => {
        if (!isDbConnected) {
          showToast('Mode demo statis: Tidak dapat memperbarui database.', 'info');
          return;
        }
        const artId = badge.dataset.toggleStatus;
        const art = currentArticles.find(a => a.id === artId);
        if (art) {
          const newStatus = !art.is_published;
          try {
            const { error } = await supabase
              .from('articles')
              .update({ is_published: newStatus, updated_at: new Date().toISOString() })
              .eq('id', artId);

            if (error) throw error;
            art.is_published = newStatus;
            showToast(`Artikel berhasil di-${newStatus ? 'terbitkan' : 'pindahkan ke draft'}!`, 'success');
            renderView();
          } catch (err) {
            showToast('Gagal mengubah status: ' + err.message, 'danger');
          }
        }
      });
    });

    // Edit button
    document.querySelectorAll('[data-edit-art]').forEach(btn => {
      btn.addEventListener('click', () => {
        const art = currentArticles.find(a => a.id === btn.dataset.editArt);
        if (art) openForm(art);
      });
    });

    // Delete button
    document.querySelectorAll('[data-delete-art]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const artId = btn.dataset.deleteArt;
        const art = currentArticles.find(a => a.id === artId);
        if (!art) return;

        if (confirm(`Apakah Anda yakin ingin menghapus artikel "${art.title}"?`)) {
          if (!isDbConnected) {
            currentArticles = currentArticles.filter(a => a.id !== artId);
            showToast('Artikel dihapus (Mode Demo Statis)', 'success');
            renderView();
            return;
          }

          try {
            const { error } = await supabase
              .from('articles')
              .delete()
              .eq('id', artId);

            if (error) throw error;
            currentArticles = currentArticles.filter(a => a.id !== artId);
            showToast('Artikel berhasil dihapus!', 'success');
            renderView();
          } catch (err) {
            showToast('Gagal menghapus artikel: ' + err.message, 'danger');
          }
        }
      });
    });
  }

  // Modal State for Uploads
  let selectedCoverBase64 = null;

  function openForm(art = null) {
    const modal = document.getElementById('articleModal');
    const form = document.getElementById('articleForm');
    if (!modal || !form) return;

    // Reset Form fields
    form.reset();
    selectedCoverBase64 = null;

    const modalTitle = document.getElementById('artModalTitle');
    const artId = document.getElementById('artId');
    const artTitle = document.getElementById('artTitle');
    const artCategory = document.getElementById('artCategory');
    const artIsPublished = document.getElementById('artIsPublished');
    const artExcerpt = document.getElementById('artExcerpt');
    const artContent = document.getElementById('artContent');

    const coverArea = document.getElementById('artCoverArea');
    const previewArea = document.getElementById('artCoverPreviewArea');
    const previewImage = document.getElementById('artCoverPreview');

    if (art) {
      modalTitle.textContent = 'Edit Artikel Edukasi';
      artId.value = art.id;
      artTitle.value = art.title;
      artCategory.value = art.category;
      artIsPublished.checked = art.is_published;
      artExcerpt.value = art.excerpt;
      artContent.value = art.content;

      if (art.image_url) {
        coverArea.style.display = 'none';
        previewArea.style.display = 'block';
        previewImage.src = art.image_url;
        selectedCoverBase64 = art.image_url; // Default to keep the original url if not changed
      } else {
        coverArea.style.display = '';
        previewArea.style.display = 'none';
      }
    } else {
      modalTitle.textContent = 'Tambah Artikel Baru';
      artId.value = '';
      coverArea.style.display = '';
      previewArea.style.display = 'none';
      artIsPublished.checked = true;
    }

    modal.style.display = 'flex';

    // File Input Logic
    const fileInput = document.getElementById('artCoverFileInput');
    coverArea.onclick = () => fileInput?.click();

    // Drag-and-drop
    coverArea.ondragover = (e) => {
      e.preventDefault();
      coverArea.style.borderColor = 'var(--primary-400)';
    };
    coverArea.ondragleave = () => {
      coverArea.style.borderColor = '';
    };
    coverArea.ondrop = async (e) => {
      e.preventDefault();
      coverArea.style.borderColor = '';
      if (e.dataTransfer.files?.length) {
        await processAndPreviewImage(e.dataTransfer.files[0]);
      }
    };

    fileInput.onchange = async (e) => {
      if (e.target.files?.length) {
        await processAndPreviewImage(e.target.files[0]);
      }
    };

    // Remove cover picture
    const removeBtn = document.getElementById('artCoverRemoveBtn');
    if (removeBtn) {
      removeBtn.onclick = () => {
        selectedCoverBase64 = null;
        fileInput.value = '';
        coverArea.style.display = '';
        previewArea.style.display = 'none';
        previewImage.src = '';
      };
    }

    // Modal Close buttons
    const closeBtn = document.getElementById('artModalClose');
    const cancelBtn = document.getElementById('artFormCancel');
    const handleClose = () => { modal.style.display = 'none'; };
    if (closeBtn) closeBtn.onclick = handleClose;
    if (cancelBtn) cancelBtn.onclick = handleClose;

    // Rich Editor Buttons helper formatting
    document.querySelectorAll('[data-editor-cmd]').forEach(btn => {
      btn.onclick = () => {
        const cmd = btn.dataset.editorCmd;
        const textarea = document.getElementById('artContent');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);

        let replacement = '';
        switch (cmd) {
          case 'b': replacement = `<b>${selected || 'Teks Tebal'}</b>`; break;
          case 'i': replacement = `<i>${selected || 'Teks Miring'}</i>`; break;
          case 'h2': replacement = `<h2>${selected || 'Sub-Judul H2'}</h2>`; break;
          case 'h3': replacement = `<h3>${selected || 'Sub-Sub-Judul H3'}</h3>`; break;
          case 'ul': replacement = `<ul>\n  <li>${selected || 'Butir 1'}</li>\n  <li>Butir 2</li>\n</ul>`; break;
          case 'ol': replacement = `<ol>\n  <li>${selected || 'Langkah 1'}</li>\n  <li>Langkah 2</li>\n</ol>`; break;
        }

        textarea.value = text.substring(0, start) + replacement + text.substring(end);
        textarea.focus();
        textarea.setSelectionRange(start + replacement.length, start + replacement.length);
      };
    });

    // Form submit listener
    form.onsubmit = async (e) => {
      e.preventDefault();

      if (!selectedCoverBase64) {
        showToast('Gambar cover wajib diunggah!', 'warning');
        return;
      }

      const id = artId.value || crypto.randomUUID();
      const title = artTitle.value;
      const category = artCategory.value;
      const isPublished = artIsPublished.checked;
      const excerpt = artExcerpt.value;
      const content = artContent.value;
      
      const submitBtn = document.getElementById('artFormSubmit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Menyimpan...';

      let finalImageUrl = selectedCoverBase64;

      try {
        // Upload to Supabase Storage if image is a base64 image (newly uploaded)
        if (selectedCoverBase64.startsWith('data:image')) {
          if (!isDbConnected) {
            // Local mockup url for static testing
            finalImageUrl = selectedCoverBase64;
          } else {
            showToast('Mengunggah dan mengompresi gambar cover...', 'info');
            const filePath = `articles/${id}/cover.jpg`;
            const uploadedUrl = await uploadBase64Image('simpah_media', filePath, selectedCoverBase64);
            if (!uploadedUrl) {
              throw new Error('Unggah gambar cover gagal.');
            }
            finalImageUrl = uploadedUrl;
          }
        }

        const currentUserId = user?.id || null;

        const payload = {
          id,
          title,
          category,
          is_published: isPublished,
          excerpt,
          content,
          image_url: finalImageUrl,
          author_id: currentUserId,
          updated_at: new Date().toISOString()
        };

        if (artId.value) {
          // Edit mode
          if (!isDbConnected) {
            currentArticles = currentArticles.map(a => a.id === id ? { ...a, ...payload } : a);
          } else {
            const { error } = await supabase
              .from('articles')
              .update(payload)
              .eq('id', id);

            if (error) throw error;
            currentArticles = currentArticles.map(a => a.id === id ? { ...a, ...payload } : a);
          }
          showToast('Artikel berhasil diperbarui!', 'success');
        } else {
          // Create mode
          payload.created_at = new Date().toISOString();
          if (!isDbConnected) {
            currentArticles.unshift(payload);
          } else {
            const { error } = await supabase
              .from('articles')
              .insert(payload);

            if (error) throw error;
            currentArticles.unshift(payload);
          }
          showToast('Artikel baru berhasil dibuat!', 'success');
        }

        modal.style.display = 'none';
        renderView();
      } catch (err) {
        showToast('Gagal menyimpan artikel: ' + err.message, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan Artikel';
      }
    };
  }

  async function processAndPreviewImage(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Hanya berkas gambar yang didukung!', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Berkas terlalu besar (Maks 5MB)', 'warning');
      return;
    }

    try {
      showToast('Mengompresi gambar cover...', 'info');
      // Automatic image compression via compressImage
      const compressedBase64 = await compressImage(file);
      
      selectedCoverBase64 = compressedBase64;
      
      const coverArea = document.getElementById('artCoverArea');
      const previewArea = document.getElementById('artCoverPreviewArea');
      const previewImage = document.getElementById('artCoverPreview');

      if (coverArea && previewArea && previewImage) {
        coverArea.style.display = 'none';
        previewArea.style.display = 'block';
        previewImage.src = compressedBase64;
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal mengompresi gambar.', 'danger');
    }
  }

  // Initial render
  renderView();
}
