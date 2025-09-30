import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useChatter } from "@/hooks/useChatter";
import { cn } from "@/lib/utils";

interface ChatterButtonProps {
  recordType: string;
  recordId: string;
  variant?: "default" | "floating" | "compact";
  className?: string;
}

export const ChatterButton = ({ 
  recordType, 
  recordId, 
  variant = "default",
  className 
}: ChatterButtonProps) => {
  const navigate = useNavigate();
  const { messages, auditLogs } = useChatter(recordType, recordId);
  
  const totalActivity = messages.length + auditLogs.length;
  
  const getRecentActivity = () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const recentMessages = messages.filter(msg => 
      new Date(msg.created_at) > threeDaysAgo
    );
    const recentAudits = auditLogs.filter(audit => 
      new Date(audit.timestamp) > threeDaysAgo
    );
    
    return recentMessages.length + recentAudits.length;
  };

  const recentActivity = getRecentActivity();

  const handleClick = () => {
    navigate(`/chatter/${recordType}/${recordId}`);
  };

  if (variant === "floating") {
    return (
      <Button
        onClick={handleClick}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all",
          "bg-primary hover:bg-primary/90 z-50",
          className
        )}
        size="icon"
      >
        <div className="relative">
          <MessageCircle className="h-6 w-6" />
          {recentActivity > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground"
            >
              {recentActivity > 9 ? "9+" : recentActivity}
            </Badge>
          )}
        </div>
      </Button>
    );
  }

  if (variant === "compact") {
    return (
      <Button
        onClick={handleClick}
        variant="outline"
        size="sm"
        className={cn("h-9 px-3 gap-2 text-sm", className)}
      >
        <MessageCircle className="h-4 w-4" />
        <span>Chatter</span>
        {recentActivity > 0 && (
          <Badge className="h-5 w-5 p-0 text-xs bg-primary text-primary-foreground rounded-full flex items-center justify-center ml-1">
            {recentActivity > 9 ? "9+" : recentActivity}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className={cn("flex items-center gap-2", className)}
    >
      <MessageCircle className="h-4 w-4" />
      Chatter
      {totalActivity > 0 && (
        <Badge variant="secondary" className="ml-1">
          {totalActivity}
        </Badge>
      )}
      {recentActivity > 0 && (
        <Badge className="ml-1 bg-destructive text-destructive-foreground">
          {recentActivity} novos
        </Badge>
      )}
    </Button>
  );
};