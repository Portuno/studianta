-- Add birth_city to public.users (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'birth_city'
  ) THEN
    ALTER TABLE public.users ADD COLUMN birth_city text;
  END IF;
END
$$ LANGUAGE plpgsql; 