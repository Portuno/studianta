-- =====================================================
-- CONFIGURACIÓN DE STORAGE PARA SONIDOS AMBIENTE
-- =====================================================
-- 
-- Este script:
-- 1. Crea el bucket "ambient-sounds" (si no existe)
-- 2. Configura las políticas RLS para acceso público
--
-- Pasos después de ejecutar este script:
-- 1. Subir los archivos MP3 organizados en carpetas:
--    - rain/
--    - monastic/
--    - fire/
-- 2. Actualizar las URLs en components/SoundChanneler.tsx
-- =====================================================

-- =====================================================
-- PASO 1: Crear el Bucket (si no existe)
-- =====================================================
-- Inserta el bucket en la tabla storage.buckets
-- Si ya existe, no hará nada (gracias al ON CONFLICT)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ambient-sounds',
  'ambient-sounds',
  true,  -- Bucket público para acceso directo a URLs
  10485760,  -- 10 MB en bytes (ajusta según necesites)
  ARRAY['audio/mpeg', 'audio/mp3']  -- Solo archivos MP3
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3'];

-- =====================================================
-- PASO 2: Eliminar políticas existentes (si las hay)
-- =====================================================
-- Esto evita duplicados si ejecutas el script varias veces

DROP POLICY IF EXISTS "Public Read Access for Ambient Sounds" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Read Access for Ambient Sounds" ON storage.objects;

-- =====================================================
-- POLÍTICA 1: Lectura Pública (SELECT)
-- =====================================================
-- Permite a cualquier usuario leer/descargar archivos del bucket
-- Esto es necesario para que las URLs públicas funcionen

CREATE POLICY "Public Read Access for Ambient Sounds"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'ambient-sounds'
);

-- =====================================================
-- POLÍTICA 2: Lectura para Usuarios Autenticados (Opcional)
-- =====================================================
-- Si prefieres que solo usuarios autenticados puedan leer,
-- descomenta esta política y comenta la anterior

-- CREATE POLICY "Authenticated Read Access for Ambient Sounds"
-- ON storage.objects
-- FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'ambient-sounds'
-- );

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Para verificar que las políticas se crearon correctamente:
-- SELECT * FROM storage.policies WHERE name LIKE '%ambient%';

-- =====================================================
-- NOTAS ADICIONALES
-- =====================================================
-- 1. El bucket debe crearse como "Public bucket" en el Dashboard
-- 2. Los archivos deben subirse con la estructura de carpetas:
--    ambient-sounds/
--    ├── rain/
--    │   ├── rain-ambient-01.mp3
--    │   ├── rain-ambient-02.mp3
--    │   └── rain-ambient-03.mp3
--    ├── monastic/
--    │   ├── monastic-ambient-01.mp3
--    │   ├── monastic-ambient-02.mp3
--    │   └── monastic-ambient-03.mp3
--    └── fire/
--        ├── fire-ambient-01.mp3
--        ├── fire-ambient-02.mp3
--        └── fire-ambient-03.mp3
--
-- 3. Formato de URL pública:
--    https://[PROJECT-REF].supabase.co/storage/v1/object/public/ambient-sounds/[categoria]/[archivo].mp3
--
-- 4. Para eliminar las políticas (si es necesario):
--    DROP POLICY IF EXISTS "Public Read Access for Ambient Sounds" ON storage.objects;
-- =====================================================

