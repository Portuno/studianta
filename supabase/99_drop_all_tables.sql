-- ============================================
-- STUDIANTA - Script para Eliminar TODAS las Tablas
-- ============================================
-- ⚠️ ADVERTENCIA: Este script eliminará TODAS las tablas y datos
-- Ejecuta esto SOLO si quieres empezar desde cero
-- ============================================

-- Deshabilitar RLS temporalmente para evitar problemas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Eliminar todas las políticas primero
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Eliminar todos los triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name, event_object_table, event_object_schema
        FROM information_schema.triggers
        WHERE event_object_schema = 'public'
        AND trigger_name NOT LIKE 'pg_%'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE',
            r.trigger_name, r.event_object_schema, r.event_object_table);
    END LOOP;
END $$;

-- Eliminar todas las funciones
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT routine_name, routine_schema
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
    ) LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I CASCADE',
            r.routine_schema, r.routine_name);
    END LOOP;
END $$;

-- Eliminar todas las tablas (en orden para evitar problemas de foreign keys)
-- Usando CASCADE para eliminar dependencias automáticamente
DROP TABLE IF EXISTS resource_ratings CASCADE;
DROP TABLE IF EXISTS community_resources CASCADE;
DROP TABLE IF EXISTS mentorship_sessions CASCADE;
DROP TABLE IF EXISTS mentorship_relationships CASCADE;
DROP TABLE IF EXISTS grimorio_snapshots CASCADE;
DROP TABLE IF EXISTS community_messages CASCADE;
DROP TABLE IF EXISTS community_channels CASCADE;
DROP TABLE IF EXISTS community_memberships CASCADE;
DROP TABLE IF EXISTS communities CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS budget_categories CASCADE;
DROP TABLE IF EXISTS budget_plans CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS study_materials CASCADE;
DROP TABLE IF EXISTS subject_notes CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_modules CASCADE;
DROP TABLE IF EXISTS security_config CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Eliminar tipos ENUM si existen (opcional)
-- DROP TYPE IF EXISTS mood_type CASCADE;
-- DROP TYPE IF EXISTS subject_status CASCADE;
-- etc.

-- Verificar que todas las tablas fueron eliminadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Tablas restantes en schema public: %', table_count;
    
    IF table_count > 0 THEN
        RAISE NOTICE 'Tablas que aún existen:';
        FOR r IN (
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
        ) LOOP
            RAISE NOTICE '  - %', r.table_name;
        END LOOP;
    ELSE
        RAISE NOTICE '✓ Todas las tablas fueron eliminadas correctamente';
    END IF;
END $$;

-- Limpiar extensiones si no las necesitas (opcional)
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
-- DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;

