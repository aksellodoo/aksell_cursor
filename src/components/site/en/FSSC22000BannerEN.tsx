import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { useInView } from "@/hooks/useInView";

export const FSSC22000BannerEN = () => {
  const { ref: sectionRef, inView: sectionInView } = useInView({ threshold: 0.4, once: false });
  const { ref: cardRef, inView: cardInView } = useInView({ threshold: 0.4, once: false });

  return (
    <section
      aria-label="FSSC 22000 Certification"
      ref={sectionRef}
      className="bg-background hero-texture"
    >
      <ResponsiveContainer className="py-8 md:py-12">
        <div className={`relative rounded-3xl overflow-hidden ring-1 ring-primary/10 ${sectionInView ? 'hero-texture-pan' : ''}`}>
          <div className="absolute inset-0 bg-foreground/5" aria-hidden="true" />

          <div className="relative grid md:grid-cols-[minmax(280px,420px)_1fr] gap-6 md:gap-10 items-center p-6 md:p-10">
            <div className="relative h-[220px] md:h-[280px] lg:h-[320px] w-full overflow-hidden rounded-2xl shadow-elegant ring-1 ring-primary/10">
              <img
                src="https://i.postimg.cc/kqvhVztF/selo-quadro.jpg"
                alt="FSSC 22000 certification seal by DNV-GL"
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

            <article
              ref={cardRef}
              className={`bg-card text-card-foreground rounded-2xl shadow-elegant ring-1 ring-primary/10 p-6 md:p-8 ${cardInView ? 'animate-bounce-in' : 'opacity-0 scale-95'}`}
            >
              <h2 className="font-oswald font-semibold text-2xl md:text-3xl lg:text-4xl leading-tight text-[hsl(var(--brand-brown))]">
                FSSC 22000 Certification
              </h2>
              <p className="mt-4 text-muted-foreground">
                Aksell Nutrition, committed to the safety and quality of its products, is FSSC 22000 certified by DNV-GL.
              </p>
            </article>
          </div>
        </div>
      </ResponsiveContainer>
    </section>
  );
};

export default FSSC22000BannerEN;