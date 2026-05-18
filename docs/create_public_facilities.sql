-- ============================================================
-- SIMPAH - Tabel Data Fasilitas Umum (Fasum)
-- Digunakan untuk mendata penghasil sampah non-domestik
-- ============================================================

CREATE TABLE IF NOT EXISTS public_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                     -- Nama Fasum (Misal: Pasar Wage, SMAN 1 Banjarnegara)
  category TEXT NOT NULL,                 -- Kategori: Pasar, Sekolah, Terminal, Perkantoran, Rumah Sakit, dll
  kecamatan TEXT NOT NULL,                -- Relasi ke kecamatan (harus cocok dengan tabel village_population)
  address TEXT,                           -- Alamat detail
  latitude NUMERIC(10, 6),                -- Koordinat Peta
  longitude NUMERIC(10, 6),               -- Koordinat Peta
  
  -- Variabel untuk menghitung estimasi timbulan sampah (berbeda tiap kategori)
  capacity_value INT DEFAULT 0,           -- Nilai Kapasitas (Jumlah siswa/pegawai/luas m2)
  capacity_unit TEXT,                     -- Satuan ('Orang', 'm2', 'Bed/Kamar')
  timbulan_per_unit NUMERIC(5,2),         -- Standar timbulan (Misal SNI: 0.15 kg/siswa/hari)
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policy (read by all authenticated, write by admin/validator)
ALTER TABLE public_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all on public_facilities" ON public_facilities
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for admin/validator" ON public_facilities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for admin/validator" ON public_facilities
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete for admin/validator" ON public_facilities
  FOR DELETE USING (true);


