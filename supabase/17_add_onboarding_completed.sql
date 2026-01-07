-- ============================================
-- AGREGAR CAMPO ONBOARDING_COMPLETED
-- Descripción: Agrega campo para rastrear si el usuario completó el onboarding
-- ============================================

-- Agregar columna onboarding_completed a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL;

-- Actualizar la función handle_new_user para incluir onboarding_completed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, tier, essence, total_essence_earned, arcane_level, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'Free',
    0,
    0,
    'Buscadora de Luz',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

