import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Admin-only trigger for the Fesztiválkatlan program sync. */
export const syncPrograms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    if (!isAdmin) throw new Error("Csak admin futtathatja a szinkronizálást.");

    const { syncKatlanPrograms } = await import("@/lib/katlan.server");
    return syncKatlanPrograms();
  });
