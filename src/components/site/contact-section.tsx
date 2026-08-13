import { Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/site";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Reveal, SectionHeading } from "./section";

function LegalDocumentModal({ title, triggerLabel, pdfUrl, children }: { title: string; triggerLabel: string; pdfUrl?: string; children?: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="inline-flex items-center text-primary underline-offset-4 hover:underline">
          {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-none overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Olvassa el a teljes dokumentumot a foglalás előtt.</DialogDescription>
        </DialogHeader>

        {pdfUrl ? (
          <div className="space-y-3">
            <div className="flex justify-end">
              <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                PDF megnyitása új lapon
              </a>
            </div>
            <iframe
              title={title}
              src={pdfUrl}
              className="h-[75vh] min-h-[540px] w-full rounded-md border border-border bg-white"
            />
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-sm leading-7 text-foreground/90">
            {children}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function LegalModalLink({ label, title, pdfUrl, children }: { label: string; title: string; pdfUrl?: string; children?: React.ReactNode }) {
  return (
    <LegalDocumentModal title={title} triggerLabel={label} pdfUrl={pdfUrl}>
      {children}
    </LegalDocumentModal>
  );
}

export function ContactSection() {
  return (
    <section id="kapcsolat" className="relative border-t border-border/50 py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Kapcsolat"
              title="Írj nekünk, mielőtt útnak indulsz"
              lead="Szívesen segítünk pincelátogatás, transzfer vagy programajánló ügyében."
            />

            <Reveal delay={120} className="mt-10 space-y-5">
              <div className="space-y-1">
                <a
                  href="tel:+36703682132"
                  className="group flex items-center gap-4 text-foreground transition-colors hover:text-primary"
                >
                  <Phone className="size-5 text-primary" />
                  <span className="text-lg">Horváth-Katona Fruzsina: +36 70 368 2132</span>
                </a>
                <a
                  href="tel:+36706212582"
                  className="group flex items-center gap-4 text-foreground transition-colors hover:text-primary"
                >
                  <Phone className="size-5 text-primary" />
                  <span className="text-lg">Horváth Gergő: +36 70 621 2582</span>
                </a>
              </div>
              <a
                href={`mailto:${SITE.email}`}
                className="group flex items-center gap-4 text-foreground transition-colors hover:text-primary"
              >
                <Mail className="size-5 text-primary" />
                <span className="text-lg">{SITE.email}</span>
              </a>
              <p className="flex items-center gap-4 text-muted-foreground">
                <MapPin className="size-5 text-primary" />
                <span className="text-lg">{SITE.address}</span>
              </p>
            </Reveal>

            <Reveal delay={150} className="mt-8 rounded-sm border border-border/70 bg-card/40 p-5 text-sm text-muted-foreground">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-primary">Érkezés</p>
                  <p className="mt-2 text-base font-medium text-foreground">15:00 – 16:00</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-primary">Távozás</p>
                  <p className="mt-2 text-base font-medium text-foreground">10:00</p>
                </div>
              </div>
              <p className="mt-4 text-sm italic text-foreground/80">
                Eltérő időpontban telefonos vagy e-mail-es egyeztetést követően lehetséges!
              </p>
            </Reveal>
          </div>

          <Reveal delay={160} className="overflow-hidden rounded-sm border border-border/70">
            <iframe
              title="Tokaj térkép"
              src="https://www.openstreetmap.org/export/embed.html?bbox=21.38%2C48.11%2C21.44%2C48.14&layer=mapnik&marker=48.1234%2C21.4090"
              className="h-[420px] w-full grayscale-[0.4]"
              loading="lazy"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-center">
        <p className="font-display text-xl tracking-[0.32em] text-foreground">CORNUS</p>
        <div className="hairline w-32" />
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs tracking-[0.18em] text-muted-foreground uppercase">
          <LegalModalLink label="Házirend" title="Házirend" pdfUrl="/hazirend.pdf">
            <h3 className="mt-4 text-base font-semibold text-foreground">Házirend</h3>
            <p className="mt-3">A vendégház használata során kérjük, a vendégek tartózkodjanak a szálláshely rendjéhez és a környezet tiszteletben tartásához.</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>A vendégek az érkezés és a távozás időpontjának betartásával használhatják a szállást.</li>
              <li>Kérjük, a helyiségekben a csendet és a környezetet tiszteletben tartsák.</li>
              <li>A vendégházban a dohányzást csak a kijelölt helyen engedélyezzük.</li>
              <li>Az eszközök és a berendezések rendeltetésszerű használata kötelező.</li>
              <li>Az itt tartózkodó állatokat a házirend szerint kell kezelni.</li>
            </ul>
          </LegalModalLink>
          <span aria-hidden="true">·</span>
          <LegalModalLink label="Adatkezelési Tájékoztató" title="Adatkezelési Tájékoztató" pdfUrl="/adatkezelesi.pdf">
            <h3 className="mt-4 text-base font-semibold text-foreground">Adatkezelési Tájékoztató</h3>
            <p className="mt-3">A foglalási kérelmek feldolgozása céljából a megadott név, e-mail és telefonszám adatait kezeljük, kizárólag a szállásfoglalás, visszaigazolás és kapcsolattartás céljára.</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Az adatokat a foglalás lebonyolításához, a vendégkapcsolat és a visszaigazolás céljából kezeljük.</li>
              <li>Az adatokat csak a szálláshely üzemeltetője és az adott foglalással összefüggő, jogszabály által engedélyezett személyek láthatják.</li>
              <li>A vendég bármikor kérheti adatai módosítását vagy törlését, a megadott e-mailen keresztül.</li>
            </ul>
          </LegalModalLink>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[0.58rem] tracking-[0.2em] text-muted-foreground/80 uppercase">
          <span>Adószám: {SITE.taxNumber}</span>
          <span aria-hidden="true">|</span>
          <span>NTAK szám: {SITE.ntakNumber}</span>
        </div>
        <p className="mt-3 text-xs tracking-[0.25em] text-muted-foreground uppercase">
          {SITE.town} · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
