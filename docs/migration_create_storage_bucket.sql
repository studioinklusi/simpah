-- Migration: Create Storage Bucket and RLS Policies for SIMPAH Media
-- Run this in your Supabase SQL Editor to enable photo uploads.

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('simpah_media', 'simpah_media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users to upload files to 'simpah_media'
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'simpah_media');

-- 3. Allow public read access to files in 'simpah_media'
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'simpah_media');

-- 4. Allow authenticated users to update/delete their own files (Optional but good)
DROP POLICY IF EXISTS "Allow owner update and delete" ON storage.objects;
CREATE POLICY "Allow owner update and delete" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'simpah_media' AND auth.uid()::TEXT = owner_id)
  WITH CHECK (bucket_id = 'simpah_media' AND auth.uid()::TEXT = owner_id);
