-- ============================================
-- STORAGE: Bucket para fotos del diario
-- Descripción: Configuración del bucket de almacenamiento para fotos de entradas del diario
-- ============================================

-- Crear el bucket 'journal-photos' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-photos', 'journal-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can upload own journal photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own journal photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view journal photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own journal photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own journal photos" ON storage.objects;

-- Política: Los usuarios pueden subir sus propias fotos del diario
CREATE POLICY "Users can upload own journal photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'journal-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política: Permitir acceso público a las fotos del diario (bucket público)
CREATE POLICY "Public can view journal photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'journal-photos');

-- Política: Los usuarios pueden actualizar sus propias fotos del diario
CREATE POLICY "Users can update own journal photos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'journal-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'journal-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política: Los usuarios pueden eliminar sus propias fotos del diario
CREATE POLICY "Users can delete own journal photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'journal-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

