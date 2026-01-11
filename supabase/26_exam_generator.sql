-- ============================================
-- GENERADOR DE EXÁMENES
-- Descripción: Sistema completo para generar y gestionar exámenes con IA
-- ============================================

-- ============================================
-- TABLA: exams
-- Descripción: Exámenes generados por los usuarios
-- ============================================

CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('multiple-choice', 'true-false', 'open-ended', 'cloze', 'case-study')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
  question_count INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('real', 'guided')),
  material_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Comentarios
COMMENT ON TABLE public.exams IS 'Exámenes generados por los usuarios';
COMMENT ON COLUMN public.exams.exam_type IS 'Tipo de examen: multiple-choice, true-false, open-ended, cloze, case-study';
COMMENT ON COLUMN public.exams.difficulty IS 'Dificultad: easy, medium, hard, mixed';
COMMENT ON COLUMN public.exams.mode IS 'Modo: real (sin feedback) o guided (con feedback)';
COMMENT ON COLUMN public.exams.material_ids IS 'Array de IDs de materiales usados para generar el examen';

-- ============================================
-- TABLA: exam_questions
-- Descripción: Preguntas de cada examen
-- ============================================

CREATE TABLE IF NOT EXISTS public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple-choice', 'true-false', 'open-ended', 'cloze', 'case-study')),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  rationale TEXT,
  source_material TEXT,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('easy', 'intermediate', 'hard')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Comentarios
COMMENT ON TABLE public.exam_questions IS 'Preguntas individuales de cada examen';
COMMENT ON COLUMN public.exam_questions.options IS 'Opciones de respuesta (JSONB array para multiple-choice, null para otros tipos)';
COMMENT ON COLUMN public.exam_questions.correct_answer IS 'Respuesta correcta (índice para multiple-choice, texto para otros)';
COMMENT ON COLUMN public.exam_questions.explanation IS 'Explicación pedagógica de la respuesta correcta';
COMMENT ON COLUMN public.exam_questions.rationale IS 'Razonamiento detrás de la respuesta correcta';
COMMENT ON COLUMN public.exam_questions.source_material IS 'Nombre del material de donde se extrajo la información';

-- ============================================
-- TABLA: exam_responses
-- Descripción: Respuestas del usuario a cada pregunta
-- ============================================

CREATE TABLE IF NOT EXISTS public.exam_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Comentarios
COMMENT ON TABLE public.exam_responses IS 'Respuestas del usuario a las preguntas del examen';
COMMENT ON COLUMN public.exam_responses.user_answer IS 'Respuesta proporcionada por el usuario';
COMMENT ON COLUMN public.exam_responses.time_spent_seconds IS 'Tiempo en segundos que el usuario tardó en responder';

-- ============================================
-- TABLA: exam_results
-- Descripción: Resultados finales de cada examen
-- ============================================

CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE UNIQUE,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  score_percentage NUMERIC(5, 2) NOT NULL,
  time_spent_total INTEGER NOT NULL,
  mastery_level TEXT NOT NULL CHECK (mastery_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Comentarios
COMMENT ON TABLE public.exam_results IS 'Resultados finales de cada examen completado';
COMMENT ON COLUMN public.exam_results.mastery_level IS 'Nivel de dominio: beginner, intermediate, advanced, expert';

-- ============================================
-- TABLA: exam_flashcards
-- Descripción: Flashcards generadas de preguntas fallidas
-- ============================================

CREATE TABLE IF NOT EXISTS public.exam_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  reviewed_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Comentarios
COMMENT ON TABLE public.exam_flashcards IS 'Flashcards generadas automáticamente de preguntas fallidas';
COMMENT ON COLUMN public.exam_flashcards.front_text IS 'Texto frontal de la tarjeta (pregunta)';
COMMENT ON COLUMN public.exam_flashcards.back_text IS 'Texto trasero de la tarjeta (respuesta y explicación)';

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_exams_user_id ON public.exams(user_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject_id ON public.exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON public.exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_responses_exam_id ON public.exam_responses(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_responses_question_id ON public.exam_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON public.exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_flashcards_exam_id ON public.exam_flashcards(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_flashcards_question_id ON public.exam_flashcards(question_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para actualizar updated_at en exams
CREATE TRIGGER set_updated_at_exams
  BEFORE UPDATE ON public.exams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_flashcards ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS: exams
-- ============================================

-- SELECT: Usuarios pueden ver sus propios exámenes
CREATE POLICY "Users can view own exams"
  ON public.exams
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Usuarios pueden crear sus propios exámenes
CREATE POLICY "Users can insert own exams"
  ON public.exams
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuarios pueden actualizar sus propios exámenes
CREATE POLICY "Users can update own exams"
  ON public.exams
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuarios pueden eliminar sus propios exámenes
CREATE POLICY "Users can delete own exams"
  ON public.exams
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS: exam_questions
-- ============================================

-- SELECT: Usuarios pueden ver preguntas de sus exámenes
CREATE POLICY "Users can view own exam questions"
  ON public.exam_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_questions.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- INSERT: Usuarios pueden crear preguntas en sus exámenes
CREATE POLICY "Users can insert own exam questions"
  ON public.exam_questions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_questions.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- UPDATE: Usuarios pueden actualizar preguntas de sus exámenes
CREATE POLICY "Users can update own exam questions"
  ON public.exam_questions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_questions.exam_id
      AND exams.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_questions.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- DELETE: Usuarios pueden eliminar preguntas de sus exámenes
CREATE POLICY "Users can delete own exam questions"
  ON public.exam_questions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_questions.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS: exam_responses
-- ============================================

-- SELECT: Usuarios pueden ver respuestas de sus exámenes
CREATE POLICY "Users can view own exam responses"
  ON public.exam_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_responses.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- INSERT: Usuarios pueden crear respuestas en sus exámenes
CREATE POLICY "Users can insert own exam responses"
  ON public.exam_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_responses.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- UPDATE: Usuarios pueden actualizar respuestas de sus exámenes
CREATE POLICY "Users can update own exam responses"
  ON public.exam_responses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_responses.exam_id
      AND exams.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_responses.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- DELETE: Usuarios pueden eliminar respuestas de sus exámenes
CREATE POLICY "Users can delete own exam responses"
  ON public.exam_responses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_responses.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS: exam_results
-- ============================================

-- SELECT: Usuarios pueden ver resultados de sus exámenes
CREATE POLICY "Users can view own exam results"
  ON public.exam_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_results.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- INSERT: Usuarios pueden crear resultados de sus exámenes
CREATE POLICY "Users can insert own exam results"
  ON public.exam_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_results.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- UPDATE: Usuarios pueden actualizar resultados de sus exámenes
CREATE POLICY "Users can update own exam results"
  ON public.exam_results
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_results.exam_id
      AND exams.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_results.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- DELETE: Usuarios pueden eliminar resultados de sus exámenes
CREATE POLICY "Users can delete own exam results"
  ON public.exam_results
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_results.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS: exam_flashcards
-- ============================================

-- SELECT: Usuarios pueden ver flashcards de sus exámenes
CREATE POLICY "Users can view own exam flashcards"
  ON public.exam_flashcards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_flashcards.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- INSERT: Usuarios pueden crear flashcards de sus exámenes
CREATE POLICY "Users can insert own exam flashcards"
  ON public.exam_flashcards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_flashcards.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- UPDATE: Usuarios pueden actualizar flashcards de sus exámenes
CREATE POLICY "Users can update own exam flashcards"
  ON public.exam_flashcards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_flashcards.exam_id
      AND exams.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_flashcards.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- DELETE: Usuarios pueden eliminar flashcards de sus exámenes
CREATE POLICY "Users can delete own exam flashcards"
  ON public.exam_flashcards
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_flashcards.exam_id
      AND exams.user_id = auth.uid()
    )
  );
