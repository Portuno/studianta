-- ============================================
-- TABLA: calendar_events
-- Descripción: Eventos personalizados del calendario de cada usuario
-- ============================================

-- Crear la tabla calendar_events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  color TEXT DEFAULT '#E35B8F' NOT NULL,
  priority TEXT DEFAULT 'low' NOT NULL CHECK (priority IN ('low', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios eventos
CREATE POLICY "Users can view own calendar events"
  ON public.calendar_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propios eventos
CREATE POLICY "Users can insert own calendar events"
  ON public.calendar_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propios eventos
CREATE POLICY "Users can update own calendar events"
  ON public.calendar_events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propios eventos
CREATE POLICY "Users can delete own calendar events"
  ON public.calendar_events
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER set_updated_at_calendar_events
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS calendar_events_user_id_idx ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS calendar_events_date_idx ON public.calendar_events(date);
CREATE INDEX IF NOT EXISTS calendar_events_priority_idx ON public.calendar_events(priority);

