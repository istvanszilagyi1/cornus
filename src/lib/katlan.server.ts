/** Shared helper for pulling Tokaji Fesztiválkatlan programs into the database. */

export type ParsedProgram = {
  external_id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  starts_at?: string | null;
  date_text?: string | null;
  image_url?: string | null;
  source_url?: string | null;
};

const SOURCE_PAGE = "https://fesztivalkatlan.hu/";
const SOURCE_API = "https://fesztivalkatlan.hu/wp-json/wp/v2";

function absolutize(url: string | null | undefined, base: string) {
  if (!url) return null;
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

function stripHtml(value?: string | null) {
  if (!value) return null;
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWordPressMediaImage(mediaId: number | null | undefined) {
  if (!mediaId) return null;

  try {
    const res = await fetch(`${SOURCE_API}/media/${mediaId}?_fields=id,source_url,media_details`, {
      headers: { "User-Agent": "CornusApartman/1.0 (+program sync)" },
    });
    if (!res.ok) return null;

    const payload = (await res.json()) as {
      source_url?: string | null;
      media_details?: { sizes?: Record<string, { source_url?: string | null }> };
    };

    return (
      payload.source_url ??
      payload.media_details?.sizes?.large?.source_url ??
      payload.media_details?.sizes?.full?.source_url ??
      null
    );
  } catch {
    return null;
  }
}

/** Fetches the Fesztiválkatlan events via the site's WordPress REST API. */
export async function fetchKatlanPrograms(): Promise<ParsedProgram[]> {
  const pageRes = await fetch(`${SOURCE_API}/musorok?per_page=40&_fields=id,slug,title,content,link,date,featured_media&order=desc&orderby=date`, {
    headers: { "User-Agent": "CornusApartman/1.0 (+program sync)" },
  });
  if (!pageRes.ok) throw new Error(`A forrásoldal nem elérhető (${pageRes.status})`);

  const payload = (await pageRes.json()) as Array<{
    id?: number;
    slug?: string;
    title?: { rendered?: string } | string;
    content?: { rendered?: string } | string;
    link?: string;
    date?: string | null;
    featured_media?: number | null;
  }>;

  if (!Array.isArray(payload)) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const programs = await Promise.all(
    payload.map(async (item) => {
      const title = typeof item.title === "string" ? item.title : item.title?.rendered ?? "";
      const description = typeof item.content === "string" ? item.content : item.content?.rendered ?? "";
      const cleanTitle = stripHtml(title)?.trim();
      if (!cleanTitle) return null;

      const startsAt = item.date ?? null;
      const eventDate = startsAt ? new Date(startsAt) : null;
      if (eventDate && !Number.isNaN(eventDate.getTime()) && eventDate < today) return null;

      const image_url = await fetchWordPressMediaImage(item.featured_media ?? null);

      return {
        external_id: `katlan:${item.id ?? item.slug ?? cleanTitle.toLowerCase().replace(/\s+/g, "-").slice(0, 80)}`,
        title: cleanTitle,
        description: stripHtml(description) ?? null,
        location: "Tokaji Fesztiválkatlan",
        starts_at: startsAt,
        date_text: startsAt ? new Date(startsAt).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" }) : null,
        image_url: image_url ? absolutize(image_url, SOURCE_PAGE) : null,
        source_url: item.link ? absolutize(item.link, SOURCE_PAGE) ?? SOURCE_PAGE : SOURCE_PAGE,
      } satisfies ParsedProgram;
    }),
  );

  return (programs.filter(Boolean) as ParsedProgram[]).sort((a, b) => {
    const aTime = a.starts_at ? new Date(a.starts_at).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.starts_at ? new Date(b.starts_at).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}

/** Upserts the parsed programs; returns how many rows were written. */
export async function syncKatlanPrograms() {
  const programs = await fetchKatlanPrograms();
  if (!programs.length) return { count: 0 };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const deduped = new Map<string, ParsedProgram>();
  for (const program of programs) {
    deduped.set(program.external_id, program);
  }

  const rows = [...deduped.values()].map((p) => ({
    title: p.title,
    description: p.description ?? null,
    location: p.location ?? "Tokaji Fesztiválkatlan",
    starts_at: p.starts_at ?? null,
    date_text: p.date_text ?? null,
    image_url: p.image_url ?? null,
    source_url: p.source_url ?? SOURCE_PAGE,
    source: "fesztivalkatlan",
    external_id: p.external_id,
  }));

  const { error } = await supabaseAdmin
    .from("programs")
    .upsert(rows, { onConflict: "external_id" });
  if (error) throw new Error(error.message);

  return { count: rows.length };
}
