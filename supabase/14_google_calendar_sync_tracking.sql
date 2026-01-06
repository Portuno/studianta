-- ============================================
-- TABLA: google_calendar_sync_tracking
-- Descripción: Trackea qué eventos de Studianta están sincronizados con Google Calendar
-- ============================================

-- Crear la tabla google_calendar_sync_tracking
CREATE TABLE IF NOT EXISTS public.google_calendar_sync_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identificador del evento en Studianta
  studianta_event_type TEXT NOT NULL, -- 'milestone', 'custom_event'
  studianta_event_id TEXT NOT NULL, -- ID del milestone o custom_event
  
  -- Identificador del evento en Google Calendar
  google_calendar_event_id TEXT NOT NULL,
  
  -- Información del evento para matching
  event_date DATE NOT NULL,
  event_time TIME,
  event_title TEXT NOT NULL,
  
  -- Metadata
  last_synced_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraint: un evento de Studianta solo puede tener un evento de Google Calendar
  UNIQUE(user_id, studianta_event_type, studianta_event_id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.google_calendar_sync_tracking ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios tracking
CREATE POLICY "Users can view own sync tracking"
  ON public.google_calendar_sync_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propios tracking
CREATE POLICY "Users can insert own sync tracking"
  ON public.google_calendar_sync_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propios tracking
CREATE POLICY "Users can update own sync tracking"
  ON public.google_calendar_sync_tracking
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propios tracking
CREATE POLICY "Users can delete own sync tracking"
  ON public.google_calendar_sync_tracking
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER set_updated_at_google_calendar_sync_tracking
  BEFORE UPDATE ON public.google_calendar_sync_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS google_calendar_sync_tracking_user_id_idx 
  ON public.google_calendar_sync_tracking(user_id);
CREATE INDEX IF NOT EXISTS google_calendar_sync_tracking_studianta_event_idx 
  ON public.google_calendar_sync_tracking(user_id, studianta_event_type, studianta_event_id);
CREATE INDEX IF NOT EXISTS google_calendar_sync_tracking_google_event_id_idx 
  ON public.google_calendar_sync_tracking(google_calendar_event_id);

