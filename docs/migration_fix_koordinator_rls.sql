-- Migration: Fix Row Level Security (RLS) for Koordinator Lapangan
-- This allows Koordinator Lapangan (petugas with job_type = 'koordinator')
-- to read and validate (update) waste records within their assigned kecamatan.

-- 1. SELECT Policy
DROP POLICY IF EXISTS "koordinator_read_kecamatan" ON waste_records;

CREATE POLICY "koordinator_read_kecamatan" ON waste_records 
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
        AND p.role = 'petugas' 
        AND p.job_type = 'koordinator'
        AND (
          waste_records.desa_id IS NULL OR 
          EXISTS (
            SELECT 1 FROM master_wilayah mw 
            WHERE mw.id = waste_records.desa_id 
              AND LOWER(mw.kecamatan) = LOWER(p.kecamatan)
          )
        )
    )
  );

-- 2. UPDATE Policy (for Validation)
DROP POLICY IF EXISTS "koordinator_update_kecamatan" ON waste_records;

CREATE POLICY "koordinator_update_kecamatan" ON waste_records 
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
        AND p.role = 'petugas' 
        AND p.job_type = 'koordinator'
        AND (
          waste_records.desa_id IS NULL OR 
          EXISTS (
            SELECT 1 FROM master_wilayah mw 
            WHERE mw.id = waste_records.desa_id 
              AND LOWER(mw.kecamatan) = LOWER(p.kecamatan)
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
        AND p.role = 'petugas' 
        AND p.job_type = 'koordinator'
        AND (
          waste_records.desa_id IS NULL OR 
          EXISTS (
            SELECT 1 FROM master_wilayah mw 
            WHERE mw.id = waste_records.desa_id 
              AND LOWER(mw.kecamatan) = LOWER(p.kecamatan)
          )
        )
    )
  );
