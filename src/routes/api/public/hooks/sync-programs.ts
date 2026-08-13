import { createFileRoute } from "@tanstack/react-router";

/** Cron endpoint: refreshes the Fesztiválkatlan program list. */
export const Route = createFileRoute("/api/public/hooks/sync-programs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        if (!apikey || apikey !== process.env["SUPABASE_PUBLISHABLE_KEY"]) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const { syncKatlanPrograms } = await import("@/lib/katlan.server");
          const result = await syncKatlanPrograms();
          return new Response(JSON.stringify({ success: true, ...result }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("sync-programs failed", err);
          return new Response(
            JSON.stringify({ success: false, error: (err as Error).message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
