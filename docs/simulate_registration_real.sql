-- TEST SIMULATION 2: Jalankan insert ke auth.users dengan data real
-- yang diinput di screenshot (Kecamatan Bawang, Desa Blambangan)

BEGIN;

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
  '99999999-9999-9999-9999-999999999999',
  'test_diag_user_real@example.com',
  'dummy_hash',
  now(),
  jsonb_build_object(
    'username', 'singgihmantep',
    'full_name', 'singgih mantep bener',
    'invitation_code', 'CWKM0WS7',
    'kecamatan', 'Bawang',
    'desa_id', '03b7e33a-f29a-422d-802f-083fe948f7d7'
  ),
  now(),
  now(),
  'authenticated'
);

SELECT * FROM profiles WHERE id = '99999999-9999-9999-9999-999999999999';

ROLLBACK;
