-- ============================================
-- STORAGE: Bucket para materiales de estudio
-- Descripción: Configuración del bucket de almacenamiento para PDFs y documentos de estudio
-- ============================================

-- Crear el bucket 'study-materials' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can upload own study materials" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own study materials" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own study materials" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own study materials" ON storage.objects;

-- Política: Los usuarios pueden subir sus propios materiales de estudio
CREATE POLICY "Users can upload own study materials"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'study-materials' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política: Los usuarios pueden ver sus propios materiales de estudio
CREATE POLICY "Users can view own study materials"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'study-materials' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política: Los usuarios pueden actualizar sus propios materiales de estudio
CREATE POLICY "Users can update own study materials"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'study-materials' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'study-materials' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política: Los usuarios pueden eliminar sus propios materiales de estudio
CREATE POLICY "Users can delete own study materials"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'study-materials' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
