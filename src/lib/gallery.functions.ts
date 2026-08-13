import { createServerFn } from "@tanstack/react-start";

export type GalleryItem = {
  id: string;
  url: string;
  title: string | null;
  category: string;
};

/**
 * Public gallery listing. Uploaded images live in a private bucket, so the
 * server signs short-lived URLs for them before sending them to the browser.
 */
export const listGallery = createServerFn({ method: "GET" }).handler(async (): Promise<GalleryItem[]> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("gallery_images")
    .select("id, storage_path, external_url, title, category, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  if (!data?.length) return [];

  const paths = data.filter((row) => row.storage_path).map((row) => row.storage_path as string);
  const signedMap = new Map<string, string>();

  if (paths.length) {
    const { data: signed } = await supabaseAdmin.storage
      .from("cornus")
      .createSignedUrls(paths, 60 * 60 * 6);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) signedMap.set(item.path, item.signedUrl);
    }
  }

  return data
    .map((row) => {
      const url = row.storage_path
        ? (signedMap.get(row.storage_path) ?? null)
        : (row.external_url ?? null);
      if (!url) return null;
      return { id: row.id, url, title: row.title, category: row.category } satisfies GalleryItem;
    })
    .filter((item): item is GalleryItem => item !== null);
});
