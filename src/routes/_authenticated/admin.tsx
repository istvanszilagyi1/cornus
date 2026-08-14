import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, differenceInCalendarDays } from "date-fns";
import { hu } from "date-fns/locale";
import { toast } from "sonner";
import { BarChart3, CalendarDays, Check, Clock3, LogOut, TrendingUp, Trash2, Users, X } from "lucide-react";
import { Area, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DEFAULT_PRICING_SETTINGS, DEFAULT_SPECIAL_PERIODS, estimateBookingRevenueFromBooking, getBookingPricingSummary } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { getAnalyticsEvents, type AnalyticsEvent } from "@/lib/analytics";
import { getMyRole } from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin – Cornus Apartman" },
      { name: "description", content: "Foglalások, naptár és bevételkezelés adminisztrációja." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const btn =
  "inline-flex items-center gap-2 rounded-sm border border-border/70 px-4 py-2 text-xs tracking-[0.18em] uppercase transition-colors hover:border-primary hover:text-primary disabled:opacity-50";
const btnPrimary =
  "inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-xs tracking-[0.2em] text-primary-foreground uppercase transition-all hover:brightness-110 disabled:opacity-50";
const panel = "rounded-sm border border-border/70 bg-card/50 p-6";

function AdminPage() {
  const navigate = useNavigate();
  const fetchRole = useServerFn(getMyRole);
  const { isLoading } = useQuery({
    queryKey: ["my-role"],
    queryFn: () => fetchRole(),
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (isLoading) {
    return <div className="p-10 text-muted-foreground">Betöltés…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-display text-xl tracking-[0.3em] text-foreground">
            CORNUS
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className={btn}>
              Weboldal
            </Link>
            <button onClick={signOut} className={btn}>
              <LogOut className="size-4" /> Kilépés
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-4xl text-foreground">Szállásadói panel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Foglalások, érkezések, naptár és bevételkezelés.
        </p>

        <Tabs defaultValue="dashboard" className="mt-10">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="bookings">Foglalások</TabsTrigger>
            <TabsTrigger value="pricing">Árazási beállítások</TabsTrigger>
            <TabsTrigger value="calendar">Naptár</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-8">
            <DashboardPanel />
          </TabsContent>
          <TabsContent value="bookings" className="mt-8">
            <BookingsPanel />
          </TabsContent>
          <TabsContent value="pricing" className="mt-8">
            <PricingSettingsPanel />
          </TabsContent>
          <TabsContent value="calendar" className="mt-8">
            <CalendarPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ------------------------------- Dashboard -------------------------------- */

function DashboardPanel() {
  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-dashboard-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, status, check_in, check_out, adults, children, guests, dogs, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ["admin-dashboard-analytics"],
    queryFn: getAnalyticsEvents,
  });

  const { data: pricingSettings = DEFAULT_PRICING_SETTINGS } = useQuery({
    queryKey: ["dashboard-pricing-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_settings")
        .select("*")
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data ? { ...DEFAULT_PRICING_SETTINGS, ...data } : { ...DEFAULT_PRICING_SETTINGS };
    },
  });

  const monthlyPageViews = useMemo(() => createMonthlySeries(analytics, "page_view"), [analytics]);
  const monthlyMetrics = useMemo(() => createMonthlyRevenueSeries(bookings, pricingSettings), [bookings, pricingSettings]);
  const upcomingArrivals = useMemo(() => {
    const now = new Date();
    return bookings
      .filter((booking) => booking.status === "confirmed")
      .filter((booking) => booking.check_in && new Date(`${booking.check_in}T12:00:00`) >= now)
      .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())
      .slice(0, 5);
  }, [bookings]);

  const summary = useMemo(() => {
    const totalBookings = bookings.length;
    const validBookings = bookings.filter((booking) => booking.status !== "rejected");
    const expectedRevenue = validBookings.reduce(
      (sum, booking) => sum + estimateBookingRevenueFromBooking(booking, pricingSettings),
      0,
    );
    const views = analytics.filter((event) => event.type === "page_view").length;
    const conversionRate = views > 0 ? (validBookings.length / views) * 100 : 0;

    return {
      totalBookings,
      expectedRevenue,
      pageViews: views,
      conversionRate,
      confirmedBookings: bookings.filter((booking) => booking.status === "confirmed").length,
    };
  }, [analytics, bookings, pricingSettings]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Összes foglalás" value={summary.totalBookings.toString()} icon={<BarChart3 className="size-4" />} accent="bg-primary/10 text-primary" />
        <MetricCard label="Várható bevétel" value={formatMoney(summary.expectedRevenue)} icon={<TrendingUp className="size-4" />} accent="bg-emerald-500/10 text-emerald-500" />
        <MetricCard label="Látogatók" value={summary.pageViews.toLocaleString()} icon={<Users className="size-4" />} accent="bg-sky-500/10 text-sky-500" />
        <MetricCard label="Konverziós ráta" value={`${summary.conversionRate.toFixed(1)}%`} icon={<TrendingUp className="size-4" />} accent="bg-violet-500/10 text-violet-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className={cn(panel, "p-4 sm:p-6")}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Látogatottság</p>
              <h2 className="mt-2 font-display text-2xl text-foreground">Havi oldalmegtekintések</h2>
            </div>
          </div>
          <ChartContainer
            config={{
              pageViews: { label: "Oldalmegtekintés", color: "hsl(var(--chart-1))" },
            }}
            className="h-[280px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyPageViews}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="pageViews" fill="hsl(var(--chart-1))" fillOpacity={0.2} stroke="hsl(var(--chart-1))" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className={cn(panel, "p-4 sm:p-6")}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Foglalások</p>
              <h2 className="mt-2 font-display text-2xl text-foreground">Bevétel és foglalások</h2>
            </div>
          </div>
          <ChartContainer
            config={{
              bookings: { label: "Foglalások", color: "hsl(var(--chart-2))" },
              revenue: { label: "Bevétel", color: "hsl(var(--chart-3))" },
            }}
            className="h-[280px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCompactMoney(value)} tickLine={false} axisLine={false} />
                <Tooltip
                  content={<ChartTooltipContent formatter={(value: number, name: string) => [name === "revenue" ? formatMoney(Number(value)) : value.toLocaleString(), name]} />}
                />
                <Bar yAxisId="left" dataKey="bookings" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(var(--chart-3))" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      <div className={cn(panel, "p-4 sm:p-6")}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
            <CalendarDays className="size-4" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Következő érkezések</p>
            <h2 className="mt-1 font-display text-2xl text-foreground">Érkezések és távozások</h2>
          </div>
        </div>

        {upcomingArrivals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Jelenleg nincs közelgő igazolt érkezés.</p>
        ) : (
          <div className="space-y-3">
            {upcomingArrivals.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between gap-4 rounded-sm border border-border/70 bg-card/40 px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{booking.guest_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {format(new Date(`${booking.check_in}T12:00:00`), "yyyy. MMM d.", { locale: hu })} – {format(new Date(`${booking.check_out}T12:00:00`), "yyyy. MMM d.", { locale: hu })}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <Clock3 className="size-3.5" /> Érkezés
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className={cn(panel, "flex items-center justify-between gap-4")}>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-3 font-display text-3xl text-foreground">{value}</p>
      </div>
      <div className={cn("flex size-10 items-center justify-center rounded-sm", accent)}>{icon}</div>
    </div>
  );
}

function estimateBookingRevenue(
  booking: {
    check_in?: string;
    check_out?: string;
    adults?: number | null;
    children?: number | null;
    guests?: number | null;
    dogs?: number | null;
    status?: string | null;
  },
  settings: typeof DEFAULT_PRICING_SETTINGS,
) {
  return estimateBookingRevenueFromBooking(booking, settings, DEFAULT_SPECIAL_PERIODS);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactMoney(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
}

function createMonthlySeries(events: AnalyticsEvent[], type: "page_view") {
  const lastMonths = Array.from({ length: 6 }, (_, index) => {
    const month = new Date();
    month.setDate(1);
    month.setMonth(month.getMonth() - (5 - index));
    const label = format(month, "yyyy. MMM");
    return { label, monthKey: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`, pageViews: 0 };
  });

  for (const event of events) {
    if (event.type !== type || !event.created_at) continue;

    const date = new Date(event.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const match = lastMonths.find((item) => item.monthKey === monthKey);
    if (match) match.pageViews += 1;
  }

  return lastMonths;
}

function createMonthlyRevenueSeries(
  bookings: Array<{ status?: string | null; check_in?: string; check_out?: string; adults?: number | null; children?: number | null; guests?: number | null; dogs?: number | null; created_at?: string; }>,
  settings: typeof DEFAULT_PRICING_SETTINGS,
) {
  const lastMonths = Array.from({ length: 6 }, (_, index) => {
    const month = new Date();
    month.setDate(1);
    month.setMonth(month.getMonth() - (5 - index));
    return {
      label: format(month, "yyyy. MMM"),
      monthKey: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
      bookings: 0,
      revenue: 0,
    };
  });

  for (const booking of bookings) {
    if (!booking.check_in || !booking.check_out || booking.status === "rejected") continue;

    const date = new Date(booking.created_at ?? booking.check_in);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const match = lastMonths.find((item) => item.monthKey === monthKey);
    if (!match) continue;

    match.bookings += 1;
    match.revenue += estimateBookingRevenue(booking, settings);
  }

  return lastMonths;
}

/* ------------------------------- Bookings -------------------------------- */

const STATUS_LABEL: Record<string, string> = {
  pending: "Függőben",
  confirmed: "Visszaigazolva",
  rejected: "Elutasítva",
};

function BookingsPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      block,
      guestEmail,
      guestName,
      checkIn,
      checkOut,
      adults,
      children,
      guests,
      dogs,
      message,
    }: {
      id: string;
      status: string;
      block?: { start: string; end: string; name: string };
      guestEmail?: string;
      guestName?: string;
      checkIn?: string;
      checkOut?: string;
      adults?: number;
      children?: number;
      guests?: number;
      dogs?: number;
      message?: string | null;
    }) => {
      try {
        const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
        if (error) throw error;

        if (block) {
          const { error: blockError } = await supabase.from("blocked_dates").insert({
            start_date: block.start,
            end_date: block.end,
            reason: "Foglalás – lezárt időszak",
          });
          if (blockError) throw blockError;
        }

        // Ha elutasítunk valamit, töröljük a naptárból is a hozzátartozó lezárást!
        if (status === "rejected" && checkIn && checkOut) {
          const { error: unblockError } = await supabase.from("blocked_dates")
            .delete()
            .eq("start_date", checkIn)
            .eq("end_date", checkOut);
          
          if (unblockError) {
            console.error("Nem sikerült törölni a lezárást elutasításkor:", unblockError);
          }
        }

        if (status === "confirmed" || status === "rejected") {
          const bookingSummary = getBookingPricingSummary({
            range: checkIn && checkOut ? { from: new Date(`${checkIn}T12:00:00`), to: new Date(`${checkOut}T12:00:00`) } : undefined,
            adults: Number(adults ?? 1),
            childAges: Array(Number(children ?? 0)).fill(0),
            dogs: Number(dogs ?? 0),
            settings: DEFAULT_PRICING_SETTINGS,
            periods: DEFAULT_SPECIAL_PERIODS,
          });

          const payload = {
            action: status === "confirmed" ? "booking_approved" : "booking_rejected",
            guest_name: guestName ?? "Vendég",
            email: guestEmail ?? "",
            check_in: checkIn ?? "",
            check_out: checkOut ?? "",
            adults: Number(adults ?? 1),
            children: Number(children ?? 0),
            guests: Number(guests ?? adults ?? 1),
            dogs: Number(dogs ?? 0),
            message: message ?? null,
            total: bookingSummary.total,
            deposit: bookingSummary.deposit,
            nights: bookingSummary.nights,
            adult_guests: bookingSummary.adultGuests,
            child_guests: bookingSummary.childGuests,
            toddler_guests: bookingSummary.toddlerGuests,
            room_subtotal: bookingSummary.roomSubtotal,
            ifa_subtotal: bookingSummary.ifaSubtotal,
            dog_subtotal: bookingSummary.dogSubtotal,
            single_night_surcharge: bookingSummary.singleNightSurcharge,
            nightly_adult_rate: bookingSummary.nightlyAdultRate,
            nightly_child_rate: bookingSummary.nightlyChildRate,
            payment_note: "A foglalás teljes költségének 50%-át kell átutalni a megadott bankszámlára, a foglalási névvel megjelölve.",
          };

          if (!payload.email || !payload.check_in || !payload.check_out) {
            return;
          }

          try {
            const emailResponse = await fetch("/api/public/booking-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (!emailResponse.ok) {
              const payloadResponse = (await emailResponse.json().catch(() => ({}))) as { error?: string };
              console.error("admin booking email send failed", payloadResponse.error ?? "unknown error");
            }
          } catch (emailError) {
            console.error("admin booking email send failed", emailError);
          }
        }
      } catch (error) {
        console.error("admin booking status update failed", error);
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      qc.invalidateQueries({ queryKey: ["blocked-dates"] });
      qc.invalidateQueries({ queryKey: ["admin-blocked"] });
      toast.success("Frissítve.");
    },
    onError: () => toast.error("A módosítás nem sikerült."),
  });

  const remove = useMutation({
    mutationFn: async (b: any) => {
      // Ha nincs elutasítva, akkor csak elutasítjuk és kitöröljük a naptárból
      if (b.status !== "rejected") {
        if (b.check_in && b.check_out) {
          await supabase.from("blocked_dates").delete()
            .eq("start_date", b.check_in)
            .eq("end_date", b.check_out);
        }
        const { error } = await supabase.from("bookings").update({ status: "rejected" }).eq("id", b.id);
        if (error) throw error;
      } else {
        // Ha már elutasított, véglegesen töröljük az adatbázisból
        const { error } = await supabase.from("bookings").delete().eq("id", b.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      qc.invalidateQueries({ queryKey: ["admin-blocked"] });
      qc.invalidateQueries({ queryKey: ["blocked-dates"] });
      toast.success("Sikeres művelet.");
    },
  });

  const anonymizePersonalData = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({
          guest_name: "Anonimizált vendég",
          email: "deleted@privacy.local",
          phone: null,
          message: null,
          personal_data_redacted_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("A személyes adatok anonimizálva.");
    },
    onError: () => toast.error("Az anonimizálás nem sikerült."),
  });

  const bookings = data ?? [];

  if (!bookings.length) {
    return <p className="text-sm text-muted-foreground">Még nincs foglalási kérelem.</p>;
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => {
        const isLegacyBooking = b.status !== "pending" && differenceInCalendarDays(new Date(), new Date(b.check_out)) > 30;

        return (
          <div key={b.id} className={cn(panel, "flex flex-wrap items-start justify-between gap-6")}>
            <div className="min-w-[240px]">
              <p className="font-display text-2xl text-foreground">
                {b.personal_data_redacted_at ? "Anonimizált vendég" : b.guest_name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {b.personal_data_redacted_at ? "Személyes adatok anonimizálva" : `${b.email}${b.phone ? ` · ${b.phone}` : ""}`}
              </p>
              <p className="mt-3 text-sm text-foreground">
                {format(new Date(b.check_in), "yyyy. MMM d.", { locale: hu })} –{" "}
                {format(new Date(b.check_out), "yyyy. MMM d.", { locale: hu })} · {b.guests} fő
              </p>
              {!b.personal_data_redacted_at && b.message && (
                <p className="mt-3 max-w-lg text-sm text-muted-foreground">{b.message}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-3">
            <span
              className={cn(
                "rounded-sm px-3 py-1 text-[0.65rem] tracking-[0.2em] uppercase",
                b.status === "confirmed" && "bg-primary/15 text-primary",
                b.status === "pending" && "bg-secondary text-muted-foreground",
                b.status === "rejected" && "bg-destructive/15 text-destructive",
              )}
            >
              {STATUS_LABEL[b.status] ?? b.status}
            </span>
              <div className="flex flex-wrap gap-2">
                {!b.personal_data_redacted_at && isLegacyBooking && (
                  <button
                    className={btn}
                    onClick={() => anonymizePersonalData.mutate(b.id)}
                    disabled={anonymizePersonalData.isPending}
                  >
                    <Trash2 className="size-4" /> Személyes adatok anonimizálása
                  </button>
                )}
                <button
                  className={btn}
                  disabled={b.status === "confirmed"}
                  onClick={() =>
                    setStatus.mutate({
                      id: b.id,
                      status: "confirmed",
                      block: { start: b.check_in, end: b.check_out, name: b.guest_name },
                      guestEmail: b.email,
                      guestName: b.guest_name,
                      checkIn: b.check_in,
                      checkOut: b.check_out,
                      adults: b.adults,
                      children: b.children,
                      guests: b.guests,
                      dogs: b.dogs,
                      message: b.message,
                    })
                  }
                >
                  <Check className="size-4" /> Elfogad
                </button>
                <button
                  className={btn}
                  onClick={() =>
                    setStatus.mutate({
                      id: b.id,
                      status: "rejected",
                      guestEmail: b.email,
                      guestName: b.guest_name,
                      checkIn: b.check_in,
                      checkOut: b.check_out,
                      adults: b.adults,
                      children: b.children,
                      guests: b.guests,
                      dogs: b.dogs,
                      message: b.message,
                    })
                  }
                >
                  <X className="size-4" /> Elutasít
                </button>
                <button className={btn} onClick={() => remove.mutate(b)}>
                  <Trash2 className="size-4" /> Törlés
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- Pricing -------------------------------- */

type PricingSettingsForm = {
  adult_price: number;
  child_price: number;
  toddler_price: number;
  dog_price: number;
  ifa_per_adult: number;
  min_nights_default: number;
  single_night_surcharge_percent: number;
};

function PricingSettingsPanel() {
  const qc = useQueryClient();
  const [settings, setSettings] = useState<PricingSettingsForm>(DEFAULT_PRICING_SETTINGS);
  const [periods, setPeriods] = useState(DEFAULT_SPECIAL_PERIODS);

  const { data: settingsData } = useQuery({
    queryKey: ["pricing-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pricing_settings").select("*").maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data ?? DEFAULT_PRICING_SETTINGS;
    },
  });

  const { data: periodsData } = useQuery({
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

  useEffect(() => {
    if (settingsData) {
      setSettings({
        adult_price: Number(settingsData.adult_price ?? DEFAULT_PRICING_SETTINGS.adult_price),
        child_price: Number(settingsData.child_price ?? DEFAULT_PRICING_SETTINGS.child_price),
        toddler_price: Number(settingsData.toddler_price ?? DEFAULT_PRICING_SETTINGS.toddler_price),
        dog_price: Number(settingsData.dog_price ?? DEFAULT_PRICING_SETTINGS.dog_price),
        ifa_per_adult: Number(settingsData.ifa_per_adult ?? DEFAULT_PRICING_SETTINGS.ifa_per_adult),
        min_nights_default: Number(
          settingsData.min_nights_default ?? DEFAULT_PRICING_SETTINGS.min_nights_default,
        ),
        single_night_surcharge_percent: Number(
          settingsData.single_night_surcharge_percent ??
            DEFAULT_PRICING_SETTINGS.single_night_surcharge_percent,
        ),
      });
    }
  }, [settingsData]);

  useEffect(() => {
    if (periodsData) setPeriods(periodsData as typeof DEFAULT_SPECIAL_PERIODS);
  }, [periodsData]);

  const saveSettings = useMutation({
    mutationFn: async (values: PricingSettingsForm) => {
      const payload = {
        id: "default",
        ...values,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("pricing_settings").upsert(payload, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pricing-settings"] });
      toast.success("Árazási beállítások mentve.");
    },
    onError: () => toast.error("A beállítások mentése sikertelen volt."),
  });

  const upsertPeriod = useMutation({
    mutationFn: async (period: (typeof DEFAULT_SPECIAL_PERIODS)[number]) => {
      const payload = {
        ...period,
        updated_at: new Date().toISOString(),
      };
      if (period.id) {
        const { error } = await supabase.from("pricing_special_periods").update(payload).eq("id", period.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("pricing_special_periods").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pricing-special-periods"] });
      toast.success("Kiemelt időszak mentve.");
    },
    onError: () => toast.error("A kiemelt időszak mentése sikertelen volt."),
  });

  const removePeriod = useMutation({
    mutationFn: async (id: string) => {
      if (!id) return;
      const { error } = await supabase.from("pricing_special_periods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pricing-special-periods"] });
      toast.success("Kiemelt időszak törölve.");
    },
    onError: () => toast.error("A törlés sikertelen volt."),
  });

  const updatePeriodField = <K extends keyof (typeof DEFAULT_SPECIAL_PERIODS)[number]>(
    index: number,
    field: K,
    value: (typeof DEFAULT_SPECIAL_PERIODS)[number][K],
  ) => {
    setPeriods((current) =>
      current.map((period, i) => (i === index ? { ...period, [field]: value } : period)),
    );
  };

  return (
    <div className="space-y-8">
      <div className={cn(panel, "space-y-6")}>
        <div>
          <p className="eyebrow">Alapértelmezett árak</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Ezek az alapbeállítások használatosak, ha nincs a naptárban kiemelt időszaki ár.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <Label htmlFor="adult-price">Alap felnőtt ár</Label>
            <Input
              id="adult-price"
              type="number"
              min={0}
              value={settings.adult_price}
              onChange={(e) => setSettings((prev) => ({ ...prev, adult_price: Number(e.target.value) || 0 }))}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="child-price">Gyerek ár (3–14 év)</Label>
            <Input
              id="child-price"
              type="number"
              min={0}
              value={settings.child_price}
              onChange={(e) => setSettings((prev) => ({ ...prev, child_price: Number(e.target.value) || 0 }))}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="toddler-price">Gyerek ár (0–3 év)</Label>
            <Input
              id="toddler-price"
              type="number"
              min={0}
              value={settings.toddler_price}
              onChange={(e) => setSettings((prev) => ({ ...prev, toddler_price: Number(e.target.value) || 0 }))}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="dog-price">Kutya felár</Label>
            <Input
              id="dog-price"
              type="number"
              min={0}
              value={settings.dog_price}
              onChange={(e) => setSettings((prev) => ({ ...prev, dog_price: Number(e.target.value) || 0 }))}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="ifa-price">IFA / fő / éj</Label>
            <Input
              id="ifa-price"
              type="number"
              min={0}
              value={settings.ifa_per_adult}
              onChange={(e) => setSettings((prev) => ({ ...prev, ifa_per_adult: Number(e.target.value) || 0 }))}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="default-min-nights">Alap minimum éjszaka</Label>
            <Input
              id="default-min-nights"
              type="number"
              min={1}
              value={settings.min_nights_default}
              onChange={(e) => setSettings((prev) => ({ ...prev, min_nights_default: Number(e.target.value) || 1 }))}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="single-night-surcharge">1 éjszakás felár %</Label>
            <Input
              id="single-night-surcharge"
              type="number"
              min={0}
              value={settings.single_night_surcharge_percent}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  single_night_surcharge_percent: Number(e.target.value) || 0,
                }))
              }
              className="mt-2"
            />
          </div>
        </div>

        <button
          type="button"
          className={btnPrimary}
          disabled={saveSettings.isPending}
          onClick={() => saveSettings.mutate(settings)}
        >
          {saveSettings.isPending ? "Mentés…" : "Beállítások mentése"}
        </button>
      </div>

      <div className={cn(panel, "space-y-6")}>
        <div>
          <p className="eyebrow">Kiemelt időszaki árak</p>
          <p className="mt-2 text-sm text-muted-foreground">
            A megadott dátumoknál automatikusan a kiemelt ár és minimum éjszaka érvényesül.
          </p>
        </div>

        <div className="space-y-4">
          {periods.map((period, index) => (
            <div key={period.id ?? `${period.name}-${index}`} className="rounded-sm border border-border/70 bg-card/40 p-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <div className="xl:col-span-2">
                  <Label htmlFor={`period-name-${index}`}>Név</Label>
                  <Input
                    id={`period-name-${index}`}
                    value={period.name}
                    onChange={(e) => updatePeriodField(index, "name", e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor={`period-start-${index}`}>Kezdet</Label>
                  <Input
                    id={`period-start-${index}`}
                    type="date"
                    value={period.start_date}
                    onChange={(e) => updatePeriodField(index, "start_date", e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor={`period-end-${index}`}>Vége</Label>
                  <Input
                    id={`period-end-${index}`}
                    type="date"
                    value={period.end_date}
                    onChange={(e) => updatePeriodField(index, "end_date", e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor={`period-min-${index}`}>Min. éjszaka</Label>
                  <Input
                    id={`period-min-${index}`}
                    type="number"
                    min={1}
                    value={period.min_nights}
                    onChange={(e) => updatePeriodField(index, "min_nights", Number(e.target.value) || 1)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor={`period-active-${index}`}>Aktív</Label>
                  <select
                    id={`period-active-${index}`}
                    value={period.is_active === false ? "false" : "true"}
                    onChange={(e) => updatePeriodField(index, "is_active", e.target.value === "true")}
                    className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="true">Igen</option>
                    <option value="false">Nem</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor={`period-adult-${index}`}>Felnőtt / éj</Label>
                  <Input
                    id={`period-adult-${index}`}
                    type="number"
                    min={0}
                    value={period.adult_price}
                    onChange={(e) => updatePeriodField(index, "adult_price", Number(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor={`period-child-${index}`}>Gyerek / éj</Label>
                  <Input
                    id={`period-child-${index}`}
                    type="number"
                    min={0}
                    value={period.child_price}
                    onChange={(e) => updatePeriodField(index, "child_price", Number(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className={btn}
                  disabled={upsertPeriod.isPending}
                  onClick={() => upsertPeriod.mutate(period)}
                >
                  Mentés
                </button>
                {period.id && (
                  <button
                    type="button"
                    className={btn}
                    disabled={removePeriod.isPending}
                    onClick={() => removePeriod.mutate(period.id as string)}
                  >
                    <Trash2 className="size-4" /> Törlés
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className={btnPrimary}
          onClick={() =>
            setPeriods((current) => [
              ...current,
              {
                id: undefined,
                name: "Új kiemelt időszak",
                start_date: "2027-01-01",
                end_date: "2027-01-03",
                min_nights: 2,
                adult_price: 30000,
                child_price: 15000,
                is_active: true,
              },
            ])
          }
        >
          + Új kiemelt időszak
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- Calendar -------------------------------- */

function CalendarPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-blocked"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_dates")
        .select("*")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ["admin-calendar-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, guest_name, check_in, check_out, status")
        .in("status", ["confirmed", "pending"])
        .order("check_in", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async (values: { start: string; end: string; reason: string }) => {
      const { error } = await supabase.from("blocked_dates").insert({
        start_date: values.start,
        end_date: values.end,
        reason: values.reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blocked"] });
      qc.invalidateQueries({ queryKey: ["blocked-dates"] });
      toast.success("Időszak blokkolva.");
    },
    onError: () => toast.error("Nem sikerült menteni."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blocked"] });
      qc.invalidateQueries({ queryKey: ["blocked-dates"] });
      toast.success("Feloldva.");
    },
  });

  const upcomingBookings = (bookings ?? [])
    .filter((booking) => booking.status === "confirmed" && booking.check_in)
    .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())
    .slice(0, 6);

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <form
        className={cn(panel, "space-y-4")}
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const start = String(form.get("start") ?? "");
          const end = String(form.get("end") ?? "");
          if (!start || !end || end < start) {
            toast.error("Adj meg érvényes időszakot.");
            return;
          }
          add.mutate({ start, end, reason: String(form.get("reason") ?? "") });
          e.currentTarget.reset();
        }}
      >
        <p className="eyebrow">Új blokkolt időszak</p>
        <div>
          <Label htmlFor="start">Kezdet</Label>
          <Input id="start" name="start" type="date" required className="mt-2" />
        </div>
        <div>
          <Label htmlFor="end">Vége</Label>
          <Input id="end" name="end" type="date" required className="mt-2" />
        </div>
        <div>
          <Label htmlFor="reason">Megjegyzés</Label>
          <Input id="reason" name="reason" className="mt-2" placeholder="Karbantartás, saját használat…" />
        </div>
        <button type="submit" className={btnPrimary}>
          Blokkolás
        </button>
      </form>

      <div className="space-y-6">
        <div className={cn(panel, "space-y-3 p-4 sm:p-5")}>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <CalendarDays className="size-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Érkezések</p>
              <h3 className="mt-1 font-display text-2xl text-foreground">Közelgő vendégek</h3>
            </div>
          </div>

          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nincs közelgő igazolt érkezés.</p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="rounded-sm border border-border/70 bg-card/40 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">{booking.guest_name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {format(new Date(`${booking.check_in}T12:00:00`), "yyyy. MMM d.", { locale: hu })} – {format(new Date(`${booking.check_out}T12:00:00`), "yyyy. MMM d.", { locale: hu })}
                      </p>
                    </div>
                    <span className="rounded-sm bg-primary/10 px-2 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-primary">
                      {booking.status === "confirmed" ? "igazolt" : "függő"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Blokkolt időszakok</p>
          {(data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nincs blokkolt időszak.</p>
          )}
          {(data ?? []).map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-sm border border-border/70 bg-card/40 px-5 py-4"
            >
              <div>
                <p className="text-foreground">
                  {format(new Date(row.start_date), "yyyy. MMM d.", { locale: hu })} –{" "}
                  {format(new Date(row.end_date), "yyyy. MMM d.", { locale: hu })}
                </p>
                {row.reason && <p className="text-xs text-muted-foreground">{row.reason}</p>}
              </div>
              <button className={btn} onClick={() => remove.mutate(row.id)}>
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

