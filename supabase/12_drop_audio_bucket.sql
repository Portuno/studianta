-- =====================================================
-- ELIMINACIÓN DEL BUCKET DE AUDIO AMBIENTE
-- =====================================================
-- 
-- Este script elimina completamente el bucket "ambient-sounds"
-- y todas sus políticas asociadas.
--
-- ⚠️ ADVERTENCIA: Esta operación es IRREVERSIBLE.
-- Todos los archivos MP3 almacenados en el bucket serán eliminados.
-- =====================================================

-- =====================================================
-- PASO 1: Eliminar todas las políticas del bucket
-- =====================================================
-- Primero eliminamos las políticas para evitar conflictos

DROP POLICY IF EXISTS "Public Read Access for Ambient Sounds" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Read Access for Ambient Sounds" ON storage.objects;

-- =====================================================
-- PASO 2: Eliminar todos los objetos del bucket
-- =====================================================
-- Eliminar todos los archivos dentro del bucket
-- Nota: Esto se hace automáticamente al eliminar el bucket,
-- pero puedes ejecutarlo manualmente si prefieres hacerlo paso a paso

-- DELETE FROM storage.objects WHERE bucket_id = 'ambient-sounds';

-- =====================================================
-- PASO 3: Eliminar el bucket
-- =====================================================
-- Eliminar el bucket de la tabla storage.buckets

DELETE FROM storage.buckets WHERE id = 'ambient-sounds';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Para verificar que el bucket fue eliminado:
-- SELECT * FROM storage.buckets WHERE id = 'ambient-sounds';
-- (No debería retornar ningún resultado)

-- =====================================================
-- NOTAS
-- =====================================================
-- 1. Si el bucket no existe, los comandos DROP POLICY y DELETE
--    simplemente no harán nada (no generarán errores).
--
-- 2. Si tienes archivos importantes en el bucket, asegúrate de
--    hacer una copia de seguridad antes de ejecutar este script.
--
-- 3. Después de ejecutar este script, también deberías:
--    - Eliminar el componente SoundChanneler.tsx (si existe)
--    - Eliminar cualquier referencia a audio en FocusModule.tsx
--    - Eliminar el archivo supabase/10_audio_storage_setup.md (opcional)
--    - Eliminar el archivo supabase/11_audio_storage_policies.sql (opcional)
-- =====================================================

