-- Complete setup for folders functionality
-- This script combines both folder table creation and study_materials update

-- 1. Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. Create indexes for folders
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_subject_id ON public.folders(subject_id);
CREATE INDEX IF NOT EXISTS idx_folders_created_at ON public.folders(created_at);

-- 3. Enable RLS for folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for folders
DROP POLICY IF EXISTS "Users can view own folders" ON public.folders;
CREATE POLICY "Users can view own folders" ON public.folders
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own folders" ON public.folders;
CREATE POLICY "Users can insert own folders" ON public.folders
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own folders" ON public.folders;
CREATE POLICY "Users can update own folders" ON public.folders
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own folders" ON public.folders;
CREATE POLICY "Users can delete own folders" ON public.folders
  FOR DELETE USING ((select auth.uid()) = user_id);

-- 5. Create updated_at trigger for folders
DROP TRIGGER IF EXISTS update_folders_updated_at ON public.folders;
CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Add folder_id column to study_materials table
ALTER TABLE public.study_materials 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- 7. Create index for folder_id in study_materials
CREATE INDEX IF NOT EXISTS idx_study_materials_folder_id ON public.study_materials(folder_id);

-- 8. Verify the setup
SELECT 'Folders table created successfully' as status;
SELECT 'folder_id column added to study_materials' as status;
