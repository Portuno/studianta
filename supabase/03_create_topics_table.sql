-- Create topics table (topics within a subject)

CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON public.topics(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON public.topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_created_at ON public.topics(created_at);

-- Optional: prevent duplicate topic names per subject per user
-- CREATE UNIQUE INDEX IF NOT EXISTS uq_topics_user_subject_name ON public.topics(user_id, subject_id, name);

-- RLS
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own topics" ON public.topics;
CREATE POLICY "Users can view own topics" ON public.topics
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own topics" ON public.topics;
CREATE POLICY "Users can insert own topics" ON public.topics
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own topics" ON public.topics;
CREATE POLICY "Users can update own topics" ON public.topics
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own topics" ON public.topics;
CREATE POLICY "Users can delete own topics" ON public.topics
  FOR DELETE USING ((select auth.uid()) = user_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_topics_updated_at ON public.topics;
CREATE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 