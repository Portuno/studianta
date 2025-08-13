-- Create subject_events table
-- This table stores events and important dates for subjects

CREATE TABLE IF NOT EXISTS public.subject_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('exam', 'practical_activity', 'project_submission', 'presentation', 'quiz', 'assignment_due', 'lab_session', 'other')),
  event_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subject_events_user_id ON public.subject_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subject_events_subject_id ON public.subject_events(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_events_event_date ON public.subject_events(event_date);
CREATE INDEX IF NOT EXISTS idx_subject_events_event_type ON public.subject_events(event_type);

-- Enable Row Level Security
ALTER TABLE public.subject_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own subject events" ON public.subject_events;
CREATE POLICY "Users can view own subject events" ON public.subject_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subject events" ON public.subject_events;
CREATE POLICY "Users can insert own subject events" ON public.subject_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subject events" ON public.subject_events;
CREATE POLICY "Users can update own subject events" ON public.subject_events
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own subject events" ON public.subject_events;
CREATE POLICY "Users can delete own subject events" ON public.subject_events
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subject_events_updated_at 
  BEFORE UPDATE ON public.subject_events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 