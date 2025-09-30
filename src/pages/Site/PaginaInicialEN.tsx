import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, Mail, Search, Phone, ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useInView } from "@/hooks/useInView";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const PaginaInicialEN = () => {
  useEffect(() => {
    document.title = "Aksell - Home";

    const desc = "Specialty ingredients for the food and agricultural industries. Aksell - modern and sustainable solutions.";
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

    // Structured data (Organization)
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Aksell',
      url: 'https://www.aksell.com.br',
      logo: window.location.origin + '/lovable-uploads/aksell-logo-site.png',
      contactPoint: [{
        '@type': 'ContactPoint',
        telephone: '+55 19 3115-2800',
        contactType: 'customer service',
        email: 'aksell@aksell.com.br'
      }]
    });
    document.head.appendChild(ld);

    return () => {
      document.head.removeChild(ld);
    };
  }, []);

  const slides = [
    {
      title: 'Special ingredients for the food and agricultural industries',
      description: 'Aksell offers a modern line of products with special solutions for a healthier and more sustainable world.',
      img: 'https://i.postimg.cc/wqRSS03t/photo-of-joyful-beautiful-woman-eating-cake-and-dr-2025-02-15-20-56-14-utc-scaled-e1741618812391.jpg',
      alt: 'Aksell banner – smiling woman'
    },
    {
      title: 'Manufacturer of inorganic and hybrid salts since 1999.',
      description: 'We produce numerous ingredients and nutrients with the highest quality and purity.',
      img: 'https://i.postimg.cc/jsFpgGq0/sais-inorganicos-hibridos.jpg',
      alt: 'Inorganic and hybrid salts – Aksell'
    }
  ];
  const { ref: heroRef, inView: heroInView } = useInView({ threshold: 0.4, once: false });
  const { ref: bannerRef, inView: bannerInView } = useInView({ threshold: 0.5, once: false });
  const { ref: presenceRef, inView: presenceInView } = useInView({ threshold: 0.2, once: false });
  const { ref: bannerSustRef, inView: bannerSustInView } = useInView({ threshold: 0.5, once: false });
  const { ref: reducaoRef, inView: reducaoInView } = useInView({ threshold: 0.2, once: false });
  const { ref: pqAksellRef, inView: pqAksellInView } = useInView({ threshold: 0.2, once: false });
  const { ref: faleRef, inView: faleInView } = useInView({ threshold: 0.2, once: false });

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
  const telefoneBase = "+55 19 3115-2800";
  const [contactOpen, setContactOpen] = useState(false);

  // Iron Salts banner slides
  const ferroSlides = [
    { src: "https://i.postimg.cc/SSwpsHH7/embutidos.webp", alt: "Processed meats" },
    { src: "https://i.postimg.cc/7D2kcYTB/paes.webp", alt: "Breads" },
    { src: "https://i.postimg.cc/4sRgTk6X/top-view-arrangement-with-dairy-products.webp", alt: "Dairy" },
  ];
  const { ref: ferroRef, inView: ferroInView } = useInView({ threshold: 0.3, once: false });
  const [ferroIndex, setFerroIndex] = useState(0);
  const [zoomOn, setZoomOn] = useState(false);

  // Preload Iron Salts banner images
  useEffect(() => {
    ferroSlides.forEach((s) => {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.src = s.src;
    });
  }, []);

  // Auto rotation when in view
  useEffect(() => {
    if (!ferroInView) return;
    const id = setInterval(() => {
      setFerroIndex((i) => (i + 1) % ferroSlides.length);
    }, 8000);
    return () => clearInterval(id);
  }, [ferroInView, ferroSlides.length]);

  // Zoom-in effect per slide when visible
  useEffect(() => {
    if (!ferroInView) return;
    setZoomOn(false);
    const raf = requestAnimationFrame(() => setZoomOn(true));
    return () => cancelAnimationFrame(raf);
  }, [ferroIndex, ferroInView]);

  return (
    <div id="top">
      <header className="sticky top-0 inset-x-0 z-[200] bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <ResponsiveContainer className="flex items-center justify-between py-2 md:py-3 mobile-safe-padding">
          <div className="flex items-center gap-4">
            <NavLink to="/auth" aria-label="Go to app login" title="Login" className="flex items-center gap-3">
              <img src="/lovable-uploads/aksell-logo-site.png" alt="Aksell logo - access login" className="h-8 md:h-10 w-auto" loading="lazy" />
            </NavLink>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink href="#top" className="px-3 py-2 text-primary hover:text-primary">Home</NavigationMenuLink>
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
                  <a href="#top" className="rounded-md px-3 py-2 text-primary hover:bg-primary/10">Home</a>
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
                    <button
                      type="button"
                      onClick={() => setContactOpen(true)}
                      className="rounded-md px-3 py-2 hover:bg-accent inline-flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" /> Contact
                    </button>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/site/home/pt" className="rounded-md px-3 py-2 hover:bg-accent inline-flex items-center gap-2">
                      <img src="https://flagcdn.com/br.svg" alt="Português (BR)" className="h-4 w-4 rounded-sm" loading="lazy" />
                      Português
                    </NavLink>
                  </SheetClose>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </ResponsiveContainer>
      </header>
      <div className="h-0 md:h-16" aria-hidden="true"></div>
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
              <h3 className="text-h2-premium text-primary mb-3 text-hover-lift">Talk to our team!</h3>
              <p className="text-body-premium text-muted-foreground mb-6">
                Composed of technicians, chemists and engineers, we're always ready to answer your questions or requests.
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

                {/* Phone line + extension */}
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Phone className="h-4 w-4" />
                  </span>
                  <a href={`tel:${telefoneBase.replace(/[^0-9]/g, '')},${selected.ramal}`} className="text-foreground underline hover:text-primary transition">
                    {telefoneBase}
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
        {/* Hero (Carousel) */}
        <section className={`bg-background hero-texture ${heroInView ? 'hero-texture-pan' : ''} md:-mt-6 lg:-mt-8`} ref={heroRef}>
          <ResponsiveContainer padding="sm" className="min-h-[260px] md:min-h-[320px] lg:min-h-[380px]">
            <Carousel>
              <CarouselContent>
                {slides.map((slide, idx) => (
                  <CarouselItem key={idx}>
                    <div className="grid md:grid-cols-2 gap-10 items-center py-1 md:py-2">
                      <div className={`bg-hero-left/80 backdrop-blur-sm border border-primary/10 rounded-3xl p-3 md:p-5 space-y-4 opacity-0 will-change-transform [animation-fill-mode:forwards] relative -top-1 md:-top-2 ${idx === 1 ? "md:order-2" : ""} ${heroInView ? (idx === 1 ? "animate-[slide-in-right_0.7s_ease-out] opacity-100" : "animate-[slide-in-left_0.7s_ease-out] opacity-100") : "opacity-0"} motion-reduce:animate-none motion-reduce:opacity-100`}>
                        <h1 className="text-4xl md:text-5xl font-bold text-amber-900">
                          {slide.title}
                        </h1>
                        {slide.description && (
                          <p className="text-body-lg-premium text-muted-foreground max-w-prose">{slide.description}</p>
                        )}
                        <div className="flex items-center gap-3">
                          <Button size="lg">Talk to a consultant</Button>
                        </div>
                      </div>
                      <div className={`relative h-[240px] md:h-[320px] lg:h-[380px] w-full overflow-hidden rounded-3xl shadow-elegant ${idx === 1 ? 'md:order-1' : ''}`}>
                        <img
                          src={slide.img}
                          alt={slide.alt}
                          className={`absolute inset-0 w-full h-full object-cover will-change-transform ${heroInView ? "animate-[heroZoomOut_6s_ease-out_forwards]" : ""} motion-reduce:animate-none`}
                          style={{ objectPosition: idx === 1 ? 'left center' : 'right center' }}
                          loading={idx === 0 ? 'eager' : 'lazy'}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            if (idx === 0) {
                              if (img.src.includes('postimg.cc')) {
                                img.src = 'https://aksell.com.br/wp-content/uploads/2025/03/photo-of-joyful-beautiful-woman-eating-cake-and-dr-2025-02-15-20-56-14-utc.jpg';
                              } else if (img.src.includes('aksell.com.br')) {
                                img.onerror = null;
                                img.src = '/lovable-uploads/d934859e-4790-40b1-b733-5aac51de303f.png';
                              }
                            } else {
                              if (img.src.includes('postimg.cc')) {
                                img.onerror = null;
                                img.src = '/lovable-uploads/d934859e-4790-40b1-b733-5aac51de303f.png';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-end gap-2 mt-2">
                <CarouselPrevious />
                <CarouselNext />
              </div>
            </Carousel>
          </ResponsiveContainer>
        </section>

        {/* Busca */}
        <section className="bg-gradient-section-warm py-8 md:py-12 -mt-3 md:-mt-4 lg:-mt-5">
          <ResponsiveContainer className="flex items-center justify-center gap-3">
            <div className="w-full max-w-2xl">
              <label className="sr-only" htmlFor="search">Search for a product or CAS</label>
              <div className="group relative flex items-center rounded-full border bg-card/90 backdrop-blur-sm pl-4 pr-2 py-2 shadow-elegant ring-1 ring-primary/10 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300">
                <input
                  id="search"
                  placeholder="Search for a product or CAS"
                  className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground focus:placeholder:text-muted-foreground/70"
                  aria-label="Search for a product or CAS"
                />
                <button
                  type="button"
                  aria-label="Search"
                  className="ml-2 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 hover:bg-primary/15 hover:ring-primary/30 hover:shadow-glow transition-all duration-300 p-2"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Banner central */}
        <section aria-label="Central message" className="bg-background" ref={bannerRef}>
          <ResponsiveContainer className="py-10 md:py-16 text-center space-y-4">
            <h2 className={`text-h1-premium text-primary text-hover-lift mx-auto ${bannerInView ? 'animate-title-shrink' : 'opacity-0'} motion-reduce:opacity-100 motion-reduce:animate-none`}>
              Passion for details.
            </h2>
            <p className={`text-body-lg-premium mx-auto max-w-3xl text-[hsl(var(--brand-brown))] ${bannerInView ? 'animate-fade-up' : 'opacity-0'} motion-reduce:opacity-100 motion-reduce:animate-none`}>
              We turn every element into a unique expression of excellence to catalyze your business success.
            </p>
          </ResponsiveContainer>
        </section>

        {/* Presença Aksell */}
        <section id="presence" className="bg-gradient-wine-premium text-white relative overflow-hidden" ref={presenceRef} aria-label="Aksell is present in everyone's daily life">
          <div className="absolute inset-0 bg-overlay-warm opacity-60"></div>
          <ResponsiveContainer className="py-12 md:py-16 space-y-10 relative z-10">
            <h2 className="text-h2-premium text-center text-white text-hover-lift">
              Aksell is present in everyone's daily life.
            </h2>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <article className={`${presenceInView ? 'animate-fade-in' : 'opacity-0'} bg-overlay-glass backdrop-blur-sm rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-elegant ring-1 ring-white/10 transition-all duration-500 motion-reduce:opacity-100 motion-reduce:animate-none`}>
                <h3 className="text-h3-premium text-aksell-coral mb-3 text-hover-lift">Human Food</h3>
                <p className="text-body-premium text-white/95">
                  At Aksell, we dedicate our expertise in high-purity ingredients to offer innovative solutions that enhance food quality and nutritional value. Our commitment to customization allows us to meet the most specific demands of the food industry, ensuring products that combine safety, taste, and well-being for consumers.
                </p>
              </article>
              <div className={`${presenceInView ? 'animate-fade-in' : 'opacity-0'} relative h-[260px] md:h-[360px] lg:h-[420px] rounded-[24px] md:rounded-[32px] overflow-hidden shadow-elegant transition-all duration-500 hover:scale-[1.02] motion-reduce:opacity-100 motion-reduce:animate-none`}>
                <img
                  src="https://i.postimg.cc/RMhrTMBL/happy-woman-buying-meat-at-refrigerated-section-in-2023-11-27-04-57-12-utc-v2.webp"
                  alt="Consumer choosing food products in the refrigerated section"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-overlay-image-warm opacity-30"></div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className={`${presenceInView ? 'animate-fade-in opacity-100' : 'opacity-0'} relative h-[260px] md:h-[360px] lg:h-[420px] rounded-[24px] md:rounded-[32px] overflow-hidden shadow-elegant hover-lift will-change-transform motion-reduce:opacity-100 motion-reduce:animate-none`}>
                <img
                  src="https://i.postimg.cc/YtbKgvJS/black-and-white-cows-graze-in-a-meadow-on-a-sunny-2023-11-27-05-36-59-utc-scaled-e1741619510329.webp"
                  alt="Cattle grazing in a sunlit field"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-overlay-image-warm opacity-30"></div>
              </div>
              <article className={`${presenceInView ? 'animate-fade-in opacity-100' : 'opacity-0'} bg-overlay-glass backdrop-blur-sm rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-elegant ring-1 ring-white/10 hover-glass will-change-transform motion-reduce:opacity-100 motion-reduce:animate-none`}>
                <h3 className="text-h3-premium text-aksell-coral mb-3 text-hover-lift">Animal Nutrition</h3>
                <p className="text-body-premium text-white/95">
                  In the animal nutrition sector, Aksell stands out for providing ingredients of the highest quality and purity, essential for animal health and performance. With a technical and personalized approach, we create tailored nutritional solutions, contributing to sustainability and efficiency in animal production.
                </p>
              </article>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Banner central sustentável */}
        <section aria-label="Sustainable central message" className="bg-gradient-section-warm relative overflow-hidden" ref={bannerSustRef}>
          <div className="absolute inset-0 bg-gradient-product-premium opacity-40"></div>
          <ResponsiveContainer className="py-10 md:py-16 text-center relative z-10">
            <h2 className={`text-h1-premium text-aksell-wine text-hover-lift mx-auto will-change-transform ${bannerSustInView ? 'animate-title-shrink opacity-100' : 'opacity-0'} motion-reduce:opacity-100 motion-reduce:animate-none`}>
              Special solutions for a healthier and more sustainable future
            </h2>
          </ResponsiveContainer>
        </section>

        {/* Banner Redução de Sódio */}
        <section aria-label="Sodium Reduction Program" className="bg-gradient-subtle" ref={reducaoRef}>
          <ResponsiveContainer className="py-8 md:py-12">
            <div className={`relative rounded-[24px] md:rounded-[32px] lg:overflow-hidden overflow-visible shadow-elegant hover-lift ${reducaoInView ? 'animate-fade-in opacity-100' : 'opacity-0'} motion-reduce:opacity-100 motion-reduce:animate-none`}>
              <div className="relative">
                <img
                  src="https://i.postimg.cc/xnGSfx5M/fundo-red-sodio.webp"
                  alt="Aksell Sodium Reduction Program"
                  className="w-full h-[220px] md:h-[300px] lg:h-[380px] object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.onerror = null;
                    img.src = '/lovable-uploads/d934859e-4790-40b1-b733-5aac51de303f.png';
                  }}
                />
                <div className="absolute inset-0 bg-overlay-image-warm opacity-20"></div>
              </div>
              <article className="relative lg:absolute left-4 right-4 lg:left-8 lg:right-auto top-auto lg:top-8 bg-gradient-wine-premium backdrop-blur-sm text-white rounded-2xl lg:rounded-3xl p-5 lg:p-8 lg:max-w-[560px] w-full lg:w-[40%] mt-4 lg:mt-0 shadow-elegant ring-1 ring-white/10 hover-glass">
                <h3 className="font-oswald text-aksell-coral text-2xl md:text-3xl mb-3 text-hover-lift">Sodium Reduction</h3>
                <p className="text-white/95">
                  Aksell's Sodium Reduction Program delivers the best cost for each application while relentlessly pursuing great taste. We produce Potassium and Mineral Salts, Light Salt and Low‑Sodium Salt. We are one of the leading manufacturers in Brazil and export to more than 12 countries.
                </p>
                <div className="mt-4">
                  <Button onClick={() => setContactOpen(true)} className="hover-warm active-press">
                    Learn more about this program
                  </Button>
                </div>
              </article>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Banner Sais de Ferro */}
        <section aria-label="Iron Salts" ref={ferroRef} className="bg-gradient-product-premium">
          <ResponsiveContainer className="py-8 md:py-12">
            <div className={`relative rounded-[24px] md:rounded-[32px] lg:overflow-hidden overflow-visible shadow-elegant hover-lift ${ferroInView ? 'animate-fade-in opacity-100' : 'opacity-0'} motion-reduce:opacity-100 motion-reduce:animate-none`}>
              <div className="relative w-full h-[220px] md:h-[300px] lg:h-[380px]">
                {ferroSlides.map((s, idx) => (
                  <img
                    key={s.src}
                    src={s.src}
                    alt={`Iron Salts - ${s.alt}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${idx === ferroIndex ? 'opacity-100' : 'opacity-0'}`}
                    referrerPolicy="no-referrer"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.onerror = null;
                      img.src = '/lovable-uploads/d934859e-4790-40b1-b733-5aac51de303f.png';
                    }}
                    style={idx === ferroIndex ? { transform: zoomOn ? 'scale(1.08)' : 'scale(1)', transition: 'transform 8s ease-out' } : {}}
                  />
                ))}
                <div className="absolute inset-0 bg-overlay-product opacity-50"></div>
              </div>

              <article className="relative lg:absolute right-4 left-4 lg:right-8 lg:left-auto top-auto lg:top-8 bg-card/95 backdrop-blur-sm text-foreground rounded-2xl lg:rounded-3xl p-5 lg:p-8 lg:max-w-[640px] w-full shadow-elegant ring-1 ring-primary/10 mt-4 lg:mt-0 hover-glass">
                <h3 className="font-oswald text-aksell-rust text-2xl md:text-3xl mb-3 text-hover-lift">Iron Salts</h3>
                <p className="text-muted-foreground/90">
                  With over 20 years in the Iron Salts market for the food industry, we have expertise manufacturing Ferric Pyrophosphate, Ferrous Fumarate, Ferrous Sulfate Heptahydrate and Monohydrate, all with high purity, meeting market requirements.
                </p>
                <div className="mt-4">
                  <Button onClick={() => setContactOpen(true)} className="hover-warm active-press">
                    Request a sample
                  </Button>
                </div>
              </article>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Banner Por que a Aksell */}
        <section aria-label="Why Aksell" className="bg-gradient-section-warm" ref={pqAksellRef}>
          <ResponsiveContainer className="py-8 md:py-12">
            <div className={`${pqAksellInView ? 'animate-fade-in opacity-100' : 'opacity-0'} relative rounded-[24px] md:rounded-[32px] lg:overflow-hidden overflow-visible shadow-elegant hover-lift motion-reduce:opacity-100 motion-reduce:animate-none`}>
              <div className="relative">
                <img
                  src="https://i.postimg.cc/xQ7QtbqJ/medical-science-black-woman-and-microscope-in-lab-2023-11-27-04-51-34-utc-v2-1.jpg"
                  alt="Why Aksell is one of Brazil's leading manufacturers"
                  className="w-full h-[360px] md:h-[460px] lg:h-[560px] xl:h-[600px] object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.onerror = null;
                    img.src = '/lovable-uploads/d934859e-4790-40b1-b733-5aac51de303f.png';
                  }}
                />
                <div className="absolute inset-0 bg-overlay-image-warm opacity-25"></div>
              </div>

              <article className="relative lg:absolute left-4 right-4 lg:left-8 lg:right-auto top-auto lg:top-8 bg-card/95 backdrop-blur-sm text-foreground rounded-2xl lg:rounded-3xl p-5 lg:p-8 lg:max-w-[660px] w-full shadow-elegant ring-1 ring-primary/10 mt-4 lg:mt-0 hover-glass">
                <h3 className="font-oswald text-aksell-wine text-2xl md:text-3xl mb-3 text-hover-lift">
                  Why is Aksell one of Brazil's leading manufacturers?
                </h3>

                <div className="space-y-3 text-sm md:text-base">
                  <div className="hover-warm p-2 rounded-lg transition-sophisticated">
                    <h4 className="font-semibold text-aksell-rust">FSSC 22000 Certification</h4>
                    <p className="text-muted-foreground/90">
                      Our products are highly safe and certified by the Food Safety System – DNV FSSC 22000.
                    </p>
                  </div>

                  <div className="hover-warm p-2 rounded-lg transition-sophisticated">
                    <h4 className="font-semibold text-aksell-rust">Exclusive Solutions</h4>
                    <p className="text-muted-foreground/90">
                      Aksell has a specialized engineering team that develops custom solutions for you.
                    </p>
                  </div>

                  <div className="hover-warm p-2 rounded-lg transition-sophisticated">
                    <h4 className="font-semibold text-aksell-rust">Over two decades of experience</h4>
                    <p className="text-muted-foreground/90">
                      Since January 1999 manufacturing inorganic and hybrid salts throughout Brazil and exporting to 10 countries.
                    </p>
                  </div>

                  <div className="hover-warm p-2 rounded-lg transition-sophisticated">
                    <h4 className="font-semibold text-aksell-rust">Strategic Location</h4>
                    <p className="text-muted-foreground/90">
                      We are in Indaiatuba, 25 km from Campinas and 95 km from São Paulo, one of the best logistics hubs in Brazil.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Fale com nosso time! */}
        <section aria-label="Talk to our team" ref={faleRef} className="bg-gradient-product-premium">
          <ResponsiveContainer className="py-8 md:py-12">
            <div className={`grid md:grid-cols-2 gap-8 items-center ${faleInView ? 'animate-fade-in opacity-100' : 'opacity-0'} motion-reduce:opacity-100 motion-reduce:animate-none`}>
              {/* Image column */}
              <div className="relative h-[360px] md:h-[460px] lg:h-[560px] rounded-[24px] md:rounded-[32px] overflow-hidden shadow-elegant hover-lift">
                <img
                  src="https://i.postimg.cc/D7238rpD/colleagues-working-together-call-center-office-1.jpg"
                  alt="Aksell customer service team at the call center"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.onerror = null;
                    img.src = '/lovable-uploads/d934859e-4790-40b1-b733-5aac51de303f.png';
                  }}
                />
                <div className="absolute inset-0 bg-overlay-image-warm opacity-20"></div>
              </div>

              {/* Dynamic content column */}
              <article className="bg-card/95 backdrop-blur-sm text-foreground rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-elegant ring-1 ring-primary/10 hover-glass">
                <h3 className="font-oswald text-aksell-wine text-3xl md:text-4xl leading-tight mb-3 text-hover-lift">Talk to our team!</h3>
                <p className="text-muted-foreground/90 mb-6">
                  Composed of technicians, chemists and engineers, we're always ready to answer your questions or requests.
                </p>

                <div className="space-y-4">
                  <label className="text-sm text-muted-foreground block">Which department would you like to contact?</label>
                  <div className="flex items-center">
                    <div className="relative w-full md:w-[320px]">
                      <div className="pointer-events-none absolute left-[-40px] top-1/2 -translate-y-1/2 hidden md:flex items-center gap-[2px] text-aksell-coral" aria-hidden="true">
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

                  {/* Phone line + extension */}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                      <Phone className="h-4 w-4" />
                    </span>
                    <a href={`tel:${telefoneBase.replace(/[^0-9]/g, '')},${selected.ramal}`} className="text-foreground underline hover:text-primary transition">
                      {telefoneBase}
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

export default PaginaInicialEN;