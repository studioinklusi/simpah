-- ==============================================================================
-- SIMPAH - MIGRATION: DESA_ID pada REGISTRASI
-- Jalankan skrip ini di Supabase SQL Editor SETELAH migration_wilayah_centric.sql
--
-- Perubahan:
--   1. Update RPC check_invitation_code() → tambah return desa_id & desa_name
--   2. Update trigger handle_new_user() → simpan desa_id dari kode undangan
--      ATAU dari metadata signup (pilihan manual user di form register)
-- ==============================================================================

-- ============================================================
-- 1. UPDATE FUNGSI check_invitation_code()
--    Menambahkan desa_id dan desa_name ke output
--    DROP dulu karena return type berubah (PostgreSQL requirement)
-- ============================================================
DROP FUNCTION IF EXISTS check_invitation_code(text);

CREATE OR REPLACE FUNCTION check_invitation_code(input_code TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  role TEXT,
  job_type TEXT,
  location_id UUID,
  location_name TEXT,
  desa_id UUID,
  desa_name TEXT,
  error_message TEXT
) AS $$
DECLARE
  v_code RECORD;
  v_loc_name TEXT := NULL;
  v_desa_name TEXT := NULL;
BEGIN
  -- Cari kode secara case-insensitive
  SELECT ic.* INTO v_code 
  FROM invitation_codes ic
  WHERE UPPER(ic.code) = UPPER(TRIM(input_code)) 
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE, NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, 
      NULL::UUID, NULL::TEXT, 
      'Kode undangan tidak ditemukan'::TEXT;
    RETURN;
  END IF;
  
  IF NOT v_code.is_active THEN
    RETURN QUERY SELECT 
      FALSE, NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, 
      NULL::UUID, NULL::TEXT, 
      'Kode undangan sudah tidak aktif'::TEXT;
    RETURN;
  END IF;
  
  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < NOW() THEN
    RETURN QUERY SELECT 
      FALSE, NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, 
      NULL::UUID, NULL::TEXT, 
      'Kode undangan telah kedaluwarsa'::TEXT;
    RETURN;
  END IF;
  
  IF v_code.max_uses > 0 AND v_code.current_uses >= v_code.max_uses THEN
    RETURN QUERY SELECT 
      FALSE, NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, 
      NULL::UUID, NULL::TEXT, 
      'Kuota pemakaian kode undangan telah habis'::TEXT;
    RETURN;
  END IF;
  
  -- Ambil nama lokasi jika diisi
  IF v_code.location_id IS NOT NULL THEN
    SELECT name INTO v_loc_name FROM locations WHERE id = v_code.location_id;
  END IF;
  
  -- Ambil nama desa (format: "Desa X, Kec. Y") jika diisi
  IF v_code.desa_id IS NOT NULL THEN
    SELECT 
      'Desa ' || mw.desa_kelurahan || ', Kec. ' || mw.kecamatan 
      INTO v_desa_name 
    FROM master_wilayah mw 
    WHERE mw.id = v_code.desa_id;
  END IF;
  
  RETURN QUERY SELECT 
    TRUE, 
    v_code.role, 
    v_code.job_type, 
    v_code.location_id, 
    v_loc_name, 
    v_code.desa_id, 
    v_desa_name, 
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 2. UPDATE TRIGGER handle_new_user()
--    Membaca desa_id dari 2 sumber (prioritas kode undangan):
--      a) invitation_codes.desa_id  (jika kode valid & punya desa)
--      b) raw_user_meta_data->>'desa_id' (pilihan manual user)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_inv_code TEXT;
  v_role TEXT := 'warga';
  v_job_type TEXT := NULL;
  v_location_id UUID := NULL;
  v_desa_id UUID := NULL;
  v_code_id UUID;
  v_current_uses INT;
  v_max_uses INT;
  v_is_active BOOLEAN;
  v_expires_at TIMESTAMPTZ;
  v_meta_desa_id TEXT;
BEGIN
  -- Ambil kode undangan dari metadata signup
  v_inv_code := new.raw_user_meta_data->>'invitation_code';
  
  IF v_inv_code IS NOT NULL AND TRIM(v_inv_code) <> '' THEN
    -- Cari kode undangan dan lock row untuk menghindari race condition
    SELECT id, role, job_type, location_id, desa_id, current_uses, max_uses, is_active, expires_at 
    INTO v_code_id, v_role, v_job_type, v_location_id, v_desa_id, v_current_uses, v_max_uses, v_is_active, v_expires_at
    FROM invitation_codes
    WHERE UPPER(code) = UPPER(TRIM(v_inv_code))
    FOR UPDATE;
    
    IF v_code_id IS NOT NULL 
       AND v_is_active 
       AND (v_expires_at IS NULL OR v_expires_at >= NOW()) 
       AND (v_max_uses = 0 OR v_current_uses < v_max_uses) THEN
      
      -- Update pemakaian
      UPDATE invitation_codes 
      SET current_uses = current_uses + 1 
      WHERE id = v_code_id;
      
    ELSE
      -- Jika kode tidak valid/expired/habis kuota, fallback ke warga biasa
      v_role := 'warga';
      v_job_type := NULL;
      v_location_id := NULL;
      v_desa_id := NULL;
    END IF;
  END IF;

  -- Jika desa_id belum ter-set dari kode undangan, cek metadata manual user
  IF v_desa_id IS NULL THEN
    v_meta_desa_id := new.raw_user_meta_data->>'desa_id';
    IF v_meta_desa_id IS NOT NULL AND TRIM(v_meta_desa_id) <> '' THEN
      -- Validasi bahwa desa_id benar-benar ada di master_wilayah
      IF EXISTS (SELECT 1 FROM master_wilayah WHERE id = v_meta_desa_id::UUID) THEN
        v_desa_id := v_meta_desa_id::UUID;
      END IF;
    END IF;
  END IF;

  -- Insert profile baru ke tabel profiles
  INSERT INTO profiles (id, username, full_name, role, job_type, location_id, desa_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', 'User Baru'),
    v_role,
    v_job_type,
    v_location_id,
    v_desa_id
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- CATATAN PENTING
-- ============================================================
-- Setelah menjalankan migration ini:
--
-- 1. Fungsi check_invitation_code() kini mengembalikan 2 field baru:
--      - desa_id  (UUID)    → ID desa dari master_wilayah
--      - desa_name (TEXT)   → "Desa X, Kec. Y"
--
-- 2. Trigger handle_new_user() kini menyimpan desa_id ke profiles:
--      - Prioritas 1: dari kode undangan (invitation_codes.desa_id)
--      - Prioritas 2: dari pilihan manual user (metadata signup)
--      - desa_id divalidasi terhadap master_wilayah sebelum disimpan
--
-- 3. Pastikan tabel invitation_codes sudah punya kolom desa_id
--    (ditambahkan oleh migration_wilayah_centric.sql)
-- ==============================================================
