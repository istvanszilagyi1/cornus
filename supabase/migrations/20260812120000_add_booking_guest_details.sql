ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS adults integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS children integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS children_ages integer[] NOT NULL DEFAULT '{}'::integer[],
  ADD COLUMN IF NOT EXISTS dogs integer NOT NULL DEFAULT 0;

UPDATE public.bookings
SET
  adults = CASE WHEN adults IS NULL THEN GREATEST(1, COALESCE(guests, 2)) ELSE adults END,
  children = CASE WHEN children IS NULL THEN 0 ELSE children END,
  dogs = CASE WHEN dogs IS NULL THEN 0 ELSE dogs END,
  children_ages = CASE WHEN children_ages IS NULL THEN '{}'::integer[] ELSE children_ages END
WHERE adults IS NULL OR children IS NULL OR dogs IS NULL OR children_ages IS NULL;

DROP POLICY IF EXISTS "anyone can request a booking" ON public.bookings;
CREATE POLICY "anyone can request a booking" ON public.bookings
FOR INSERT TO anon, authenticated
WITH CHECK (
  check_out > check_in
  AND guests > 0
  AND adults > 0
  AND adults <= 8
  AND children >= 0
  AND dogs >= 0
  AND dogs <= 1
  AND adults + children <= 8
);
