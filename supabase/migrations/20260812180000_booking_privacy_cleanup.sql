ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS personal_data_redacted_at timestamptz;

CREATE OR REPLACE FUNCTION public.get_booking_personal_data_retention_days()
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT 30;
$$;

CREATE OR REPLACE FUNCTION public.anonymize_expired_booking_personal_data()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  retention_days integer := public.get_booking_personal_data_retention_days();
  updated_rows integer;
BEGIN
  UPDATE public.bookings
  SET
    guest_name = 'Anonimizált vendég',
    email = 'deleted@privacy.local',
    phone = NULL,
    message = NULL,
    personal_data_redacted_at = COALESCE(personal_data_redacted_at, now())
  WHERE status IN ('confirmed', 'rejected')
    AND check_out < CURRENT_DATE - (retention_days || ' days')::interval
    AND personal_data_redacted_at IS NULL;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows;
END;
$$;

GRANT EXECUTE ON FUNCTION public.anonymize_expired_booking_personal_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.anonymize_expired_booking_personal_data() TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'booking-personal-data-cleanup',
  '0 3 * * *',
  $$SELECT public.anonymize_expired_booking_personal_data();$$
);

COMMENT ON FUNCTION public.anonymize_expired_booking_personal_data() IS
  'Anonimizálja a lezárt foglalások személyes adatait a megadott TTL után, miközben megőrzi a pénzügyi és naptáradatokat.';
