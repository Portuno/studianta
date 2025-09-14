-- Fix the relationship between folders and study_materials
-- Run this script in your Supabase SQL Editor

-- Step 1: Check if folder_id column exists in study_materials
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'study_materials' 
AND column_name = 'folder_id';

-- Step 2: Add folder_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'study_materials' 
        AND column_name = 'folder_id'
    ) THEN
        ALTER TABLE public.study_materials 
        ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added folder_id column to study_materials';
    ELSE
        RAISE NOTICE 'folder_id column already exists in study_materials';
    END IF;
END $$;

-- Step 3: Create index for folder_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_study_materials_folder_id ON public.study_materials(folder_id);

-- Step 4: Verify the foreign key relationship
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='study_materials'
AND kcu.column_name='folder_id';

-- Step 5: Test the relationship by creating a test folder and material
-- (This will be cleaned up automatically)
DO $$
DECLARE
    test_user_id UUID;
    test_subject_id UUID;
    test_folder_id UUID;
    test_material_id UUID;
BEGIN
    -- Get a real user and subject for testing
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    SELECT id INTO test_subject_id FROM public.subjects WHERE user_id = test_user_id LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_subject_id IS NOT NULL THEN
        -- Create test folder
        INSERT INTO public.folders (user_id, subject_id, name)
        VALUES (test_user_id, test_subject_id, 'TEST_FOLDER_' || extract(epoch from now()))
        RETURNING id INTO test_folder_id;
        
        -- Create test material with folder_id
        INSERT INTO public.study_materials (user_id, subject_id, folder_id, title, type)
        VALUES (test_user_id, test_subject_id, test_folder_id, 'TEST_MATERIAL', 'document')
        RETURNING id INTO test_material_id;
        
        -- Verify the relationship works
        IF EXISTS (
            SELECT 1 FROM public.study_materials sm
            JOIN public.folders f ON sm.folder_id = f.id
            WHERE sm.id = test_material_id AND f.id = test_folder_id
        ) THEN
            RAISE NOTICE 'SUCCESS: Foreign key relationship is working correctly!';
        ELSE
            RAISE NOTICE 'ERROR: Foreign key relationship is not working';
        END IF;
        
        -- Clean up test data
        DELETE FROM public.study_materials WHERE id = test_material_id;
        DELETE FROM public.folders WHERE id = test_folder_id;
        
        RAISE NOTICE 'Test completed and cleaned up';
    ELSE
        RAISE NOTICE 'No users or subjects found for testing';
    END IF;
END $$;
