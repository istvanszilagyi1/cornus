import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";
import { differenceInCalendarDays, eachDayOfInterval, format, startOfToday } from "date-fns";
import { hu } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { trackBookingStart } from "@/lib/analytics";
import {
  DEFAULT_PRICING_SETTINGS,
  DEFAULT_SPECIAL_PERIODS,
  getBookingPricingSummary,
} from "@/lib/pricing";
import { SITE, formatHuf } from "@/lib/site";
import { LegalModalLink } from "./contact-section";
import { Reveal, SectionHeading } from "./section";

const MAX_TOTAL_GUESTS = SITE.maxGuests;
const MAX_DOGS = 1;

export function BookingSection() {
  const [range, setRange] = useState<DateRange | undefined>();
  const [checkInInput, setCheckInInput] = useState("");
  const [checkOutInput, setCheckOutInput] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);
  const [dogs, setDogs] = useState(0);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCheckInInput(range?.from ? format(range.from, "yyyy-MM-dd") : "");
    setCheckOutInput(range?.to ? format(range.to, "yyyy-MM-dd") : "");
  }, [range]);

  useEffect(() => {
    if (range?.from && range?.to) {
      trackBookingStart({
        path: window.location.pathname,
        title: "Foglalás indítása",
        metadata: {
          checkIn: format(range.from, "yyyy-MM-dd"),
          checkOut: format(range.to, "yyyy-MM-dd"),
        },
      });
    }
  }, [range?.from, range?.to]);

  const syncRangeFromManualInput = (type: "from" | "to", rawValue: string) => {
    if (!rawValue) {
      if (type === "from") {
        setRange((current) => (current?.to ? { from: undefined, to: current.to } : undefined));
      } else {
        setRange((current) => (current?.from ? { from: current.from, to: undefined } : undefined));
      }
      return;
    }

    const nextDate = new Date(`${rawValue}T12:00:00`);
    if (Number.isNaN(nextDate.getTime())) return;

    if (type === "from") {
      setRange((current) => {
        const safeTo = current?.to && nextDate > current.to ? nextDate : current?.to;
        return { from: nextDate, to: safeTo ?? nextDate };
      });
      return;
    }

    setRange((current) => {
      const safeFrom =
        current?.from && nextDate < current.from ? nextDate : (current?.from ?? nextDate);
      return { from: safeFrom, to: nextDate };
    });
  };

  const { data: blocked } = useQuery({
    queryKey: ["blocked-dates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blocked_dates").select("start_date, end_date");
      if (error) throw error;
      return data;
    },
  });

  const { data: pricingSettings = DEFAULT_PRICING_SETTINGS } = useQuery({
    queryKey: ["pricing-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pricing_settings").select("*").maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data ? { ...DEFAULT_PRICING_SETTINGS, ...data } : { ...DEFAULT_PRICING_SETTINGS };
    },
  });
  const bookingEnabled = pricingSettings.booking_enabled ?? true;

  const { data: specialPeriods = DEFAULT_SPECIAL_PERIODS } = useQuery({
    queryKey: ["pricing-special-periods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_special_periods")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data && data.length ? data : DEFAULT_SPECIAL_PERIODS;
    },
  });

  const disabledDays = useMemo(() => {
    const days: Date[] = [];
    for (const row of blocked ?? []) {
      const start = new Date(row.start_date);
      const end = new Date(row.end_date);
      if (end < start) continue;
      days.push(...eachDayOfInterval({ start, end }));
    }
    return days;
  }, [blocked]);

  const nights = range?.from && range?.to ? differenceInCalendarDays(range.to, range.from) : 0;
  const totalGuests = adults + children;
  const pricingSummary = useMemo(
    () =>
      getBookingPricingSummary({
        range,
        adults,
        childAges: childrenAges.slice(0, children),
        dogs,
        settings: pricingSettings,
        periods: specialPeriods,
      }),
    [range, adults, children, childrenAges, dogs, pricingSettings, specialPeriods],
  );

  const handleAdultsChange = (value: number) => {
    const safeAdults = Math.min(Math.max(1, value), 8);
    setAdults(safeAdults);
    setChildren((previousChildren) => {
      const maxChildren = Math.max(0, MAX_TOTAL_GUESTS - safeAdults);
      const nextChildren = Math.min(previousChildren, maxChildren);
      setChildrenAges((previousAges) => previousAges.slice(0, nextChildren));
      return nextChildren;
    });
  };

  const handleChildrenChange = (value: number) => {
    const safeChildren = Math.max(0, Math.min(value, MAX_TOTAL_GUESTS - adults));
    setChildren(safeChildren);
    setChildrenAges((previousAges) =>
      previousAges
        .slice(0, safeChildren)
        .concat(Array(Math.max(0, safeChildren - previousAges.length)).fill(0)),
    );
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // MENTSÜK EL A FORM REFERENCIÁJÁT AZ ASZINKRON FOLYAMATOK ELŐTT!
    const formElement = event.currentTarget;

    if (!range?.from || !range?.to || nights < 1) {
      toast.error("Válaszd ki az érkezés és a távozás napját a naptárban.");
      return;
    }
    if (nights > 1 && nights < pricingSummary.minNightsRequired) {
      toast.error(
        `A kiválasztott időszakban minimum ${pricingSummary.minNightsRequired} éjszaka szükséges.`,
      );
      return;
    }
    if (adults < 1 || adults > 8 || totalGuests > MAX_TOTAL_GUESTS) {
      toast.error("A vendégek száma maximum 8 fő lehet, legalább 1 felnőtt kell.");
      return;
    }
    if (dogs < 0 || dogs > MAX_DOGS) {
      toast.error("A kistestű kutya száma 0 vagy 1 lehet.");
      return;
    }
    if (children > 0 && childrenAges.length < children) {
      toast.error("Add meg az összes gyermek életkorát.");
      return;
    }

    const form = new FormData(formElement);
    const normalizedChildrenAges = childrenAges
      .slice(0, children)
      .map((age) => Math.max(0, Number(age) || 0));
    trackBookingStart({
      path: window.location.pathname,
      title: "Foglalás beküldése",
      metadata: {
        checkIn: format(range.from, "yyyy-MM-dd"),
        checkOut: format(range.to, "yyyy-MM-dd"),
        adults,
        children,
      },
    });
    setSubmitting(true);

    const { error } = await supabase.from("bookings").insert({
      guest_name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim() || null,
      check_in: format(range.from, "yyyy-MM-dd"),
      check_out: format(range.to, "yyyy-MM-dd"),
      adults,
      children,
      children_ages: normalizedChildrenAges,
      dogs,
      guests: totalGuests,
      message: String(form.get("message") ?? "").trim() || null,
      total: pricingSummary.total,
      deposit: pricingSummary.deposit,
      nights: pricingSummary.nights,
      adult_guests: pricingSummary.adultGuests,
      child_guests: pricingSummary.childGuests,
      toddler_guests: pricingSummary.toddlerGuests,
      room_subtotal: pricingSummary.roomSubtotal,
      ifa_subtotal: pricingSummary.ifaSubtotal,
      dog_subtotal: pricingSummary.dogSubtotal,
      single_night_surcharge: pricingSummary.singleNightSurcharge,
      nightly_adult_rate: pricingSummary.nightlyAdultRate,
      nightly_child_rate: pricingSummary.nightlyChildRate,
    });

    setSubmitting(false);

    if (error) {
      toast.error("A foglalási kérelmet nem sikerült elküldeni. Próbáld újra.");
      return;
    }

    try {
      const emailResponse = await fetch("/api/public/booking-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "booking_received",
          guest_name: String(form.get("name") ?? "").trim(),
          email: String(form.get("email") ?? "").trim(),
          phone: String(form.get("phone") ?? "").trim() || null,
          check_in: format(range.from, "yyyy-MM-dd"),
          check_out: format(range.to, "yyyy-MM-dd"),
          adults,
          children,
          guests: totalGuests,
          dogs,
          message: String(form.get("message") ?? "").trim() || null,
          total: pricingSummary.total,
          deposit: pricingSummary.deposit,
          nights: pricingSummary.nights,
          adult_guests: pricingSummary.adultGuests,
          child_guests: pricingSummary.childGuests,
          toddler_guests: pricingSummary.toddlerGuests,
          room_subtotal: pricingSummary.roomSubtotal,
          ifa_subtotal: pricingSummary.ifaSubtotal,
          dog_subtotal: pricingSummary.dogSubtotal,
          single_night_surcharge: pricingSummary.singleNightSurcharge,
          nightly_adult_rate: pricingSummary.nightlyAdultRate,
          nightly_child_rate: pricingSummary.nightlyChildRate,
        }),
      });

      if (!emailResponse.ok) {
        const payload = (await emailResponse.json().catch(() => ({}))) as { error?: string };
        console.error("booking email send failed", payload.error ?? "unknown error");
      }
    } catch (emailError) {
      console.error("booking email send failed", emailError);
    }

    toast.success("Köszönjük! Hamarosan e-mailben visszaigazoljuk a foglalást.");

    // Űrlap kiürítése a MENTETT referencia segítségével
    formElement.reset();
    setRange(undefined);
    setCheckInInput("");
    setCheckOutInput("");
    setAdults(2);
    setChildren(0);
    setChildrenAges([]);
    setDogs(0);
    setLegalAccepted(false); // Visszaállítja a gombot inaktívra
  }

  return (
    <section id="foglalas" className="relative border-t border-border/50 py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow={bookingEnabled ? "Foglalás" : "Árlista"}
          title={bookingEnabled ? "Válaszd ki a dátumot" : "Árak és feltételek"}
          lead={
            bookingEnabled
              ? "A szürke napok már foglaltak. A kérelmedet 24 órán belül visszaigazoljuk."
              : "Jelenleg a foglalás ideiglenesen zárva van, de az aktuális árak és a feltételek itt láthatók."
          }
        />

        <Reveal className="mt-16">
          <div className="mx-auto max-w-4xl rounded-sm border border-border/70 bg-card/50 p-6 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.5)] sm:p-8">
            <div className="mb-8 flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  {bookingEnabled ? "Nyitott foglalás" : "Nyitvatartás"}
                </p>
                <h3 className="mt-2 font-display text-3xl text-foreground">Árjegyzék</h3>
              </div>
              {!bookingEnabled && (
                <div className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-amber-600">
                  Foglalás zárva
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-sm border border-border/70 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Felnőtt · 14+ év
                </p>
                <p className="mt-3 font-display text-3xl text-foreground">
                  {formatHuf(pricingSettings.adult_price)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">/ fő / éj</p>
              </div>
              <div className="rounded-sm border border-border/70 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Gyerek · 3–14 év
                </p>
                <p className="mt-3 font-display text-3xl text-foreground">
                  {formatHuf(pricingSettings.child_price)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">/ fő / éj</p>
              </div>
              <div className="rounded-sm border border-border/70 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Gyerek · 0–3 év
                </p>
                <p className="mt-3 font-display text-3xl text-foreground">
                  {formatHuf(pricingSettings.toddler_price)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">/ fő / éj</p>
              </div>
              <div className="rounded-sm border border-border/70 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Kutya</p>
                <p className="mt-3 font-display text-3xl text-foreground">
                  {formatHuf(pricingSettings.dog_price)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">/ éj</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 rounded-sm border border-border/70 bg-background/40 p-4 text-sm text-muted-foreground md:grid-cols-2">
              <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 md:border-none md:pb-0">
                <span>Minimális tartózkodás</span>
                <span className="font-medium text-foreground">2 éjszaka</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 md:border-none md:pb-0">
                <span>IFA / fő / éj</span>
                <span className="font-medium text-foreground">
                  {formatHuf(pricingSettings.ifa_per_adult)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>1 éjszaka esetén felár</span>
                <span className="font-medium text-foreground">+{pricingSettings.single_night_surcharge_percent}%</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>4 éjszaka felett</span>
                <span className="font-medium text-primary">egyéni ár</span>
              </div>
            </div>

            <div className="mt-8 rounded-sm border border-primary/30 bg-primary/5 p-4 text-sm text-foreground/90">
              Kiemelt időszakban a szállás ára +5.000 Ft / fő / éj, így a felnőtt 25.000 Ft, a gyermek 15.000 Ft / fő / éj.
            </div>
          </div>
        </Reveal>

        {bookingEnabled && (
          <div className="mt-16 grid gap-10 lg:grid-cols-[auto_1fr] lg:gap-16">
            <Reveal className="rounded-sm border border-border/70 bg-card/50 p-4 sm:p-6">
              <Calendar
                mode="range"
                locale={hu}
                numberOfMonths={1}
                selected={range}
                onSelect={(value) => {
                  const nextRange = value ?? undefined;
                  setRange(nextRange);
                }}
                disabled={[{ before: startOfToday() }, ...disabledDays]}
                className="pointer-events-auto"
              />

              <div className="mt-5 grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="manual-checkin">Érkezés dátuma</Label>
                  <Input
                    id="manual-checkin"
                    type="date"
                    min={format(startOfToday(), "yyyy-MM-dd")}
                    value={checkInInput}
                    onChange={(event) => syncRangeFromManualInput("from", event.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-checkout">Távozás dátuma</Label>
                  <Input
                    id="manual-checkout"
                    type="date"
                    min={checkInInput || format(startOfToday(), "yyyy-MM-dd")}
                    value={checkOutInput}
                    onChange={(event) => syncRangeFromManualInput("to", event.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="mt-4 border-t border-border/60 pt-4 text-sm">
                {nights > 0 ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {format(range!.from!, "MMM d.", { locale: hu })} –{" "}
                      {format(range!.to!, "MMM d.", { locale: hu })} · {nights} éj
                    </span>
                    <span className="ml-4 shrink-0 font-display text-2xl text-primary">
                      {formatHuf(pricingSummary.total)}
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Jelöld ki az érkezés és a távozás napját.</p>
                )}
              </div>
            </Reveal>

            <Reveal delay={140}>
              <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <Label htmlFor="name">Név</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    className="mt-2"
                    placeholder="Kovács Anna"
                  />
                </div>
                <div className="sm:col-span-1">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="mt-2"
                    placeholder="anna@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" name="phone" className="mt-2" placeholder="+36 …" />
                </div>
                <div>
                  <Label htmlFor="adults">Felnőttek száma</Label>
                  <select
                    id="adults"
                    name="adults"
                    value={adults}
                    onChange={(event) => handleAdultsChange(Number(event.target.value))}
                    className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {Array.from({ length: 8 }, (_, index) => index + 1).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="children">Gyerekek száma</Label>
                  <select
                    id="children"
                    name="children"
                    value={children}
                    onChange={(event) => handleChildrenChange(Number(event.target.value))}
                    className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {Array.from({ length: MAX_TOTAL_GUESTS + 1 }, (_, index) => index).map(
                      (value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <Label htmlFor="dogs">Kistestű kutya</Label>
                  <select
                    id="dogs"
                    name="dogs"
                    value={dogs}
                    onChange={(event) => setDogs(Number(event.target.value))}
                    className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {[0, 1].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <p className="text-sm text-muted-foreground">Összesen: {totalGuests} fő</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Max. kapacitás: {MAX_TOTAL_GUESTS} fő · Min. 2 éjszaka
                  </p>
                </div>
                {children > 0 && (
                  <div className="sm:col-span-2 space-y-3">
                    <Label>Gyermekek életkora</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Array.from({ length: children }, (_, index) => (
                        <div key={`child-age-${index}`}>
                          <Label
                            htmlFor={`child-age-${index}`}
                            className="text-sm text-muted-foreground"
                          >
                            {index + 1}. gyermek életkora
                          </Label>
                          <select
                            id={`child-age-${index}`}
                            value={childrenAges[index] ?? 0}
                            onChange={(event) => {
                              const nextAges = [...childrenAges];
                              nextAges[index] = Number(event.target.value) || 0;
                              setChildrenAges(nextAges);
                            }}
                            className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            {Array.from({ length: 15 }, (_, i) => i).map((age) => (
                              <option key={age} value={age}>
                                {age === 0 ? "0 éves (1 év alatti)" : `${age} éves`}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {nights > 0 && (
                  <div className="sm:col-span-2 rounded-sm border border-border/70 bg-card/40 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">Árkalkuláció</p>
                      {pricingSummary.isPeakPeriod && (
                        <span className="rounded-sm bg-primary/10 px-2 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-primary">
                          {pricingSummary.activePeriodName}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between gap-4">
                        <span>Szállásdíj</span>
                        <span className="font-medium text-foreground">
                          {formatHuf(pricingSummary.roomSubtotal)}
                        </span>
                      </div>
                      {pricingSummary.singleNightSurcharge > 0 && (
                        <div className="flex items-center justify-between gap-4">
                          <span>1 éjszakás felár (+50%)</span>
                          <span className="font-medium text-foreground">
                            {formatHuf(pricingSummary.singleNightSurcharge)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-4">
                        <span>IFA</span>
                        <span className="font-medium text-foreground">
                          {formatHuf(pricingSummary.ifaSubtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Kutya díj</span>
                        <span className="font-medium text-foreground">
                          {formatHuf(pricingSummary.dogSubtotal)}
                        </span>
                      </div>
                      <div className="border-t border-border/60 pt-2">
                        <div className="flex items-center justify-between gap-4 text-base font-medium text-foreground">
                          <span>Végösszeg</span>
                          <span>{formatHuf(pricingSummary.total)}</span>
                        </div>
                        {pricingSummary.nights > 4 && (
                          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-primary">
                            Egyéni kedvezményes ár a szállásadótól – a foglalásnál ezt küldjük tovább.
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-4 text-sm text-muted-foreground">
                          <span>50% előleg</span>
                          <span className="font-medium text-primary">
                            {formatHuf(pricingSummary.deposit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <Label htmlFor="message">Üzenet</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="mt-2"
                    placeholder="Késői érkezés, gyerekágy, egyéb kérés…"
                  />
                </div>
                <div className="sm:col-span-2 space-y-3">
                  <label className="flex items-start gap-3 rounded-sm border border-border/70 bg-card/30 p-3 text-sm text-foreground/90">
                    <input
                      type="checkbox"
                      checked={legalAccepted}
                      onChange={(event) => setLegalAccepted(event.target.checked)}
                      className="mt-1 size-4 accent-primary"
                    />
                    <span>
                      Elfogadom a{" "}
                      <LegalModalLink label="[Házirend]" title="Házirend" pdfUrl="/hazirend.pdf" />{" "}
                      és az{" "}
                      <LegalModalLink
                        label="[Adatkezelési Tájékoztató]"
                        title="Adatkezelési Tájékoztató"
                        pdfUrl="/adatkezelesi.html"
                      />{" "}
                      feltételeit.
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={submitting || !legalAccepted}
                    className="w-full rounded-sm bg-primary px-8 py-4 text-xs tracking-[0.28em] text-primary-foreground uppercase transition-all duration-300 hover:shadow-glow hover:brightness-110 disabled:opacity-60"
                  >
                    {submitting ? "Küldés…" : "Foglalási kérelem küldése"}
                  </button>
                  <p className="mt-3 text-xs text-muted-foreground">
                    A kérelem nem jelent végleges foglalást – e-mailben visszaigazoljuk.
                  </p>
                </div>
              </form>
            </Reveal>
          </div>
        )}
      </div>
    </section>
  );
}
