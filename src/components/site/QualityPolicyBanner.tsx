import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { useInView } from "@/hooks/useInView";

export const QualityPolicyBanner = () => {
  const { ref: cardRef, inView } = useInView({ threshold: 0.5, once: false });

  return (
    <section aria-label="Política de Qualidade e Segurança de Alimentos" className="bg-background">
      <ResponsiveContainer className="py-8 md:py-12">
        <div className="relative rounded-3xl overflow-hidden ring-1 ring-primary/10">
          <img
            src="https://i.postimg.cc/fDCBWd68/man-lab-doing-experiments-wb.jpg"
            alt="Profissional de laboratório realizando experimentos, representando qualidade e segurança de alimentos"
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
                Política de Qualidade e Segurança de Alimentos
              </h2>
              <div className="mt-4 space-y-4 text-muted-foreground">
                <p>
                  Atender aos requisitos dos nossos clientes, estabelecendo critérios sobre a qualidade e a segurança dos alimentos, tendo um processo monitorado pelas legislações e normas vigentes.
                </p>
                <p>
                  Comunicar e monitorar de forma eficaz, ao longo de toda cadeia produtiva, os aspectos de segurança dos alimentos necessários para garantir um produto seguro aos nossos clientes.
                </p>
                <p>
                  Assegurar também a capacitação e competências necessárias para o cumprimento destes aspectos e o fortalecimento da cultura de qualidade e segurança dos alimentos.
                </p>
                <p>
                  Por fim, aprimorar os processos produtivos e de gestão, visando sempre a melhoria contínua do Sistema de Gestão de Qualidade e Segurança do Alimento.
                </p>
              </div>
            </article>
          </div>
        </div>
      </ResponsiveContainer>
    </section>
  );
};

export default QualityPolicyBanner;
