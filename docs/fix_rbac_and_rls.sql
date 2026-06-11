-- ==============================================================================
-- SIMPAH - RLS & RBAC SECURITY REINFORCEMENT PATCH
-- Eksekusi skrip ini di Supabase SQL Editor untuk meningkatkan keamanan.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROFILE TABLE UPDATES (Admin Access & Trigger Protection)
-- ------------------------------------------------------------------------------

-- Hapus trigger trigger pendaftaran jika ada, untuk diganti trigger yang aman
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Fungsi trigger yang telah dimodifikasi (Aman dari manipulasi role metadata)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', 'User Baru'),
    'warga' -- Selalu set sebagai 'warga' secara default, abaikan client metadata role!
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang kembali trigger pendaftaran
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Kebijakan RLS agar peran 'admin' dapat meng-update profil pengguna lain (misalnya promosi role)
DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles" ON profiles 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ------------------------------------------------------------------------------
-- 2. SECURING EXPOSED TABLES (village_population & public_facilities)
-- ------------------------------------------------------------------------------

-- 2.1. village_population
DROP POLICY IF EXISTS "Allow read for all" ON village_population;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON village_population;
DROP POLICY IF EXISTS "Allow update for authenticated" ON village_population;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON village_population;

CREATE POLICY "Allow read for authenticated" ON village_population
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write for admin only" ON village_population
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 2.2. public_facilities
DROP POLICY IF EXISTS "Allow read for all on public_facilities" ON public_facilities;
DROP POLICY IF EXISTS "Allow insert for admin/validator" ON public_facilities;
DROP POLICY IF EXISTS "Allow update for admin/validator" ON public_facilities;
DROP POLICY IF EXISTS "Allow delete for admin/validator" ON public_facilities;

CREATE POLICY "Allow read for authenticated on public_facilities" ON public_facilities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write for admin/validator only" ON public_facilities
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- ------------------------------------------------------------------------------
-- 3. ENABLING RLS FOR UNPROTECTED TABLES (7 Tables)
-- ------------------------------------------------------------------------------

-- 3.1. sorted_waste (Child of waste_records, restricts insert to petugas/admin)
ALTER TABLE sorted_waste ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_sorted_waste" ON sorted_waste;
DROP POLICY IF EXISTS "insert_sorted_waste" ON sorted_waste;

CREATE POLICY "read_sorted_waste" ON sorted_waste 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_sorted_waste" ON sorted_waste 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('petugas', 'admin')));

-- 3.2. incidental_events (Restricts insert to petugas/admin)
ALTER TABLE incidental_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_incidental_events" ON incidental_events;
DROP POLICY IF EXISTS "insert_incidental_events" ON incidental_events;

CREATE POLICY "read_incidental_events" ON incidental_events 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_incidental_events" ON incidental_events 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('petugas', 'admin')));

-- 3.3. audit_log (High protection: read by admin, write by authenticated system actions)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_select_audit_log" ON audit_log;
DROP POLICY IF EXISTS "insert_audit_log" ON audit_log;

CREATE POLICY "admin_select_audit_log" ON audit_log 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "insert_audit_log" ON audit_log 
  FOR INSERT TO authenticated 
  WITH CHECK (true); -- Diperbolehkan merekam log tindakan user

-- 3.4. notifications (User reads own only, admin manages all)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_own_notifications" ON notifications;
DROP POLICY IF EXISTS "admin_all_notifications" ON notifications;

CREATE POLICY "read_own_notifications" ON notifications 
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "admin_all_notifications" ON notifications 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3.5. activity_feed (Read by authenticated, managed by system/admin)
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_activity_feed" ON activity_feed;
DROP POLICY IF EXISTS "admin_all_activity_feed" ON activity_feed;

CREATE POLICY "read_activity_feed" ON activity_feed 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_all_activity_feed" ON activity_feed 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3.6. ai_predictions & anomaly_alerts (Read by admin and eksekutif, write by system/admin)
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_predictions" ON ai_predictions;
DROP POLICY IF EXISTS "admin_predictions" ON ai_predictions;

CREATE POLICY "read_predictions" ON ai_predictions 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'eksekutif')));

CREATE POLICY "admin_predictions" ON ai_predictions 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE anomaly_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_anomaly_alerts" ON anomaly_alerts;
DROP POLICY IF EXISTS "admin_anomaly_alerts" ON anomaly_alerts;

CREATE POLICY "read_anomaly_alerts" ON anomaly_alerts 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'eksekutif')));

CREATE POLICY "admin_anomaly_alerts" ON anomaly_alerts 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3.7. ai_chat_history (Read and write own only)
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_chat_history" ON ai_chat_history;

CREATE POLICY "own_chat_history" ON ai_chat_history 
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. COMPLAINTS TABLE SECURITY ENHANCEMENTS
-- ------------------------------------------------------------------------------
-- Memperbolehkan petugas/eksekutif melihat aduan jika diperlukan
DROP POLICY IF EXISTS "petugas_eksekutif_read_complaints" ON complaints;
CREATE POLICY "petugas_eksekutif_read_complaints" ON complaints 
  FOR SELECT TO authenticated 
  USING (
    reporter_user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'petugas', 'eksekutif')
    )
  );

-- Memperbolehkan admin/petugas meng-update status aduan (misal: memproses laporan warga)
DROP POLICY IF EXISTS "update_complaint_status" ON complaints;
CREATE POLICY "update_complaint_status" ON complaints 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'petugas')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'petugas')
    )
  );
