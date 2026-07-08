-- ==============================================================================
-- SIMPAH v2 - MIGRATION: SAFE DELETE FOR LOCATIONS & FLEET
-- Jalankan query ini di SQL Editor Supabase Anda untuk mengizinkan penghapusan 
-- lokasi & kendaraan secara aman tanpa merusak integritas data historis.
-- ==============================================================================

-- 1. Hapus constraint kunci asing (foreign key) lama
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_location_id_fkey;
ALTER TABLE waste_records DROP CONSTRAINT IF EXISTS waste_records_location_id_fkey;
ALTER TABLE waste_records DROP CONSTRAINT IF EXISTS waste_records_source_location_id_fkey;
ALTER TABLE waste_records DROP CONSTRAINT IF EXISTS waste_records_fleet_id_fkey;
ALTER TABLE ai_predictions DROP CONSTRAINT IF EXISTS ai_predictions_location_id_fkey;
ALTER TABLE anomaly_alerts DROP CONSTRAINT IF EXISTS anomaly_alerts_location_id_fkey;

-- 2. Buat kembali constraint kunci asing dengan perilaku ON DELETE SET NULL
--    (Ketika lokasi/kendaraan dihapus, relasi di data transaksi otomatis diset NULL 
--     tetapi data historis/angka performa lainnya tetap aman).

ALTER TABLE profiles 
  ADD CONSTRAINT profiles_location_id_fkey 
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE waste_records 
  ADD CONSTRAINT waste_records_location_id_fkey 
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE waste_records 
  ADD CONSTRAINT waste_records_source_location_id_fkey 
  FOREIGN KEY (source_location_id) REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE waste_records 
  ADD CONSTRAINT waste_records_fleet_id_fkey 
  FOREIGN KEY (fleet_id) REFERENCES fleet(id) ON DELETE SET NULL;

ALTER TABLE ai_predictions 
  ADD CONSTRAINT ai_predictions_location_id_fkey 
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE anomaly_alerts 
  ADD CONSTRAINT anomaly_alerts_location_id_fkey 
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;
