-- 1. Create articles table
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Umum',
    image_url TEXT,
    is_published BOOLEAN DEFAULT true,
    author_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if any
DROP POLICY IF EXISTS "Public can read published articles" ON public.articles;
DROP POLICY IF EXISTS "Admin can manage all articles" ON public.articles;

-- 4. Create policies
-- Anyone (including anonymous users) can view published articles
CREATE POLICY "Public can read published articles" ON public.articles
    FOR SELECT
    USING (is_published = true);

-- Only authenticated administrators can perform INSERT, UPDATE, DELETE, and SELECT (including draft articles)
CREATE POLICY "Admin can manage all articles" ON public.articles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 5. Create indices for performance
CREATE INDEX IF NOT EXISTS idx_articles_published ON public.articles(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);

-- 6. Insert initial seed articles (converting the static hardcoded articles to DB rows)
INSERT INTO public.articles (id, title, excerpt, content, category, image_url, is_published, created_at)
VALUES 
(
  'a1111111-1111-1111-1111-111111111111',
  'Panduan Praktis Memilah Sampah Rumah Tangga',
  'Langkah mudah memulai pilah sampah dari dapur Anda untuk mengurangi volume sampah ke TPA.',
  '<h2>Pentingnya Memilah Sampah dari Rumah</h2><p>Memilah sampah adalah langkah pertama yang paling krusial dalam siklus pengelolaan sampah modern. Dengan memisahkan sampah organik dan anorganik di tingkat rumah tangga, kita dapat meningkatkan tingkat daur ulang hingga 80% dan mencegah pencemaran lingkungan.</p><h3>Langkah Praktis Memulai:</h3><ol><li><strong>Siapkan Wadah Terpisah:</strong> Sediakan minimal dua tempat sampah di rumah, satu untuk sampah organik (sisa makanan, dedaunan) dan satu untuk anorganik (plastik, kertas, logam).</li><li><strong>Bersihkan Sampah Anorganik:</strong> Sebelum membuang botol plastik atau wadah bekas makanan, bilas terlebih dahulu dengan air agar tidak mengundang lalat dan mempermudah proses daur ulang.</li><li><strong>Konsistensi:</strong> Jadikan memilah sampah sebagai kebiasaan sehari-hari seluruh anggota keluarga.</li></ol>',
  'Pemilahan',
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
  true,
  NOW() - INTERVAL '5 days'
),
(
  'a2222222-2222-2222-2222-222222222222',
  'Membuat Kompos Organik dengan Metode Takakura',
  'Metode praktis pembuatan kompos skala rumah tangga tanpa bau dan tidak memerlukan lahan luas.',
  '<h2>Mengenal Metode Kompos Takakura</h2><p>Metode Takakura dikembangkan oleh Koji Takakura dari Jepang. Metode ini sangat cocok untuk daerah perkotaan atau rumah tangga dengan lahan terbatas karena prosesnya kering, tidak berbau, dan cepat menghasilkan kompos.</p><h3>Persiapan Alat & Bahan:</h3><ul><li>Keranjang plastik berlubang udara (keranjang baju)</li><li>Bantalan sekam padi</li><li>Starter bakteri/kompos matang</li><li>Kain penutup hitam</li></ul><h3>Cara Pembuatan:</h3><ol><li>Letakkan bantalan sekam di dasar keranjang untuk menyerap kelebihan air.</li><li>Masukkan starter bakteri atau kompos matang ke dalam keranjang.</li><li>Masukkan sampah organik dapur yang sudah dipotong kecil-kecil.</li><li>Aduk rata dengan starter.</li><li>Tutup dengan bantalan sekam kedua dan kain hitam untuk menjaga kelembapan dan panas.</li></ol>',
  'Kompos',
  'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=600&q=80',
  true,
  NOW() - INTERVAL '4 days'
),
(
  'a3333333-3333-3333-3333-333333333333',
  'Daur Ulang Plastik PET: Jenis dan Prosesnya',
  'Mengenal kode plastik nomor 1 (PET/PETE) dan bagaimana kontribusi Anda menyelamatkan laut.',
  '<h2>Apa itu Plastik PET?</h2><p>PET (Polyethylene Terephthalate) adalah jenis plastik yang paling umum digunakan untuk botol minuman sekali pakai. Plastik ini ditandai dengan kode angka 1 di dalam segitiga daur ulang.</p><h3>Proses Daur Ulang PET:</h3><p>Plastik PET 100% dapat didaur ulang menjadi serat poliester untuk pakaian, tas belanja, hingga botol minuman baru. Pengurangan limbah PET sangat krusial karena plastik ini membutuhkan waktu hingga 450 tahun untuk terurai di alam bebas.</p><h3>Cara Membantu Proses Daur Ulang:</h3><ol><li>Kosongkan isi botol sepenuhnya.</li><li>Remas botol untuk menghemat ruang penyimpanan dan transportasi.</li><li>Buang ke bank sampah atau wadah daur ulang terdekat.</li></ol>',
  'Daur Ulang',
  'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80',
  true,
  NOW() - INTERVAL '3 days'
),
(
  'a4444444-4444-4444-4444-444444444444',
  'Mengenal Regulasi Pengelolaan Sampah Nasional',
  'Pahami UU No. 18 Tahun 2008 tentang Pengelolaan Sampah dan hak serta kewajiban kita sebagai warga.',
  '<h2>Payung Hukum Pengelolaan Sampah</h2><p>Undang-Undang Nomor 18 Tahun 2008 tentang Pengelolaan Sampah menetapkan paradigma baru dari kumpul-angkut-buang menjadi pengurangan di hulu dan penanganan di hilir (3R: Reduce, Reuse, Recycle).</p><h3>Kewajiban Produsen & Masyarakat:</h3><p>Regulasi menetapkan bahwa produsen wajib mengelola kemasan produk mereka yang tidak dapat terurai. Di sisi lain, masyarakat berkewajiban melakukan pengelolaan sampah secara bertanggung jawab, termasuk memilah dari sumbernya.</p>',
  'Regulasi',
  'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
  true,
  NOW() - INTERVAL '2 days'
),
(
  'a5555555-5555-5555-5555-555555555555',
  'Peran TPS3R dalam Ekonomi Sirkular Desa',
  'Bagaimana tempat pengolahan sampah 3R di Banjarnegara mengubah limbah menjadi rupiah.',
  '<h2>Apa itu TPS3R?</h2><p>Tempat Pengolahan Sampah Terpadu 3R (TPS3R) adalah sarana pengolahan sampah berbasis masyarakat. Di sini, sampah organik diolah menjadi kompos, sampah anorganik dipilah untuk dijual kembali, dan hanya sisa residu yang dikirim ke TPA.</p><h3>Ekonomi Sirkular di Desa:</h3><p>Dengan adanya TPS3R, desa dapat mengurangi biaya pengangkutan sampah ke TPA sekaligus menghasilkan pendapatan mandiri bagi kader dan petugas dari penjualan bahan daur ulang dan pupuk organik.</p>',
  'TPS3R',
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
  true,
  NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;
