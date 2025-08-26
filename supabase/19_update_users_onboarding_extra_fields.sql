-- Extra onboarding fields on public.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'education_level'
  ) THEN
    ALTER TABLE public.users ADD COLUMN education_level text;
  END IF;
END
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'country'
  ) THEN
    ALTER TABLE public.users ADD COLUMN country text;
  END IF;
END
$$ LANGUAGE plpgsql; 