import { ReactNode, forwardRef } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends ButtonProps {
  children: ReactNode;
  animation?: "press" | "lift" | "glow" | "pulse" | "bounce";
  loading?: boolean;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, animation = "press", loading, className, disabled, ...props }, ref) => {
    const getAnimationClasses = () => {
      switch (animation) {
        case "press":
          return "button-press";
        case "lift":
          return "hover-lift";
        case "glow":
          return "hover-glow";
        case "pulse":
          return "pulse-primary";
        case "bounce":
          return "transition-bounce hover:scale-105";
        default:
          return "";
      }
    };

    return (
      <Button
        ref={ref}
        className={cn(
          getAnimationClasses(),
          loading && "opacity-70 cursor-not-allowed",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Carregando...
          </div>
        ) : (
          children
        )}
      </Button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";