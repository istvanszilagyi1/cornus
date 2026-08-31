BEGIN;

CREATE TABLE IF NOT EXISTS public.pricing_settings (
  id text PRIMARY KEY DEFAULT 'default',
  adult_price integer NOT NULL DEFAULT 25000,
  child_price integer NOT NULL DEFAULT 12500,
  toddler_price integer NOT NULL DEFAULT 0,
  dog_price integer NOT NULL DEFAULT 7000,
  ifa_per_adult integer NOT NULL DEFAULT 750,
  min_nights_default integer NOT NULL DEFAULT 2,
  single_night_surcharge_percent integer NOT NULL DEFAULT 50,
  booking_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_settings
  ADD COLUMN IF NOT EXISTS toddler_price integer,
  ADD COLUMN IF NOT EXISTS dog_price integer,
  ADD COLUMN IF NOT EXISTS ifa_per_adult integer,
  ADD COLUMN IF NOT EXISTS min_nights_default integer,
  ADD COLUMN IF NOT EXISTS single_night_surcharge_percent integer,
  ADD COLUMN IF NOT EXISTS booking_enabled boolean;

UPDATE public.pricing_settings
SET
  toddler_price = COALESCE(toddler_price, 0),
  dog_price = COALESCE(dog_price, 7000),
  ifa_per_adult = COALESCE(ifa_per_adult, 750),
  min_nights_default = COALESCE(min_nights_default, 2),
  single_night_surcharge_percent = COALESCE(single_night_surcharge_percent, 50),
  booking_enabled = COALESCE(booking_enabled, true)
WHERE id = 'default';

ALTER TABLE public.pricing_settings
  ALTER COLUMN toddler_price SET DEFAULT 0,
  ALTER COLUMN dog_price SET DEFAULT 7000,
  ALTER COLUMN ifa_per_adult SET DEFAULT 750,
  ALTER COLUMN min_nights_default SET DEFAULT 2,
  ALTER COLUMN single_night_surcharge_percent SET DEFAULT 50,
  ALTER COLUMN booking_enabled SET DEFAULT true;

ALTER TABLE public.pricing_settings
  ALTER COLUMN toddler_price SET NOT NULL,
  ALTER COLUMN dog_price SET NOT NULL,
  ALTER COLUMN ifa_per_adult SET NOT NULL,
  ALTER COLUMN min_nights_default SET NOT NULL,
  ALTER COLUMN single_night_surcharge_percent SET NOT NULL,
  ALTER COLUMN booking_enabled SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.pricing_special_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  min_nights integer NOT NULL DEFAULT 2,
  adult_price integer NOT NULL DEFAULT 30000,
  child_price integer NOT NULL DEFAULT 15000,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_special_periods
  ADD COLUMN IF NOT EXISTS min_nights integer,
  ADD COLUMN IF NOT EXISTS adult_price integer,
  ADD COLUMN IF NOT EXISTS child_price integer,
  ADD COLUMN IF NOT EXISTS is_active boolean;

UPDATE public.pricing_special_periods
SET
  min_nights = COALESCE(min_nights, 2),
  adult_price = COALESCE(adult_price, 30000),
  child_price = COALESCE(child_price, 15000),
  is_active = COALESCE(is_active, true)
WHERE min_nights IS NULL OR adult_price IS NULL OR child_price IS NULL OR is_active IS NULL;

ALTER TABLE public.pricing_special_periods
  ALTER COLUMN min_nights SET DEFAULT 2,
  ALTER COLUMN adult_price SET DEFAULT 30000,
  ALTER COLUMN child_price SET DEFAULT 15000,
  ALTER COLUMN is_active SET DEFAULT true;

ALTER TABLE public.pricing_special_periods
  ALTER COLUMN min_nights SET NOT NULL,
  ALTER COLUMN adult_price SET NOT NULL,
  ALTER COLUMN child_price SET NOT NULL,
  ALTER COLUMN is_active SET NOT NULL;

GRANT SELECT ON public.pricing_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pricing_settings TO authenticated;
GRANT ALL ON public.pricing_settings TO service_role;

GRANT SELECT ON public.pricing_special_periods TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pricing_special_periods TO authenticated;
GRANT ALL ON public.pricing_special_periods TO service_role;

ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_special_periods ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pricing_settings'
      AND policyname = 'pricing settings are public read'
  ) THEN
    CREATE POLICY "pricing settings are public read"
      ON public.pricing_settings
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pricing_settings'
      AND policyname = 'admins manage pricing settings'
  ) THEN
    CREATE POLICY "admins manage pricing settings"
      ON public.pricing_settings
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pricing_special_periods'
      AND policyname = 'pricing special periods are public read'
  ) THEN
    CREATE POLICY "pricing special periods are public read"
      ON public.pricing_special_periods
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pricing_special_periods'
      AND policyname = 'admins manage special pricing periods'
  ) THEN
    CREATE POLICY "admins manage special pricing periods"
      ON public.pricing_special_periods
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS pricing_settings_updated_at ON public.pricing_settings;
CREATE TRIGGER pricing_settings_updated_at
BEFORE UPDATE ON public.pricing_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS pricing_special_periods_updated_at ON public.pricing_special_periods;
CREATE TRIGGER pricing_special_periods_updated_at
BEFORE UPDATE ON public.pricing_special_periods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.pricing_settings (
  id,
  adult_price,
  child_price,
  toddler_price,
  dog_price,
  ifa_per_adult,
  min_nights_default,
  single_night_surcharge_percent,
  booking_enabled
)
VALUES (
  'default',
  25000,
  12500,
  0,
  7000,
  750,
  2,
  50,
  true
)
ON CONFLICT (id) DO UPDATE SET
  adult_price = EXCLUDED.adult_price,
  child_price = EXCLUDED.child_price,
  toddler_price = EXCLUDED.toddler_price,
  dog_price = EXCLUDED.dog_price,
  ifa_per_adult = EXCLUDED.ifa_per_adult,
  min_nights_default = EXCLUDED.min_nights_default,
  single_night_surcharge_percent = EXCLUDED.single_night_surcharge_percent,
  booking_enabled = EXCLUDED.booking_enabled,
  updated_at = now();

INSERT INTO public.pricing_special_periods (name, start_date, end_date, min_nights, adult_price, child_price, is_active)
VALUES
  ('Október 23–25.', '2026-10-23', '2026-10-25', 2, 30000, 15000, true),
  ('Őszi szünet', '2026-10-26', '2026-11-01', 3, 30000, 15000, true),
  ('Karácsony', '2026-12-24', '2026-12-27', 3, 30000, 15000, true),
  ('Szilveszter', '2026-12-31', '2027-01-02', 2, 30000, 15000, true)
ON CONFLICT DO NOTHING;

COMMIT;
