-- ============================================
-- ACTUALIZAR ESENCIA INICIAL A 0
-- Descripción: Cambia la esencia inicial de 500 a 0 para nuevos usuarios
-- ============================================

-- Actualizar el valor por defecto de essence en la tabla profiles
ALTER TABLE public.profiles 
ALTER COLUMN essence SET DEFAULT 0;

-- Actualizar la función handle_new_user para usar 0 en lugar de 500
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, tier, essence, total_essence_earned, arcane_level)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'Free',
    0,
    0,
    'Buscadora de Luz'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

