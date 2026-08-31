export const SITE = {
  name: "Cornus Vendégház",
  short: "Cornus",
  town: "Tokaj",
  tagline: "Vendégház a szőlőhegy és a folyó között",
  address: "3910 Tokaj, Jeddi-Fejér Andor utca 31.",
  phone: "Horváth-Katona Fruzsina (+36 70 368 2132), Horváth Gergő (+36 70 621 2582)",
  email: "cornustokaj@gmail.com",
  taxNumber: "92026449-1-29",
  ntakNumber: "(placeholder meglévő mezővel)",
  maxGuests: 8,
  pricePerNight: 38000,
} as const;

export const NAV_LINKS = [
  { id: "vendeghaz", label: "Vendégház" },
  { id: "programok", label: "Programok" },
  { id: "galeria", label: "Galéria" },
  { id: "foglalas", label: "Foglalás" },
  { id: "kapcsolat", label: "Kapcsolat" },
] as const;

export function formatHuf(value: number) {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(value);
}
