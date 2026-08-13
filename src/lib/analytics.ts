import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEventType = "page_view" | "booking_started" | "booking_completed";

export type AnalyticsEvent = {
  id?: string;
  type: AnalyticsEventType;
  path?: string;
  title?: string;
  referrer?: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
};

const LOCAL_ANALYTICS_KEY = "cornus-analytics-events";
const PAGE_VIEW_SESSION_KEY = "cornus-page-view";
const BOOKING_START_SESSION_KEY = "cornus-booking-started";

function getStoredEvents(): AnalyticsEvent[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_ANALYTICS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function setStoredEvents(events: AnalyticsEvent[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify(events.slice(-500)));
  } catch {
    // Ignore local storage write errors.
  }
}

async function persistEvent(event: AnalyticsEvent) {
  const payload = {
    ...event,
    created_at: event.created_at ?? new Date().toISOString(),
    metadata: event.metadata ?? {},
  };

  if (typeof window !== "undefined") {
    const current = getStoredEvents();
    setStoredEvents([...current, payload]);
  }

  try {
    const { error } = await supabase.from("analytics_events").insert({
      type: payload.type,
      path: payload.path ?? null,
      title: payload.title ?? null,
      referrer: payload.referrer ?? null,
      created_at: payload.created_at,
      metadata: payload.metadata,
    });

    if (error) {
      console.warn("Analytics insert failed", error.message);
    }
  } catch {
    // Supabase may not be configured or the table may not yet exist.
  }
}

export async function getAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  try {
    const { data, error } = await supabase
      .from("analytics_events")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && Array.isArray(data)) {
      return data as AnalyticsEvent[];
    }
  } catch {
    // Fallback to local storage below.
  }

  return getStoredEvents();
}

function markSessionFlag(key: string) {
  if (typeof window === "undefined") return false;

  try {
    const current = JSON.parse(window.sessionStorage.getItem(key) ?? "{}") as Record<string, number>;
    const today = new Date().toISOString().slice(0, 10);
    const count = current[today] ?? 0;

    if (count > 0) {
      return false;
    }

    current[today] = count + 1;
    window.sessionStorage.setItem(key, JSON.stringify(current));
    return true;
  } catch {
    return false;
  }
}

export function trackPageView(path: string, meta: Partial<AnalyticsEvent> = {}) {
  const nextPath = path || "/";
  if (!markSessionFlag(`${PAGE_VIEW_SESSION_KEY}:${nextPath}`)) {
    return;
  }

  void persistEvent({
    type: "page_view",
    path: nextPath,
    title: meta.title,
    referrer: meta.referrer,
    metadata: meta.metadata ?? {},
  });
}

export function trackBookingStart(meta: Partial<AnalyticsEvent> = {}) {
  if (!markSessionFlag(BOOKING_START_SESSION_KEY)) {
    return;
  }

  void persistEvent({
    type: "booking_started",
    path: meta.path,
    title: meta.title,
    referrer: meta.referrer,
    metadata: meta.metadata ?? {},
  });
}
