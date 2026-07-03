-- Migration: Kecamatan-level Koordinator
-- Adds kecamatan responsibility to profiles and invitation_codes

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kecamatan TEXT;
ALTER TABLE invitation_codes ADD COLUMN IF NOT EXISTS kecamatan TEXT;

-- Update trigger handle_new_user()
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_inv_code TEXT;
  v_role TEXT := 'warga';
  v_job_type TEXT := NULL;
  v_location_id UUID := NULL;
  v_desa_id UUID := NULL;
  v_kecamatan TEXT := NULL;
  v_code_id UUID;
  v_current_uses INT;
  v_max_uses INT;
  v_is_active BOOLEAN;
  v_expires_at TIMESTAMPTZ;
  v_meta_desa_id TEXT;
  v_meta_kecamatan TEXT;
BEGIN
  -- Ambil kode undangan dari metadata signup
  v_inv_code := new.raw_user_meta_data->>'invitation_code';
  
  IF v_inv_code IS NOT NULL AND TRIM(v_inv_code) <> '' THEN
    -- Cari kode undangan dan lock row untuk menghindari race condition
    SELECT id, role, job_type, location_id, desa_id, kecamatan, current_uses, max_uses, is_active, expires_at 
    INTO v_code_id, v_role, v_job_type, v_location_id, v_desa_id, v_kecamatan, v_current_uses, v_max_uses, v_is_active, v_expires_at
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
      v_kecamatan := NULL;
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

  -- Cek kecamatan dari metadata manual user jika belum ter-set dari kode undangan
  IF v_kecamatan IS NULL THEN
    v_meta_kecamatan := new.raw_user_meta_data->>'kecamatan';
    IF v_meta_kecamatan IS NOT NULL AND TRIM(v_meta_kecamatan) <> '' THEN
      v_kecamatan := v_meta_kecamatan;
    END IF;
  END IF;

  -- Insert profile baru ke tabel profiles
  INSERT INTO profiles (id, username, full_name, role, job_type, location_id, desa_id, kecamatan)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', 'User Baru'),
    v_role,
    v_job_type,
    v_location_id,
    v_desa_id,
    v_kecamatan
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
