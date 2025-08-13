-- Update study_materials table structure
-- Remove topic_id dependency and ensure subject_id is properly linked

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE public.study_materials 
DROP CONSTRAINT IF EXISTS study_materials_topic_id_fkey;

-- Drop the topic_id column
ALTER TABLE public.study_materials 
DROP COLUMN IF EXISTS topic_id;

-- Ensure subject_id is NOT NULL and has proper foreign key constraint
ALTER TABLE public.study_materials 
ALTER COLUMN subject_id SET NOT NULL;

-- Add foreign key constraint for subject_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'study_materials_subject_id_fkey'
  ) THEN
    ALTER TABLE public.study_materials 
    ADD CONSTRAINT study_materials_subject_id_fkey 
    FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update the index to remove topic_id and ensure subject_id is properly indexed
DROP INDEX IF EXISTS idx_study_materials_topic_id;
CREATE INDEX IF NOT EXISTS idx_study_materials_subject_id ON public.study_materials(subject_id);

-- Update RLS policies to reflect the new structure
DROP POLICY IF EXISTS "Users can view own materials" ON public.study_materials;
CREATE POLICY "Users can view own materials" ON public.study_materials
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own materials" ON public.study_materials;
CREATE POLICY "Users can insert own materials" ON public.study_materials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own materials" ON public.study_materials;
CREATE POLICY "Users can update own materials" ON public.study_materials
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own materials" ON public.study_materials;
CREATE POLICY "Users can delete own materials" ON public.study_materials
  FOR DELETE USING (auth.uid() = user_id); 