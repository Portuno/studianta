-- Create study_materials table (uploaded notes and files)

CREATE TABLE IF NOT EXISTS public.study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('notes', 'document', 'audio', 'video', 'pdf', 'image')),
  content TEXT,
  file_path TEXT,
  file_size BIGINT,
  mime_type TEXT,
  ai_status TEXT NOT NULL DEFAULT 'pending' CHECK (ai_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_study_materials_user_id ON public.study_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_subject_id ON public.study_materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_topic_id ON public.study_materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_created_at ON public.study_materials(created_at);

-- RLS
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own study materials" ON public.study_materials;
CREATE POLICY "Users can view own study materials" ON public.study_materials
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own study materials" ON public.study_materials;
CREATE POLICY "Users can insert own study materials" ON public.study_materials
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own study materials" ON public.study_materials;
CREATE POLICY "Users can update own study materials" ON public.study_materials
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own study materials" ON public.study_materials;
CREATE POLICY "Users can delete own study materials" ON public.study_materials
  FOR DELETE USING ((select auth.uid()) = user_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_study_materials_updated_at ON public.study_materials;
CREATE TRIGGER update_study_materials_updated_at
  BEFORE UPDATE ON public.study_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 