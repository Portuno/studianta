-- Add context columns to chat_sessions table
-- This allows us to persist subject and folder context for chat sessions

-- Add subject_id column
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE;

-- Add folder_id column  
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE;

-- Add folder_name column for display purposes
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS folder_name TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_subject_id ON public.chat_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_folder_id ON public.chat_sessions(folder_id);

-- Update RLS policies to include the new columns
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can insert their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON public.chat_sessions;

-- Recreate policies
CREATE POLICY "Users can view their own chat sessions" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions" ON public.chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions" ON public.chat_sessions
  FOR DELETE USING (auth.uid() = user_id);
