import { Share2, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SharedRecordIndicatorProps {
  recordType: string;
  recordId: string;
  className?: string;
  isShared?: boolean;
  sharedCount?: number;
  hasSharedAccess?: boolean;
  variant?: 'minimal' | 'detailed';
}

export const SharedRecordIndicator = ({
  recordType,
  recordId,
  className = "",
  isShared = false,
  sharedCount = 0,
  hasSharedAccess = false,
  variant = 'minimal'
}: SharedRecordIndicatorProps) => {
  
  if (!isShared && !hasSharedAccess) {
    return null;
  }

  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-1", className)}>
              {hasSharedAccess && (
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Acesso
                </Badge>
              )}
              {isShared && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                  <Share2 className="w-3 h-3 mr-1" />
                  {sharedCount > 0 && sharedCount}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              {hasSharedAccess && <p>• Você tem acesso via compartilhamento</p>}
              {isShared && <p>• Compartilhado com {sharedCount} pessoa(s)</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {hasSharedAccess && (
        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
          <Lock className="w-4 h-4 mr-2" />
          Acesso via compartilhamento
        </Badge>
      )}
      {isShared && (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhado com {sharedCount} pessoa(s)
        </Badge>
      )}
    </div>
  );
};