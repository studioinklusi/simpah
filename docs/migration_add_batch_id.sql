-- ============================================================
-- SIMPAH Migration - Add batch_id Column for Batch Grouping
-- Jalankan skrip ini di SQL Editor Supabase Anda
-- ============================================================

-- 1. Tambahkan kolom batch_id ke tabel waste_records
ALTER TABLE waste_records 
ADD COLUMN IF NOT EXISTS batch_id UUID;

-- 2. Buat indeks untuk kolom batch_id agar pencarian lebih cepat
CREATE INDEX IF NOT EXISTS idx_waste_records_batch_id 
ON waste_records(batch_id);

-- 3. Tambahkan komentar penjelasan pada kolom
COMMENT ON COLUMN waste_records.batch_id IS 'UUID unik untuk mengelompokkan data input akumulasi (batch split)';
