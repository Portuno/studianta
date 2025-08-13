-- Enable Row Level Security (RLS) and create security policies
-- for tables that currently have RLS disabled
-- This fixes the security vulnerabilities identified by Supabase

-- =====================================================
-- CHAT MESSAGES TABLE
-- =====================================================

-- Enable RLS on chat_messages table
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_messages
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.chat_session_id
      AND cs.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.chat_session_id
      AND cs.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own chat messages" ON public.chat_messages;
CREATE POLICY "Users can update own chat messages" ON public.chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.chat_session_id
      AND cs.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.chat_messages;
CREATE POLICY "Users can delete own chat messages" ON public.chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.chat_session_id
      AND cs.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- CHAT SESSIONS TABLE
-- =====================================================

-- Enable RLS on chat_sessions table
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_sessions
DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can insert own chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can update own chat sessions" ON public.chat_sessions
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can delete own chat sessions" ON public.chat_sessions
  FOR DELETE USING ((select auth.uid()) = user_id);

-- =====================================================
-- STUDY CONTEXTS TABLE
-- =====================================================

-- Enable RLS on study_contexts table
ALTER TABLE public.study_contexts ENABLE ROW LEVEL SECURITY;

-- Create policies for study_contexts
DROP POLICY IF EXISTS "Users can view own study contexts" ON public.study_contexts;
CREATE POLICY "Users can view own study contexts" ON public.study_contexts
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own study contexts" ON public.study_contexts;
CREATE POLICY "Users can insert own study contexts" ON public.study_contexts
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own study contexts" ON public.study_contexts;
CREATE POLICY "Users can update own study contexts" ON public.study_contexts
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own study contexts" ON public.study_contexts;
CREATE POLICY "Users can delete own study contexts" ON public.study_contexts
  FOR DELETE USING ((select auth.uid()) = user_id);

-- =====================================================
-- STUDY BLOCKS TABLE
-- =====================================================

-- Enable RLS on study_blocks table
ALTER TABLE public.study_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies for study_blocks
DROP POLICY IF EXISTS "Users can view own study blocks" ON public.study_blocks;
CREATE POLICY "Users can view own study blocks" ON public.study_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = study_blocks.subject_id
      AND s.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own study blocks" ON public.study_blocks;
CREATE POLICY "Users can insert own study blocks" ON public.study_blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = study_blocks.subject_id
      AND s.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own study blocks" ON public.study_blocks;
CREATE POLICY "Users can update own study blocks" ON public.study_blocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = study_blocks.subject_id
      AND s.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own study blocks" ON public.study_blocks;
CREATE POLICY "Users can delete own study blocks" ON public.study_blocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = study_blocks.subject_id
      AND s.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- ACADEMIC CALENDAR TABLE
-- =====================================================

-- Enable RLS on academic_calendar table
ALTER TABLE public.academic_calendar ENABLE ROW LEVEL SECURITY;

-- Create policies for academic_calendar
DROP POLICY IF EXISTS "Users can view own academic calendar" ON public.academic_calendar;
CREATE POLICY "Users can view own academic calendar" ON public.academic_calendar
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own academic calendar" ON public.academic_calendar;
CREATE POLICY "Users can insert own academic calendar" ON public.academic_calendar
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own academic calendar" ON public.academic_calendar;
CREATE POLICY "Users can update own academic calendar" ON public.academic_calendar
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own academic calendar" ON public.academic_calendar;
CREATE POLICY "Users can delete own academic calendar" ON public.academic_calendar
  FOR DELETE USING ((select auth.uid()) = user_id);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Query to verify RLS is enabled on all tables
-- Run this after executing the script to confirm RLS is enabled
/*
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'chat_messages',
    'chat_sessions', 
    'study_contexts',
    'study_blocks',
    'academic_calendar'
  )
ORDER BY tablename;
*