import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_PRICING_SETTINGS,
  DEFAULT_SPECIAL_PERIODS,
  estimateBookingRevenueFromBooking,
  getApplicableSpecialPeriod,
} from "./pricing.ts";

test("booking is enabled by default and pricing rules stay intact", () => {
  assert.equal(DEFAULT_PRICING_SETTINGS.booking_enabled, true);
  assert.equal(DEFAULT_PRICING_SETTINGS.adult_price, 20000);
  assert.equal(DEFAULT_PRICING_SETTINGS.child_price, 10000);
  assert.equal(DEFAULT_PRICING_SETTINGS.dog_price, 7000);
  assert.equal(DEFAULT_PRICING_SETTINGS.ifa_per_adult, 750);
  assert.equal(DEFAULT_PRICING_SETTINGS.single_night_surcharge_percent, 50);

  const settings = {
    ...DEFAULT_PRICING_SETTINGS,
    adult_price: 20000,
    child_price: 10000,
    dog_price: 7000,
    ifa_per_adult: 750,
  };

  const total = estimateBookingRevenueFromBooking(
    {
      check_in: "2026-09-10",
      check_out: "2026-09-12",
      adults: 2,
      children: 1,
      guests: 3,
      dogs: 1,
      status: "confirmed",
    },
    settings,
    DEFAULT_SPECIAL_PERIODS,
  );

  assert.equal(total, 117000);

  const peakTotal = estimateBookingRevenueFromBooking(
    {
      check_in: "2026-10-23",
      check_out: "2026-10-25",
      adults: 2,
      children: 1,
      guests: 3,
      dogs: 0,
      status: "confirmed",
    },
    settings,
    DEFAULT_SPECIAL_PERIODS,
  );

  assert.equal(DEFAULT_SPECIAL_PERIODS[0].adult_price, 25000);
  assert.equal(DEFAULT_SPECIAL_PERIODS[0].child_price, 15000);
  assert.equal(peakTotal, 133000);
});

test("annual and single-repeat special periods match recurring dates", () => {
  const yearly = {
    id: "yearly-birthday",
    name: "Születésnap",
    start_date: "2026-10-23",
    end_date: "2026-10-25",
    min_nights: 2,
    adult_price: 25000,
    child_price: 15000,
    is_active: true,
    recurrence: "yearly" as const,
  };

  const singleRepeat = {
    ...yearly,
    id: "once-next-year",
    name: "Egyszer megismételt nyaralás",
    recurrence: "once" as const,
  };

  assert.equal(
    getApplicableSpecialPeriod(
      { from: new Date("2027-10-24T00:00:00"), to: new Date("2027-10-26T00:00:00") },
      [yearly],
    )?.name,
    "Születésnap",
  );

  assert.equal(
    getApplicableSpecialPeriod(
      { from: new Date("2027-10-24T00:00:00"), to: new Date("2027-10-26T00:00:00") },
      [singleRepeat],
    )?.name,
    "Egyszer megismételt nyaralás",
  );

  assert.equal(
    getApplicableSpecialPeriod(
      { from: new Date("2028-10-24T00:00:00"), to: new Date("2028-10-26T00:00:00") },
      [singleRepeat],
    ),
    undefined,
  );
});
