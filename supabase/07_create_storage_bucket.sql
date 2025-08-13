-- Create storage bucket for study materials
-- This is the only part we can do via SQL

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'study-materials', 
  'study-materials', 
  false,
  52428800, -- 50MB file size limit
  ARRAY['application/pdf', 'image/*', 'video/*', 'audio/*', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- After running this, go to Supabase Dashboard > Storage > study-materials
-- Enable RLS and add the policies manually as described in 07_storage_setup_manual.sql 