-- ============================================
-- TABLA: profiles
-- Descripción: Perfiles de usuario con información académica y gamificación
-- ============================================

-- Crear la tabla profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  career TEXT,
  institution TEXT,
  avatar_url TEXT,
  tier TEXT DEFAULT 'Free' NOT NULL CHECK (tier IN ('Free', 'Premium')),
  arcane_level TEXT DEFAULT 'Buscadora de Luz',
  essence INTEGER DEFAULT 500 NOT NULL,
  total_essence_earned INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política: Los usuarios solo pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política: Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Función para calcular el nivel arcano basado en total_essence_earned
CREATE OR REPLACE FUNCTION public.calculate_arcane_level(total_essence INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF total_essence < 100 THEN
    RETURN 'Buscadora de Luz';
  ELSIF total_essence < 300 THEN
    RETURN 'Aprendiz de la Logia';
  ELSIF total_essence < 600 THEN
    RETURN 'Alquimista Clínica';
  ELSIF total_essence < 1000 THEN
    RETURN 'Maestra de la Transmutación';
  ELSIF total_essence < 2000 THEN
    RETURN 'Archimaga del Conocimiento';
  ELSIF total_essence < 5000 THEN
    RETURN 'Gran Alquimista';
  ELSE
    RETURN 'Arquitecta del Saber Eterno';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar arcane_level cuando cambia total_essence_earned
CREATE OR REPLACE FUNCTION public.update_arcane_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.arcane_level = public.calculate_arcane_level(NEW.total_essence_earned);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_arcane_level
  BEFORE INSERT OR UPDATE OF total_essence_earned ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_arcane_level();

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, tier, essence, total_essence_earned, arcane_level)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'Free',
    500,
    0,
    'Buscadora de Luz'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil cuando se crea un usuario en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_arcane_level_idx ON public.profiles(arcane_level);
CREATE INDEX IF NOT EXISTS profiles_tier_idx ON public.profiles(tier);
