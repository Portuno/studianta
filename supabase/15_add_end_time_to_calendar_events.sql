-- ============================================
-- AGREGAR CAMPO end_time A calendar_events
-- Descripción: Agrega el campo end_time para permitir especificar hora de finalización de eventos
-- ============================================

-- Agregar columna end_time a la tabla calendar_events
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Comentario en la columna
COMMENT ON COLUMN public.calendar_events.end_time IS 'Hora de finalización del evento (opcional)';

