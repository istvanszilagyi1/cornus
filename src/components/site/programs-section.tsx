import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import festivalKatlan from "@/assets/festival-katlan.jpg";
import tokajCellar from "@/assets/tokaj-cellar.jpg";
import tokajTown from "@/assets/tokaj-town.jpg";
import { Reveal, SectionHeading } from "./section";

const FALLBACK_IMAGES = [festivalKatlan, tokajCellar, tokajTown];

const BASE_PROGRAMS = [
  {
    title: "Pincelátogatás és aszúkóstoló",
    description:
      "A történelmi pincesorok néhány percre vannak az apartmantól. Szívesen segítünk időpontot foglalni.",
    location: "Tokaji pincesor",
    date_text: "Egész évben",
  },
  {
    title: "Csónakázás a Bodrogon",
    description: "Naplementés evezés a Tisza-torkolatig, helyi túravezetővel.",
    location: "Bodrog-part",
    date_text: "Április – október",
  },
  {
    title: "Kopasz-hegyi kilátótúra",
    description: "Másfél órás séta a szőlősorok között, panorámával a Tokaji-hegyre.",
    location: "Tokaji Kopasz-hegy",
    date_text: "Egész évben",
  },
] as const;

const KATLAN_PROGRAM_LINK = "https://fesztivalkatlan.hu/musor/";

export function ProgramsSection() {
  return (
    <section id="programok" className="relative border-t border-border/50 py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        
        {/* Felső rész: Fesztiválkatlan dinamikus programok */}
        <div className="flex flex-wrap items-end justify-between gap-8 mb-12">
          <SectionHeading
            eyebrow="Aktuális"
            title="A Fesztiválkatlan műsora"
            lead="Nézd meg a legújabb eseményeket, amiket a Tokaji Fesztiválkatlan kínál a közeljövőben."
          />
          <Reveal delay={120}>
            <a
              href="https://fesztivalkatlan.hu/musor/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs tracking-[0.25em] text-primary uppercase transition-opacity hover:opacity-70"
            >
              Fesztiválkatlan <ExternalLink className="size-3.5" />
            </a>
          </Reveal>
        </div>

        {/* Új, letisztult link a kártyák helyett */}
        <div className="mb-24">
          <Reveal delay={90}>
            <a
              href={KATLAN_PROGRAM_LINK}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-3 text-lg font-medium text-foreground transition-colors hover:text-primary"
            >
              <CalendarDays className="size-5 text-primary" />
              <span>Itt nézheted meg a műsort és vásárolhatsz jegyet a programokra</span>
              <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          </Reveal>
        </div>

        {/* Alsó rész: Fix, állandó helyi programok */}
        <div className="flex flex-wrap items-end justify-between gap-8 mt-16 mb-12 border-t border-border/50 pt-16">
          <SectionHeading
            eyebrow="Állandó"
            title="Helyi élmények és programok"
            lead="Fedezd fel Tokaj állandó szépségeit a pincelátogatásoktól kezdve a természetjárásig."
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BASE_PROGRAMS.map((p, i) => (
            <Reveal key={p.title} delay={i * 90}>
              <article className="group flex h-full flex-col justify-between rounded-sm border border-border/70 bg-card/30 p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/50">
                <div>
                  <p className="flex items-center gap-2 text-xs tracking-[0.2em] text-primary uppercase">
                    <CalendarDays className="size-3.5" /> {p.date_text}
                  </p>
                  <h3 className="mt-3 font-display text-xl leading-tight text-foreground">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                </div>
                <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 text-primary" /> {p.location}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}