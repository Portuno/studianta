-- ============================================
-- AGREGAR CAMPOS PARA ONBOARDING COMPLETO
-- Descripción: Agrega campos para almacenar información del onboarding
-- ============================================

-- Agregar columna academic_stage para la etapa académica
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS academic_stage TEXT;

-- Agregar columna interests para áreas de interés (array de texto)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- Agregar columna referral_source para cómo nos conoció
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_source TEXT;

