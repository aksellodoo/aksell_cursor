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
    title: "Respect in our relationships.",
    text:
      "We treat everyone involved in our journey with respect: customers, employees, suppliers, society and the environment. We value diversity and ethical interaction as fundamental elements of our culture.",
    alt: "Business team in a meeting representing respect in relationships",
  },
  {
    image: "https://i.postimg.cc/RCzvXydV/01-akse-criacao-marca-v01-0524-20cut.png",
    title: "Transparency as an essential pillar.",
    text:
      "We conduct our business with full clarity in governance, acting with ethics and commitment. Transparency strengthens long‑term relationships and builds solid trust with all stakeholders.",
    alt: "Chart and visual elements representing transparency in governance",
  },
  {
    image: "https://i.postimg.cc/JR7zwwLs/medical-science-woman-and-microscope-in-a-laborat-2023-11-27-04-59-47-utc-scaled.jpg",
    title: "Safety as a priority.",
    text:
      "We demonstrate our commitment through meticulous attention to detail, care, dedication and applied knowledge across our operations. A safe and reliable environment is the basis of our activities.",
    alt: "Scientist using a microscope representing safety and precision",
  },
  {
    image: "https://i.postimg.cc/Ykg9YfRC/imagem-do-whatsapp-de-2025-03-14-as-121431-73c21888.jpg",
    title: "Commitment to uniqueness.",
    text:
      "We understand each customer is unique. We develop tailored, one‑of‑a‑kind solutions that meet specific demands others cannot, always pursuing excellence through innovation.",
    alt: "Professional analyzing a tailored solution representing uniqueness",
  },
  {
    image: "https://i.postimg.cc/8NSCHJXB/hes-skilled-in-all-areas-of-the-clinical-laborator-2023-11-27-05-03-52-utc-scaled.jpg",
    title: "Relentless pursuit of efficiency.",
    text:
      "Continuous evolution, both technical and personal, driving sustainability and overcoming challenges. We aim not only to meet but to exceed expectations, building strong relationships for success.",
    alt: "Laboratory professional representing continuous efficiency",
  },
  {
    image: "https://i.postimg.cc/JM5zdr9w/business-woman-freelance-person-or-creative-stylis-2023-11-27-05-05-02-utc-scaled.jpg",
    title: "Results‑driven focus.",
    text:
      "We adopt an agile mindset—speedy and flexible—focused on outcomes. We value adaptability in a dynamic environment and the constant challenge of delivering high‑performance solutions.",
    alt: "Executive analyzing KPIs representing results focus",
  },
];

export const ValuesSectionEN = () => {
  return (
    <section id="values" aria-labelledby="our-values-title" className="bg-background">
      <ResponsiveContainer className="py-10 md:py-14">
        <header className="text-center mb-8 md:mb-12">
          <h2 id="our-values-title" className="font-oswald text-3xl md:text-5xl font-bold text-[hsl(var(--brand-brown))]">
            Our Values
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

export default ValuesSectionEN;
