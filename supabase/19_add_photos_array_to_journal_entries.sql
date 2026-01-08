-- ============================================
-- MIGRACIÓN: Agregar campo photos a journal_entries
-- Descripción: Agrega el campo photos como array de TEXT para soportar múltiples fotos por entrada
-- ============================================

-- Agregar el campo photos como array de texto
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS photos TEXT[];

-- Comentario para documentar el campo
COMMENT ON COLUMN public.journal_entries.photos IS 'Array de URLs de fotos almacenadas en el bucket journal-photos';

