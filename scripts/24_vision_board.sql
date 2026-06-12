-- Vision Board: tablas, RLS, storage y extensión del diario
-- Ejecutar en Supabase SQL Editor

-- ============ TABLAS ============

CREATE TABLE IF NOT EXISTS public.vision_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Mi Vision Board',
  is_public BOOLEAN NOT NULL DEFAULT false,
  share_token UUID UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.board_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.vision_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  size_preset TEXT NOT NULL DEFAULT 'sm' CHECK (size_preset IN ('sm', 'md', 'lg', 'wide', 'tall')),
  grid_col INT NOT NULL DEFAULT 0,
  grid_row INT NOT NULL DEFAULT 0,
  col_span INT NOT NULL DEFAULT 1,
  row_span INT NOT NULL DEFAULT 1,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  links JSONB NOT NULL DEFAULT '[]'::jsonb,
  mood_tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'en_proceso' CHECK (status IN ('en_proceso', 'conseguido', 'archivado')),
  progress_percentage INT NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.board_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.vision_boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (board_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.block_progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES public.board_blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_achievements_savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id UUID NOT NULL UNIQUE REFERENCES public.board_blocks(id) ON DELETE CASCADE,
  monetary_gain NUMERIC(12,2) NOT NULL DEFAULT 0,
  saved_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  success_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extensión del diario
ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS block_id UUID REFERENCES public.board_blocks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vision_boards_user_id ON public.vision_boards(user_id);
CREATE INDEX IF NOT EXISTS idx_vision_boards_share_token ON public.vision_boards(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_board_blocks_board_id ON public.board_blocks(board_id);
CREATE INDEX IF NOT EXISTS idx_board_blocks_status ON public.board_blocks(status);
CREATE INDEX IF NOT EXISTS idx_board_collaborators_board_id ON public.board_collaborators(board_id);
CREATE INDEX IF NOT EXISTS idx_board_collaborators_user_id ON public.board_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_block_progress_logs_block_id ON public.block_progress_logs(block_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_block_id ON public.journal_entries(block_id);

-- ============ FUNCIONES HELPER RLS ============

CREATE OR REPLACE FUNCTION public.is_board_owner(p_board_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vision_boards vb
    WHERE vb.id = p_board_id AND vb.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_board_collaborator(p_board_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.board_collaborators bc
    WHERE bc.board_id = p_board_id AND bc.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_board_editor(p_board_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_board_owner(p_board_id)
    OR EXISTS (
      SELECT 1 FROM public.board_collaborators bc
      WHERE bc.board_id = p_board_id
        AND bc.user_id = auth.uid()
        AND bc.role = 'editor'
    );
$$;

CREATE OR REPLACE FUNCTION public.can_view_board(p_board_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vision_boards vb
    WHERE vb.id = p_board_id
      AND (
        vb.user_id = auth.uid()
        OR vb.is_public = true
        OR EXISTS (
          SELECT 1 FROM public.board_collaborators bc
          WHERE bc.board_id = vb.id AND bc.user_id = auth.uid()
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_board(p_board_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_board_editor(p_board_id);
$$;

-- Límite de tableros para tier Free (máx. 3)
CREATE OR REPLACE FUNCTION public.check_vision_board_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  board_count INT;
  user_tier TEXT;
BEGIN
  SELECT COUNT(*) INTO board_count
  FROM public.vision_boards
  WHERE user_id = NEW.user_id;

  SELECT COALESCE(tier, 'Free') INTO user_tier
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF user_tier = 'Free' AND board_count >= 3 THEN
    RAISE EXCEPTION 'Límite de 3 Vision Boards alcanzado para usuarios Free';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_vision_board_limit ON public.vision_boards;
CREATE TRIGGER trg_check_vision_board_limit
  BEFORE INSERT ON public.vision_boards
  FOR EACH ROW
  EXECUTE FUNCTION public.check_vision_board_limit();

-- updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vision_boards_updated_at ON public.vision_boards;
CREATE TRIGGER trg_vision_boards_updated_at
  BEFORE UPDATE ON public.vision_boards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_board_blocks_updated_at ON public.board_blocks;
CREATE TRIGGER trg_board_blocks_updated_at
  BEFORE UPDATE ON public.board_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RLS ============

ALTER TABLE public.vision_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements_savings ENABLE ROW LEVEL SECURITY;

-- vision_boards
DROP POLICY IF EXISTS "vision_boards_select" ON public.vision_boards;
CREATE POLICY "vision_boards_select" ON public.vision_boards
  FOR SELECT TO authenticated, anon
  USING (
    user_id = auth.uid()
    OR is_public = true
    OR EXISTS (
      SELECT 1 FROM public.board_collaborators bc
      WHERE bc.board_id = vision_boards.id AND bc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "vision_boards_insert" ON public.vision_boards;
CREATE POLICY "vision_boards_insert" ON public.vision_boards
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "vision_boards_update" ON public.vision_boards;
CREATE POLICY "vision_boards_update" ON public.vision_boards
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "vision_boards_delete" ON public.vision_boards;
CREATE POLICY "vision_boards_delete" ON public.vision_boards
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- board_blocks
DROP POLICY IF EXISTS "board_blocks_select" ON public.board_blocks;
CREATE POLICY "board_blocks_select" ON public.board_blocks
  FOR SELECT TO authenticated, anon
  USING (public.can_view_board(board_id));

DROP POLICY IF EXISTS "board_blocks_insert" ON public.board_blocks;
CREATE POLICY "board_blocks_insert" ON public.board_blocks
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_board(board_id));

DROP POLICY IF EXISTS "board_blocks_update" ON public.board_blocks;
CREATE POLICY "board_blocks_update" ON public.board_blocks
  FOR UPDATE TO authenticated
  USING (public.can_edit_board(board_id))
  WITH CHECK (public.can_edit_board(board_id));

DROP POLICY IF EXISTS "board_blocks_delete" ON public.board_blocks;
CREATE POLICY "board_blocks_delete" ON public.board_blocks
  FOR DELETE TO authenticated
  USING (public.can_edit_board(board_id));

-- board_collaborators (no expuesto a anon)
DROP POLICY IF EXISTS "board_collaborators_select" ON public.board_collaborators;
CREATE POLICY "board_collaborators_select" ON public.board_collaborators
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_board_owner(board_id)
  );

DROP POLICY IF EXISTS "board_collaborators_insert" ON public.board_collaborators;
CREATE POLICY "board_collaborators_insert" ON public.board_collaborators
  FOR INSERT TO authenticated
  WITH CHECK (public.is_board_owner(board_id));

DROP POLICY IF EXISTS "board_collaborators_update" ON public.board_collaborators;
CREATE POLICY "board_collaborators_update" ON public.board_collaborators
  FOR UPDATE TO authenticated
  USING (public.is_board_owner(board_id))
  WITH CHECK (public.is_board_owner(board_id));

DROP POLICY IF EXISTS "board_collaborators_delete" ON public.board_collaborators;
CREATE POLICY "board_collaborators_delete" ON public.board_collaborators
  FOR DELETE TO authenticated
  USING (public.is_board_owner(board_id) OR user_id = auth.uid());

-- block_progress_logs
DROP POLICY IF EXISTS "block_progress_logs_select" ON public.block_progress_logs;
CREATE POLICY "block_progress_logs_select" ON public.block_progress_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.board_blocks bb
      WHERE bb.id = block_progress_logs.block_id
        AND public.can_view_board(bb.board_id)
    )
  );

DROP POLICY IF EXISTS "block_progress_logs_insert" ON public.block_progress_logs;
CREATE POLICY "block_progress_logs_insert" ON public.block_progress_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.board_blocks bb
      WHERE bb.id = block_progress_logs.block_id
        AND public.can_edit_board(bb.board_id)
    )
  );

DROP POLICY IF EXISTS "block_progress_logs_delete" ON public.block_progress_logs;
CREATE POLICY "block_progress_logs_delete" ON public.block_progress_logs
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- user_achievements_savings
DROP POLICY IF EXISTS "user_achievements_savings_select" ON public.user_achievements_savings;
CREATE POLICY "user_achievements_savings_select" ON public.user_achievements_savings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_achievements_savings_insert" ON public.user_achievements_savings;
CREATE POLICY "user_achievements_savings_insert" ON public.user_achievements_savings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_achievements_savings_update" ON public.user_achievements_savings;
CREATE POLICY "user_achievements_savings_update" ON public.user_achievements_savings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_achievements_savings_delete" ON public.user_achievements_savings;
CREATE POLICY "user_achievements_savings_delete" ON public.user_achievements_savings
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Búsqueda de perfiles para invitar (solo email y nombre)
DROP POLICY IF EXISTS "profiles_search_for_invite" ON public.profiles;
CREATE POLICY "profiles_search_for_invite" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- ============ STORAGE BUCKET ============

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vision-board-images',
  'vision-board-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "vision_board_images_select" ON storage.objects;
CREATE POLICY "vision_board_images_select" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'vision-board-images');

DROP POLICY IF EXISTS "vision_board_images_insert" ON storage.objects;
CREATE POLICY "vision_board_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vision-board-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "vision_board_images_update" ON storage.objects;
CREATE POLICY "vision_board_images_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'vision-board-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "vision_board_images_delete" ON storage.objects;
CREATE POLICY "vision_board_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'vision-board-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
