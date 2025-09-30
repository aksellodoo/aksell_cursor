import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";

interface ValueItem {
  title: string;
  text: string;
  image: string;
  alt: string;
}

const VALUES: ValueItem[] = [
  {
    image: "https://i.postimg.cc/3KV8DdDG/business-people-2025-03-10-11-12-14-utc-scaled.jpg",
    title: "Respeito com as nossas relações.",
    text:
      "Tratamos com respeito todos os envolvidos em nossa jornada: clientes, colaboradores, fornecedores, sociedade e meio ambiente. Valorizamos a diversidade e a interação ética como elementos fundamentais de nossa cultura organizacional.",
    alt: "Equipe de negócios em reunião representando respeito nas relações",
  },
  {
    image: "https://i.postimg.cc/RCzvXydV/01-akse-criacao-marca-v01-0524-20cut.png",
    title: "Transparência como pilar essencial.",
    text:
      "Conduzimos nossos negócios com total clareza na governança, agindo com ética e comprometimento. Acreditamos que a transparência não só fortalece laços duradouros, mas também constrói confiança sólida com todas as partes envolvidas.",
    alt: "Gráfico e elementos visuais representando transparência na governança",
  },
  {
    image: "https://i.postimg.cc/JR7zwwLs/medical-science-woman-and-microscope-in-a-laborat-2023-11-27-04-59-47-utc-scaled.jpg",
    title: "Segurança como prioridade.",
    text:
      "Demonstramos nosso compromisso com a atenção meticulosa aos detalhes, o cuidado, a dedicação e o conhecimento aplicado em todas as nossas operações. Valorizamos um ambiente seguro e confiável como base para nossas atividades.",
    alt: "Cientista utilizando microscópio representando segurança e precisão",
  },
  {
    image: "https://i.postimg.cc/Ykg9YfRC/imagem-do-whatsapp-de-2025-03-14-as-121431-73c21888.jpg",
    title: "Compromisso com a singularidade.",
    text:
      "Entendemos que cada cliente é único. Desenvolvemos soluções singulares e sob medida, atendendo às demandas específicas que outros não conseguem buscando sempre a excelência com inovação.",
    alt: "Profissional analisando solução sob medida representando singularidade",
  },
  {
    image: "https://i.postimg.cc/8NSCHJXB/hes-skilled-in-all-areas-of-the-clinical-laborator-2023-11-27-05-03-52-utc-scaled.jpg",
    title: "Busca constante por eficiência.",
    text:
      "Evolução contínua, tanto técnica quanto pessoal, impulsionando a sustentabilidade e superando desafios. Estamos determinados a não apenas atender, mas ultrapassar as expectativas, construindo relações sólidas de sucesso.",
    alt: "Profissional de laboratório representando eficiência contínua",
  },
  {
    image: "https://i.postimg.cc/JM5zdr9w/business-woman-freelance-person-or-creative-stylis-2023-11-27-05-05-02-utc-scaled.jpg",
    title: "Foco em resultados.",
    text:
      "Adotamos uma mentalidade ágil, destacada pela rapidez e flexibilidade, direcionada aos resultados. Valorizamos a capacidade de adaptação em um cenário dinâmico, no desafio constante de entregar soluções de alta performance.",
    alt: "Executiva analisando indicadores representando foco em resultados",
  },
];

export const ValuesSection = () => {
  return (
    <section id="valores" aria-labelledby="nossos-valores-title" className="bg-background">
      <ResponsiveContainer className="py-10 md:py-14">
        <header className="text-center mb-8 md:mb-12">
          <h2 id="nossos-valores-title" className="font-oswald text-3xl md:text-5xl font-bold text-[hsl(var(--brand-brown))]">
            Nossos Valores
          </h2>
        </header>

        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((item, idx) => (
            <Card key={idx} className="group overflow-hidden border-0 bg-muted text-foreground shadow-card hover-lift rounded-2xl">
              <div className="relative w-full h-44 md:h-52 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.alt}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.onerror = null;
                    img.src = '/lovable-uploads/d934859e-4790-40b1-b733-5aac51de303f.png';
                  }}
                />
              </div>
              <CardContent className="px-5 pb-5 pt-5">
                <h3 className="text-xl md:text-[22px] font-bold leading-snug mb-2 text-[hsl(var(--brand-brown))]">
                  {item.title}
                </h3>
                <p className="text-base md:text-[15px] leading-relaxed text-foreground">
                  {item.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ResponsiveContainer>
    </section>
  );
};
