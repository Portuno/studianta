-- ============================================
-- TABLA: user_modules
-- Descripción: Módulos desbloqueados/activados por cada usuario
-- ============================================

-- Crear la tabla user_modules
CREATE TABLE IF NOT EXISTS public.user_modules (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false NOT NULL,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (id, user_id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios módulos
CREATE POLICY "Users can view own modules"
  ON public.user_modules
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propios módulos
CREATE POLICY "Users can insert own modules"
  ON public.user_modules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propios módulos
CREATE POLICY "Users can update own modules"
  ON public.user_modules
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propios módulos
CREATE POLICY "Users can delete own modules"
  ON public.user_modules
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER set_updated_at_user_modules
  BEFORE UPDATE ON public.user_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS user_modules_user_id_idx ON public.user_modules(user_id);
CREATE INDEX IF NOT EXISTS user_modules_id_idx ON public.user_modules(id);
CREATE INDEX IF NOT EXISTS user_modules_is_active_idx ON public.user_modules(is_active);

