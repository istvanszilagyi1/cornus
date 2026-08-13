import test from "node:test";
import assert from "node:assert/strict";

import { buildGuestEmailHtml, buildAdminNotificationHtml, normalizeBookingEmailPayload } from "./email.ts";

test("normalizeBookingEmailPayload keeps all booking pricing details for the email body", () => {
  const payload = normalizeBookingEmailPayload({
    action: "booking_received",
    guest_name: "Teszt Aladár",
    email: "teszt@example.com",
    check_in: "2026-09-10",
    check_out: "2026-09-12",
    adults: 2,
    children: 1,
    guests: 3,
    dogs: 1,
    total: 180000,
    deposit: 90000,
    nights: 2,
    adult_guests: 2,
    child_guests: 1,
    toddler_guests: 0,
    room_subtotal: 120000,
    ifa_subtotal: 30000,
    dog_subtotal: 30000,
    single_night_surcharge: 0,
    nightly_adult_rate: 30000,
    nightly_child_rate: 15000,
  });

  assert.equal(payload.room_subtotal, 120000);
  assert.equal(payload.ifa_subtotal, 30000);
  assert.equal(payload.dog_subtotal, 30000);
  assert.equal(payload.nightly_adult_rate, 30000);
  assert.equal(payload.nightly_child_rate, 15000);
  assert.equal(payload.deposit, 90000);
});

test("guest email includes booking math and brand card attachment reference", () => {
  const html = buildGuestEmailHtml({
    action: "booking_received",
    guest_name: "Teszt Aladár",
    email: "teszt@example.com",
    phone: "+36 70 123 4567",
    check_in: "2026-09-10",
    check_out: "2026-09-12",
    adults: 2,
    children: 1,
    guests: 3,
    dogs: 0,
    total: 125000,
    deposit: 62500,
    nights: 2,
    adult_guests: 2,
    child_guests: 1,
    toddler_guests: 0,
    room_subtotal: 100000,
    ifa_subtotal: 3000,
    dog_subtotal: 0,
    single_night_surcharge: 0,
    nightly_adult_rate: 25000,
    nightly_child_rate: 12500,
  });

  assert.match(html, /cid:cornus-brand-card/i);
  assert.match(html, /Felnőttek/i);
  assert.match(html, /Gyermekek/i);
  assert.match(html, /125\s*000\s*Ft/i);
  assert.match(html, /62\s*500\s*Ft/i);
});

test("guest email does not show 0 Ft for missing breakdown values and mentions the 48-hour deposit rule", () => {
  const html = buildGuestEmailHtml({
    action: "booking_approved",
    guest_name: "Teszt Aladár",
    email: "teszt@example.com",
    phone: "+36 70 123 4567",
    check_in: "2026-09-10",
    check_out: "2026-09-12",
    adults: 2,
    children: 1,
    guests: 3,
    dogs: 1,
    total: 150000,
    deposit: 75000,
    nights: 2,
    adult_guests: 2,
    child_guests: 1,
    toddler_guests: 0,
    room_subtotal: 120000,
    ifa_subtotal: 15000,
    dog_subtotal: 15000,
    single_night_surcharge: 0,
    payment_note: "A foglalás teljes költségének 50%-át kell átutalni a megadott bankszámlára, a foglalási névvel megjelölve.",
  });

  assert.doesNotMatch(html, /Gyermekek<\/td>.*?0\s*Ft/i);
  assert.doesNotMatch(html, /Kisgyermek.*?0\s*Ft/i);
  assert.doesNotMatch(html, /Kutya:<\/td>.*?0\s*db/i);
  assert.match(html, /48\s*óra|48\s*órán\s*belül/i);
  assert.match(html, /el\s*kell\s*utalnia|átutalni/i);
  assert.match(html, /150\s*000\s*Ft/i);
});

test("rejected email omits pricing details and dog row", () => {
  const html = buildGuestEmailHtml({
    action: "booking_rejected",
    guest_name: "Teszt Aladár",
    email: "teszt@example.com",
    phone: "+36 70 123 4567",
    check_in: "2026-09-10",
    check_out: "2026-09-12",
    adults: 2,
    children: 0,
    guests: 2,
    dogs: 0,
    total: 150000,
    deposit: 75000,
    nights: 2,
    adult_guests: 2,
    child_guests: 0,
    toddler_guests: 0,
    room_subtotal: 120000,
    ifa_subtotal: 15000,
    dog_subtotal: 0,
    single_night_surcharge: 0,
    nightly_adult_rate: 30000,
    nightly_child_rate: 0,
  });

  assert.match(html, /elutasításra került/i);
  assert.doesNotMatch(html, /Árkalkuláció/i);
  assert.doesNotMatch(html, /Kutya:/i);
  assert.doesNotMatch(html, /150\s*000\s*Ft/i);
});

test("admin email uses a notification template instead of the guest offer", () => {
  const html = buildAdminNotificationHtml({
    action: "booking_received",
    guest_name: "Teszt Aladár",
    email: "teszt@example.com",
    phone: "+36 70 123 4567",
    check_in: "2026-09-10",
    check_out: "2026-09-12",
    adults: 2,
    children: 1,
    guests: 3,
    dogs: 0,
    total: 125000,
    deposit: 62500,
    nights: 2,
    adult_guests: 2,
    child_guests: 1,
    toddler_guests: 0,
    room_subtotal: 100000,
    ifa_subtotal: 3000,
    dog_subtotal: 0,
    single_night_surcharge: 0,
    nightly_adult_rate: 25000,
    nightly_child_rate: 12500,
  });

  assert.match(html, /Új foglalási értesítés/i);
  assert.match(html, /2026.*10/i);
  assert.match(html, /125\s*000\s*Ft/i);
  assert.doesNotMatch(html, /Foglalási kérelmedet/i);
});
