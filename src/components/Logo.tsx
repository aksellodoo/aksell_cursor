import aksellLogo from "@/assets/aksell-logo-new.svg";
import aksellIcon from "@/assets/aksell-icon-official.png";
console.log("Logo component loaded");
interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  variant?: "full" | "icon-only" | "text-only";
  onClick?: () => void;
}
export const Logo = ({
  size = "md",
  animated = false,
  variant = "full",
  onClick
}: LogoProps) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24"
  };
  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-4xl"
  };
  const handleClick = () => {
    onClick?.();
  };
  if (variant === "text-only") {
    return (
      <div 
        className={`cursor-pointer transition-smooth ${onClick ? 'hover:scale-105' : ''} ${animated ? 'text-shimmer' : ''}`} 
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <span className={`font-bold text-primary ${textSizeClasses[size]} tracking-tight`}>
          Aksell Nutrition
        </span>
      </div>
    );
  }
  if (variant === "icon-only") {
    return (
      <div 
        className={`relative cursor-pointer transition-smooth hover-lift ${onClick ? 'hover:scale-105' : ''} ${animated ? 'logo-animation' : ''}`} 
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <img src={aksellIcon} alt="Aksell" className={`${sizeClasses[size]} object-contain transition-smooth`} />
      </div>
    );
  }
  return (
    <div 
      className={`flex items-center cursor-pointer transition-smooth group hover-lift ${onClick ? 'hover:scale-105' : ''} ${animated ? 'logo-animation' : ''}`} 
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      {/* Logo */}
      <img 
        src={aksellLogo} 
        alt="Aksell Nutrition" 
        className={`h-${size === 'sm' ? '8' : size === 'md' ? '12' : size === 'lg' ? '16' : '20'} w-auto object-contain transition-smooth`} 
      />
    </div>
  );
};