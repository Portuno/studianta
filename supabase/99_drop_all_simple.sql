-- ============================================
-- STUDIANTA - Eliminación Simple de TODAS las Tablas
-- ============================================
-- ⚠️ ADVERTENCIA: Esto eliminará TODO
-- Versión más simple y rápida
-- ============================================

-- Eliminar todas las tablas de una vez usando CASCADE
-- Esto eliminará automáticamente todas las dependencias (foreign keys, etc.)

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Eliminar todas las tablas
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', r.tablename);
        RAISE NOTICE 'Eliminada tabla: %', r.tablename;
    END LOOP;
    
    -- Eliminar todas las funciones
    FOR r IN (
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
    ) LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I CASCADE', r.routine_name);
        RAISE NOTICE 'Eliminada función: %', r.routine_name;
    END LOOP;
    
    RAISE NOTICE '✓ Limpieza completada';
END $$;

-- Verificar resultado
SELECT 
    COUNT(*) as tablas_restantes
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';

