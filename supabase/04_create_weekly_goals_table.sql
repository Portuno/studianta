-- Create weekly_goals table
-- Tracks weekly study goals for subjects

CREATE TABLE IF NOT EXISTS public.weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  target_hours INTEGER NOT NULL, -- Target study hours for the week
  current_hours INTEGER DEFAULT 0, -- Current study hours achieved
  week_start DATE NOT NULL, -- Start of the week (Monday)
  week_end DATE NOT NULL, -- End of the week (Sunday)
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_id ON public.weekly_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_subject_id ON public.weekly_goals(subject_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_topic_id ON public.weekly_goals(topic_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_week_start ON public.weekly_goals(week_start);

-- RLS
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own weekly goals" ON public.weekly_goals;
CREATE POLICY "Users can view own weekly goals" ON public.weekly_goals
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own weekly goals" ON public.weekly_goals;
CREATE POLICY "Users can insert own weekly goals" ON public.weekly_goals
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own weekly goals" ON public.weekly_goals;
CREATE POLICY "Users can update own weekly goals" ON public.weekly_goals
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own weekly goals" ON public.weekly_goals;
CREATE POLICY "Users can delete own weekly goals" ON public.weekly_goals
  FOR DELETE USING ((select auth.uid()) = user_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_weekly_goals_updated_at ON public.weekly_goals;
CREATE TRIGGER update_weekly_goals_updated_at
  BEFORE UPDATE ON public.weekly_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 