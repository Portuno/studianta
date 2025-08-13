-- Fix study_blocks table by adding missing columns
-- Run this in your Supabase SQL Editor

-- Add missing columns one by one
ALTER TABLE public.study_blocks ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;
ALTER TABLE public.study_blocks ADD COLUMN IF NOT EXISTS topic_name TEXT DEFAULT 'Study Session';
ALTER TABLE public.study_blocks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE public.study_blocks ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE public.study_blocks ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ DEFAULT now();

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'study_blocks' 
ORDER BY ordinal_position;
