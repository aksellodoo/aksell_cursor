import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator = ({ password, className = "" }: PasswordStrengthIndicatorProps) => {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    
    let score = 0;
    const checks = {
      length: password.length >= 10,
      longLength: password.length >= 15,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[^A-Za-z0-9]/.test(password),
      noRepeats: !/(.)\1{2,}/.test(password),
    };
    
    if (checks.length) score += 1;
    if (checks.longLength) score += 1;
    if (checks.lowercase) score += 1;
    if (checks.uppercase) score += 1;
    if (checks.numbers) score += 1;
    if (checks.symbols) score += 1;
    if (checks.noRepeats) score += 1;
    
    const percentage = Math.min((score / 7) * 100, 100);
    
    if (percentage <= 28) return { score: percentage, label: "Muito fraca", color: "bg-destructive" };
    if (percentage <= 42) return { score: percentage, label: "Fraca", color: "bg-orange-500" };
    if (percentage <= 70) return { score: percentage, label: "Média", color: "bg-yellow-500" };
    if (percentage <= 85) return { score: percentage, label: "Boa", color: "bg-blue-500" };
    return { score: percentage, label: "Muito forte", color: "bg-green-500" };
  }, [password]);

  if (!password) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Força da senha:</span>
        <span className={`font-medium ${
          strength.label === "Muito fraca" ? "text-destructive" :
          strength.label === "Fraca" ? "text-orange-500" :
          strength.label === "Média" ? "text-yellow-500" :
          strength.label === "Boa" ? "text-blue-500" :
          "text-green-500"
        }`}>
          {strength.label}
        </span>
      </div>
      <Progress value={strength.score} className="h-2" />
    </div>
  );
};