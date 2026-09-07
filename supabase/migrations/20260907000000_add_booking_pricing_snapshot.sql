ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS total integer,
  ADD COLUMN IF NOT EXISTS deposit integer,
  ADD COLUMN IF NOT EXISTS nights integer,
  ADD COLUMN IF NOT EXISTS adult_guests integer,
  ADD COLUMN IF NOT EXISTS child_guests integer,
  ADD COLUMN IF NOT EXISTS toddler_guests integer,
  ADD COLUMN IF NOT EXISTS room_subtotal integer,
  ADD COLUMN IF NOT EXISTS ifa_subtotal integer,
  ADD COLUMN IF NOT EXISTS dog_subtotal integer,
  ADD COLUMN IF NOT EXISTS single_night_surcharge integer,
  ADD COLUMN IF NOT EXISTS nightly_adult_rate integer,
  ADD COLUMN IF NOT EXISTS nightly_child_rate integer;