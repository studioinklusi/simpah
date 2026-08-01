-- ==============================================================================
-- SIMPAH - INVITATION CODES MIGRATION (HYBRID REGISTRATION)
-- Jalankan skrip ini di Supabase SQL Editor.
-- ==============================================================================

-- 1. Buat Tabel invitation_codes jika belum ada
CREATE TABLE IF NOT EXISTS invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('warga', 'petugas', 'eksekutif', 'admin')),
  job_type TEXT CHECK (job_type IN ('koordinator', 'angkut', 'operator_tps', 'kader', 'operator_institusi')),
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  max_uses INTEGER DEFAULT 0, -- 0 berarti tidak terbatas
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS pada invitation_codes
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;

-- Buat Kebijakan RLS agar Admin bisa melakukan CRUD
DROP POLICY IF EXISTS "Allow all for admin on invitation_codes" ON invitation_codes;
CREATE POLICY "Allow all for admin on invitation_codes" ON invitation_codes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 2. Fungsi RPC untuk validasi kode dari client-side sebelum registrasi (Public Access)
CREATE OR REPLACE FUNCTION check_invitation_code(input_code TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  role TEXT,
  job_type TEXT,
  location_id UUID,
  location_name TEXT,
  error_message TEXT
) AS $$
DECLARE
  v_code RECORD;
  v_loc_name TEXT := NULL;
BEGIN
  -- Cari kode secara case-insensitive
  SELECT ic.* INTO v_code 
  FROM invitation_codes ic
  WHERE UPPER(ic.code) = UPPER(TRIM(input_code)) 
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, 'Kode undangan tidak ditemukan'::TEXT;
    RETURN;
  END IF;
  
  IF NOT v_code.is_active THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, 'Kode undangan sudah tidak aktif'::TEXT;
    RETURN;
  END IF;
  
  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, 'Kode undangan telah kedaluwarsa'::TEXT;
    RETURN;
  END IF;
  
  IF v_code.max_uses > 0 AND v_code.current_uses >= v_code.max_uses THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, 'Kuota pemakaian kode undangan telah habis'::TEXT;
    RETURN;
  END IF;
  
  -- Ambil nama lokasi jika diisi
  IF v_code.location_id IS NOT NULL THEN
    SELECT name INTO v_loc_name FROM locations WHERE id = v_code.location_id;
  END IF;
  
  RETURN QUERY SELECT TRUE, v_code.role, v_code.job_type, v_code.location_id, v_loc_name, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Modifikasi fungsi trigger handle_new_user() agar memproses kode undangan
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_inv_code TEXT;
  v_role TEXT := 'warga';
  v_job_type TEXT := NULL;
  v_location_id UUID := NULL;
  v_code_id UUID;
  v_current_uses INT;
  v_max_uses INT;
  v_is_active BOOLEAN;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Ambil kode undangan dari metadata signup
  v_inv_code := new.raw_user_meta_data->>'invitation_code';
  
  IF v_inv_code IS NOT NULL AND TRIM(v_inv_code) <> '' THEN
    -- Cari kode undangan dan lock row untuk menghindari race condition pemakaian
    SELECT id, role, job_type, location_id, current_uses, max_uses, is_active, expires_at 
    INTO v_code_id, v_role, v_job_type, v_location_id, v_current_uses, v_max_uses, v_is_active, v_expires_at
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
    END IF;
  END IF;

  -- Insert profile baru ke tabel profiles
  INSERT INTO profiles (id, username, full_name, role, job_type, location_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', 'User Baru'),
    v_role,
    v_job_type,
    v_location_id
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
