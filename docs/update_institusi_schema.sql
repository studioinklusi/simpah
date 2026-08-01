-- ==============================================================================
-- SIMPAH - MIGRATION SCRIPT FOR INSTITUTIONAL OPERATOR & NEW LOCATION TYPES
-- Jalankan skrip ini di Supabase SQL Editor (Project Dashboard -> SQL Editor)
-- ==============================================================================

-- 1. Update CHECK constraint pada tabel locations
-- Menambahkan tipe lokasi institusi: mbg, sekolah, perkantoran, pesantren, faskes, institusi_lain
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_type_check;
ALTER TABLE locations ADD CONSTRAINT locations_type_check 
  CHECK (type IN (
    'tps', 'tps3r', 'bank_sampah', 'pengepul', 'tpa',
    'mbg', 'sekolah', 'perkantoran', 'pesantren', 'faskes', 'institusi_lain'
  ));

-- 2. Update CHECK constraint pada tabel profiles
-- Menambahkan job_type baru: operator_institusi
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_job_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_job_type_check 
  CHECK (job_type IS NULL OR job_type IN (
    'koordinator', 'angkut', 'operator_tps', 'kader', 'operator_institusi'
  ));

-- 3. Update CHECK constraint pada tabel invitation_codes
-- Menambahkan job_type baru: operator_institusi
ALTER TABLE invitation_codes DROP CONSTRAINT IF EXISTS invitation_codes_job_type_check;
ALTER TABLE invitation_codes ADD CONSTRAINT invitation_codes_job_type_check 
  CHECK (job_type IS NULL OR job_type IN (
    'koordinator', 'angkut', 'operator_tps', 'kader', 'operator_institusi'
  ));
