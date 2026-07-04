-- DIAGNOSTIC: Cek kenapa registrasi dengan kode CWKM0WS7 gagal
-- Jalankan ini di Supabase SQL Editor

-- 1. Cek data invitation code
SELECT id, code, role, job_type, location_id, desa_id, kecamatan, 
       current_uses, max_uses, is_active, expires_at
FROM invitation_codes 
WHERE UPPER(code) = 'CWKM0WS7';

-- 2. Cek apakah location_id dari kode valid (jika ada)
SELECT 'location_id valid' AS check_name, 
       CASE WHEN EXISTS (
         SELECT 1 FROM locations WHERE id = (
           SELECT location_id FROM invitation_codes WHERE UPPER(code) = 'CWKM0WS7'
         )
       ) THEN 'YES' ELSE 'NO atau NULL' END AS result;

-- 3. Cek apakah desa_id dari kode valid (jika ada)
SELECT 'desa_id valid' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM master_wilayah WHERE id = (
           SELECT desa_id FROM invitation_codes WHERE UPPER(code) = 'CWKM0WS7'
         )
       ) THEN 'YES' ELSE 'NO atau NULL' END AS result;

-- 4. Cek semua constraint di tabel profiles
SELECT conname AS constraint_name, 
       contype AS constraint_type,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass
ORDER BY contype;

-- 5. Cek kolom profiles yang ada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 6. Simulasi INSERT (DRY RUN - tidak benar-benar insert)
-- Ubah nilai di bawah sesuai data yang diinput
DO $$
DECLARE
  v_inv RECORD;
  v_role TEXT;
  v_job_type TEXT;
  v_location_id UUID;
  v_desa_id UUID;
  v_kecamatan TEXT;
BEGIN
  -- Ambil data dari invitation code
  SELECT role, job_type, location_id, desa_id, kecamatan
  INTO v_role, v_job_type, v_location_id, v_desa_id, v_kecamatan
  FROM invitation_codes 
  WHERE UPPER(code) = 'CWKM0WS7';

  RAISE NOTICE '--- Invitation Code Data ---';
  RAISE NOTICE 'role: %', v_role;
  RAISE NOTICE 'job_type: %', v_job_type;
  RAISE NOTICE 'location_id: %', v_location_id;
  RAISE NOTICE 'desa_id: %', v_desa_id;
  RAISE NOTICE 'kecamatan: %', v_kecamatan;

  -- Cek FK location_id
  IF v_location_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM locations WHERE id = v_location_id) THEN
      RAISE NOTICE '❌ PROBLEM: location_id % TIDAK ADA di tabel locations!', v_location_id;
    ELSE
      RAISE NOTICE '✅ location_id valid';
    END IF;
  ELSE
    RAISE NOTICE '✅ location_id is NULL (no FK check needed)';
  END IF;

  -- Cek FK desa_id
  IF v_desa_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM master_wilayah WHERE id = v_desa_id) THEN
      RAISE NOTICE '❌ PROBLEM: desa_id % TIDAK ADA di tabel master_wilayah!', v_desa_id;
    ELSE
      RAISE NOTICE '✅ desa_id valid';
    END IF;
  ELSE
    RAISE NOTICE '✅ desa_id is NULL (will use metadata)';
  END IF;

  -- Cek role constraint
  IF v_role NOT IN ('warga', 'petugas', 'eksekutif', 'admin') THEN
    RAISE NOTICE '❌ PROBLEM: role "%" tidak valid! Harus salah satu dari: warga, petugas, eksekutif, admin', v_role;
  ELSE
    RAISE NOTICE '✅ role "%" valid', v_role;
  END IF;

  -- Cek job_type constraint
  IF v_job_type IS NOT NULL AND v_job_type NOT IN ('koordinator', 'angkut', 'operator_tps', 'kader') THEN
    RAISE NOTICE '❌ PROBLEM: job_type "%" tidak valid!', v_job_type;
  ELSE
    RAISE NOTICE '✅ job_type "%" valid', v_job_type;
  END IF;

  RAISE NOTICE '--- End Diagnostic ---';
END $$;
