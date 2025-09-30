import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu, Mail, Phone, ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useInView } from "@/hooks/useInView";
import { ValuesSectionEN } from "@/components/site/en/ValuesSectionEN";
import { QualityPolicyBannerEN } from "@/components/site/en/QualityPolicyBannerEN";
import { FSSC22000BannerEN } from "@/components/site/en/FSSC22000BannerEN";
import { StructureSectionEN } from "@/components/site/en/StructureSectionEN";

const EmpresaEN = () => {
  // SEO
  useEffect(() => {
    document.title = "About the Company - Aksell";

    const desc = "Aksell has been a manufacturer of inorganic and hybrid salts since 1999. A reference in iron salts and other minerals.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About the Company - Aksell',
      url: window.location.href,
      primaryImageOfPage: {
        '@type': 'ImageObject',
        contentUrl: 'https://i.postimg.cc/VzqcvJL5/fachada-aksell.jpg',
        description: 'Aksell headquarters facade, Indaiatuba, SP'
      },
      isPartOf: {
        '@type': 'WebSite',
        name: 'Aksell',
        url: 'https://www.aksell.com.br'
      }
    });
    document.head.appendChild(ld);
    return () => {
      document.head.removeChild(ld);
    };
  }, []);

  // Contact (same mapping as home EN)
  const AREAS = [
    { value: "vendas", label: "Sales", ramal: "801", email: "vendas@aksell.com.br" },
    { value: "suporte", label: "Technical Support", ramal: "801", email: "suporte@aksell.com.br" },
    { value: "qualidade", label: "Quality", ramal: "805", email: "qualidade@aksell.com.br" },
    { value: "financeiro", label: "Finance", ramal: "803", email: "financeiro@aksell.com.br" },
    { value: "compras", label: "Purchasing", ramal: "802", email: "compras@aksell.com.br" },
    { value: "lab", label: "Lab / Development", ramal: "809", email: "lab@aksell.com.br" },
    { value: "rh", label: "Human Resources", ramal: "804", email: "rh@aksell.com.br" },
  ] as const;
  const [areaValue, setAreaValue] = useState<string>("vendas");
  const selected = AREAS.find((a) => a.value === areaValue)!;
  const phoneBase = "+55 19 3115-2800";
  const [contactOpen, setContactOpen] = useState(false);

  const { ref: heroRef, inView: heroInView } = useInView({ threshold: 0.4, once: false });
  const { ref: talkRef, inView: talkInView } = useInView({ threshold: 0.2, once: false });

  // Parallax for Mission banner
  const missionRef = useRef<HTMLDivElement | null>(null);
  const [missionBgY, setMissionBgY] = useState(50);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mq && mq.matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const el = missionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const range = 20;
      const progress = (vh / 2 - rect.top) / (vh + rect.height);
      const clamped = Math.max(-0.5, Math.min(0.5, progress));
      const y = 50 + clamped * range;
      setMissionBgY(y);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div id="top">
      <header className="sticky top-0 inset-x-0 z-[200] bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <ResponsiveContainer className="flex items-center justify-between py-2 md:py-3 mobile-safe-padding">
          <div className="flex items-center gap-4">
            <NavLink to="/auth" aria-label="Go to app login" title="Login" className="flex items-center gap-3">
              <img src="/lovable-uploads/aksell-logo-site.png" alt="Aksell logo - access login" className="h-8 md:h-10 w-auto" loading="lazy" />
            </NavLink>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-4">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink href="/site/home/en" className="px-3 py-2 text-primary hover:text-primary">Home</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink href="/site/products/en" className="px-3 py-2 text-primary hover:text-primary">Products</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink href="/site/empresa/en" className="px-3 py-2 text-primary hover:text-primary">About the company</NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <NavLink to="/site/home/pt" aria-label="Mudar para Português" title="Português" className="inline-flex">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label="Português (BR)">
                <img
                  src="https://flagcdn.com/br.svg"
                  width={20}
                  height={20}
                  alt="Português (BR)"
                  className="h-5 w-5 rounded-sm"
                  loading="lazy"
                />
              </Button>
            </NavLink>

            <Button size="sm" onClick={() => setContactOpen(true)}>
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact
              </span>
            </Button>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-4 grid gap-1">
                  <SheetClose asChild>
                    <NavLink to="/site/home/en" className="rounded-md px-3 py-2 hover:bg-accent inline-flex items-center gap-2">
                      Home
                    </NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/site/products/en" className="rounded-md px-3 py-2 hover:bg-accent inline-flex items-center gap-2">
                      Products
                    </NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/site/empresa/en" className="rounded-md px-3 py-2 hover:bg-accent inline-flex items-center gap-2">
                      About the company
                    </NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/site/home/pt" className="rounded-md px-3 py-2 hover:bg-accent inline-flex items-center gap-2">
                      <img src="https://flagcdn.com/br.svg" alt="Português (BR)" className="h-4 w-4 rounded-sm" loading="lazy" />
                      Português
                    </NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <button
                      type="button"
                      onClick={() => setContactOpen(true)}
                      className="rounded-md px-3 py-2 hover:bg-accent inline-flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" /> Contact
                    </button>
                  </SheetClose>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </ResponsiveContainer>
      </header>
      <div className="h-0 md:h-12 lg:h-12" aria-hidden="true"></div>

      {/* Contact Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-5xl w-[96vw] p-0 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Image column */}
            <div className="relative h-[260px] md:h-[420px] lg:h-[520px] overflow-hidden">
              <img
                src="https://i.postimg.cc/D7238rpD/colleagues-working-together-call-center-office-1.jpg"
                alt="Aksell customer service team at the call center"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  img.src = '/lovable-uploads/d934859e-4790-40b1-b733-5aac51de303f.png';
                }}
              />
            </div>

            {/* Dynamic content column */}
            <article className="bg-card/95 text-foreground rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-elegant ring-1 ring-primary/10 m-4">
              <h3 className="font-oswald text-primary text-3xl md:text-4xl leading-tight mb-3">Talk to our team!</h3>
              <p className="text-muted-foreground mb-6">
                Composed of technicians, chemists and engineers, we’re always ready to answer your questions or requests.
              </p>

              <div className="space-y-4">
                <label className="text-sm text-muted-foreground block">Which department would you like to contact?</label>
                <div className="flex items-center">
                  <div className="relative w-full md:w-[320px]">
                    <div className="pointer-events-none absolute left-[-40px] top-1/2 -translate-y-1/2 hidden md:flex items-center gap-[2px] text-primary" aria-hidden="true">
                      <ChevronRight className="h-4 w-4 arrow-nudge" />
                      <ChevronRight className="h-4 w-4 arrow-nudge" />
                    </div>
                    <Select value={areaValue} onValueChange={setAreaValue}>
                      <SelectTrigger className="h-12 text-base border-primary/40 focus:ring-primary w-full md:w-[320px]">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        {AREAS.map((a) => (
                          <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Phone + extension */}
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Phone className="h-4 w-4" />
                  </span>
                  <a href={`tel:${phoneBase.replace(/[^0-9]/g, '')},${selected.ramal}`} className="text-foreground underline hover:text-primary transition">
                    {phoneBase}
                  </a>
                  <span className="ml-2 inline-flex items-center rounded-md bg-muted px-3 py-1 text-sm text-primary ring-1 ring-primary/10">
                    Ext. {selected.ramal}
                  </span>
                </div>

                {/* Email line */}
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Mail className="h-4 w-4" />
                  </span>
                  <a href={`mailto:${selected.email}`} className="text-foreground underline hover:text-primary transition">
                    {selected.email}
                  </a>
                </div>
              </div>
            </article>
          </div>
        </DialogContent>
      </Dialog>

      <main>
        {/* Hero */}
        <section className={`bg-background hero-texture ${heroInView ? 'hero-texture-pan' : ''} md:-mt-8 lg:-mt-10`} ref={heroRef}>
          <ResponsiveContainer padding="sm" className="min-h-[260px] md:min-h-[320px] lg:min-h-[380px]">
            <div className="grid md:grid-cols-2 gap-10 items-center py-2">
              <div className="bg-hero-left rounded-3xl p-3 md:p-6 space-y-4">
                <h1 className="font-oswald text-3xl md:text-5xl leading-tight text-foreground">
                  Aksell has been a manufacturer of inorganic and hybrid salts since January 1999.
                </h1>
                <p className="text-muted-foreground max-w-prose">
                  Throughout its history, Aksell has become a reference in the production of iron salts and other minerals for the food industry.
                </p>
              </div>
              <div className="relative h-[240px] md:h-[320px] lg:h-[380px] w-full overflow-hidden rounded-3xl shadow-elegant">
                <img
                  src="https://i.postimg.cc/VzqcvJL5/fachada-aksell.jpg"
                  alt="Aksell facade in Indaiatuba, São Paulo"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.onerror = null;
                    img.src = '/lovable-uploads/d934859e-4790-40b1-b733-5aac51de303f.png';
                  }}
                />
              </div>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Additional institutional text */}
        <section className="bg-background">
          <ResponsiveContainer className="py-10 md:py-14">
            <article className="prose prose-neutral max-w-none text-foreground">
              <p className="first-letter:text-6xl first-letter:font-oswald first-letter:text-primary first-letter:leading-[0.8] first-letter:mr-2 first-letter:float-left">
                With units dedicated to serving the food industry and others serving several different segments, Aksell is located in Indaiatuba (25 km from Campinas and 95 km from São Paulo), one of Brazil’s best logistics hubs. Aksell has expertise in manufacturing high‑purity salts, meeting each customer’s specifications and international quality standards.
              </p>
              <p>
                Throughout its history, Aksell has become a reference in the production of iron salts and other minerals for the food industry, serving large companies operating in Brazil and abroad and supplying our ingredients and minerals to several countries.
              </p>
              <p>
                Tell us about your needs. We have several communication channels and are ready to assist you.
              </p>
            </article>
          </ResponsiveContainer>
        </section>

        {/* Mission banner with parallax */}
        <section className="bg-background">
          <ResponsiveContainer className="py-6 md:py-10">
            <div
              ref={missionRef}
              className="relative rounded-3xl overflow-hidden ring-1 ring-primary/10 bg-no-repeat bg-cover"
              style={{
                backgroundImage: "url('https://i.postimg.cc/5xdmttK7/fundo-missao-moleculas.jpg')",
                backgroundPosition: `center ${missionBgY}%`
              }}
            >
              <div className="absolute inset-0 bg-background/75" aria-hidden="true"></div>
              <div className="relative grid md:grid-cols-[0.8fr_1.2fr] gap-6 md:gap-10 items-center px-6 md:px-10 py-12 md:py-16">
                <h2 className="font-oswald text-primary text-4xl md:text-6xl leading-none">Mission</h2>
                <p className="text-foreground text-lg md:text-xl max-w-prose">
                  Create lasting value by responsibly producing and marketing salts and food ingredients — with quality, safety and trusted partnerships.
                </p>
              </div>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Our Values */}
        <ValuesSectionEN />

        {/* Quality and Food Safety Policy */}
        <QualityPolicyBannerEN />

        {/* FSSC 22000 Certification */}
        <FSSC22000BannerEN />

        {/* Structure */}
        <StructureSectionEN />

        {/* Talk to our team! */}
        <section aria-label="Talk to our team" ref={talkRef} className="bg-background">
          <ResponsiveContainer className="py-8 md:py-12">
            <div className={`${talkInView ? 'animate-fade-in opacity-100' : 'opacity-0'} motion-reduce:opacity-100 motion-reduce:animate-none grid md:grid-cols-2 gap-8 items-center`}>
              {/* Image column */}
              <div className="relative h-[360px] md:h-[460px] lg:h-[560px] rounded-[24px] md:rounded-[32px] overflow-hidden shadow-elegant">
                <img
                  src="https://i.postimg.cc/D7238rpD/colleagues-working-together-call-center-office-1.jpg"
                  alt="Aksell customer service team at the call center"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.onerror = null;
                    img.src = '/lovable-uploads/d934859e-4790-40b1-b733-5aac51de303f.png';
                  }}
                />
              </div>

              {/* Dynamic content column */}
              <article className="bg-card/95 text-foreground rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-elegant ring-1 ring-primary/10">
                <h3 className="font-oswald text-primary text-3xl md:text-4xl leading-tight mb-3">Talk to our team!</h3>
                <p className="text-muted-foreground mb-6">
                  Composed of technicians, chemists and engineers, we’re always ready to answer your questions or requests.
                </p>

                <div className="space-y-4">
                  <label className="text-sm text-muted-foreground block">Which department would you like to contact?</label>
                  <div className="flex items-center">
                    <div className="relative w-full md:w-[320px]">
                      <div className="pointer-events-none absolute left-[-40px] top-1/2 -translate-y-1/2 hidden md:flex items-center gap-[2px] text-primary" aria-hidden="true">
                        <ChevronRight className="h-4 w-4 arrow-nudge" />
                        <ChevronRight className="h-4 w-4 arrow-nudge" />
                      </div>
                      <Select value={areaValue} onValueChange={setAreaValue}>
                        <SelectTrigger className="h-12 text-base border-primary/40 focus:ring-primary w-full md:w-[320px]">
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                        <SelectContent>
                          {AREAS.map((a) => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Phone + extension */}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                      <Phone className="h-4 w-4" />
                    </span>
                    <a href={`tel:${phoneBase.replace(/[^0-9]/g, '')},${selected.ramal}`} className="text-foreground underline hover:text-primary transition">
                      {phoneBase}
                    </a>
                    <span className="ml-2 inline-flex items-center rounded-md bg-muted px-3 py-1 text-sm text-primary ring-1 ring-primary/10">
                      Ext. {selected.ramal}
                    </span>
                  </div>

                  {/* Email line */}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                      <Mail className="h-4 w-4" />
                    </span>
                    <a href={`mailto:${selected.email}`} className="text-foreground underline hover:text-primary transition">
                      {selected.email}
                    </a>
                  </div>
                </div>
              </article>
            </div>
          </ResponsiveContainer>
        </section>
      </main>
    </div>
  );
};

export default EmpresaEN;