import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { claimFirstAdmin } from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TITLE = "Szállásadói belépés – Cornus Apartman";
const DESCRIPTION = "Bejelentkezés a Cornus Apartman foglaláskezelő felületére.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const claim = useServerFn(claimFirstAdmin);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Fiók létrehozva. Erősítsd meg az e-mail címedet, majd lépj be.");
      setMode("signin");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error("Hibás e-mail vagy jelszó.");
      return;
    }

    try {
      const result = await claim();
      if (result.granted) toast.success("Admin jogosultság aktiválva.");
    } catch {
      /* an admin already exists – nothing to do */
    }

    setLoading(false);
    navigate({ to: "/admin" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center">
          <span className="font-display text-3xl tracking-[0.32em] text-foreground">CORNUS</span>
        </Link>
        <div className="hairline mx-auto mt-6 w-24" />

        <h1 className="mt-8 text-center font-display text-3xl text-foreground">
          {mode === "signin" ? "Szállásadói belépés" : "Fiók létrehozása"}
        </h1>

        <form
          onSubmit={onSubmit}
          className="animate-fade-up mt-8 space-y-5 rounded-sm border border-border/70 bg-card/50 p-7"
        >
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required className="mt-2" />
          </div>
          <div>
            <Label htmlFor="password">Jelszó</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-primary px-6 py-3.5 text-xs tracking-[0.28em] text-primary-foreground uppercase transition-all hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Egy pillanat…" : mode === "signin" ? "Belépés" : "Regisztráció"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-center text-xs tracking-[0.2em] text-muted-foreground uppercase transition-colors hover:text-primary"
          >
            {mode === "signin" ? "Még nincs fiókom" : "Van már fiókom"}
          </button>
        </form>
      </div>
    </div>
  );
}
