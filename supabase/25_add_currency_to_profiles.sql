-- ============================================
-- AGREGAR CAMPO CURRENCY A PROFILES
-- Descripción: Permite a los usuarios seleccionar su moneda preferida
-- ============================================

-- Agregar columna currency a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR' NOT NULL;

-- Comentario en la columna
COMMENT ON COLUMN public.profiles.currency IS 'Código de moneda ISO 4217 (EUR, USD, ARS, etc.)';

-- Actualizar perfiles existentes para que tengan EUR por defecto si no tienen valor
UPDATE public.profiles
SET currency = 'EUR'
WHERE currency IS NULL OR currency = '';
