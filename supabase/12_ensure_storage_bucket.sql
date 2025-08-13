-- Ensure study-materials storage bucket exists and is properly configured
-- This script should be run after the storage bucket is created

-- Create the storage bucket if it doesn't exist
-- Note: This requires the storage extension to be enabled
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'study-materials',
  'study-materials',
  false, -- Private bucket for security
  52428800, -- 50MB file size limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'video/mp4',
    'video/webm',
    'video/ogg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the study-materials bucket
-- Users can only access their own files

-- Policy for uploading files
DROP POLICY IF EXISTS "Users can upload own study materials" ON storage.objects;
CREATE POLICY "Users can upload own study materials" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'study-materials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for viewing files
DROP POLICY IF EXISTS "Users can view own study materials" ON storage.objects;
CREATE POLICY "Users can view own study materials" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'study-materials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for updating files
DROP POLICY IF EXISTS "Users can update own study materials" ON storage.objects;
CREATE POLICY "Users can update own study materials" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'study-materials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for deleting files
DROP POLICY IF EXISTS "Users can delete own study materials" ON storage.objects;
CREATE POLICY "Users can delete own study materials" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'study-materials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 