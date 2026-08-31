import { differenceInCalendarDays, eachDayOfInterval } from "date-fns";
import type { DateRange } from "react-day-picker";

export type PricingSettings = {
  id?: string;
  adult_price: number;
  child_price: number;
  toddler_price: number;
  dog_price: number;
  ifa_per_adult: number;
  min_nights_default: number;
  single_night_surcharge_percent: number;
  booking_enabled: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PricingSpecialPeriod = {
  id?: string;
  name: string;
  start_date: string;
  end_date: string;
  min_nights: number;
  adult_price: number;
  child_price: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type BookingPricingSummary = {
  nights: number;
  isPeakPeriod: boolean;
  activePeriodName?: string;
  minNightsRequired: number;
  roomSubtotal: number;
  singleNightSurcharge: number;
  ifaSubtotal: number;
  dogSubtotal: number;
  total: number;
  deposit: number;
  adultGuests: number;
  childGuests: number;
  toddlerGuests: number;
  nightlyAdultRate: number;
  nightlyChildRate: number;
};

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  adult_price: 20000,
  child_price: 10000,
  toddler_price: 0,
  dog_price: 7000,
  ifa_per_adult: 750,
  min_nights_default: 2,
  single_night_surcharge_percent: 50,
  booking_enabled: true,
};

export const DEFAULT_SPECIAL_PERIODS: PricingSpecialPeriod[] = [
  {
    id: "default-oct-23-25",
    name: "Október 23–25.",
    start_date: "2026-10-23",
    end_date: "2026-10-25",
    min_nights: 2,
    adult_price: 30000,
    child_price: 20000,
    is_active: true,
  },
  {
    id: "default-oct-26-nov-1",
    name: "Őszi szünet",
    start_date: "2026-10-26",
    end_date: "2026-11-01",
    min_nights: 3,
    adult_price: 30000,
    child_price: 20000,
    is_active: true,
  },
  {
    id: "default-dec-24-27",
    name: "Karácsony",
    start_date: "2026-12-24",
    end_date: "2026-12-27",
    min_nights: 3,
    adult_price: 30000,
    child_price: 20000,
    is_active: true,
  },
  {
    id: "default-dec-31-jan-2",
    name: "Szilveszter",
    start_date: "2026-12-31",
    end_date: "2027-01-02",
    min_nights: 2,
    adult_price: 30000,
    child_price: 20000,
    is_active: true,
  },
];

export function getRangeMinNights(
  range: DateRange | undefined,
  settings: PricingSettings,
  periods: PricingSpecialPeriod[],
) {
  if (!range?.from || !range?.to) return settings.min_nights_default;

  const selectedDays = eachDayOfInterval({ start: range.from, end: range.to });
  const periodMinimums = periods
    .filter((period) => period.is_active !== false)
    .filter((period) => {
      const start = new Date(`${period.start_date}T00:00:00`);
      const end = new Date(`${period.end_date}T23:59:59`);
      return selectedDays.some((day) => day >= start && day <= end);
    })
    .map((period) => period.min_nights);

  return periodMinimums.length ? Math.max(...periodMinimums) : settings.min_nights_default;
}

export function getApplicableSpecialPeriod(
  range: DateRange | undefined,
  periods: PricingSpecialPeriod[],
) {
  if (!range?.from || !range?.to) return undefined;

  const selectedDays = eachDayOfInterval({ start: range.from, end: range.to });
  return periods
    .filter((period) => period.is_active !== false)
    .find((period) => {
      const start = new Date(`${period.start_date}T00:00:00`);
      const end = new Date(`${period.end_date}T23:59:59`);
      return selectedDays.some((day) => day >= start && day <= end);
    });
}

export function estimateBookingRevenueFromBooking(
  booking: {
    check_in?: string;
    check_out?: string;
    adults?: number | null;
    children?: number | null;
    guests?: number | null;
    dogs?: number | null;
    status?: string | null;
  },
  settings: PricingSettings,
  periods: PricingSpecialPeriod[] = DEFAULT_SPECIAL_PERIODS,
) {
  if (!booking.check_in || !booking.check_out) return 0;

  const start = new Date(`${booking.check_in}T12:00:00`);
  const end = new Date(`${booking.check_out}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  const nights = Math.max(1, differenceInCalendarDays(end, start));
  const adultGuests = Math.max(Number(booking.adults ?? booking.guests ?? 1), 1);
  const childGuests = Math.max(
    Number(booking.children ?? Math.max(0, Number(booking.guests ?? adultGuests) - adultGuests)),
    0,
  );
  const applicablePeriod = getApplicableSpecialPeriod({ from: start, to: end }, periods);
  const nightlyAdultRate = applicablePeriod?.adult_price ?? settings.adult_price;
  const nightlyChildRate = applicablePeriod?.child_price ?? settings.child_price;

  const roomSubtotal = nights * (adultGuests * nightlyAdultRate + childGuests * nightlyChildRate);
  const ifaSubtotal = adultGuests * nights * settings.ifa_per_adult;
  const dogSubtotal = (booking.dogs ?? 0) * nights * settings.dog_price;
  const singleNightSurcharge =
    nights === 1 ? roomSubtotal * (settings.single_night_surcharge_percent / 100) : 0;

  return roomSubtotal + ifaSubtotal + dogSubtotal + singleNightSurcharge;
}

export function getBookingPricingSummary({
  range,
  adults,
  childAges,
  dogs,
  settings,
  periods,
}: {
  range: DateRange | undefined;
  adults: number;
  childAges: number[];
  dogs: number;
  settings: PricingSettings;
  periods: PricingSpecialPeriod[];
}): BookingPricingSummary {
  const nights = range?.from && range?.to ? differenceInCalendarDays(range.to, range.from) : 0;

  const adultGuests = adults + childAges.filter((age) => age >= 15).length;
  const childGuests = childAges.filter((age) => age >= 3 && age <= 14).length;
  const toddlerGuests = childAges.filter((age) => age >= 0 && age <= 2).length;
  const applicablePeriod = getApplicableSpecialPeriod(range, periods);
  const nightlyAdultRate = applicablePeriod?.adult_price ?? settings.adult_price;
  const nightlyChildRate = applicablePeriod?.child_price ?? settings.child_price;
  const roomSubtotal = nights * (adultGuests * nightlyAdultRate + childGuests * nightlyChildRate);
  const ifaSubtotal = adultGuests * nights * settings.ifa_per_adult;
  const dogSubtotal = dogs * nights * settings.dog_price;
  const singleNightSurcharge =
    nights === 1 ? roomSubtotal * (settings.single_night_surcharge_percent / 100) : 0;
  const total = roomSubtotal + ifaSubtotal + dogSubtotal + singleNightSurcharge;

  return {
    nights,
    isPeakPeriod: !!applicablePeriod,
    activePeriodName: applicablePeriod?.name,
    minNightsRequired: getRangeMinNights(range, settings, periods),
    roomSubtotal,
    singleNightSurcharge,
    ifaSubtotal,
    dogSubtotal,
    total,
    deposit: total * 0.5,
    adultGuests,
    childGuests,
    toddlerGuests,
    nightlyAdultRate,
    nightlyChildRate,
  };
}
