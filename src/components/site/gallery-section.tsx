import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { listGallery } from "@/lib/gallery.functions";
import apartmentLiving from "@/assets/apartment-living.jpg";
import apartmentBedroom from "@/assets/apartment-bedroom.jpg";
import apartmentBath from "@/assets/apartment-bath.jpg";
import heroTokaj from "@/assets/hero-tokaj.jpg";
import tokajCellar from "@/assets/tokaj-cellar.jpg";
import tokajTown from "@/assets/tokaj-town.jpg";
import { Reveal, SectionHeading } from "./section";
import { cn } from "@/lib/utils";

const DEFAULTS = [
  { id: "d1", url: apartmentLiving, title: "Nappali panorámaablakkal", category: "apartman" },
  { id: "d2", url: apartmentBedroom, title: "Hálószoba", category: "apartman" },
  { id: "d3", url: apartmentBath, title: "Fürdőszoba", category: "apartman" },
  { id: "d4", url: heroTokaj, title: "Tokaji szőlőhegy", category: "tokaj" },
  { id: "d5", url: tokajCellar, title: "Pince és aszú", category: "tokaj" },
  { id: "d6", url: tokajTown, title: "Tokaj városa", category: "tokaj" },
];

export function GallerySection() {
  const fetchGallery = useServerFn(listGallery);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => fetchGallery(),
  });

  const images = data?.length ? data : DEFAULTS;

  return (
    <section id="galeria" className="relative border-t border-border/50 py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Galéria"
          title="Pillanatképek a Cornusból"
          lead="A terek, a fények és a táj, ami körülvesz."
          align="center"
        />

        <div className="mt-16 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {images.map((img, i) => (
            <Reveal key={img.id} delay={(i % 3) * 100}>
              <button
                type="button"
                onClick={() => setLightbox(img.url)}
                className={cn(
                  "group relative block w-full overflow-hidden rounded-sm",
                  i % 5 === 0 ? "aspect-[3/4]" : "aspect-[4/3]",
                )}
              >
                <img
                  src={img.url}
                  alt={img.title ?? "Cornus Apartman"}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-[1400ms] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-background/40 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                {img.title && (
                  <span className="absolute bottom-4 left-4 translate-y-3 text-xs tracking-[0.25em] text-foreground uppercase opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    {img.title}
                  </span>
                )}
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {lightbox && (
        <div
          className="animate-soft-fade fixed inset-0 z-[80] flex items-center justify-center bg-background/95 p-6 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Bezárás"
            className="absolute top-6 right-6 text-foreground/70 transition-colors hover:text-primary"
          >
            <X className="size-7" />
          </button>
          <img
            src={lightbox}
            alt="Nagyított kép"
            className="max-h-[85vh] max-w-full rounded-sm object-contain shadow-lift"
          />
        </div>
      )}
    </section>
  );
}
