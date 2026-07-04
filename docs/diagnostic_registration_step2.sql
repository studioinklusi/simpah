-- Jalankan SATU PER SATU (pilih satu query, block/select, lalu Run)

-- ====== QUERY A: Trigger lain di tabel profiles ======
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'public' AND event_object_table = 'profiles';

-- ====== QUERY B: Trigger di auth.users ======
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- ====== QUERY C: Cek username & email ======
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE username = 'singgihmantep') AS username_exists,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'skuadkito@gmail.com') AS email_exists,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'handle_new_user' AND prosrc LIKE '%EXCEPTION WHEN OTHERS%') AS trigger_updated;
