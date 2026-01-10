-- ============================================
-- ELIMINAR SISTEMA DE ESENCIA
-- Descripción: Elimina completamente el sistema de gamificación basado en esencia
-- ============================================

-- Eliminar trigger que actualiza arcane_level
DROP TRIGGER IF EXISTS set_arcane_level ON public.profiles;

-- Eliminar función que actualiza arcane_level
DROP FUNCTION IF EXISTS public.update_arcane_level();

-- Eliminar función que calcula el nivel arcano
DROP FUNCTION IF EXISTS public.calculate_arcane_level(INTEGER);

-- Eliminar índice relacionado con arcane_level
DROP INDEX IF EXISTS public.profiles_arcane_level_idx;

-- Eliminar columnas de esencia de la tabla profiles
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS essence,
DROP COLUMN IF EXISTS total_essence_earned,
DROP COLUMN IF EXISTS arcane_level;

-- Actualizar función handle_new_user para no incluir campos de esencia
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'Free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
