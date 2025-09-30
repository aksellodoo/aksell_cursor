import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, ChevronDown, ChevronRight, Menu, Mail, Phone, X, Copy, CheckCircle, Beaker, Package, Grid, List, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NavLink, useSearchParams } from 'react-router-dom';
import { useInView } from '@/hooks/useInView';

// Import product hero images
import cosmeticoImg from '@/assets/cosmetico-pantshoo-shampoo.png';
import embutidosImg from '@/assets/embutidos.webp';
import colheitaImg from '@/assets/colheita-02.png';
import dairyImg from '@/assets/dairy-products.webp';
import paesImg from '@/assets/paes.webp';
import vacasImg from '@/assets/vacas.png';
import hotdogImg from '@/assets/hot-dog.png';
import fabricaImg from '@/assets/fabrica-de-papel.png';

// Usando os tipos do Supabase diretamente
type ProductSegment = {
  id: string;
  created_at: string;
  name: string;
  is_active: boolean;
};

type ProductGroup = {
  id: string;
  created_at: string;
  name: string;
  is_active: boolean;
};

type ProductFamily = {
  id: string;
  created_at: string;
  name: string;
  is_active: boolean;
};

type ProductApplication = {
  id: string;
  created_at: string;
  name: string;
  is_active: boolean;
};

type ProductName = {
  id: string;
  created_at: string;
  name: string;
  is_active: boolean;
};

// Tipo baseado na estrutura real da tabela site_products
type Product = {
  id: string;
  created_at: string;
  name_id: string;
  cas_number: string | null;
  cas_note: string | null;
  molecular_formula: string | null;
  molecular_weight: number | null;
  molecular_structure_image_url: string | null;
  family_id: string | null;
  compound_type: string | null;
  is_active: boolean;
  segments: ProductSegment[];
  groups: ProductGroup[];
  applications: ProductApplication[];
  product_image_url: string | null;
  product_format: string | null;
};

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  
  // SEO Setup
  useEffect(() => {
    document.title = "Nossos Produtos - Aksell";

    const desc = "Descubra nossa linha completa de produtos químicos de alta qualidade. Sais inorgânicos, híbridos e ingredientes especiais para indústria alimentícia.";
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

    // Structured data for products page
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Nossos Produtos - Aksell',
      description: desc,
      url: window.location.href,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Aksell',
        url: 'https://www.aksell.com.br'
      },
      mainEntity: {
        '@type': 'ItemList',
        name: 'Produtos Aksell',
        description: 'Linha completa de sais inorgânicos e ingredientes especiais'
      }
    });
    document.head.appendChild(ld);

    return () => {
      if (document.head.contains(ld)) {
        document.head.removeChild(ld);
      }
    };
  }, []);

  // Contact functionality (same as home page)
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
  const selected = AREAS.find((a) => a.value === areaValue)!;
  const telefoneBase = "+55 19 3115-2800";
  const [contactOpen, setContactOpen] = useState(false);

  // Hero images setup
  const { ref: heroRef, inView: heroInView } = useInView({ threshold: 0.4, once: false });
  const productHeroImages = [
    { src: cosmeticoImg, alt: "Cosméticos e produtos de higiene pessoal" },
    { src: embutidosImg, alt: "Embutidos e produtos cárneos" },
    { src: colheitaImg, alt: "Produtos agrícolas e colheita" },
    { src: dairyImg, alt: "Produtos lácteos e derivados do leite" },
    { src: paesImg, alt: "Panificação e produtos de confeitaria" },
    { src: vacasImg, alt: "Pecuária e produtos bovinos" },
    { src: hotdogImg, alt: "Produtos processados e fast food" },
    { src: fabricaImg, alt: "Indústria de papel e celulose" }
  ];
  
  const [heroIndex, setHeroIndex] = useState(0);
  const [prevHeroIndex, setPrevHeroIndex] = useState(0);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload images and setup rotation
  useEffect(() => {
    const preloadImages = async () => {
      const promises = productHeroImages.map((img) => {
        return new Promise<void>((resolve) => {
          const image = new Image();
          image.onload = () => resolve();
          image.onerror = () => resolve();
          image.src = img.src;
        });
      });
      
      await Promise.all(promises);
      setImagesLoaded(true);
    };
    
    preloadImages();
  }, []);

  // Auto-rotate images every 10 seconds with crossfade
  useEffect(() => {
    if (!imagesLoaded) return;
    
    const interval = setInterval(() => {
      setIsCrossfading(true);
      setPrevHeroIndex(heroIndex); // Capture current index before changing
      
      setTimeout(() => {
        setHeroIndex((prev) => (prev + 1) % productHeroImages.length);
        setIsCrossfading(false);
      }, 300); // 300ms crossfade duration
    }, 10000);
    
    return () => clearInterval(interval);
  }, [imagesLoaded, productHeroImages.length, heroIndex]);

  // Product data state
  const [products, setProducts] = useState<Product[]>([]);
  const [productNames, setProductNames] = useState<ProductName[]>([]);
  const [segments, setSegments] = useState<ProductSegment[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [families, setFamilies] = useState<ProductFamily[]>([]);
  const [applications, setApplications] = useState<ProductApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [selectedApplication, setSelectedApplication] = useState<string>('');
  const [selectedName, setSelectedName] = useState<string>('');
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped');
  const [copiedCAS, setCopiedCAS] = useState<string>('');

  // Check for search parameter and set search term
  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchParams]);

  // Função para buscar os dados dos produtos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar produtos
        const { data: productsData, error: productsError } = await supabase
          .from('site_products')
          .select('*')
          .eq('is_active', true);

        if (productsError) {
          console.error('Erro ao buscar produtos:', productsError);
          return;
        }

        // Buscar nomes de produtos
        const { data: namesData, error: namesError } = await supabase
          .from('site_product_names')
          .select('*')
          .eq('is_active', true);

        if (namesError) {
          console.error('Erro ao buscar nomes:', namesError);
          return;
        }

        // Buscar segmentos
        const { data: segmentsData, error: segmentsError } = await supabase
          .from('site_product_segments')
          .select('*')
          .eq('is_active', true);

        if (segmentsError) {
          console.error('Erro ao buscar segmentos:', segmentsError);
          return;
        }

        // Buscar grupos
        const { data: groupsData, error: groupsError } = await supabase
          .from('site_product_groups')
          .select('*')
          .eq('is_active', true);

        if (groupsError) {
          console.error('Erro ao buscar grupos:', groupsError);
          return;
        }

        // Buscar famílias
        const { data: familiesData, error: familiesError } = await supabase
          .from('site_product_families')
          .select('*')
          .eq('is_active', true);

        if (familiesError) {
          console.error('Erro ao buscar famílias:', familiesError);
          return;
        }

        // Buscar aplicações
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('site_product_applications')
          .select('*')
          .eq('is_active', true);

        if (applicationsError) {
          console.error('Erro ao buscar aplicações:', applicationsError);
          return;
        }

        // Buscar mapeamentos
        const { data: segmentsMapData } = await supabase
          .from('site_product_segments_map')
          .select('*');

        const { data: groupsMapData } = await supabase
          .from('site_product_groups_map')
          .select('*');

        const { data: applicationsMapData } = await supabase
          .from('site_product_applications_map')
          .select('*');

        // Processar dados
        if (productsData && namesData && segmentsData && groupsData && familiesData && applicationsData) {
          const processedProducts = productsData.map(product => ({
            ...product,
            segments: segmentsMapData?.filter(map => map.product_id === product.id)
              .map(map => segmentsData.find(seg => seg.id === map.segment_id))
              .filter(Boolean) || [],
            groups: groupsMapData?.filter(map => map.product_id === product.id)
              .map(map => groupsData.find(group => group.id === map.group_id))
              .filter(Boolean) || [],
            applications: applicationsMapData?.filter(map => map.product_id === product.id)
              .map(map => applicationsData.find(app => app.id === map.application_id))
              .filter(Boolean) || []
          }));

          setProducts(processedProducts);
          setProductNames(namesData);
          setSegments(segmentsData);
          setGroups(groupsData);
          setFamilies(familiesData);
          setApplications(applicationsData);
        }
      } catch (error) {
        console.error('Erro geral ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const productName = productNames.find(name => name.id === product.name_id);
      
      // Filtro de busca
      if (searchTerm && productName) {
        const searchLower = searchTerm.toLowerCase();
        if (!productName.name.toLowerCase().includes(searchLower) &&
            !product.cas_number?.toLowerCase().includes(searchLower) &&
            !product.molecular_formula?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Filtro por segmento
      if (selectedSegment && !product.segments?.some(seg => seg?.id === selectedSegment)) {
        return false;
      }

      // Filtro por grupo
      if (selectedGroup && !product.groups?.some(group => group?.id === selectedGroup)) {
        return false;
      }

      // Filtro por família
      if (selectedFamily && product.family_id !== selectedFamily) {
        return false;
      }

      return true;
    });
  }, [products, productNames, searchTerm, selectedSegment, selectedGroup, selectedFamily]);
  
  // Agrupar produtos por nome
  const productsByName = useMemo(() => {
    const grouped: Record<string, { name: ProductName; products: Product[] }> = {};
    
    filteredProducts.forEach(product => {
      const productName = productNames.find(name => name.id === product.name_id);
      if (productName) {
        if (!grouped[productName.id]) {
          grouped[productName.id] = { name: productName, products: [] };
        }
        grouped[productName.id].products.push(product);
      }
    });
    
    return grouped;
  }, [filteredProducts, productNames]);

  // Calcular total de produtos ativos
  const totalActiveProducts = products.length;

  // Helper functions for filters
  const hasActiveFilters = selectedSegment !== '' || selectedGroup !== '' || selectedFamily !== '';
  
  const clearAllFilters = () => {
    setSelectedSegment('');
    setSelectedGroup('');
    setSelectedFamily('');
  };

  const copyCAS = async (cas: string) => {
    try {
      await navigator.clipboard.writeText(cas);
      setCopiedCAS(cas);
      setTimeout(() => setCopiedCAS(''), 2000);
    } catch (err) {
      console.error('Failed to copy CAS:', err);
    }
  };

  const toggleProductExpansion = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
      // Também remover dos detalhes expandidos
      const newDetails = new Set(expandedDetails);
      newDetails.delete(productId);
      setExpandedDetails(newDetails);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const toggleNameExpansion = (nameId: string) => {
    const newExpanded = new Set(expandedNames);
    if (newExpanded.has(nameId)) {
      newExpanded.delete(nameId);
    } else {
      newExpanded.add(nameId);
    }
    setExpandedNames(newExpanded);
  };

  const toggleDetailExpansion = (productId: string) => {
    const newExpanded = new Set(expandedDetails);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedDetails(newExpanded);
  };

  // Função para formatar estado físico
  const formatPhysicalState = (format: string | null | undefined): string => {
    if (!format) return '';
    
    switch (format.toLowerCase()) {
      case 'solid':
        return 'Sólido';
      case 'liquid':
        return 'Líquido';
      default:
        return format.charAt(0).toUpperCase() + format.slice(1).toLowerCase();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="top">
      {/* Header - same as other site pages */}
      <header className="sticky top-0 inset-x-0 z-[200] bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <ResponsiveContainer className="flex items-center justify-between py-2 md:py-3 mobile-safe-padding">
          <div className="flex items-center gap-4">
            <NavLink to="/auth" aria-label="Ir para login do app" title="Login" className="flex items-center gap-3">
              <img src="/lovable-uploads/aksell-logo-site.png" alt="Aksell logo - acessar login" className="h-8 md:h-10 w-auto" loading="lazy" />
            </NavLink>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-4">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink href="/site/home/pt" className="px-3 py-2 text-primary hover:text-primary">Início</NavigationMenuLink>
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

          {/* Mobile menu */}
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
                  <SheetClose asChild>
                    <NavLink to="/site/home/pt" className="rounded-md px-3 py-2 hover:bg-accent inline-flex items-center gap-2">
                      Início
                    </NavLink>
                  </SheetClose>
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
                    <NavLink to="/site/home/en" className="rounded-md px-3 py-2 hover:bg-accent inline-flex items-center gap-2">
                      <img src="https://flagcdn.com/us.svg" alt="English (US)" className="h-4 w-4 rounded-sm" loading="lazy" />
                      English
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
        {/* Hero Section */}
        <section ref={heroRef} className={`bg-background hero-texture ${heroInView ? 'hero-texture-pan' : ''} md:-mt-8 lg:-mt-12 xl:-mt-14`}>
          <ResponsiveContainer padding="sm" className="min-h-[180px] md:min-h-[240px] lg:min-h-[300px]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center py-4 md:py-6 lg:py-8">
              {/* Left: Title */}
              <div className="text-center lg:text-left">
                <div className={`bg-background/30 backdrop-blur-sm rounded-2xl p-6 md:p-8 ring-1 ring-primary/10 text-center ${heroInView ? 'animate-slide-in-left' : ''}`}>
                  <h1 className="text-4xl md:text-5xl font-bold text-amber-900 leading-tight">
                    Nossos Produtos
                  </h1>
                </div>
              </div>

              {/* Right: Hero Images */}
              <div className="relative h-[160px] md:h-[200px] lg:h-[240px] flex items-center justify-center">
                <div className="relative w-full max-w-lg h-full bg-card/20 backdrop-blur-sm rounded-3xl overflow-hidden shadow-elegant ring-1 ring-primary/10">
                  {imagesLoaded && productHeroImages.length > 0 && (
                    <>
                      {/* Previous image (for crossfade) */}
                      {isCrossfading && (
                        <img
                          src={productHeroImages[prevHeroIndex].src}
                          alt={productHeroImages[prevHeroIndex].alt}
                          className={`absolute inset-0 w-full h-full object-cover will-change-transform ${heroInView ? "animate-[heroZoomOut_10s_ease-out_forwards]" : ""} motion-reduce:animate-none`}
                          loading="eager"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      {/* Current image */}
                      <img
                        key={heroIndex}
                        src={productHeroImages[heroIndex].src}
                        alt={productHeroImages[heroIndex].alt}
                        className={`absolute inset-0 w-full h-full object-cover will-change-transform ${heroInView ? "animate-[heroZoomOut_10s_ease-out_forwards]" : ""} motion-reduce:animate-none transition-opacity duration-300 ${isCrossfading ? 'opacity-0' : 'opacity-100'}`}
                        loading="eager"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null;
                          img.src = '/lovable-uploads/d934859e-4790-40b1-b733-5aac51de303f.png';
                        }}
                      />
                    </>
                  )}
                  {!imagesLoaded && (
                    <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Central Search Section - matching home page design */}
        <section className="bg-gradient-section-warm py-4 md:py-6 -mt-3 md:-mt-4 lg:-mt-5">
          <ResponsiveContainer className="flex items-center justify-center gap-3">
            <div className="w-full max-w-2xl">
              <label className="sr-only" htmlFor="search">Buscar por nome de produto, fórmula molecular ou C.A.S.</label>
              <div className="group relative flex items-center rounded-full border bg-card/90 backdrop-blur-sm pl-4 pr-2 py-2 shadow-elegant ring-1 ring-primary/10 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300">
                <input
                  id="search"
                  placeholder="Buscar por nome de produto, fórmula molecular ou C.A.S."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground focus:placeholder:text-muted-foreground/70"
                  aria-label="Buscar por nome de produto, fórmula molecular ou C.A.S."
                />
                <button
                  type="button"
                  aria-label="Pesquisar"
                  className="ml-2 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 hover:bg-primary/15 hover:ring-primary/30 hover:shadow-glow transition-all duration-300 p-2"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Products Content */}
        <section className="bg-background">
          <ResponsiveContainer className="py-8 md:py-12">
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Sticky Glass Filters Sidebar */}
              <div className="lg:w-1/4">
                <div className="lg:sticky lg:top-24 space-y-4">
                  
                  {/* Filter Header */}
                  <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-elegant ring-1 ring-primary/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Filtros</h3>
                      </div>
                      {hasActiveFilters && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={clearAllFilters}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Limpar
                        </Button>
                      )}
                    </div>
                    
                    {/* Active Filters */}
                    {hasActiveFilters && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Filtros ativos:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedSegment && (
                            <Badge variant="outline" className="text-xs">
                              {segments.find(s => s.id === selectedSegment)?.name}
                              <button 
                                onClick={() => setSelectedSegment('')}
                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                              >
                                <X className="h-2 w-2" />
                              </button>
                            </Badge>
                          )}
                          {selectedGroup && (
                            <Badge variant="outline" className="text-xs">
                              {groups.find(g => g.id === selectedGroup)?.name}
                              <button 
                                onClick={() => setSelectedGroup('')}
                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                              >
                                <X className="h-2 w-2" />
                              </button>
                            </Badge>
                          )}
                          {selectedFamily && (
                            <Badge variant="outline" className="text-xs">
                              {families.find(f => f.id === selectedFamily)?.name}
                              <button 
                                onClick={() => setSelectedFamily('')}
                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                              >
                                <X className="h-2 w-2" />
                              </button>
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Segmentos Chips */}
                  <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-elegant ring-1 ring-primary/10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-6 bg-gradient-primary rounded-full"></div>
                      <h4 className="font-medium text-foreground">Segmentos</h4>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedSegment('')}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all bg-transparent hover:ring-1 hover:ring-muted-foreground/20 text-muted-foreground/80 hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span>Todos</span>
                        <Badge variant="secondary" className="text-xs">
                          {totalActiveProducts}
                        </Badge>
                      </button>
                      <div className="flex flex-wrap gap-1">
                        {segments
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(segment => {
                            const count = products.filter(p => 
                              p.segments?.some(s => s?.id === segment.id)
                            ).length;
                            
                            return (
                              <button
                                key={segment.id}
                                onClick={() => setSelectedSegment(segment.id)}
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all ${
                                  selectedSegment === segment.id
                                    ? 'bg-primary/15 text-primary ring-1 ring-primary/30' 
                                    : 'bg-transparent hover:ring-1 hover:ring-muted-foreground/20 text-muted-foreground/70 hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary'
                                }`}
                              >
                                <span>{segment.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {count}
                                </Badge>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Grupos Chips */}
                  <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-elegant ring-1 ring-primary/10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-6 bg-gradient-primary rounded-full"></div>
                      <h4 className="font-medium text-foreground">Grupos</h4>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedGroup('')}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all bg-transparent hover:ring-1 hover:ring-muted-foreground/20 text-muted-foreground/80 hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span>Todos</span>
                        <Badge variant="secondary" className="text-xs">
                          {totalActiveProducts}
                        </Badge>
                      </button>
                      <div className="flex flex-wrap gap-1">
                        {groups
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(group => {
                            const count = products.filter(p => 
                              p.groups?.some(g => g?.id === group.id)
                            ).length;
                            
                            return (
                              <button
                                key={group.id}
                                onClick={() => setSelectedGroup(group.id)}
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all ${
                                  selectedGroup === group.id
                                    ? 'bg-primary/15 text-primary ring-1 ring-primary/30' 
                                    : 'bg-transparent hover:ring-1 hover:ring-muted-foreground/20 text-muted-foreground/70 hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary'
                                }`}
                              >
                                <span>{group.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {count}
                                </Badge>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Famílias Chips */}
                  <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-elegant ring-1 ring-primary/10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-6 bg-gradient-primary rounded-full"></div>
                      <h4 className="font-medium text-foreground">Famílias</h4>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedFamily('')}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all bg-transparent hover:ring-1 hover:ring-muted-foreground/20 text-muted-foreground/80 hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span>Todas</span>
                        <Badge variant="secondary" className="text-xs">
                          {totalActiveProducts}
                        </Badge>
                      </button>
                      <div className="flex flex-wrap gap-1">
                        {families
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(family => {
                            const count = products.filter(p => p.family_id === family.id).length;
                            
                            return (
                              <button
                                key={family.id}
                                onClick={() => setSelectedFamily(family.id)}
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all ${
                                  selectedFamily === family.id
                                    ? 'bg-primary/15 text-primary ring-1 ring-primary/30' 
                                    : 'bg-transparent hover:ring-1 hover:ring-muted-foreground/20 text-muted-foreground/70 hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary'
                                }`}
                              >
                                <span>{family.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {count}
                                </Badge>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Área principal com produtos */}
              <div className="lg:w-3/4">
                
                {/* Products Header with View Toggle */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Package className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">
                      {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full p-1 shadow-elegant ring-1 ring-primary/10">
                    <button
                      onClick={() => setViewMode('grouped')}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all ${
                        viewMode === 'grouped'
                          ? 'bg-primary text-primary-foreground shadow-glow'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline">Agrupar</span>
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all ${
                        viewMode === 'grid'
                          ? 'bg-primary text-primary-foreground shadow-glow'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                      <span className="hidden sm:inline">Grade</span>
                    </button>
                  </div>
                </div>
                
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 shadow-elegant ring-1 ring-primary/10 inline-block">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-foreground mb-2">
                        Nenhum produto encontrado
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Tente ajustar os filtros ou termos de busca.
                      </p>
                      {hasActiveFilters && (
                        <Button onClick={clearAllFilters} variant="outline" size="sm">
                          <X className="h-4 w-4 mr-2" />
                          Limpar todos os filtros
                        </Button>
                      )}
                    </div>
                  </div>
                ) : viewMode === 'grid' ? (
                  // Grid Mode - Show individual products directly
                  <div className="space-y-4">
                    {filteredProducts.map((product) => {
                      const productName = productNames.find(name => name.id === product.name_id);
                      const isProductExpanded = expandedProducts.has(product.id);
                      
                      if (!productName) return null;
                      
                      return (
                        <Card key={product.id} className="shadow-elegant ring-1 ring-border overflow-hidden">
                          <CardContent className="p-0">
                            <div 
                              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors group"
                              onClick={() => toggleProductExpansion(product.id)}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="p-1.5 bg-secondary/50 rounded-lg ring-1 ring-secondary/60 group-hover:shadow-card transition-all">
                                  {isProductExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-secondary-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-secondary-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-medium text-amber-800">
                                      {productName.name}
                                    </h3>
                                    <span className="text-muted-foreground">•</span>
                                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                      {product.compound_type?.trim() || 'Particularidades'}
                                    </h4>
                                  </div>
                                
                                  {/* Enhanced Property Chips - First Line */}
                                  <div className="space-y-2">
                                    {/* First line: Physical State, Molecular Formula, Molecular Weight */}
                                    <div className="flex flex-wrap gap-2">
                                      {product.product_format && (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-secondary/15 text-secondary-foreground rounded-full ring-1 ring-secondary/25">
                                          <Package className="h-3 w-3" />
                                          <span>{formatPhysicalState(product.product_format)}</span>
                                        </div>
                                      )}
                                      {product.molecular_formula && (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent/10 text-amber-800 rounded-full ring-1 ring-accent/20">
                                          <span className="font-mono">{product.molecular_formula}</span>
                                        </div>
                                      )}
                                      {product.molecular_weight && product.molecular_weight > 0 && (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted/15 text-muted-foreground rounded-full ring-1 ring-muted/25">
                                          <span>Peso Molecular: {product.molecular_weight} g/mol</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Second line: C.A.S and C.A.S Note */}
                                    <div className="flex flex-wrap gap-2">
                                      {product.cas_number && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyCAS(product.cas_number!);
                                          }}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent/10 text-amber-800 rounded-full ring-1 ring-accent/20 hover:bg-accent/15 hover:ring-accent/30 hover:shadow-glow transition-all group/cas"
                                          title="Clique para copiar o CAS"
                                        >
                                          <Beaker className="h-3 w-3" />
                                          <span className="font-mono">CAS: {product.cas_number}</span>
                                          {copiedCAS === product.cas_number ? (
                                            <CheckCircle className="h-3 w-3 text-success" />
                                          ) : (
                                            <Copy className="h-3 w-3 opacity-0 group-hover/cas:opacity-100 transition-opacity" />
                                          )}
                                        </button>
                                      )}
                                      {product.cas_note && (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-100 text-orange-800 rounded-full ring-1 ring-orange-200">
                                          <span>Obs. CAS: {product.cas_note}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {isProductExpanded && (
                              <div className="border-t bg-gradient-card p-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                  {/* Product Information */}
                                  <div className="space-y-4">
                                    {/* Applications - moved to first position */}
                                    {(() => {
                                      console.debug('Product applications:', product.applications);
                                      return product.applications?.length > 0 && (
                                        <div>
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1 h-6 bg-gradient-primary rounded-full"></div>
                                            <span className="font-medium text-foreground">Aplicações</span>
                                          </div>
                                           <div className="flex flex-wrap gap-2">
                                             {product.applications.map((application) => application && (
                                               <Badge key={application.id} variant="secondary" className="px-3 py-1 font-medium text-foreground hover:bg-muted/50 transition-colors bg-transparent">
                                                 <div className="flex items-center gap-2">
                                                   <div className="w-2 h-2 bg-gradient-primary rounded-full"></div>
                                                   {application.name}
                                                 </div>
                                               </Badge>
                                             ))}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  {/* Product Images */}
                                  <div className="space-y-4">
                                     {product.product_image_url && (
                                       <div>
                                         <span className="text-sm font-medium text-foreground block mb-2">Foto do Produto</span>
                                         <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-elegant ring-1 ring-primary/10">
                                           <img 
                                             src={product.product_image_url} 
                                             alt={`Foto do produto ${productName.name}`}
                                             className="w-full h-auto rounded-xl object-contain"
                                             loading="lazy"
                                           />
                                         </div>
                                         <p className="text-xs text-muted-foreground mt-2 italic text-center">
                                           Imagem meramente ilustrativa. Caso deseje dados sobre a aparência e características reais do produto, entre em contato conosco.
                                         </p>
                                       </div>
                                     )}
                                     {product.molecular_structure_image_url && (
                                       <div>
                                         <span className="text-sm font-medium text-foreground block mb-2">Estrutura Molecular</span>
                                         <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-elegant ring-1 ring-primary/10">
                                           <img 
                                             src={product.molecular_structure_image_url} 
                                             alt={`Estrutura molecular de ${productName.name}`}
                                             className="w-full h-auto rounded-xl object-contain"
                                             loading="lazy"
                                           />
                                         </div>
                                         <p className="text-xs text-muted-foreground mt-2 italic text-center">
                                           Imagem meramente ilustrativa. Caso deseje dados sobre a aparência e características reais do produto, entre em contato conosco.
                                         </p>
                                       </div>
                                     )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  // Grouped Mode - Show products grouped by name (original behavior)
                  <div className="space-y-6">
                    {Object.entries(productsByName).map(([nameId, { name, products }]) => (
                      <Card key={nameId} className="shadow-elegant ring-1 ring-border overflow-hidden">
                        <CardContent className="p-0">
                          {/* Enhanced Group Header */}
                          <div 
                            className="relative flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors group"
                            onClick={() => toggleNameExpansion(nameId)}
                          >
                            {/* Left border gradient */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-primary"></div>
                            
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-primary/10 rounded-lg ring-1 ring-primary/20 group-hover:shadow-glow transition-all">
                                {expandedNames.has(nameId) ? (
                                  <ChevronDown className="h-4 w-4 text-primary" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Beaker className="h-5 w-5 text-primary" />
                                <div>
                                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                                    {name.name}
                                  </h2>
                                  <p className="text-sm text-muted-foreground">
                                    {products.length} {products.length !== 1 ? 'variações' : 'variação'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <Badge variant="secondary" className="text-lg px-4 py-2 bg-primary/10 text-primary ring-1 ring-primary/20">
                              {products.length}
                            </Badge>
                          </div>

                          {expandedNames.has(nameId) && (
                            <div className="border-t bg-gradient-subtle p-6">
                              <div className="grid gap-4">
                                {products.map((product) => {
                                  const isProductExpanded = expandedProducts.has(product.id);
                                  
                                  return (
                                    <div key={product.id} className="bg-card/90 backdrop-blur-sm rounded-xl ring-1 ring-border overflow-hidden shadow-card">
                                      <div 
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors group"
                                        onClick={() => toggleProductExpansion(product.id)}
                                      >
                                        <div className="flex items-center gap-3 flex-1">
                                          <div className="p-1.5 bg-secondary/50 rounded-lg ring-1 ring-secondary/60 group-hover:shadow-card transition-all">
                                            {isProductExpanded ? (
                                              <ChevronDown className="h-4 w-4 text-secondary-foreground" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4 text-secondary-foreground" />
                                            )}
                                          </div>
                                            <div className="flex-1">
                                             <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-medium text-amber-800">
                                                  {name.name}
                                                </h3>
                                                <span className="text-muted-foreground">•</span>
                                                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                  {product.compound_type?.trim() || 'Particularidades'}
                                                </h4>
                                             </div>
                                            
                                             {/* Enhanced Property Chips - First Line */}
                                             <div className="space-y-2">
                                               {/* First line: Physical State, Molecular Formula, Molecular Weight */}
                                               <div className="flex flex-wrap gap-2">
                                                 {product.product_format && (
                                                   <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-secondary/15 text-secondary-foreground rounded-full ring-1 ring-secondary/25">
                                                     <Package className="h-3 w-3" />
                                                     <span>{formatPhysicalState(product.product_format)}</span>
                                                   </div>
                                                 )}
                                                 {product.molecular_formula && (
                                                   <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent/10 text-amber-800 rounded-full ring-1 ring-accent/20">
                                                     <span className="font-mono">{product.molecular_formula}</span>
                                                   </div>
                                                 )}
                                                 {product.molecular_weight && product.molecular_weight > 0 && (
                                                   <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted/15 text-muted-foreground rounded-full ring-1 ring-muted/25">
                                                     <span>Peso Molecular: {product.molecular_weight} g/mol</span>
                                                   </div>
                                                 )}
                                               </div>
                                               
                                               {/* Second line: C.A.S and C.A.S Note */}
                                               <div className="flex flex-wrap gap-2">
                                                 {product.cas_number && (
                                                   <button
                                                     onClick={(e) => {
                                                       e.stopPropagation();
                                                       copyCAS(product.cas_number!);
                                                     }}
                                                     className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent/10 text-amber-800 rounded-full ring-1 ring-accent/20 hover:bg-accent/15 hover:ring-accent/30 hover:shadow-glow transition-all group/cas"
                                                     title="Clique para copiar o CAS"
                                                   >
                                                     <Beaker className="h-3 w-3" />
                                                     <span className="font-mono">CAS: {product.cas_number}</span>
                                                     {copiedCAS === product.cas_number ? (
                                                       <CheckCircle className="h-3 w-3 text-success" />
                                                     ) : (
                                                       <Copy className="h-3 w-3 opacity-0 group-hover/cas:opacity-100 transition-opacity" />
                                                     )}
                                                   </button>
                                                 )}
                                                 {product.cas_note && (
                                                   <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-100 text-orange-800 rounded-full ring-1 ring-orange-200">
                                                     <span>Obs. CAS: {product.cas_note}</span>
                                                   </div>
                                                 )}
                                               </div>
                                             </div>
                                          </div>
                                        </div>
                                      </div>

                                      {isProductExpanded && (
                                        <div className="border-t bg-gradient-card p-6">
                                          <div className="space-y-6">
                                            {/* Applications Section - Full Width, One Per Line */}
                                            {product.applications?.length > 0 && (
                                              <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                  <div className="w-1 h-6 bg-gradient-primary rounded-full"></div>
                                                  <span className="font-medium text-foreground">Aplicações</span>
                                                </div>
                                                <div className="space-y-2">
                                                  {product.applications.map((application) => application && (
                                                    <div key={application.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                                                      <div className="w-2 h-2 bg-gradient-primary rounded-full flex-shrink-0"></div>
                                                      <span className="text-foreground font-medium">{application.name}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {/* Images Section - Side by Side on Desktop, Stacked on Mobile */}
                                            {(product.molecular_structure_image_url || product.product_image_url) && (
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Molecular Structure Image - Left on Desktop */}
                                                {product.molecular_structure_image_url && (
                                                  <div className="space-y-3">
                                                    <span className="text-sm font-medium text-foreground block">Estrutura Molecular</span>
                                                    <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-elegant ring-1 ring-primary/10">
                                                      <img 
                                                        src={product.molecular_structure_image_url} 
                                                        alt={`Estrutura molecular de ${name.name}`}
                                                        className="w-full h-auto rounded-xl object-contain max-h-64"
                                                        loading="lazy"
                                                      />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground italic text-center">
                                                      Estrutura molecular gerada por IA com fins educativos. Para dados técnicos precisos, entre em contato.
                                                    </p>
                                                  </div>
                                                )}

                                                {/* Product Image - Right on Desktop */}
                                                {product.product_image_url && (
                                                  <div className="space-y-3">
                                                    <span className="text-sm font-medium text-foreground block">Foto do Produto</span>
                                                    <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-elegant ring-1 ring-primary/10">
                                                      <img 
                                                        src={product.product_image_url} 
                                                        alt={`Foto do produto ${name.name}`}
                                                        className="w-full h-auto rounded-xl object-contain max-h-64"
                                                        loading="lazy"
                                                      />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground italic text-center">
                                                      Imagem meramente ilustrativa. Para dados sobre aparência e características reais, entre em contato.
                                                    </p>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ResponsiveContainer>
        </section>
      </main>
    </div>
  );
};

export default ProductsPage;