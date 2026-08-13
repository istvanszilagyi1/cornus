CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  path text,
  title text,
  referrer text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics are public read" ON public.analytics_events
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "analytics are insertable by public" ON public.analytics_events
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx
  ON public.analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_type_idx
  ON public.analytics_events (type);
