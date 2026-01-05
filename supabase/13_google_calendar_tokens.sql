-- ============================================
-- TABLA: google_calendar_tokens
-- Descripción: Almacena tokens de OAuth2 para sincronización con Google Calendar
-- ============================================

-- Crear la tabla google_calendar_tokens
CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  calendar_id TEXT, -- ID del calendario "Studianta - Academia" en Google Calendar
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id) -- Un usuario solo puede tener un token
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios tokens
CREATE POLICY "Users can view own google calendar tokens"
  ON public.google_calendar_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propios tokens
CREATE POLICY "Users can insert own google calendar tokens"
  ON public.google_calendar_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propios tokens
CREATE POLICY "Users can update own google calendar tokens"
  ON public.google_calendar_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propios tokens
CREATE POLICY "Users can delete own google calendar tokens"
  ON public.google_calendar_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER set_updated_at_google_calendar_tokens
  BEFORE UPDATE ON public.google_calendar_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Índice para mejorar performance
CREATE INDEX IF NOT EXISTS google_calendar_tokens_user_id_idx ON public.google_calendar_tokens(user_id);

