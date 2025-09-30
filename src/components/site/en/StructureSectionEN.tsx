import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";

interface StructureItem {
  image: string;
  title: string;
  alt: string;
}

const ITEMS: StructureItem[] = [
  {
    image:
      "https://i.postimg.cc/wHhwPZF8/mechanical-engineer-inspection-pipe-tube-connectio-2024-10-18-06-35-44-utc-scaled.jpg",
    title: "Flexibility and variety in the production line",
    alt: "Engineer inspecting industrial piping connections",
  },
  {
    image:
      "https://i.postimg.cc/8D8yZNRm/warehouse-workers-managing-inventory-with-forklift-2025-03-04-19-48-21-utc-scaled.jpg",
    title: "Broad and well-located stock",
    alt: "Warehouse workers managing inventory with a forklift",
  },
  {
    image:
      "https://i.postimg.cc/kqqTdshV/trucks-in-the-distribution-hub-2025-01-07-04-38-57-utc-scaled.jpg",
    title: "Flexible logistics",
    alt: "Trucks at a distribution hub",
  },
];

export const StructureSectionEN = () => {
  return (
    <section aria-labelledby="structure-title" className="bg-background">
      <ResponsiveContainer className="py-10 md:py-14 motion-safe:animate-fade-in">
        <header className="text-center mb-6 md:mb-10">
          <h2
            id="structure-title"
            className="font-oswald text-3xl md:text-5xl font-bold text-[hsl(var(--brand-brown))]"
          >
            Structure
          </h2>
          <p className="mt-3 text-muted-foreground max-w-3xl mx-auto">
            Physical infrastructure and equipment for service delivery, plus a fully equipped laboratory for food analysis, enabling us to offer a complete outsourcing solution.
          </p>
        </header>

        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item, idx) => (
            <Card
              key={idx}
              className="group overflow-hidden border bg-card text-card-foreground rounded-2xl shadow-elegant hover-scale ring-1 ring-primary/10"
            >
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
                    img.src = "/lovable-uploads/d934859e-4790-40b1-b733-5aac51de303f.png";
                  }}
                />
              </div>
              <CardContent className="px-5 pb-5 pt-5">
                <h3 className="text-xl md:text-[22px] font-bold leading-snug text-center text-[hsl(var(--brand-brown))]">
                  {item.title}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </ResponsiveContainer>
    </section>
  );
};

export default StructureSectionEN;