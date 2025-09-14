-- Add subscription-related fields to public.users
-- Tiers: free, basic, pro
-- Status: track paid subscription lifecycle; free users default to active

BEGIN;

-- Create enum for plan tier if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (  
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'plan_tier' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.plan_tier AS ENUM ('free', 'basic', 'pro');
  END IF;
END $$;

-- Add columns to users table (idempotent)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS plan_tier public.plan_tier NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_status text NOT NULL DEFAULT 'active' CHECK (plan_status IN (
    'inactive', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired'
  )),
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

-- Helpful indexes/uniqueness (avoid failing if duplicates exist already)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_users_stripe_customer_id'
  ) THEN
    CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);
  END IF;
END $$;

-- Uniqueness where applicable (safe-guarded)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_stripe_customer_id_unique'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_stripe_customer_id_unique UNIQUE (stripe_customer_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_stripe_subscription_id_unique'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_stripe_subscription_id_unique UNIQUE (stripe_subscription_id);
  END IF;
END $$;

COMMIT; 