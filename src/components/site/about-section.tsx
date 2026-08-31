import { BedDouble, Wifi, Coffee, Car, Wine, Sparkles } from "lucide-react";
import gardenview1 from "@/assets/gardenview1.jpeg";
import nature from "@/assets/nature.jpeg";
import nappali from "@/assets/nappali.jpeg";
import outsidewine1 from "@/assets/outsidewine1.jpeg";
import outsidewine2 from "@/assets/outsidewine2.jpeg";
import { Reveal, SectionHeading } from "./section";
import { SITE } from "@/lib/site";

const FEATURES = [
  { icon: BedDouble, label: "2 hálótér", note: "4 fő részére" },
  { icon: Wifi, label: "Gyors wifi", note: "külön munkasarok" },
  { icon: Coffee, label: "Teljes konyha", note: "eszpresszógép" },
  { icon: Car, label: "Zárt parkoló", note: "az udvarban" },
  { icon: Sparkles, label: "Panorámás terasz", note: "a szőlőre néz" },
];

const APARTMENT_DETAILS = [
  {
    title: "Elhelyezés & Szobák",
    items: [
      "6+2 fő elhelyezése lehetséges 2 szobában + galérián.",
      "Földszinti szoba: 1 db franciaágy (160x200 cm).",
      "Emelet (4 fő): 1 db franciaágy (160x200 cm) és 2 db egyszemélyes ágy (90x200 cm).",
      "Galéria: 1 db kihúzhatós kanapé (kihúzva 160x200 cm).",
    ],
  },
  {
    title: "Nappali & Kényelem",
    items: [
      "Hangulatos, nagy belmagasságú nappali tágas kanapéval.",
      "Nagy Smart TV, díjmentes Netflix előfizetés, vezeték nélküli internet (Wi-Fi).",
      "Klímaberendezés és hangulatos csempekandalló a fűtéshez.",
    ],
  },
  {
    title: "Maximálisan felszerelt konyha & Étkező",
    items: [
      "14 terítékes mosogatógép, Bialetti kávéfőző, kenyérpirító, főzőlap, vízforraló, kombinált hűtő, étkező.",
    ],
  },
  {
    title: "Fürdő & Helyiségek",
    items: [
      "Előtér beépített szekrényekkel.",
      "Fürdőszoba zuhanyzóval és hidromasszázs káddal, plusz egy külön WC.",
    ],
  },
  {
    title: "Terasz, Udvar & Wellness",
    items: [
      "15 nm-es fedett, hangulatos terasz 6 fős rattan ülővel és étkezővel.",
      "Wellness: Fatüzelésű tölgyfa dézsa.",
      "Kert: Szalonnasütő-bográcsozó és grillező.",
      "Kerti játékok: Pingpong asztal, tollaslabda, homokozó.",
      "Udvar: 3000 nm-es, zúzottköves kivilágított bejáróval (több autó részére). Hegyoldali, teraszos fásított kert, magasabb pontján panorámás kiülővel és kerti paddal.",
    ],
  },
  {
    title: "Gyerekbarát & Állatbarát felszereltség",
    items: [
      "Teljesen gyerekbarát: kiságy, babakád, etetőszék, gyereksarok játékokkal.",
      "Állatbarát: maximum 1 kistestű kutyát tudunk fogadni.",
    ],
  },
  {
    title: "Elhelyezkedés",
    items: [
      "Tokaj üdülőövezetében, csendes zöldövezetben, távol a város zajától, de mindössze 15–20 perc gyalogos távolságra a belvárostól.",
    ],
  },
];

export function AboutSection() {
  return (
    <section
      id="vendeghaz"
      className="relative overflow-hidden border-t border-border/50 py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* HEADER */}
        <Reveal>
          <div className="max-w-3xl">
            <SectionHeading
              eyebrow="A vendégház"
              title="Csend, kő, fa és aranyszínű fény"
              lead="A Cornus a tokaji óváros szélén, néhány perc sétára a Bodrog partjától. Kortárs terek, természetes anyagok és nagy ablakok, amelyeken túl a szőlősorok futnak fel a hegyre. Egy hosszú kóstoló után ide érdemes hazaérni."
            />
          </div>
        </Reveal>

        {/* FEATURES */}
        <Reveal
          delay={100}
          className="mt-12 border-y border-border/60 py-7 md:mt-14 md:py-8"
        >
          <div className="grid grid-cols-2 justify-items-center gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-8">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="group flex items-center gap-3 lg:flex lg:flex-col lg:items-center lg:text-center"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card/40 transition-all duration-300 group-hover:border-primary/50 group-hover:bg-primary/5">
                  <f.icon className="size-4 text-primary transition-transform duration-300 group-hover:-translate-y-0.5" />
                </div>

                <div className="lg:mt-3">
                  <p className="text-sm text-foreground">{f.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {f.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* MAIN CONTENT */}
        <div className="mt-14 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14 xl:gap-20">
          {/* IMAGE GALLERY */}
          <div className="w-full">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {/* Main image */}
              <Reveal className="col-span-2 overflow-hidden rounded-sm">
                <div className="aspect-[16/10]">
                  <img
                    src={gardenview1}
                    alt="A Cornus kertje és környező táj"
                    loading="lazy"
                    width={1600}
                    height={1072}
                    className="size-full object-cover transition-transform duration-[1200ms] hover:scale-105"
                  />
                </div>
              </Reveal>

              {/* Bedroom */}
              <Reveal
                delay={120}
                className="overflow-hidden rounded-sm"
              >
                <div className="aspect-[4/5]">
                  <img
                    src={nappali}
                    alt="Cornus vendégház nappali részlete"
                    loading="lazy"
                    width={1600}
                    height={1067}
                    className="size-full object-cover object-center transition-transform duration-[1200ms] hover:scale-105"
                  />
                </div>
              </Reveal>

              {/* Living room detail */}
              <Reveal
                delay={180}
                className="overflow-hidden rounded-sm"
              >
                <div className="aspect-[4/5]">
                  <img
                    src={nature}
                    alt="Tokaji borvidék és szőlőhegy részlet"
                    loading="lazy"
                    width={1600}
                    height={1072}
                    className="size-full object-cover object-[65%_center] transition-transform duration-[1200ms] hover:scale-105"
                  />
                </div>
              </Reveal>

              {/* Wide secondary image */}
              <Reveal
                delay={240}
                className="col-span-2 overflow-hidden rounded-sm"
              >
                <div className="aspect-[16/7]">
                  <img
                    src={outsidewine2}
                    alt="Tokaji környék napsütötte, borostyán színű látképe"
                    loading="lazy"
                    width={1600}
                    height={1067}
                    className="size-full object-cover object-[35%_center] transition-transform duration-[1200ms] hover:scale-105"
                  />
                </div>
              </Reveal>
            </div>
          </div>

          {/* DETAILS */}
          <div>
            <Reveal>
              <div className="border-b border-border/60 pb-5">
                <p className="eyebrow">Részletes felszereltség</p>

                <h3 className="mt-2 font-display text-2xl text-foreground md:text-3xl">
                  Minden, amire szüksége lehet
                </h3>
              </div>
            </Reveal>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {APARTMENT_DETAILS.map((section, index) => (
                <Reveal
                  key={section.title}
                  delay={80 + index * 35}
                  className={`group rounded-sm border border-border/60 bg-card/25 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-card/50 md:p-5 ${
                    index === APARTMENT_DETAILS.length - 1
                      ? "sm:col-span-2"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <span className="shrink-0 pt-0.5 font-display text-xl leading-none text-primary/40 transition-colors duration-300 group-hover:text-primary/70">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-primary md:text-sm">
                        {section.title}
                      </h4>

                      <ul className="mt-3 space-y-2 text-sm leading-5.5 text-foreground/85">
                        {section.items.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span
                              aria-hidden="true"
                              className="mt-[0.55rem] size-1.5 shrink-0 rounded-full bg-primary"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}