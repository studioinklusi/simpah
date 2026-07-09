-- Migration: Add desa_id column to incidental_events
-- Run this in your Supabase SQL Editor to support region tracking for incidental events

ALTER TABLE public.incidental_events 
ADD COLUMN IF NOT EXISTS desa_id UUID REFERENCES public.master_wilayah(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.incidental_events.desa_id IS 'References master_wilayah(id) to identify the specific village and district';
