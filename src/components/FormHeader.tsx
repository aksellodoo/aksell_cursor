import { Logo } from "@/components/Logo";

interface FormHeaderProps {
  variant?: "full" | "compact";
  className?: string;
}

export const FormHeader = ({ variant = "full", className = "" }: FormHeaderProps) => {
  const handleLogoClick = () => {
    window.location.href = '/site/home/pt';
  };

  return (
    <div className={`flex items-center justify-center bg-gradient-to-r from-primary/5 to-accent/5 border border-border/50 rounded-lg p-4 mb-6 shadow-sm ${className}`}>
      {/* Logo Aksell Centralizado - Clicável para ir ao site público */}
      <Logo 
        size={variant === "compact" ? "sm" : "md"} 
        variant="full"
        onClick={handleLogoClick}
      />
    </div>
  );
};