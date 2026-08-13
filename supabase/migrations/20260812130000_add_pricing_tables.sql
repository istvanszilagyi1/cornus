CREATE TABLE IF NOT EXISTS public.pricing_settings (
  id text PRIMARY KEY DEFAULT 'default',
  adult_price integer NOT NULL DEFAULT 25000,
  child_price integer NOT NULL DEFAULT 12500,
  toddler_price integer NOT NULL DEFAULT 0,
  dog_price integer NOT NULL DEFAULT 7000,
  ifa_per_adult integer NOT NULL DEFAULT 750,
  min_nights_default integer NOT NULL DEFAULT 2,
  single_night_surcharge_percent integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

GRANT SELECT ON public.pricing_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pricing_settings TO authenticated;
GRANT ALL ON public.pricing_settings TO service_role;

GRANT SELECT ON public.pricing_special_periods TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pricing_special_periods TO authenticated;
GRANT ALL ON public.pricing_special_periods TO service_role;

ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_special_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing settings are public read" ON public.pricing_settings
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admins manage pricing settings" ON public.pricing_settings
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "pricing special periods are public read" ON public.pricing_special_periods
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admins manage special pricing periods" ON public.pricing_special_periods
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER pricing_settings_updated_at
BEFORE UPDATE ON public.pricing_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
  single_night_surcharge_percent
)
VALUES (
  'default',
  25000,
  12500,
  0,
  7000,
  750,
  2,
  50
)
ON CONFLICT (id) DO UPDATE SET
  adult_price = EXCLUDED.adult_price,
  child_price = EXCLUDED.child_price,
  toddler_price = EXCLUDED.toddler_price,
  dog_price = EXCLUDED.dog_price,
  ifa_per_adult = EXCLUDED.ifa_per_adult,
  min_nights_default = EXCLUDED.min_nights_default,
  single_night_surcharge_percent = EXCLUDED.single_night_surcharge_percent,
  updated_at = now();

INSERT INTO public.pricing_special_periods (name, start_date, end_date, min_nights, adult_price, child_price, is_active)
VALUES
  ('Október 23–25.', '2026-10-23', '2026-10-25', 2, 30000, 15000, true),
  ('Őszi szünet', '2026-10-26', '2026-11-01', 3, 30000, 15000, true),
  ('Karácsony', '2026-12-24', '2026-12-27', 3, 30000, 15000, true),
  ('Szilveszter', '2026-12-31', '2027-01-02', 2, 30000, 15000, true)
ON CONFLICT DO NOTHING;
