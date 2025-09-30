"use client";

import { motion } from "framer-motion";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import WhisperText from "./whisper-text";

function ElegantShape({
  className,
  delay = 0,
  width = 200,
  height = 50,
  rotate = 0,
  gradient = "from-white/[0.08]",
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -50,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: "easeOut",
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{
          y: [0, 8, 0],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{
          width,
          height,
        }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-white/[0.15]",
            "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  );
}

function PassionHero({
  title = "Paixão pelos detalhes",
  subtitle = "Transformamos cada elemento em uma expressão única de excelência para catalisar o sucesso do seu negócio.",
}: {
  title?: string;
  subtitle?: string;
}) {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: "easeOut" as const,
      },
    }),
  };

  return (
    <div className="relative py-10 md:py-16 text-center overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03] blur-3xl" />

      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={300}
          height={70}
          rotate={12}
          gradient="from-primary/[0.08]"
          className="left-[-5%] top-[20%]"
        />

        <ElegantShape
          delay={0.5}
          width={250}
          height={60}
          rotate={-15}
          gradient="from-accent/[0.08]"
          className="right-[-3%] top-[70%]"
        />

        <ElegantShape
          delay={0.4}
          width={150}
          height={40}
          rotate={-8}
          gradient="from-secondary/[0.08]"
          className="left-[10%] bottom-[10%]"
        />

        <ElegantShape
          delay={0.6}
          width={100}
          height={30}
          rotate={20}
          gradient="from-muted/[0.08]"
          className="right-[20%] top-[15%]"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 space-y-4">

        <motion.div
          custom={1}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-h1-premium text-primary text-hover-lift mx-auto">
            {title}
          </h2>
        </motion.div>

        <motion.div
          custom={2}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
        >
          <WhisperText
            text={subtitle}
            className="text-body-lg-premium mx-auto max-w-3xl text-[hsl(var(--brand-brown))]"
            delay={60}
            duration={0.5}
            x={-15}
            y={0}
          />
        </motion.div>
      </div>
    </div>
  );
}

export { PassionHero };