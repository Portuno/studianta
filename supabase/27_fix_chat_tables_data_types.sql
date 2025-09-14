-- Fix chat tables data types - Step by step approach
-- This script handles the UUID to TEXT conversion for chat_sessions.id

-- Step 1: Drop existing RLS policies that depend on the id column
-- First, let's see what policies exist
DO $$ 
BEGIN
    -- Drop all policies on chat_sessions
    DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.chat_sessions;
    DROP POLICY IF EXISTS "Users can insert own chat sessions" ON public.chat_sessions;
    DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.chat_sessions;
    DROP POLICY IF EXISTS "Users can delete own chat sessions" ON public.chat_sessions;
    DROP POLICY IF EXISTS "chat_sessions_select_by_owner" ON public.chat_sessions;
    DROP POLICY IF EXISTS "chat_sessions_insert_by_owner" ON public.chat_sessions;
    DROP POLICY IF EXISTS "chat_sessions_update_by_owner" ON public.chat_sessions;
    DROP POLICY IF EXISTS "chat_sessions_delete_by_owner" ON public.chat_sessions;
    
    -- Drop all policies on chat_messages
    DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
    DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
    DROP POLICY IF EXISTS "Users can update own chat messages" ON public.chat_messages;
    DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.chat_messages;
    DROP POLICY IF EXISTS "chat_messages_select_by_session_owner" ON public.chat_messages;
    DROP POLICY IF EXISTS "chat_messages_insert_by_session_owner" ON public.chat_messages;
    DROP POLICY IF EXISTS "chat_messages_update_by_session_owner" ON public.chat_messages;
    DROP POLICY IF EXISTS "chat_messages_delete_by_session_owner" ON public.chat_messages;
    
    RAISE NOTICE 'Dropped all existing RLS policies';
END $$;

-- Step 2: Drop foreign key constraints before changing data types
DO $$ 
DECLARE
    rec RECORD;
BEGIN
    -- Drop foreign key constraint from chat_messages to chat_sessions
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_messages_chat_id_fkey'
        AND table_name = 'chat_messages'
    ) THEN
        ALTER TABLE public.chat_messages DROP CONSTRAINT chat_messages_chat_id_fkey;
        RAISE NOTICE 'Dropped foreign key constraint chat_messages_chat_id_fkey';
    END IF;
    
    -- Drop any other foreign key constraints that might reference chat_sessions.id
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%chat_sessions%'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Get all foreign key constraints that reference chat_sessions
        FOR rec IN (
            SELECT constraint_name, table_name 
            FROM information_schema.table_constraints 
            WHERE constraint_name LIKE '%chat_sessions%'
            AND constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', rec.table_name, rec.constraint_name);
            RAISE NOTICE 'Dropped foreign key constraint % from table %', rec.constraint_name, rec.table_name;
        END LOOP;
    END IF;
END $$;

-- Step 3: Change the data type of chat_sessions.id from UUID to TEXT
DO $$ 
BEGIN
    -- Check if id column is UUID type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_sessions' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
    ) THEN
        -- Alter the column to TEXT
        ALTER TABLE public.chat_sessions ALTER COLUMN id TYPE TEXT;
        RAISE NOTICE 'Changed chat_sessions.id from UUID to TEXT';
    ELSE
        RAISE NOTICE 'chat_sessions.id is already TEXT or does not exist';
    END IF;
END $$;

-- Step 4: Change the data type of chat_messages.chat_id from UUID to TEXT
DO $$ 
BEGIN
    -- Check if chat_id column is UUID type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'chat_id' 
        AND data_type = 'uuid'
    ) THEN
        -- Alter the column to TEXT
        ALTER TABLE public.chat_messages ALTER COLUMN chat_id TYPE TEXT;
        RAISE NOTICE 'Changed chat_messages.chat_id from UUID to TEXT';
    ELSE
        RAISE NOTICE 'chat_messages.chat_id is already TEXT or does not exist';
    END IF;
END $$;

-- Step 5: Ensure chat_sessions table exists with correct structure
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  context TEXT,
  mabot_chat_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  last_activity TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Step 6: Ensure chat_messages table exists with correct structure
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Step 7: Recreate foreign key constraint with correct data types
DO $$ 
BEGIN
    -- Add foreign key constraint from chat_messages.chat_id to chat_sessions.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_messages_chat_id_fkey'
        AND table_name = 'chat_messages'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD CONSTRAINT chat_messages_chat_id_fkey 
        FOREIGN KEY (chat_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE;
        RAISE NOTICE 'Recreated foreign key constraint chat_messages_chat_id_fkey';
    END IF;
END $$;

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_activity ON public.chat_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Step 9: Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Step 10: Recreate RLS policies for chat_sessions
DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can insert own chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can update own chat sessions" ON public.chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can delete own chat sessions" ON public.chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Step 11: Recreate RLS policies for chat_messages
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own chat messages" ON public.chat_messages;
CREATE POLICY "Users can update own chat messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.chat_messages;
CREATE POLICY "Users can delete own chat messages" ON public.chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Step 12: Verify the setup
SELECT 'Chat tables fixed successfully!' as status;

-- Step 13: Show the final structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('chat_sessions', 'chat_messages')
ORDER BY table_name, ordinal_position;
