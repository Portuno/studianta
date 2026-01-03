-- ============================================
-- MIGRACIÓN: Agregar campo 'aula' a subjects
-- Descripción: Agrega el campo aula para registrar el aula donde está cursando
-- ============================================

-- Agregar columna 'aula' si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subjects' 
    AND column_name = 'aula'
  ) THEN
    ALTER TABLE public.subjects ADD COLUMN aula TEXT;
  END IF;
END $$;

