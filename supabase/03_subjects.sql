-- ============================================
-- TABLA: subjects
-- Descripción: Asignaturas/materias de cada usuario
-- ============================================

-- Crear la tabla subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  career TEXT,
  professor TEXT,
  email TEXT,
  phone TEXT,
  room TEXT,
  status TEXT DEFAULT 'Cursando' NOT NULL CHECK (status IN ('Cursando', 'Final Pendiente', 'Aprobada')),
  absences INTEGER DEFAULT 0 NOT NULL,
  max_absences INTEGER DEFAULT 20 NOT NULL,
  grade NUMERIC(5, 2),
  term_start DATE,
  term_end DATE,
  milestones JSONB DEFAULT '[]'::jsonb,
  schedules JSONB DEFAULT '[]'::jsonb,
  notes JSONB DEFAULT '[]'::jsonb,
  materials JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias asignaturas
CREATE POLICY "Users can view own subjects"
  ON public.subjects
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propias asignaturas
CREATE POLICY "Users can insert own subjects"
  ON public.subjects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias asignaturas
CREATE POLICY "Users can update own subjects"
  ON public.subjects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propias asignaturas
CREATE POLICY "Users can delete own subjects"
  ON public.subjects
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER set_updated_at_subjects
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS subjects_user_id_idx ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS subjects_status_idx ON public.subjects(status);
CREATE INDEX IF NOT EXISTS subjects_created_at_idx ON public.subjects(created_at);

