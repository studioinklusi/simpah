-- ==============================================================================
-- SIMPAH v2 - DATABASE SCHEMA & SEED DATA
-- Eksekusi file ini di Supabase SQL Editor
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. SCHEMA (Berurutan sesuai dependency)
-- ------------------------------------------------------------------------------

-- 2.1. locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tps','tps3r','bank_sampah','pengepul','tpa')),
  address TEXT,
  wilayah TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  capacity_kg NUMERIC,
  max_capacity_ton NUMERIC,   -- kapasitas total TPA (untuk prediksi AI)
  current_fill_ton NUMERIC,   -- volume terisi saat ini
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2. fleet
CREATE TABLE fleet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL,
  driver_name TEXT,
  capacity_kg NUMERIC(10,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','maintenance','retired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3. profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('warga','petugas','eksekutif','admin')),
  job_type TEXT CHECK (job_type IN ('koordinator','angkut','operator_tps','kader')),
  phone TEXT,
  location_id UUID REFERENCES locations(id),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.4. waste_records
CREATE TABLE waste_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id TEXT UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('masuk','campur','pilah','olah','residu')),
  category_sipsn TEXT NOT NULL,
  weight_kg NUMERIC(10,2) NOT NULL CHECK (weight_kg > 0),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  location_id UUID REFERENCES locations(id),
  location_name TEXT,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  user_name TEXT,
  fleet_id UUID REFERENCES fleet(id),
  fleet_plate TEXT,
  source_type TEXT DEFAULT 'langsung' CHECK (source_type IN ('langsung','fasilitas_lain')),
  source_location_id UUID REFERENCES locations(id),
  is_batch BOOLEAN DEFAULT false,
  batch_start_date DATE,
  batch_end_date DATE,
  batch_days INTEGER,
  treatment_method TEXT,
  is_incidental BOOLEAN DEFAULT false,
  notes TEXT,
  photo_url TEXT,
  verification_status TEXT DEFAULT 'pending' 
    CHECK (verification_status IN ('pending','approved','rejected')),
  verification_notes TEXT,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT now(),
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_waste_records_date ON waste_records(record_date);
CREATE INDEX idx_waste_records_type ON waste_records(type);
CREATE INDEX idx_waste_records_location ON waste_records(location_id);
CREATE INDEX idx_waste_records_user ON waste_records(user_id);
CREATE INDEX idx_waste_records_status ON waste_records(verification_status);
CREATE INDEX idx_waste_records_category ON waste_records(category_sipsn);

-- 2.5. sorted_waste
CREATE TABLE sorted_waste (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waste_record_id UUID REFERENCES waste_records(id) ON DELETE CASCADE,
  category_sipsn TEXT NOT NULL,
  weight_kg NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.6. mou
CREATE TABLE mou (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transporter_name TEXT NOT NULL,
  contract_number TEXT UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expiring','expired','terminated')),
  contact_person TEXT,
  phone TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.7. mou_fleet (junction table)
CREATE TABLE mou_fleet (
  mou_id UUID REFERENCES mou(id) ON DELETE CASCADE,
  fleet_id UUID REFERENCES fleet(id) ON DELETE CASCADE,
  PRIMARY KEY (mou_id, fleet_id)
);

-- 2.8. complaints
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT UNIQUE NOT NULL,
  reporter_user_id UUID REFERENCES profiles(id),
  reporter_name TEXT NOT NULL,
  reporter_phone TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  address TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'baru' 
    CHECK (status IN ('baru','diterima','diproses','ditindaklanjuti','selesai','ditolak')),
  admin_response TEXT,
  responded_by UUID REFERENCES profiles(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_tracking ON complaints(tracking_number);

-- 2.9. incidental_events
CREATE TABLE incidental_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('kerja_bakti','edukasi','pembersihan','lainnya')),
  title TEXT NOT NULL,
  description TEXT,
  location_name TEXT,
  participants INTEGER DEFAULT 0,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  photo_url TEXT,
  user_id UUID REFERENCES profiles(id),
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.10. audit_log
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);

-- 2.11. notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.12. activity_feed
CREATE TABLE activity_feed (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.13. ai_predictions
CREATE TABLE ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  target_date DATE NOT NULL,
  predicted_volume_kg NUMERIC(10,2) NOT NULL,
  confidence_score NUMERIC(3,2),
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.14. anomaly_alerts
CREATE TABLE anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID REFERENCES waste_records(id),
  user_id UUID REFERENCES profiles(id),
  location_id UUID REFERENCES locations(id),
  type TEXT NOT NULL CHECK (type IN ('gps_drift','volume_spike','zero_input')),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high')),
  description TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.15. ai_chat_history
CREATE TABLE ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  query_text TEXT NOT NULL,
  response_text TEXT,
  sql_generated TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------

-- waste_records
ALTER TABLE waste_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "petugas_insert" ON waste_records FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('petugas','admin')));
CREATE POLICY "petugas_read_own" ON waste_records FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "admin_full" ON waste_records FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "eksekutif_read_approved" ON waste_records FOR SELECT TO authenticated
  USING (verification_status = 'approved' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'eksekutif'));

-- complaints
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert" ON complaints FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_no_direct_read" ON complaints FOR SELECT TO anon USING (false);
CREATE POLICY "user_read_own" ON complaints FOR SELECT TO authenticated
  USING (reporter_user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- others (allow full access for now for simplicity in sprint 1/2)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_locations" ON locations FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "admin_all_locations" ON locations FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE fleet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_fleet" ON fleet FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "admin_all_fleet" ON fleet FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE mou ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_mou" ON mou FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_all_mou" ON mou FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE mou_fleet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_mou_fleet" ON mou_fleet FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_all_mou_fleet" ON mou_fleet FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 4. TRIGGERS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', 'User Baru'),
    COALESCE(new.raw_user_meta_data->>'role', 'warga')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ------------------------------------------------------------------------------
-- 5. SEED DATA (Lokasi, Fleet, MoU)
-- ------------------------------------------------------------------------------

-- Seed Locations
INSERT INTO locations (name, type, lat, lng, address, wilayah) VALUES
('TPS3R Banjarnegara', 'tps3r', -7.3891, 109.6952, 'Jl. Selamanik No. 10, Banjarnegara', 'Banjarnegara'),
('TPS3R Purwareja', 'tps3r', -7.4123, 109.6310, 'Jl. Raya Purwareja, Purwareja Klampok', 'Purwareja Klampok'),
('TPS Mandiraja', 'tps', -7.4502, 109.6218, 'Jl. Raya Mandiraja', 'Mandiraja'),
('Bank Sampah Berseri', 'bank_sampah', -7.3935, 109.6988, 'Jl. Letjend S. Parman No. 45, Banjarnegara', 'Banjarnegara'),
('Bank Sampah Mawar', 'bank_sampah', -7.3780, 109.7051, 'Jl. Pemuda No. 22, Banjarnegara', 'Banjarnegara'),
('Bank Sampah Cempaka', 'bank_sampah', -7.4250, 109.6850, 'Jl. Raya Sigaluh No. 5', 'Sigaluh'),
('Pengepul Jaya Abadi', 'pengepul', -7.3998, 109.7102, 'Jl. Salak No. 8, Banjarnegara', 'Banjarnegara'),
('Pengepul Berkah', 'pengepul', -7.4350, 109.6450, 'Jl. Raya Bawang No. 12', 'Bawang'),
('TPA Winong', 'tpa', -7.3720, 109.6780, 'Desa Winong, Kec. Banjarnegara', 'Banjarnegara'),
('TPS3R Wanadadi', 'tps3r', -7.3555, 109.7410, 'Jl. Raya Wanadadi No. 3', 'Wanadadi');

-- Seed Fleet
INSERT INTO fleet (plate_number, vehicle_type, driver_name, capacity_kg, status) VALUES
('R 1234 AB', 'Dump Truck', 'Suparjo', 5000, 'active'),
('R 5678 CD', 'Arm Roll', 'Darmaji', 8000, 'active'),
('R 9012 EF', 'Motor Roda Tiga', 'Wahyudi', 500, 'active'),
('R 3456 GH', 'Pick Up', 'Eko Prasetyo', 1500, 'maintenance');

-- Seed MoU
INSERT INTO mou (transporter_name, contract_number, start_date, end_date, status, contact_person, phone) VALUES
('CV. Bersih Lestari', 'MOU/2025/001', '2025-01-01', '2026-12-31', 'active', 'Ir. Sugeng', '081299988877'),
('PT. Hijau Mandiri', 'MOU/2025/002', '2025-06-01', '2026-05-31', 'active', 'Bambang S.', '082188877766'),
('UD. Sampah Bersih', 'MOU/2024/003', '2024-01-01', '2025-12-31', 'expiring', 'Haryanto', '085766655544');

-- Hubungkan MoU dengan Fleet (mou_fleet)
DO $$
DECLARE
  mou1 UUID; mou2 UUID; mou3 UUID;
  f1 UUID; f2 UUID; f3 UUID; f4 UUID;
BEGIN
  SELECT id INTO mou1 FROM mou WHERE contract_number = 'MOU/2025/001';
  SELECT id INTO mou2 FROM mou WHERE contract_number = 'MOU/2025/002';
  SELECT id INTO mou3 FROM mou WHERE contract_number = 'MOU/2024/003';
  
  SELECT id INTO f1 FROM fleet WHERE plate_number = 'R 1234 AB';
  SELECT id INTO f2 FROM fleet WHERE plate_number = 'R 5678 CD';
  SELECT id INTO f3 FROM fleet WHERE plate_number = 'R 9012 EF';
  SELECT id INTO f4 FROM fleet WHERE plate_number = 'R 3456 GH';
  
  INSERT INTO mou_fleet (mou_id, fleet_id) VALUES (mou1, f1), (mou1, f2), (mou2, f3), (mou3, f4);
END $$;
