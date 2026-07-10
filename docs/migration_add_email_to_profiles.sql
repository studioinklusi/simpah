-- Migration: Add email column to profiles table, sync from auth.users, and add get_email_by_username RPC
-- Run this script in the Supabase SQL Editor

-- 1. Tambahkan kolom email ke tabel public.profiles jika belum ada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Sinkronkan (backfill) data email yang sudah ada dari auth.users ke public.profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- 3. Perbarui fungsi trigger handle_new_user() agar otomatis menyalin email saat user baru terdaftar
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
  v_username TEXT;
BEGIN
  -- Resolve username early for better error messages
  v_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));

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

  -- Insert profile baru ke tabel profiles (dengan kolom email baru)
  BEGIN
    INSERT INTO profiles (id, username, full_name, role, job_type, location_id, desa_id, kecamatan, email)
    VALUES (
      new.id,
      v_username,
      COALESCE(new.raw_user_meta_data->>'full_name', 'User Baru'),
      v_role,
      v_job_type,
      v_location_id,
      v_desa_id,
      v_kecamatan,
      new.email -- <-- Menyalin email dari auth.users ke public.profiles
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Gagal membuat profil: %. Username=%, Role=%, job_type=%, location_id=%, desa_id=%, kecamatan=%, inv_code=%',
      SQLERRM, v_username, v_role, v_job_type, v_location_id, v_desa_id, v_kecamatan, v_inv_code;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Tambahkan RPC function untuk menerjemahkan username menjadi email saat login (untuk unauthenticated/anon users)
CREATE OR REPLACE FUNCTION get_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Cari email di public.profiles
  SELECT email INTO v_email 
  FROM public.profiles 
  WHERE username = LOWER(TRIM(p_username));
  
  -- Jika tidak ditemukan (misal akun demo default lama yang belum dimigrasi), buat fallback ke username@simpah.dev
  IF v_email IS NULL THEN
    v_email := LOWER(TRIM(p_username)) || '@simpah.dev';
  END IF;
  
  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Berikan hak akses eksekusi fungsi ke pengguna anonim (belum login) dan terautentikasi
GRANT EXECUTE ON FUNCTION get_email_by_username(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_email_by_username(TEXT) TO authenticated;
