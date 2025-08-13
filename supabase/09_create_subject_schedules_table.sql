-- Create subject_schedules table
-- This table stores class schedules and recurring time slots for subjects

CREATE TABLE IF NOT EXISTS public.subject_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subject_schedules_user_id ON public.subject_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_subject_schedules_subject_id ON public.subject_schedules(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_schedules_day_of_week ON public.subject_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_subject_schedules_start_time ON public.subject_schedules(start_time);

-- Enable Row Level Security
ALTER TABLE public.subject_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own subject schedules" ON public.subject_schedules;
CREATE POLICY "Users can view own subject schedules" ON public.subject_schedules
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subject schedules" ON public.subject_schedules;
CREATE POLICY "Users can insert own subject schedules" ON public.subject_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subject schedules" ON public.subject_schedules;
CREATE POLICY "Users can update own subject schedules" ON public.subject_schedules
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own subject schedules" ON public.subject_schedules;
CREATE POLICY "Users can delete own subject schedules" ON public.subject_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subject_schedules_updated_at 
  BEFORE UPDATE ON public.subject_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 