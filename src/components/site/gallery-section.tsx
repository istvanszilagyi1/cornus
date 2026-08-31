import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { listGallery } from "@/lib/gallery.functions";
import bejaratImg from "@/assets/bejárat.jpeg";
import furdőszobaImg from "@/assets/fürdőszoba.jpeg";
import furdőszobaAltImg from "@/assets/fürdőszoba2.jpeg";
import gardenViewImg from "@/assets/gardenview1.jpeg";
import gyerekSarokImg from "@/assets/gyereksarok.jpeg";
import heroTokajImg from "@/assets/hero-tokaj.jpg";
import kanapeImg from "@/assets/kanapé.jpeg";
import kitchenImg from "@/assets/konyha.jpeg";
import kitchenAltImg from "@/assets/konyha2.jpeg";
import livingRoomImg from "@/assets/nappali.jpeg";
import natureImg from "@/assets/nature.jpeg";
import nature2Img from "@/assets/nature2.jpeg";
import nature3Img from "@/assets/nature3.jpeg";
import outsideWine1Img from "@/assets/outsidewine1.jpeg";
import outsideWine2Img from "@/assets/outsidewine2.jpeg";
import wardrobeImg from "@/assets/szekrény.jpeg";
import roomsImg from "@/assets/szobák.jpeg";
import terraceImg from "@/assets/terasz.jpeg";
import terraceAltImg from "@/assets/terasz2.jpeg";
import tokajCellarImg from "@/assets/tokaj-cellar.jpg";
import tokajTownImg from "@/assets/tokaj-town.jpg";
import courtyardImg from "@/assets/udvar.jpeg";
import { Reveal, SectionHeading } from "./section";
import { cn } from "@/lib/utils";

const DEFAULTS = [
  { id: "d01", url: bejaratImg, title: "Bejárat", category: "apartman" },
  { id: "d02", url: furdőszobaImg, title: "Fürdőszoba", category: "apartman" },
  { id: "d04", url: furdőszobaAltImg, title: "Fürdőszoba 2", category: "apartman" },
  { id: "d05", url: gardenViewImg, title: "Kert és környezet", category: "apartman" },
  { id: "d06", url: gyerekSarokImg, title: "Gyereksarok", category: "apartman" },
  { id: "d07", url: heroTokajImg, title: "Tokaji szőlőhegy", category: "tokaj" },
  { id: "d08", url: kanapeImg, title: "Kanapé", category: "apartman" },
  { id: "d09", url: kitchenImg, title: "Konyha", category: "apartman" },
  { id: "d10", url: kitchenAltImg, title: "Konyha 2", category: "apartman" },
  { id: "d11", url: livingRoomImg, title: "Nappali", category: "apartman" },
  { id: "d12", url: natureImg, title: "Tokaji természet", category: "tokaj" },
  { id: "d13", url: nature2Img, title: "Kert és hegyoldal", category: "tokaj" },
  { id: "d14", url: nature3Img, title: "Nyugodt környezet", category: "tokaj" },
  { id: "d15", url: outsideWine1Img, title: "Borturizmus és táj", category: "tokaj" },
  { id: "d16", url: outsideWine2Img, title: "Naplementés környék", category: "tokaj" },
  { id: "d17", url: wardrobeImg, title: "Szekrény", category: "apartman" },
  { id: "d18", url: roomsImg, title: "Szobák", category: "apartman" },
  { id: "d19", url: terraceImg, title: "Terasz", category: "apartman" },
  { id: "d20", url: terraceAltImg, title: "Terasz 2", category: "apartman" },
  { id: "d21", url: tokajCellarImg, title: "Pince és aszú", category: "tokaj" },
  { id: "d22", url: tokajTownImg, title: "Tokaj városa", category: "tokaj" },
  { id: "d23", url: courtyardImg, title: "Udvar", category: "apartman" },
];

export function GallerySection() {
  const fetchGallery = useServerFn(listGallery);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => fetchGallery(),
  });

  const images = data?.length ? data : DEFAULTS;
  const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null;

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev === null ? 0 : (prev + 1) % images.length));
      }
      if (event.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev === null ? images.length - 1 : (prev - 1 + images.length) % images.length,
        );
      }
      if (event.key === "Escape") {
        setLightboxIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, lightboxIndex]);

  const showPrevious = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
  };

  const showNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % images.length);
  };

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
                onClick={() => setLightboxIndex(i)}
                className={cn(
                  "group relative block w-full overflow-hidden rounded-sm",
                  i % 5 === 0 ? "aspect-[3/4]" : "aspect-[4/3]",
                )}
              >
                <img
                  src={img.url}
                  alt={img.title ?? "Cornus Vendégház"}
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

      {currentImage && (
        <div
          className="animate-soft-fade fixed inset-0 z-[80] flex items-center justify-center bg-background/95 p-6 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            aria-label="Bezárás"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute top-6 right-6 text-foreground/70 transition-colors hover:text-primary"
          >
            <X className="size-7" />
          </button>

          <button
            type="button"
            aria-label="Előző kép"
            onClick={(event) => {
              event.stopPropagation();
              showPrevious();
            }}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/80 p-3 text-foreground shadow-lg transition-transform hover:scale-105 sm:left-8"
          >
            <ChevronLeft className="size-6" />
          </button>

          <button
            type="button"
            aria-label="Következő kép"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/80 p-3 text-foreground shadow-lg transition-transform hover:scale-105 sm:right-8"
          >
            <ChevronRight className="size-6" />
          </button>

          <div onClick={(event) => event.stopPropagation()} className="relative max-w-[90vw]">
            <img
              src={currentImage.url}
              alt={currentImage.title ?? "Nagyított kép"}
              className="max-h-[85vh] max-w-full rounded-sm object-contain shadow-lift"
            />
            {currentImage.title && (
              <div className="mt-4 flex items-center justify-between gap-4 text-sm text-foreground/80">
                <span className="tracking-[0.18em] uppercase">{currentImage.title}</span>
                <span>
                  {lightboxIndex + 1}/{images.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
