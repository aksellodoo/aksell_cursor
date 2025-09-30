import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock } from "lucide-react";
import { useChatter } from "@/hooks/useChatter";
import { useChatterNavigation } from "@/hooks/useChatterNavigation";

interface ChatterIndicatorProps {
  recordType: string;
  recordId: string;
  recordName?: string;
  showBadge?: boolean;
  clickable?: boolean;
  className?: string;
}

export const ChatterIndicator = ({ 
  recordType, 
  recordId, 
  recordName,
  showBadge = true,
  clickable = true,
  className = ""
}: ChatterIndicatorProps) => {
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

  const content = (
    <div className={`flex items-center space-x-2 ${className}`}>
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

  const handleClick = () => {
    if (clickable) {
      openChatter({ recordType, recordId, recordName });
    }
  };

  if (!clickable) {
    return content;
  }

  return (
    <div 
      className={`cursor-pointer hover:text-primary transition-colors ${className}`}
      onClick={handleClick}
    >
      {content}
    </div>
  );
};