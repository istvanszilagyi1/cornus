import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/site-nav";
import { Hero } from "@/components/site/hero";
import { AboutSection } from "@/components/site/about-section";
import { ProgramsSection } from "@/components/site/programs-section";
import { GallerySection } from "@/components/site/gallery-section";
import { BookingSection } from "@/components/site/booking-section";
import { ContactSection, SiteFooter } from "@/components/site/contact-section";
import { trackPageView } from "@/lib/analytics";

const TITLE = "Cornus Vendégház Tokaj – foglalás, programok, galéria";
const DESCRIPTION =
  "A Cornus Vendégház Tokajban: design belső terek, panorámás terasz, online foglalás és a Fesztiválkatlan aktuális programjai.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    trackPageView(window.location.pathname, { title: TITLE });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main>
        <Hero />
        <AboutSection />
        <ProgramsSection />
        <GallerySection />
        <BookingSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  );
}
