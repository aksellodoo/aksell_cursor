import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InteractiveCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "hover-lift" | "hover-glow" | "interactive";
  animationDelay?: number;
}

export const InteractiveCard = ({
  title,
  description,
  children,
  onClick,
  className,
  variant = "default",
  animationDelay = 0
}: InteractiveCardProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "hover-lift":
        return "hover-lift";
      case "hover-glow":
        return "hover-glow";
      case "interactive":
        return "card-interactive";
      default:
        return "transition-all duration-300 hover:shadow-md";
    }
  };

  return (
    <Card 
      className={cn(
        "shadow-elegant border-0 bg-card/90 backdrop-blur-sm animate-fade-in",
        getVariantClasses(),
        onClick && "cursor-pointer",
        className
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-foreground font-bold tracking-tight">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="font-medium">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};