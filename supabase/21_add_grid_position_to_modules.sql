-- ============================================
-- MIGRACIÓN: Agregar grid_position a user_modules
-- Descripción: Permite guardar la posición de cada módulo en el grid del átanor
-- ============================================

-- Agregar columna grid_position (JSONB para almacenar {row: number, col: number})
ALTER TABLE public.user_modules
ADD COLUMN IF NOT EXISTS grid_position JSONB;

-- Crear índice para mejorar búsquedas por posición
CREATE INDEX IF NOT EXISTS user_modules_grid_position_idx ON public.user_modules USING GIN (grid_position);

-- Comentario en la columna
COMMENT ON COLUMN public.user_modules.grid_position IS 'Posición del módulo en el grid del átanor: {row: number, col: number}';
