-- Create chat_file_tracking table
-- Tracks which files have been sent to Mabot in each chat session

CREATE TABLE IF NOT EXISTS public.chat_file_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL, -- Mabot chat ID
  study_material_id UUID NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(chat_id, study_material_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_file_tracking_chat_id ON public.chat_file_tracking(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_file_tracking_study_material_id ON public.chat_file_tracking(study_material_id);
CREATE INDEX IF NOT EXISTS idx_chat_file_tracking_sent_at ON public.chat_file_tracking(sent_at);

-- RLS
ALTER TABLE public.chat_file_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chat file tracking" ON public.chat_file_tracking;
CREATE POLICY "Users can view own chat file tracking" ON public.chat_file_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.study_materials sm
      WHERE sm.id = study_material_id
      AND sm.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own chat file tracking" ON public.chat_file_tracking;
CREATE POLICY "Users can insert own chat file tracking" ON public.chat_file_tracking
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_materials sm
      WHERE sm.id = study_material_id
      AND sm.user_id = (select auth.uid())
    )
  );

-- Function to get study materials for a subject/topic that haven't been sent to a specific chat
CREATE OR REPLACE FUNCTION public.get_unsent_study_materials(
  p_user_id UUID,
  p_subject_id UUID,
  p_topic_id UUID DEFAULT NULL,
  p_chat_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  type TEXT,
  content TEXT,
  file_path TEXT,
  file_size BIGINT,
  mime_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.id,
    sm.title,
    sm.type,
    sm.content,
    sm.file_path,
    sm.file_size,
    sm.mime_type
  FROM public.study_materials sm
  WHERE sm.user_id = p_user_id
    AND sm.subject_id = p_subject_id
    AND (p_topic_id IS NULL OR sm.topic_id = p_topic_id)
    AND (p_chat_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.chat_file_tracking cft
      WHERE cft.chat_id = p_chat_id
      AND cft.study_material_id = sm.id
    ))
  ORDER BY sm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_unsent_study_materials(UUID, UUID, UUID, TEXT) TO authenticated; 