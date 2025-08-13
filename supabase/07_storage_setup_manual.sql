-- MANUAL STORAGE SETUP REQUIRED
-- This file contains instructions for setting up storage manually in Supabase Dashboard

/*
Since we can't modify storage.objects directly via SQL, follow these steps:

1. RUN THIS SQL FIRST (creates the bucket):
   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES (
     'study-materials', 
     'study-materials', 
     false,
     52428800, -- 50MB file size limit
     ARRAY['application/pdf', 'image/*', 'video/*', 'audio/*', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
   )
   ON CONFLICT (id) DO NOTHING;

2. GO TO SUPABASE DASHBOARD:
   - Navigate to Storage > study-materials
   - Click on "Policies" tab
   - Enable RLS (Row Level Security)

3. ADD THESE POLICIES MANUALLY:

   Policy 1: "Users can view own files"
   - Operation: SELECT
   - Target roles: authenticated
   - Using expression: bucket_id = 'study-materials' AND (storage.foldername(name))[1] = auth.uid()::text

   Policy 2: "Users can upload own files"
   - Operation: INSERT
   - Target roles: authenticated
   - Using expression: bucket_id = 'study-materials' AND (storage.foldername(name))[1] = auth.uid()::text

   Policy 3: "Users can update own files"
   - Operation: UPDATE
   - Target roles: authenticated
   - Using expression: bucket_id = 'study-materials' AND (storage.foldername(name))[1] = auth.uid()::text

   Policy 4: "Users can delete own files"
   - Operation: DELETE
   - Target roles: authenticated
   - Using expression: bucket_id = 'study-materials' AND (storage.foldername(name))[1] = auth.uid()::text

4. TEST:
   - Try uploading a PDF in AddSubjectModal
   - Should work without 400 errors
*/ 