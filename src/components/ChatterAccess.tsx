import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock } from "lucide-react";
import { useChatter } from "@/hooks/useChatter";
import { useChatterNavigation } from "@/hooks/useChatterNavigation";
import { cn } from "@/lib/utils";

interface ChatterAccessProps {
  recordType: string;
  recordId: string;
  recordName?: string;
  variant?: "default" | "floating" | "minimal" | "icon-only";
  showBadge?: boolean;
  className?: string;
}

export const ChatterAccess = ({ 
  recordType, 
  recordId, 
  recordName,
  variant = "default",
  showBadge = true,
  className = ""
}: ChatterAccessProps) => {
  const { messages, auditLogs, loading } = useChatter(recordType, recordId);
  const { openChatter } = useChatterNavigation();
  
  if (loading) {
    return null;
  }

  const totalActivity = messages.length + auditLogs.length;
  const recentActivity = [...messages, ...auditLogs]
    .filter(item => {
      const timestamp = 'created_at' in item ? item.created_at : item.timestamp;
      const itemDate = new Date(timestamp);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return itemDate > threeDaysAgo;
    }).length;

  const handleClick = () => {
    openChatter({ recordType, recordId, recordName });
  };

  // Floating variant (universal access button)
  if (variant === "floating") {
    return (
      <Button
        onClick={handleClick}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all",
          "bg-primary hover:bg-primary/90",
          className
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        {showBadge && recentActivity > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
          >
            {recentActivity > 99 ? '99+' : recentActivity}
          </Badge>
        )}
      </Button>
    );
  }

  // Icon only variant
  if (variant === "icon-only") {
    return (
      <Button
        onClick={handleClick}
        variant="outline"
        size="icon"
        className={cn(
          "relative rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-primary", 
          className
        )}
        aria-label="Abrir Chatter"
      >
        <MessageCircle className="h-4 w-4" />
        {showBadge && recentActivity > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse border-2 border-background"
          >
            {recentActivity > 9 ? '9+' : recentActivity}
          </Badge>
        )}
      </Button>
    );
  }

  // Minimal variant (just activity indicator)
  if (variant === "minimal") {
    return (
      <div 
        onClick={handleClick}
        className={cn(
          "flex items-center space-x-2 cursor-pointer hover:text-primary transition-colors",
          className
        )}
      >
        <div className="flex items-center space-x-1 text-muted-foreground">
          <MessageCircle className="h-3 w-3" />
          <span className="text-xs">
            {totalActivity === 0 ? 'Sem atividade' : totalActivity}
          </span>
        </div>
        
        {showBadge && recentActivity > 0 && (
          <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
            <Clock className="h-2 w-2 mr-1" />
            {recentActivity} recente{recentActivity > 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    );
  }

  // Default variant (button with text)
  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      className={cn("relative", className)}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Chatter
      {showBadge && recentActivity > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {recentActivity > 99 ? '99+' : recentActivity}
        </Badge>
      )}
    </Button>
  );
};