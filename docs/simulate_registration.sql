-- TEST: Jalankan insert ke auth.users dalam transaksi lalu ROLLBACK
-- Ini akan memicu trigger handle_new_user() secara nyata dan menampilkan
-- ERROR yang sebenarnya di Supabase SQL Editor.

BEGIN;

-- 1. Buat user dummy di auth.users (akan memicu trigger handle_new_user)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  role
) VALUES (
  '99999999-9999-9999-9999-999999999999', -- ID dummy
  'test_diag_user@example.com',
  'dummy_hash',
  now(),
  jsonb_build_object(
    'username', 'singgihmantep',
    'full_name', 'Singgih Mantep Test',
    'invitation_code', 'CWKM0WS7',
    'kecamatan', 'Karangkobar',
    'desa_id', NULL
  ),
  now(),
  now(),
  'authenticated'
);

-- 2. Tampilkan isi profile yang baru saja dibuat
SELECT * FROM profiles WHERE id = '99999999-9999-9999-9999-999999999999';

-- 3. Batalkan transaksi agar tidak mengotori database
ROLLBACK;
