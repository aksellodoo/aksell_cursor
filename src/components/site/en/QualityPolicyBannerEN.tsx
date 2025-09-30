import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { useInView } from "@/hooks/useInView";

export const QualityPolicyBannerEN = () => {
  const { ref: cardRef, inView } = useInView({ threshold: 0.5, once: false });

  return (
    <section aria-label="Quality and Food Safety Policy" className="bg-background">
      <ResponsiveContainer className="py-8 md:py-12">
        <div className="relative rounded-3xl overflow-hidden ring-1 ring-primary/10">
          <img
            src="https://i.postimg.cc/fDCBWd68/man-lab-doing-experiments-wb.jpg"
            alt="Laboratory professional conducting experiments, representing quality and food safety"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.onerror = null;
              img.src = '/lovable-uploads/d934859e-4790-40b1-b733-5aac51de303f.png';
            }}
          />
          <div className="absolute inset-0 bg-foreground/10" aria-hidden="true" />

          <div className="relative grid md:grid-cols-[1fr_minmax(320px,560px)] gap-6 md:gap-10 items-center p-6 md:p-10">
            <div className="hidden md:block" aria-hidden="true" />

            <article
              ref={cardRef}
              className={`bg-card text-card-foreground rounded-2xl shadow-elegant ring-1 ring-primary/10 p-6 md:p-8 md:ml-auto max-w-[800px]
                ${inView ? 'animate-bounce-in' : 'opacity-0 scale-95'}`}
            >
              <h2 className="font-oswald text-primary font-semibold text-2xl md:text-3xl lg:text-4xl leading-tight">
                Quality and Food Safety Policy
              </h2>
              <div className="mt-4 space-y-4 text-muted-foreground">
                <p>
                  Meet our customers’ requirements by establishing criteria for quality and food safety, with processes monitored according to applicable legislation and standards.
                </p>
                <p>
                  Communicate and effectively monitor, throughout the entire production chain, the necessary food safety aspects to ensure a safe product for our customers.
                </p>
                <p>
                  Ensure the training and competencies required to meet these aspects and strengthen a culture of quality and food safety.
                </p>
                <p>
                  Continuously improve production and management processes, always aiming to enhance the Quality and Food Safety Management System.
                </p>
              </div>
            </article>
          </div>
        </div>
      </ResponsiveContainer>
    </section>
  );
};

export default QualityPolicyBannerEN;