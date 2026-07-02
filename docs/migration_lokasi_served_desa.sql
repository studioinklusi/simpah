-- Migration: Add served_desa_ids and address to locations table
-- Run this in your Supabase SQL Editor

-- 1. Add columns to locations table if they don't exist
ALTER TABLE locations ADD COLUMN IF NOT EXISTS served_desa_ids UUID[] DEFAULT '{}';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Backfill existing locations: populate served_desa_ids with the location's current desa_id
UPDATE locations 
SET served_desa_ids = ARRAY[desa_id] 
WHERE desa_id IS NOT NULL 
  AND (served_desa_ids IS NULL OR served_desa_ids = '{}');
