BEGIN;

ALTER TABLE public.pricing_special_periods
  ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'none';

UPDATE public.pricing_special_periods
SET recurrence = 'none'
WHERE recurrence IS NULL OR recurrence = '';

COMMIT;
