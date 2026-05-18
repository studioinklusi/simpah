-- ============================================================
-- SIMPAH - Setup Role-Based Access Control (RBAC) Dinamis
-- Eksekusi skrip ini di SQL Editor Supabase Anda
-- ============================================================

-- 1. Tabel Modul/Menu Sistem
CREATE TABLE IF NOT EXISTS system_modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- 2. Tabel Role (Peran) Dinamis
CREATE TABLE IF NOT EXISTS system_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- Misal: 'admin', 'petugas', 'pengawas_kecamatan'
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- Jika true, role bawaan sistem tidak bisa dihapus
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel Mapping (Hak Akses)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_code TEXT REFERENCES system_roles(code) ON DELETE CASCADE,
  module_id TEXT REFERENCES system_modules(id) ON DELETE CASCADE,
  PRIMARY KEY (role_code, module_id)
);

-- Enable RLS
ALTER TABLE system_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Policy agar semua user yang login bisa membaca (untuk merender menu)
CREATE POLICY "Allow read for all authenticated" ON system_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for all authenticated" ON system_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for all authenticated" ON role_permissions FOR SELECT TO authenticated USING (true);

-- Policy CRUD hanya untuk Admin
CREATE POLICY "Allow all for admin" ON system_roles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow all for admin" ON role_permissions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- DATA AWAL (SEEDING)
-- ============================================================

-- Masukkan modul bawaan
INSERT INTO system_modules (id, name, description) VALUES 
('menu_gis', 'Peta GIS', 'Akses ke peta pemantauan'),
('menu_eksekutif', 'Ringkasan Eksekutif', 'Akses ke grafik dan statistik makro'),
('menu_laporan', 'Laporan & Export', 'Akses download laporan excel/pdf'),
('menu_validasi', 'Validasi Data', 'Akses untuk menyetujui/menolak inputan petugas'),
('menu_mou', 'Manajemen MoU', 'Akses ke data kontrak transporter'),
('menu_intervensi', 'Intervensi Wilayah', 'Akses ke tabel ranking kecamatan'),
('menu_fasum', 'Intervensi Fasum', 'Akses ke tabel ranking fasilitas umum'),
('menu_master', 'Master Data', 'Akses untuk mengelola user, lokasi, fasum, dll'),
('menu_audit', 'Audit Log', 'Akses log aktivitas sistem')
ON CONFLICT (id) DO NOTHING;

-- Masukkan role bawaan (migrasi dari hardcode)
INSERT INTO system_roles (code, name, is_system, description) VALUES 
('admin', 'Administrator', true, 'Akses penuh ke seluruh sistem'),
('eksekutif', 'Eksekutif', true, 'Akses pemantauan dan laporan (Read-Only)'),
('petugas', 'Petugas Lapangan', true, 'Hanya akses aplikasi mobile PWA'),
('warga', 'Warga', true, 'Hanya akses aplikasi mobile PWA')
ON CONFLICT (code) DO NOTHING;

-- Berikan semua hak akses ke Admin secara default
INSERT INTO role_permissions (role_code, module_id)
SELECT 'admin', id FROM system_modules
ON CONFLICT DO NOTHING;

-- Berikan hak akses pemantauan ke Eksekutif
INSERT INTO role_permissions (role_code, module_id) VALUES 
('eksekutif', 'menu_gis'),
('eksekutif', 'menu_eksekutif'),
('eksekutif', 'menu_laporan'),
('eksekutif', 'menu_intervensi'),
('eksekutif', 'menu_fasum')
ON CONFLICT DO NOTHING;
