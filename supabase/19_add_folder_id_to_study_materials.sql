-- Add folder_id column to study_materials table to associate files with folders

-- Add the folder_id column
ALTER TABLE public.study_materials 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_study_materials_folder_id ON public.study_materials(folder_id);

-- Update the existing RLS policies to include folder access
-- (The existing policies should work fine since they're based on user_id)
