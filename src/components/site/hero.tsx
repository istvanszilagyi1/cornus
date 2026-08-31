import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import heroTokaj from "@/assets/hero-tokaj.jpg";
import nappali from "@/assets/nappali.jpeg";
import tokajCellar from "@/assets/tokaj-cellar.jpg";
import tokajTown from "@/assets/tokaj-town.jpg";
import gardenview1 from "@/assets/gardenview1.jpeg";
import nature from "@/assets/nature.jpeg";
import outsidewine1 from "@/assets/outsidewine1.jpeg";
import outsidewine2 from "@/assets/outsidewine2.jpeg";
import { cn } from "@/lib/utils";

const FRAMES = [
  { src: heroTokaj, alt: "Tokaji szőlőhegy aranyló őszi fényben" },
  { src: gardenview1, alt: "A Cornus kertje és a környező természet" },
  { src: outsidewine1, alt: "Tokaj környező borospincék és szőlőhegyek" },
  { src: outsidewine2, alt: "A környék nyugodt, borostyán színű hangulata" },
  { src: nature, alt: "A tokaji táj északi, nyugodt része" },
  { src: nappali, alt: "A Cornus Vendégház nappalija panorámaablakkal" },
  { src: tokajCellar, alt: "Tokaji pince hordókkal és aszúval" },
  { src: tokajTown, alt: "Tokaj városa a folyópartról" },
];

/** Cinematic looping "film" hero: crossfading Ken Burns frames behind the wordmark. */
export function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % FRAMES.length), 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="top" className="relative h-[100svh] min-h-[620px] w-full overflow-hidden">
      <div className="absolute inset-0">
        {FRAMES.map((frame, i) => (
          <img
            key={frame.src}
            src={frame.src}
            alt={frame.alt}
            width={1920}
            height={1088}
            {...(i === 0 ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-[2000ms] ease-out",
              i === index ? "animate-kenburns opacity-100" : "opacity-0",
            )}
          />
        ))}
      </div>

      <div className="bg-veil absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,oklch(0.12_0.01_70/0.7)_100%)]" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow animate-soft-fade">Tokaj · Magyarország</p>

        <h1 className="animate-fade-up mt-6 font-display text-[clamp(3.5rem,15vw,11rem)] leading-[0.85] tracking-[0.12em] text-foreground">
          CORNUS
        </h1>

        <div className="hairline animate-reveal mt-6 w-40 sm:w-64" />

        <p
          className="animate-fade-up mt-6 max-w-xl text-sm leading-relaxed tracking-[0.22em] text-foreground/80 uppercase sm:text-base"
          style={{ animationDelay: "260ms" }}
        >
          Vendégház a szőlőhegy és a folyó között
        </p>

        <div
          className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-4"
          style={{ animationDelay: "420ms" }}
        >
          <a
            href="#foglalas"
            className="rounded-sm bg-primary px-8 py-3.5 text-xs tracking-[0.28em] text-primary-foreground uppercase transition-all duration-300 hover:shadow-glow hover:brightness-110"
          >
            Foglalás
          </a>
          <a
            href="#vendeghaz"
            className="rounded-sm border border-foreground/30 px-8 py-3.5 text-xs tracking-[0.28em] text-foreground uppercase backdrop-blur-sm transition-colors duration-300 hover:border-primary hover:text-primary"
          >
            A vendégház
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <ChevronDown className="animate-float size-6 text-primary/80" />
      </div>

      <div className="absolute bottom-8 right-8 z-10 hidden gap-2 md:flex">
        {FRAMES.map((frame, i) => (
          <span
            key={frame.src}
            className={cn(
              "h-px w-8 transition-all duration-500",
              i === index ? "bg-primary" : "bg-foreground/25",
            )}
          />
        ))}
      </div>
    </section>
  );
}
