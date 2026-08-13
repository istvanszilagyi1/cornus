import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-border/60 bg-background/85 py-3 backdrop-blur-xl"
          : "py-6",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <a href="#top" className="group flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-[0.32em] text-foreground">
            CORNUS
          </span>
          <span className="hidden text-[0.62rem] tracking-[0.4em] text-primary uppercase sm:block">
            {SITE.town}
          </span>
        </a>

        <div className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="relative text-sm tracking-wide text-muted-foreground transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:text-foreground hover:after:origin-left hover:after:scale-x-100"
            >
              {link.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          aria-label="Menü"
          onClick={() => setOpen((v) => !v)}
          className="text-foreground md:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {open && (
        <div className="animate-fade-up border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setOpen(false)}
                className="py-2 text-sm tracking-wide text-muted-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
