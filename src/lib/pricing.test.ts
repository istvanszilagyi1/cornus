import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_PRICING_SETTINGS, DEFAULT_SPECIAL_PERIODS, estimateBookingRevenueFromBooking } from "./pricing.ts";

test("estimateBookingRevenueFromBooking matches the actual nightly pricing rules", () => {
  const settings = {
    ...DEFAULT_PRICING_SETTINGS,
    adult_price: 30000,
    child_price: 15000,
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

  assert.equal(total, 167000);
});
