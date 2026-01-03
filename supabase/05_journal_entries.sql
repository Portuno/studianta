-- ============================================
-- TABLA: journal_entries
-- Descripción: Entradas del diario personal de cada usuario
-- ============================================

-- Crear la tabla journal_entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('Radiante', 'Enfocada', 'Equilibrada', 'Agotada', 'Estresada')),
  content TEXT NOT NULL,
  photo TEXT, -- base64 encoded image
  is_locked BOOLEAN DEFAULT false NOT NULL,
  sentiment NUMERIC(3, 2), -- Sentiment score between -1 and 1
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias entradas
CREATE POLICY "Users can view own journal entries"
  ON public.journal_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propias entradas
CREATE POLICY "Users can insert own journal entries"
  ON public.journal_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias entradas
CREATE POLICY "Users can update own journal entries"
  ON public.journal_entries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propias entradas
CREATE POLICY "Users can delete own journal entries"
  ON public.journal_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER set_updated_at_journal_entries
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS journal_entries_user_id_idx ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS journal_entries_date_idx ON public.journal_entries(date);
CREATE INDEX IF NOT EXISTS journal_entries_mood_idx ON public.journal_entries(mood);

