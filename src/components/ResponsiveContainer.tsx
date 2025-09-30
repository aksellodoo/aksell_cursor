import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
  mobileOptimized?: boolean;
}

export const ResponsiveContainer = ({ 
  children, 
  className,
  maxWidth = "xl",
  padding = "md",
  mobileOptimized = false
}: ResponsiveContainerProps) => {
  const isMobile = useIsMobile();
  
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-7xl",
    "2xl": "max-w-8xl",
    full: "max-w-full"
  };

  const paddingClasses = {
    none: "",
    sm: isMobile && mobileOptimized ? "p-2 md:p-3 lg:p-4" : "p-3 md:p-4 lg:p-6",
    md: isMobile && mobileOptimized ? "p-3 md:p-4 lg:p-6" : "p-4 md:p-6 lg:p-8",
    lg: isMobile && mobileOptimized ? "p-4 md:p-6 lg:p-8" : "p-6 md:p-8 lg:p-12"
  };

  return (
    <div className={cn(
      "w-full mx-auto",
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      mobileOptimized && isMobile && "touch-manipulation", // Improve touch performance
      className
    )}>
      {children}
    </div>
  );
};