-- Add onboarding and subscription fields to public.users
-- This migration is idempotent and safe to run multiple times

-- 1) Create enum type for subscription plans if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan_enum') THEN
    CREATE TYPE public.subscription_plan_enum AS ENUM ('free', 'basic', 'pro');
  END IF;
END
$$ LANGUAGE plpgsql;

-- 2) Add columns to public.users if they don't exist
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_onboarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_plan public.subscription_plan_enum NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS student_type text,
  ADD COLUMN IF NOT EXISTS primary_language text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS birth_time time;

-- 3) Ensure updated_at is kept in sync on updates
-- Create helper function if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'set_updated_at'
      AND n.nspname = 'public'
  ) THEN
    CREATE FUNCTION public.set_updated_at()
    RETURNS trigger AS $set_updated_at$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $set_updated_at$ LANGUAGE plpgsql;
  END IF;
END
$$ LANGUAGE plpgsql;

-- Create trigger if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_users_updated_at'
  ) THEN
    CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$$ LANGUAGE plpgsql;

-- 4) Optional: backfill null subscription_plan to 'free' and is_onboarded to false
UPDATE public.users SET subscription_plan = 'free'::public.subscription_plan_enum WHERE subscription_plan IS NULL;
UPDATE public.users SET is_onboarded = COALESCE(is_onboarded, false); 