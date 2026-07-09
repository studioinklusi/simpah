-- Migration: Add desa_id, weight_kg, and category_sipsn to incidental_events
-- Run this in your Supabase SQL Editor to support region and waste tracking for incidental events

ALTER TABLE public.incidental_events 
ADD COLUMN IF NOT EXISTS desa_id UUID REFERENCES public.master_wilayah(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS category_sipsn TEXT;

COMMENT ON COLUMN public.incidental_events.desa_id IS 'References master_wilayah(id) to identify the specific village and district';
COMMENT ON COLUMN public.incidental_events.weight_kg IS 'Estimated weight of waste collected during the incidental event in kilograms';
COMMENT ON COLUMN public.incidental_events.category_sipsn IS 'SIPSN waste category code (e.g. PL for Plastik, SM for Sisa Makanan)';
