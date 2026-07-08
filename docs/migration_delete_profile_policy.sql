-- Migration: Add RLS policy to allow admins to delete profiles
-- This allows users with role = 'admin' to delete profiles of other users.

DROP POLICY IF EXISTS "admin_delete_profiles" ON profiles;

CREATE POLICY "admin_delete_profiles" ON profiles 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
