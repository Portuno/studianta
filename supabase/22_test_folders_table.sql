-- Test script to verify folders table exists and works correctly

-- Check if folders table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'folders';

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'folders'
ORDER BY ordinal_position;

-- Test insert (this will fail if table doesn't exist)
-- Uncomment the lines below to test:
-- INSERT INTO public.folders (user_id, subject_id, name) 
-- VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Test Folder')
-- ON CONFLICT DO NOTHING;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'folders';
