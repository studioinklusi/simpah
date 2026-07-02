-- ==============================================================================
-- SIMPAH v2 - WILAYAH-CENTRIC SCHEMA MIGRATION & DATA SEEDING
-- Eksekusi file ini di Supabase SQL Editor untuk memperluas cakupan wilayah
-- ==============================================================================

-- 1. Buat Tabel master_wilayah
CREATE TABLE IF NOT EXISTS master_wilayah (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kecamatan TEXT NOT NULL,
  desa_kelurahan TEXT NOT NULL,
  jumlah_penduduk INT DEFAULT 0,
  jumlah_kk INT DEFAULT 0,
  luas_km2 NUMERIC(8,2) DEFAULT 0,
  timbulan_per_kapita NUMERIC(4,2) DEFAULT 0.70, -- Standard SNI: 0.7 kg/kapita/hari
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kecamatan, desa_kelurahan)
);

-- Buat Indexes
CREATE INDEX IF NOT EXISTS idx_master_wilayah_kecamatan ON master_wilayah(kecamatan);
CREATE INDEX IF NOT EXISTS idx_master_wilayah_desa ON master_wilayah(desa_kelurahan);

-- Aktifkan RLS untuk master_wilayah
ALTER TABLE master_wilayah ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read master_wilayah for all" ON master_wilayah
  FOR SELECT USING (true);

CREATE POLICY "Allow write master_wilayah for admin" ON master_wilayah
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- 2. Tambahkan kolom desa_id di tabel-tabel utama
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS desa_id UUID REFERENCES master_wilayah(id);
ALTER TABLE waste_records ADD COLUMN IF NOT EXISTS desa_id UUID REFERENCES master_wilayah(id);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS desa_id UUID REFERENCES master_wilayah(id);
ALTER TABLE public_facilities ADD COLUMN IF NOT EXISTS desa_id UUID REFERENCES master_wilayah(id);
ALTER TABLE invitation_codes ADD COLUMN IF NOT EXISTS desa_id UUID REFERENCES master_wilayah(id);


-- 3. Data Seeding: 20 Kecamatan & Desa/Kelurahan Resmi Kabupaten Banjarnegara
-- Jumlah penduduk di-estimate secara proporsional berdasarkan data awal
INSERT INTO master_wilayah (kecamatan, desa_kelurahan, jumlah_penduduk, jumlah_kk, luas_km2) VALUES
  -- 1. Kecamatan Banjarnegara (Pusat Kota)
  ('Banjarnegara', 'Krandegan', 7200, 1850, 2.5),
  ('Banjarnegara', 'Parakancanggah', 8500, 2200, 3.1),
  ('Banjarnegara', 'Semampir', 6800, 1750, 2.2),
  ('Banjarnegara', 'Kutabanjarnegara', 6000, 1550, 1.8),
  ('Banjarnegara', 'Winong', 5500, 1420, 2.4),
  ('Banjarnegara', 'Argasoka', 4500, 1150, 2.1),
  ('Banjarnegara', 'Karangtengah', 5000, 1300, 2.8),
  ('Banjarnegara', 'Semarang', 4200, 1080, 2.3),
  ('Banjarnegara', 'Surotrunan', 3500, 900, 1.9),
  ('Banjarnegara', 'Ampelsari', 3800, 980, 3.4),
  ('Banjarnegara', 'Cendana', 4000, 1020, 4.1),
  ('Banjarnegara', 'Sokayasa', 3200, 820, 2.0),

  -- 2. Kecamatan Purwareja Klampok
  ('Purwareja Klampok', 'Purwareja', 6500, 1680, 2.1),
  ('Purwareja Klampok', 'Klampok', 8200, 2100, 3.4),
  ('Purwareja Klampok', 'Kecitran', 5800, 1490, 2.5),
  ('Purwareja Klampok', 'Kalilandak', 4900, 1260, 2.8),
  ('Purwareja Klampok', 'Sirkandi', 5500, 1410, 3.2),
  ('Purwareja Klampok', 'Pagak', 4200, 1080, 2.2),
  ('Purwareja Klampok', 'Kalimandi', 3800, 970, 1.9),
  ('Purwareja Klampok', 'Kalisari', 3100, 800, 1.7),

  -- 3. Kecamatan Mandiraja
  ('Mandiraja', 'Mandiraja Wetan', 7100, 1830, 3.1),
  ('Mandiraja', 'Mandiraja Kulon', 6800, 1750, 2.9),
  ('Mandiraja', 'Kebanaran', 5200, 1340, 4.2),
  ('Mandiraja', 'Somawangi', 4900, 1260, 3.8),
  ('Mandiraja', 'Glempang', 4300, 1100, 2.7),
  ('Mandiraja', 'Kaliwungu', 3900, 1000, 2.5),
  ('Mandiraja', 'Jalatunda', 3100, 800, 3.4),
  ('Mandiraja', 'Kertayasa', 3600, 920, 2.1),
  ('Mandiraja', 'Panggisari', 4100, 1050, 2.3),
  ('Mandiraja', 'Blimbing', 2800, 720, 1.8),
  ('Mandiraja', 'Candiwulan', 3200, 820, 2.2),
  ('Mandiraja', 'Purwasaba', 3700, 950, 3.0),
  ('Mandiraja', 'Simbang', 2900, 740, 1.6),
  ('Mandiraja', 'Kaliajir', 3400, 870, 2.4),

  -- 4. Kecamatan Bawang
  ('Bawang', 'Bawang', 6200, 1590, 3.2),
  ('Bawang', 'Binorong', 5800, 1490, 2.8),
  ('Bawang', 'Blambangan', 5100, 1310, 2.5),
  ('Bawang', 'Depok', 4300, 1100, 2.1),
  ('Bawang', 'Gumiwang', 4700, 1210, 2.9),
  ('Bawang', 'Joho', 3900, 1000, 2.2),
  ('Bawang', 'Karanganyar', 3500, 900, 2.4),
  ('Bawang', 'Majalengka', 3200, 820, 2.0),
  ('Bawang', 'Mantrianom', 4000, 1020, 2.7),
  ('Bawang', 'Masaran', 3800, 970, 2.3),
  ('Bawang', 'Pucang', 4100, 1050, 2.6),
  ('Bawang', 'Bandingan', 2900, 740, 1.9),

  -- 5. Kecamatan Wanadadi
  ('Wanadadi', 'Wanadadi', 5800, 1490, 2.5),
  ('Wanadadi', 'Tapen', 4900, 1260, 2.2),
  ('Wanadadi', 'Wanakarsa', 4200, 1080, 1.9),
  ('Wanadadi', 'Karangjambe', 3800, 970, 2.1),
  ('Wanadadi', 'Kasilib', 3100, 800, 1.6),
  ('Wanadadi', 'Gumingsir', 2700, 690, 1.4),
  ('Wanadadi', 'Linggasari', 3500, 900, 2.3),
  ('Wanadadi', 'Medayu', 2900, 740, 1.8),
  ('Wanadadi', 'Kandangwangi', 3300, 850, 2.0),

  -- 6. Kecamatan Sigaluh
  ('Sigaluh', 'Sigaluh', 4800, 1230, 3.2),
  ('Sigaluh', 'Gombong', 3900, 1000, 2.7),
  ('Sigaluh', 'Kemiri', 3500, 900, 2.4),
  ('Sigaluh', 'Prigi', 3200, 820, 2.1),
  ('Sigaluh', 'Sawal', 2800, 720, 1.9),
  ('Sigaluh', 'Karangmangu', 3100, 800, 2.3),
  ('Sigaluh', 'Singomerto', 3400, 870, 2.5),
  ('Sigaluh', 'Kalibenda', 3000, 770, 2.0),
  ('Sigaluh', 'Randegan', 2900, 740, 1.8),

  -- 7. Kecamatan Banjarmangu
  ('Banjarmangu', 'Banjarmangu', 4500, 1150, 3.5),
  ('Banjarmangu', 'Sigeblog', 3200, 820, 2.8),
  ('Banjarmangu', 'Jenggawur', 3800, 970, 2.4),
  ('Banjarmangu', 'Kesenet', 2900, 740, 2.1),
  ('Banjarmangu', 'Majatengah', 3400, 870, 2.9),
  ('Banjarmangu', 'Paseh', 3100, 800, 2.6),
  ('Banjarmangu', 'Kalilunjar', 2700, 690, 2.3),

  -- 8. Kecamatan Batur
  ('Batur', 'Batur', 6200, 1590, 5.2),
  ('Batur', 'Dieng Kulon', 4500, 1150, 3.8),
  ('Batur', 'Karangtengah', 3900, 1000, 4.1),
  ('Batur', 'Kepakisan', 3100, 800, 3.4),
  ('Batur', 'Bakal', 2800, 720, 3.1),
  ('Batur', 'Pekasiran', 3500, 900, 4.4),

  -- 9. Kecamatan Kalibening
  ('Kalibening', 'Kalibening', 5100, 1310, 4.2),
  ('Kalibening', 'Kasinoman', 3200, 820, 3.5),
  ('Kalibening', 'Kertasari', 2900, 740, 2.9),
  ('Kalibening', 'Majatengah', 3400, 870, 3.1),
  ('Kalibening', 'Plorengan', 2700, 690, 3.8),
  ('Kalibening', 'Sidakangen', 3000, 770, 2.7),

  -- 10. Kecamatan Karangkobar
  ('Karangkobar', 'Karangkobar', 5500, 1410, 3.1),
  ('Karangkobar', 'Ambal', 3100, 800, 2.8),
  ('Karangkobar', 'Binangun', 2800, 720, 2.4),
  ('Karangkobar', 'Jembangan', 3300, 850, 2.9),
  ('Karangkobar', 'Leksana', 2900, 740, 2.5),

  -- 11. Kecamatan Madukara
  ('Madukara', 'Madukara', 4900, 1260, 3.2),
  ('Madukara', 'Bantar', 3100, 800, 2.9),
  ('Madukara', 'Clapar', 2800, 720, 2.4),
  ('Madukara', 'Dawuhan', 3400, 870, 3.5),
  ('Madukara', 'Kutayasa', 3200, 820, 2.7),

  -- 12. Kecamatan Pagedongan
  ('Pagedongan', 'Pagedongan', 4500, 1150, 4.8),
  ('Pagedongan', 'Duren', 3200, 820, 3.9),
  ('Pagedongan', 'Kebutuhduwur', 3800, 970, 5.1),
  ('Pagedongan', 'Kebutuhjurang', 3400, 870, 4.6),

  -- 13. Kecamatan Pagentan
  ('Pagentan', 'Pagentan', 4200, 1080, 3.5),
  ('Pagentan', 'Aribaya', 2900, 740, 2.9),
  ('Pagentan', 'Babadan', 3300, 850, 3.1),
  ('Pagentan', 'Bulupedar', 2700, 690, 2.4),

  -- 14. Kecamatan Pejawaran
  ('Pejawaran', 'Pejawaran', 4800, 1230, 3.9),
  ('Pejawaran', 'Beji', 3100, 800, 3.1),
  ('Pejawaran', 'Giritirta', 3400, 870, 3.5),
  ('Pejawaran', 'Penusupan', 2900, 740, 2.8),

  -- 15. Kecamatan Punggelan
  ('Punggelan', 'Punggelan', 5200, 1330, 4.5),
  ('Punggelan', 'Bondolharjo', 3800, 970, 3.8),
  ('Punggelan', 'Danasari', 3100, 800, 3.2),
  ('Punggelan', 'Mlaya', 2900, 740, 4.1),

  -- 16. Kecamatan Purwonegoro
  ('Purwonegoro', 'Purwonegoro', 6800, 1750, 3.8),
  ('Purwonegoro', 'Danaraja', 4200, 1080, 2.9),
  ('Purwonegoro', 'Gumelem Kulon', 4500, 1150, 4.2),
  ('Purwonegoro', 'Gumelem Wetan', 4900, 1260, 4.5),

  -- 17. Kecamatan Rakit
  ('Rakit', 'Rakit', 5500, 1410, 3.4),
  ('Rakit', 'Adipasar', 3200, 820, 2.8),
  ('Rakit', 'Badamita', 3800, 970, 3.2),

  -- 18. Kecamatan Susukan
  ('Susukan', 'Susukan', 5100, 1310, 3.6),
  ('Susukan', 'Brengkok', 3400, 870, 2.9),
  ('Susukan', 'Kedawung', 2900, 740, 2.5),

  -- 19. Kecamatan Wanayasa
  ('Wanayasa', 'Wanayasa', 4800, 1230, 4.1),
  ('Wanayasa', 'Balun', 3200, 820, 3.5),
  ('Wanayasa', 'Tempuran', 2900, 740, 2.9),

  -- 20. Kecamatan Pandanarum
  ('Pandanarum', 'Pandanarum', 3900, 1000, 4.5),
  ('Pandanarum', 'Beji', 2400, 610, 3.2),
  ('Pandanarum', 'Lawen', 2800, 720, 3.8)
ON CONFLICT (kecamatan, desa_kelurahan) DO NOTHING;

-- 4. Mapping Data Existing Ke master_wilayah
-- Petakan lokasi existing ke desa_kelurahan di master_wilayah
UPDATE locations SET desa_id = (SELECT id FROM master_wilayah WHERE kecamatan = 'Banjarnegara' AND desa_kelurahan = 'Winong' LIMIT 1) WHERE name = 'TPA Winong';
UPDATE locations SET desa_id = (SELECT id FROM master_wilayah WHERE kecamatan = 'Banjarnegara' AND desa_kelurahan = 'Winong' LIMIT 1) WHERE name = 'TPS3R Banjarnegara';
UPDATE locations SET desa_id = (SELECT id FROM master_wilayah WHERE kecamatan = 'Purwareja Klampok' AND desa_kelurahan = 'Purwareja' LIMIT 1) WHERE name = 'TPS3R Purwareja';
UPDATE locations SET desa_id = (SELECT id FROM master_wilayah WHERE kecamatan = 'Mandiraja' AND desa_kelurahan = 'Mandiraja Wetan' LIMIT 1) WHERE name = 'TPS Mandiraja';
UPDATE locations SET desa_id = (SELECT id FROM master_wilayah WHERE kecamatan = 'Banjarnegara' AND desa_kelurahan = 'Krandegan' LIMIT 1) WHERE name = 'Bank Sampah Berseri';
UPDATE locations SET desa_id = (SELECT id FROM master_wilayah WHERE kecamatan = 'Banjarnegara' AND desa_kelurahan = 'Semampir' LIMIT 1) WHERE name = 'Bank Sampah Mawar';
UPDATE locations SET desa_id = (SELECT id FROM master_wilayah WHERE kecamatan = 'Sigaluh' AND desa_kelurahan = 'Sigaluh' LIMIT 1) WHERE name = 'Bank Sampah Cempaka';
UPDATE locations SET desa_id = (SELECT id FROM master_wilayah WHERE kecamatan = 'Banjarnegara' AND desa_kelurahan = 'Parakancanggah' LIMIT 1) WHERE name = 'Pengepul Jaya Abadi';
UPDATE locations SET desa_id = (SELECT id FROM master_wilayah WHERE kecamatan = 'Bawang' AND desa_kelurahan = 'Bawang' LIMIT 1) WHERE name = 'Pengepul Berkah';
UPDATE locations SET desa_id = (SELECT id FROM master_wilayah WHERE kecamatan = 'Wanadadi' AND desa_kelurahan = 'Wanadadi' LIMIT 1) WHERE name = 'TPS3R Wanadadi';

-- Petakan rekam sampah existing berdasarkan lokasi fisiknya
UPDATE waste_records wr
SET desa_id = loc.desa_id
FROM locations loc
WHERE wr.location_id = loc.id;

-- Hubungkan profil kader existing ke desa default-nya
UPDATE profiles SET desa_id = (SELECT id FROM master_wilayah WHERE kecamatan = 'Banjarnegara' AND desa_kelurahan = 'Winong' LIMIT 1) WHERE username = 'kader1';
