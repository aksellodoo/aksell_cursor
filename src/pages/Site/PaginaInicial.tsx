import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, Mail, Search, Phone, ChevronRight } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useInView } from "@/hooks/useInView";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PassionHero } from "@/components/ui/passion-hero";
const PaginaInicial = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "Página Inicial do Site - Aksell";

    const desc = "Ingredientes especiais para indústria alimentícia e agrícola. Aksell - soluções modernas e sustentáveis.";
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
      title: 'Ingredientes especiais para indústria alimentícia e agrícola',
      description: 'A Aksell tem uma linha de produtos modernos com soluções especiais para um mundo mais saudável e sustentável.',
      img: 'https://i.postimg.cc/wqRSS03t/photo-of-joyful-beautiful-woman-eating-cake-and-dr-2025-02-15-20-56-14-utc-scaled-e1741618812391.jpg',
      alt: 'Banner Aksell – mulher sorrindo'
    },
    {
      title: 'Fabricante de sais inorgânicos e híbridos desde 1999.',
      description: 'Produzimos inúmeros ingredientes e nutrientes com a mais alta qualidade e pureza.',
      img: 'https://i.postimg.cc/jsFpgGq0/sais-inorganicos-hibridos.jpg',
      alt: 'Sais inorgânicos e híbridos Aksell'
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
    { value: "vendas", label: "Vendas", ramal: "801", email: "vendas@aksell.com.br" },
    { value: "suporte", label: "Suporte Técnico", ramal: "801", email: "suporte@aksell.com.br" },
    { value: "qualidade", label: "Qualidade", ramal: "805", email: "qualidade@aksell.com.br" },
    { value: "financeiro", label: "Financeiro", ramal: "803", email: "financeiro@aksell.com.br" },
    { value: "compras", label: "Compras", ramal: "802", email: "compras@aksell.com.br" },
    { value: "lab", label: "Lab / Desenvolvimento", ramal: "809", email: "lab@aksell.com.br" },
    { value: "rh", label: "Recursos Humanos", ramal: "804", email: "rh@aksell.com.br" },
  ] as const;

  const [areaValue, setAreaValue] = useState<string>("vendas");
  const [homeSearch, setHomeSearch] = useState('');
  const selected = AREAS.find((a) => a.value === areaValue)!;
  const telefoneBase = "+55 19 3115-2800";
  
  // Handle search functionality
  const handleSearch = () => {
    if (homeSearch.trim()) {
      navigate(`/site/produtos/pt?q=${encodeURIComponent(homeSearch.trim())}`);
    }
  };
  
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  const [contactOpen, setContactOpen] = useState(false);

  // Slides do banner "Sais de Ferro"
  const ferroSlides = [
    { src: "https://i.postimg.cc/SSwpsHH7/embutidos.webp", alt: "Embutidos" },
    { src: "https://i.postimg.cc/7D2kcYTB/paes.webp", alt: "Pães" },
    { src: "https://i.postimg.cc/4sRgTk6X/top-view-arrangement-with-dairy-products.webp", alt: "Laticínios" },
  ];
  const { ref: ferroRef, inView: ferroInView } = useInView({ threshold: 0.3, once: false });
  const [ferroIndex, setFerroIndex] = useState(0);
  const [zoomOn, setZoomOn] = useState(false);

  // Pré-carrega imagens do banner "Sais de Ferro"
  useEffect(() => {
    ferroSlides.forEach((s) => {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.src = s.src;
    });
  }, []);

  // Rotação automática quando em view
  useEffect(() => {
    if (!ferroInView) return;
    const id = setInterval(() => {
      setFerroIndex((i) => (i + 1) % ferroSlides.length);
    }, 8000);
    return () => clearInterval(id);
  }, [ferroInView, ferroSlides.length]);

  // Efeito de zoom-in por slide quando visível
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
            <NavLink to="/auth" aria-label="Ir para login do app" title="Login" className="flex items-center gap-3">
              <img src="/lovable-uploads/aksell-logo-site.png" alt="Aksell logo - acessar login" className="h-8 md:h-10 w-auto" loading="lazy" />
            </NavLink>
            
          </div>

          <div className="hidden md:flex items-center gap-4">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink href="#top" className="px-3 py-2 text-primary hover:text-primary">Início</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink href="/site/produtos/pt" className="px-3 py-2 text-primary hover:text-primary">Produtos</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink href="/site/empresa/pt" className="px-3 py-2 text-primary hover:text-primary">A Empresa</NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <NavLink to="/site/home/en" aria-label="Switch to English" title="English" className="inline-flex">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label="English (US)">
                <img
                  src="https://flagcdn.com/us.svg"
                  width={20}
                  height={20}
                  alt="English (US)"
                  className="h-5 w-5 rounded-sm"
                  loading="lazy"
                />
              </Button>
            </NavLink>

            <Button size="sm" onClick={() => setContactOpen(true)}>
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contato
              </span>
            </Button>
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-4 grid gap-1">
                  <a href="#top" className="rounded-md px-3 py-2 text-primary hover:bg-primary/10">Início</a>
                  <SheetClose asChild>
                    <NavLink to="/site/produtos/pt" className="rounded-md px-3 py-2 hover:bg-accent inline-flex items-center gap-2">
                      Produtos
                    </NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/site/empresa/pt" className="rounded-md px-3 py-2 hover:bg-accent inline-flex items-center gap-2">
                      A Empresa
                    </NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <button
                      type="button"
                      onClick={() => setContactOpen(true)}
                      className="rounded-md px-3 py-2 hover:bg-accent inline-flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" /> Contato
                    </button>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/site/home/en" className="rounded-md px-3 py-2 hover:bg-accent inline-flex items-center gap-2">
                      <img src="https://flagcdn.com/us.svg" alt="English (US)" className="h-4 w-4 rounded-sm" loading="lazy" />
                      English
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
            {/* Coluna da imagem */}
            <div className="relative h-[260px] md:h-[420px] lg:h-[520px] overflow-hidden">
              <img
                src="https://i.postimg.cc/D7238rpD/colleagues-working-together-call-center-office-1.jpg"
                alt="Equipe de atendimento Aksell no call center"
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

            {/* Coluna de conteúdo dinâmico */}
            <article className="bg-card/95 text-foreground rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-elegant ring-1 ring-primary/10 m-4">
              <h3 className="text-h2-premium text-primary mb-3 text-hover-lift">Fale com nosso time!</h3>
              <p className="text-body-premium text-muted-foreground mb-6">
                Composta por técnicos, químicos e engenheiros, estamos sempre a postos para responder suas dúvidas ou solicitações.
              </p>

              <div className="space-y-4">
                <label className="text-sm text-muted-foreground block">Com qual área você quer falar?</label>
                <div className="flex items-center">
                  <div className="relative w-full md:w-[320px]">
                    <div className="pointer-events-none absolute left-[-40px] top-1/2 -translate-y-1/2 hidden md:flex items-center gap-[2px] text-primary" aria-hidden="true">
                      <ChevronRight className="h-4 w-4 arrow-nudge" />
                      <ChevronRight className="h-4 w-4 arrow-nudge" />
                    </div>
                    <Select value={areaValue} onValueChange={setAreaValue}>
                      <SelectTrigger className="h-12 text-base border-primary/40 focus:ring-primary w-full md:w-[320px]">
                        <SelectValue placeholder="Selecione a área" />
                      </SelectTrigger>
                      <SelectContent>
                        {AREAS.map((a) => (
                          <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Linha telefone + ramal */}
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Phone className="h-4 w-4" />
                  </span>
                  <a href={`tel:${telefoneBase.replace(/[^0-9]/g, '')},${selected.ramal}`} className="text-foreground underline hover:text-primary transition">
                    {telefoneBase}
                  </a>
                  <span className="ml-2 inline-flex items-center rounded-md bg-muted px-3 py-1 text-sm text-primary ring-1 ring-primary/10">
                    Ramal {selected.ramal}
                  </span>
                </div>

                {/* Linha email */}
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
        {/* Hero (Carrossel) */}
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
                          <Button size="lg" onClick={() => setContactOpen(true)}>Fale com um Consultor</Button>
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
              <label className="sr-only" htmlFor="search">Buscar por nome de produto, fórmula molecular ou C.A.S.</label>
              <div className="group relative flex items-center rounded-full border bg-card/90 backdrop-blur-sm pl-4 pr-2 py-2 shadow-elegant ring-1 ring-primary/10 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300">
                <input
                  id="search"
                  value={homeSearch}
                  onChange={(e) => setHomeSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Buscar por nome de produto, fórmula molecular ou C.A.S."
                  className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground focus:placeholder:text-muted-foreground/70"
                  aria-label="Buscar por nome de produto, fórmula molecular ou C.A.S."
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  aria-label="Pesquisar"
                  className="ml-2 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 hover:bg-primary/15 hover:ring-primary/30 hover:shadow-glow transition-all duration-300 p-2"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Banner central */}
        <section aria-label="Mensagem central" ref={bannerRef}>
          <PassionHero />
        </section>

        {/* Presença Aksell */}
        <section id="presenca" className="bg-gradient-wine-premium text-white relative overflow-hidden" ref={presenceRef} aria-label="A Aksell está presente no dia a dia de todos">
          <div className="absolute inset-0 bg-overlay-warm opacity-60"></div>
          <ResponsiveContainer className="py-12 md:py-16 space-y-10 relative z-10">
            <h2 className="text-h2-premium text-center text-white text-hover-lift">
              A Aksell está presente no dia a dia de todos.
            </h2>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <article className={`${presenceInView ? 'animate-fade-in' : 'opacity-0'} bg-overlay-glass backdrop-blur-sm rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-elegant ring-1 ring-white/10 transition-all duration-500 motion-reduce:opacity-100 motion-reduce:animate-none`}>
                <h3 className="text-h3-premium text-aksell-coral mb-3 text-hover-lift">Alimentação Humana</h3>
                <p className="text-body-premium text-white/95">
                  Na Aksell, dedicamos nosso expertise em ingredientes de alta pureza para oferecer soluções inovadoras que impulsionam a qualidade e o valor nutricional dos alimentos. Nosso compromisso com a customização permite atender às demandas mais específicas da indústria alimentícia, garantindo produtos que aliam segurança, sabor e bem-estar para os consumidores.
                </p>
              </article>
              <div className={`${presenceInView ? 'animate-fade-in' : 'opacity-0'} relative h-[260px] md:h-[360px] lg:h-[420px] rounded-[24px] md:rounded-[32px] overflow-hidden shadow-elegant transition-all duration-500 hover:scale-[1.02] motion-reduce:opacity-100 motion-reduce:animate-none`}>
                <img
                  src="https://i.postimg.cc/RMhrTMBL/happy-woman-buying-meat-at-refrigerated-section-in-2023-11-27-04-57-12-utc-v2.webp"
                  alt="Consumidora escolhendo produtos alimentícios na seção refrigerada"
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
                  alt="Gado pastando em campo ao sol"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-overlay-image-warm opacity-30"></div>
              </div>
              <article className={`${presenceInView ? 'animate-fade-in opacity-100' : 'opacity-0'} bg-overlay-glass backdrop-blur-sm rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-elegant ring-1 ring-white/10 hover-glass will-change-transform motion-reduce:opacity-100 motion-reduce:animate-none`}>
                <h3 className="text-h3-premium text-aksell-coral mb-3 text-hover-lift">Alimentação Animal</h3>
                <p className="text-body-premium text-white/95">
                  No setor de alimentação animal, a Aksell se destaca por fornecer ingredientes de altíssima qualidade e pureza, essenciais para a saúde e o desempenho dos animais. Com uma abordagem técnica e personalizada, criamos soluções nutricionais sob medida, contribuindo para a  sustentabilidade e a eficiência da produção animal.
                </p>
              </article>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Banner central sustentável */}
        <section aria-label="Mensagem sustentável central" className="bg-gradient-section-warm relative overflow-hidden" ref={bannerSustRef}>
          <div className="absolute inset-0 bg-gradient-product-premium opacity-40"></div>
          <ResponsiveContainer className="py-10 md:py-16 text-center relative z-10">
            <h2 className={`text-h1-premium text-aksell-wine text-hover-lift mx-auto will-change-transform ${bannerSustInView ? 'animate-title-shrink opacity-100' : 'opacity-0'} motion-reduce:opacity-100 motion-reduce:animate-none`}>
              Soluções especiais para um futuro mais saudável e sustentável
            </h2>
          </ResponsiveContainer>
        </section>

        {/* Banner Redução de Sódio */}
        <section aria-label="Programa de Redução de Sódio" className="bg-gradient-subtle" ref={reducaoRef}>
          <ResponsiveContainer className="py-8 md:py-12">
            <div className={`relative rounded-[24px] md:rounded-[32px] lg:overflow-hidden overflow-visible shadow-elegant hover-lift ${reducaoInView ? 'animate-fade-in opacity-100' : 'opacity-0'} motion-reduce:opacity-100 motion-reduce:animate-none`}>
              <div className="relative">
                <img
                  src="https://i.postimg.cc/xnGSfx5M/fundo-red-sodio.webp"
                  alt="Programa de Redução de Sódio Aksell"
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
                <h3 className="font-oswald text-aksell-coral text-2xl md:text-3xl mb-3 text-hover-lift">Redução de Sódio</h3>
                <p className="text-white/95">
                  O Programa de Redução de Sódio da Aksell oferece o melhor custo para cada aplicação além da busca incessante pelo melhor sabor. Produzimos Sais de Potássio e Minerais, Sal Light e Sal Hipossódico. Somos um dos principais fabricantes no Brasil e exportamos para mais de 12 países.
                </p>
                <div className="mt-4">
                  <Button onClick={() => setContactOpen(true)} className="hover-warm active-press">
                    Conheça mais este programa
                  </Button>
                </div>
              </article>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Banner Sais de Ferro */}
        <section aria-label="Sais de Ferro" ref={ferroRef} className="bg-gradient-product-premium">
          <ResponsiveContainer className="py-8 md:py-12">
            <div className={`relative rounded-[24px] md:rounded-[32px] lg:overflow-hidden overflow-visible shadow-elegant hover-lift ${ferroInView ? 'animate-fade-in opacity-100' : 'opacity-0'} motion-reduce:opacity-100 motion-reduce:animate-none`}>
              <div className="relative w-full h-[220px] md:h-[300px] lg:h-[380px]">
                {ferroSlides.map((s, idx) => (
                  <img
                    key={s.src}
                    src={s.src}
                    alt={`Sais de Ferro - ${s.alt}`}
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
                <h3 className="font-oswald text-aksell-rust text-2xl md:text-3xl mb-3 text-hover-lift">Sais de Ferro</h3>
                <p className="text-muted-foreground/90">
                  Com mais de 20 anos no mercado de Sais de Ferro para a indústria de alimentos, possuímos expertise na fabricação de Pirofosfato Férrico, Fumarato Ferroso, Sulfato Ferroso Heptahidratado e Monohidratado, todos com alta pureza, atendendo as necessidades do mercado.
                </p>
                <div className="mt-4">
                  <Button onClick={() => setContactOpen(true)} className="hover-warm active-press">
                    Solicite uma amostra
                  </Button>
                </div>
              </article>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Banner Por que a Aksell */}
        <section aria-label="Por que a Aksell" className="bg-gradient-section-warm" ref={pqAksellRef}>
          <ResponsiveContainer className="py-8 md:py-12">
            <div className={`${pqAksellInView ? 'animate-fade-in opacity-100' : 'opacity-0'} relative rounded-[24px] md:rounded-[32px] lg:overflow-hidden overflow-visible shadow-elegant hover-lift motion-reduce:opacity-100 motion-reduce:animate-none`}>
              <div className="relative">
                <img
                  src="https://i.postimg.cc/xQ7QtbqJ/medical-science-black-woman-and-microscope-in-lab-2023-11-27-04-51-34-utc-v2-1.jpg"
                  alt="Por que a Aksell é uma das principais fabricantes do Brasil"
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
                  Por que a Aksell é uma das principais fabricantes do Brasil?
                </h3>

                <div className="space-y-3 text-sm md:text-base">
                  <div className="hover-warm p-2 rounded-lg transition-sophisticated">
                    <h4 className="font-semibold text-aksell-rust">Certificação FSSC 22000</h4>
                    <p className="text-muted-foreground/90">
                      Nossos produtos são altamente seguros e certificados pelo Sistema de Segurança de Alimentos – DNV FSSC 22000
                    </p>
                  </div>

                  <div className="hover-warm p-2 rounded-lg transition-sophisticated">
                    <h4 className="font-semibold text-aksell-rust">Soluções Exclusivas</h4>
                    <p className="text-muted-foreground/90">
                      A Aksell possui um time de engenharia especializado que desenvolve soluções customizadas para você.
                    </p>
                  </div>

                  <div className="hover-warm p-2 rounded-lg transition-sophisticated">
                    <h4 className="font-semibold text-aksell-rust">Mais de 2 décadas de Experiência</h4>
                    <p className="text-muted-foreground/90">
                      Desde janeiro de 1999 fabricando sais inorgânicos e híbridos para todo o Brasil e exportando para 10 países.
                    </p>
                  </div>

                  <div className="hover-warm p-2 rounded-lg transition-sophisticated">
                    <h4 className="font-semibold text-aksell-rust">Localização Estratégica</h4>
                    <p className="text-muted-foreground/90">
                      Estamos em Indaiatuba à 25 km de Campinas e à 95 km de São Paulo, num dos melhores pontos logísticos do Brasil.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Fale com nosso time! */}
        <section aria-label="Fale com nosso time" ref={faleRef} className="bg-gradient-product-premium">
          <ResponsiveContainer className="py-8 md:py-12">
            <div className={`grid md:grid-cols-2 gap-8 items-center ${faleInView ? 'animate-fade-in opacity-100' : 'opacity-0'} motion-reduce:opacity-100 motion-reduce:animate-none`}>
              {/* Coluna da imagem */}
              <div className="relative h-[360px] md:h-[460px] lg:h-[560px] rounded-[24px] md:rounded-[32px] overflow-hidden shadow-elegant hover-lift">
                <img
                  src="https://i.postimg.cc/D7238rpD/colleagues-working-together-call-center-office-1.jpg"
                  alt="Equipe de atendimento Aksell no call center"
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

              {/* Coluna de conteúdo dinâmico */}
              <article className="bg-card/95 backdrop-blur-sm text-foreground rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-elegant ring-1 ring-primary/10 hover-glass">
                <h3 className="font-oswald text-aksell-wine text-3xl md:text-4xl leading-tight mb-3 text-hover-lift">Fale com nosso time!</h3>
                <p className="text-muted-foreground/90 mb-6">
                  Composta por técnicos, químicos e engenheiros, estamos sempre a postos para responder suas dúvidas ou solicitações.
                </p>

                <div className="space-y-4">
                  <label className="text-sm text-muted-foreground block">Com qual área você quer falar?</label>
                  <div className="flex items-center">
                    <div className="relative w-full md:w-[320px]">
                      <div className="pointer-events-none absolute left-[-40px] top-1/2 -translate-y-1/2 hidden md:flex items-center gap-[2px] text-aksell-coral" aria-hidden="true">
                        <ChevronRight className="h-4 w-4 arrow-nudge" />
                        <ChevronRight className="h-4 w-4 arrow-nudge" />
                      </div>
                      <Select value={areaValue} onValueChange={setAreaValue}>
                        <SelectTrigger className="h-12 text-base border-primary/40 focus-ring-premium hover-warm w-full md:w-[320px] transition-sophisticated">
                          <SelectValue placeholder="Selecione a área" />
                        </SelectTrigger>
                        <SelectContent>
                          {AREAS.map((a) => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Linha telefone + ramal */}
                  <div className="flex items-center gap-3 hover-warm p-2 rounded-lg transition-sophisticated">
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-aksell-coral/10 text-aksell-coral ring-1 ring-aksell-coral/20">
                      <Phone className="h-4 w-4" />
                    </span>
                    <a href={`tel:${telefoneBase.replace(/[^0-9]/g, '')},${selected.ramal}`} className="text-foreground underline hover:text-aksell-coral transition-sophisticated">
                      {telefoneBase}
                    </a>
                    <span className="ml-2 inline-flex items-center rounded-md bg-aksell-cream px-3 py-1 text-sm text-aksell-rust ring-1 ring-aksell-coral/10">
                      Ramal {selected.ramal}
                    </span>
                  </div>

                  {/* Linha email */}
                  <div className="flex items-center gap-3 hover-warm p-2 rounded-lg transition-sophisticated">
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-aksell-coral/10 text-aksell-coral ring-1 ring-aksell-coral/20">
                      <Mail className="h-4 w-4" />
                    </span>
                    <a href={`mailto:${selected.email}`} className="text-foreground underline hover:text-aksell-coral transition-sophisticated">
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

export default PaginaInicial;
