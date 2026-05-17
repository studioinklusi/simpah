-- ============================================================
-- SIMPAH - Tabel Data Kependudukan per Desa/Kecamatan
-- Digunakan untuk menghitung potensi timbulan sampah & % kinerja
-- ============================================================

CREATE TABLE IF NOT EXISTS village_population (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kecamatan TEXT NOT NULL,                        -- Nama Kecamatan (harus cocok dengan field 'wilayah' di tabel locations)
  jumlah_penduduk INT NOT NULL DEFAULT 0,         -- Jumlah Jiwa
  jumlah_kk INT NOT NULL DEFAULT 0,               -- Jumlah Kepala Keluarga
  luas_km2 NUMERIC(8,2) DEFAULT 0,               -- Luas wilayah (km²)
  timbulan_per_kapita NUMERIC(4,2) DEFAULT 0.70,  -- kg/orang/hari (standar nasional 0.7)
  tahun_data INT DEFAULT 2025,                    -- Tahun sumber data
  sumber_data TEXT DEFAULT 'BPS',                 -- Sumber: BPS, Disdukcapil, dll
  catatan TEXT DEFAULT '',                        -- Catatan tambahan
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: 1 record per kecamatan
CREATE UNIQUE INDEX IF NOT EXISTS idx_village_pop_kecamatan ON village_population(kecamatan);

-- RLS Policy (read by all authenticated, write by admin)
ALTER TABLE village_population ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all" ON village_population
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated" ON village_population
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for authenticated" ON village_population
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete for authenticated" ON village_population
  FOR DELETE USING (true);

-- ============================================================
-- Contoh Data Seed (Kecamatan di Kabupaten Banjarnegara)
-- Data berikut adalah CONTOH — ganti dengan data BPS asli
-- ============================================================
INSERT INTO village_population (kecamatan, jumlah_penduduk, jumlah_kk, luas_km2, tahun_data, sumber_data) VALUES
  ('Banjarnegara',  55000, 14200, 24.5, 2025, 'Estimasi'),
  ('Purwareja Klampok', 42000, 10800, 18.3, 2025, 'Estimasi'),
  ('Mandiraja', 38000, 9800, 32.1, 2025, 'Estimasi'),
  ('Bawang', 35000, 9000, 28.7, 2025, 'Estimasi'),
  ('Wanadadi', 28000, 7200, 15.6, 2025, 'Estimasi'),
  ('Sigaluh', 25000, 6400, 22.4, 2025, 'Estimasi')
ON CONFLICT (kecamatan) DO NOTHING;
