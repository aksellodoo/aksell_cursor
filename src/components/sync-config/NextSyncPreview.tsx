
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatInSaoPauloTimezone, calculateNextScheduledExecution } from '@/utils/timezoneUtils';

interface NextSyncPreviewProps {
  syncType: string;
  intervalValue?: number;
  intervalUnit?: string;
  schedule?: string[];
  cronExpression?: string;
  lastSyncAt?: string | null;
  nextDueAt?: string | null;
  variant?: 'default' | 'compact';
}

export const NextSyncPreview = ({ 
  syncType, 
  intervalValue, 
  intervalUnit, 
  schedule, 
  cronExpression,
  lastSyncAt,
  nextDueAt,
  variant = 'default'
}: NextSyncPreviewProps) => {
  const getStatusInfo = () => {
    // Check if sync is configured
    const hasConfiguration = (syncType === 'interval' && intervalValue && intervalUnit) ||
                           (syncType === 'schedule' && schedule && schedule.length > 0) ||
                           (syncType === 'cron' && cronExpression);
    
    if (!hasConfiguration) {
      return {
        isConfigured: false,
        badgeText: "Não configurado",
        badgeVariant: "secondary" as const,
        icon: AlertCircle
      };
    }

    // Show appropriate badge based on sync type
    if (syncType === 'schedule' && schedule && schedule.length > 0) {
      return {
        isConfigured: true,
        badgeText: `Agendado (${schedule.join(', ')})`,
        badgeVariant: "default" as const,
        icon: CheckCircle,
        showLastExecution: true
      };
    }
    
    return {
      isConfigured: true,
      badgeText: "Automático (a cada minuto)",
      badgeVariant: "default" as const,
      icon: CheckCircle,
      showLastExecution: false
    };
  };

  const calculateNextSync = () => {
    const now = new Date();
    
    // Use nextDueAt if available and in the future
    if (nextDueAt) {
      const nextDueDate = new Date(nextDueAt);
      if (nextDueDate > now) {
        return formatInSaoPauloTimezone(nextDueDate, 'dd/MM/yy HH:mm');
      }
      // If nextDueAt is in the past, it might be outdated, recalculate
    }

    // Calculate based on configuration
    switch (syncType) {
      case 'interval':
        if (!intervalValue || !intervalUnit) return null;
        
        // If we don't have a last sync time, show "Logo que configurado"
        if (!lastSyncAt) return "Logo que configurado";
        
        const msMap: Record<string, number> = {
          seconds: 1000,
          minutes: 60 * 1000,
          hours: 60 * 60 * 1000,
          days: 24 * 60 * 60 * 1000
        };
        
        const lastSync = new Date(lastSyncAt);
        let nextSync = new Date(lastSync.getTime() + (intervalValue * msMap[intervalUnit]));
        
        // Ensure the calculated time is in the future
        while (nextSync <= now) {
          nextSync = new Date(nextSync.getTime() + (intervalValue * msMap[intervalUnit]));
        }
        
        return formatInSaoPauloTimezone(nextSync, 'dd/MM/yy HH:mm');
        
      case 'schedule':
        if (!schedule || schedule.length === 0) return null;
        
        const nextScheduledTime = calculateNextScheduledExecution(schedule);
        return nextScheduledTime ? formatInSaoPauloTimezone(nextScheduledTime, 'dd/MM/yy HH:mm') : null;
        
      case 'cron':
        return cronExpression ? 'Baseado na expressão cron configurada' : null;
        
      default:
        return null;
    }
  };

  const getTimeUntilNext = () => {
    const now = new Date();
    let nextSyncTime: Date | null = null;

    if (nextDueAt) {
      const nextDueDate = new Date(nextDueAt);
      if (nextDueDate > now) {
        nextSyncTime = nextDueDate;
      }
    }

    if (!nextSyncTime && syncType === 'schedule' && schedule && schedule.length > 0) {
      nextSyncTime = calculateNextScheduledExecution(schedule);
    }

    if (!nextSyncTime && syncType === 'interval' && lastSyncAt && intervalValue && intervalUnit) {
      const msMap: Record<string, number> = {
        seconds: 1000,
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000
      };
      
      const lastSync = new Date(lastSyncAt);
      nextSyncTime = new Date(lastSync.getTime() + (intervalValue * msMap[intervalUnit]));
    }

    if (nextSyncTime) {
      const diffMs = nextSyncTime.getTime() - now.getTime();
      if (diffMs > 0) {
        if (diffMs < 60 * 1000) {
          return "< 1 min";
        } else if (diffMs < 60 * 60 * 1000) {
          const minutes = Math.floor(diffMs / (60 * 1000));
          return `${minutes} min`;
        } else if (diffMs < 24 * 60 * 60 * 1000) {
          const hours = Math.floor(diffMs / (60 * 60 * 1000));
          const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
          return `${hours}h ${minutes}min`;
        } else {
          const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
          return `${days} dia(s)`;
        }
      }
    }

    return null;
  };

  const statusInfo = getStatusInfo();
  const nextSync = calculateNextSync();
  const timeUntilNext = getTimeUntilNext();

  if (!statusInfo.isConfigured && !nextSync) return null;

  // Compact mode - render single line without Card wrapper
  if (variant === 'compact') {
    if (!statusInfo.isConfigured) {
      return <span className="text-xs">Não configurado</span>;
    }
    
    if (nextSync) {
      return (
        <span className="text-sm font-medium">
          {nextSync} {timeUntilNext && <span className="text-xs opacity-75">({timeUntilNext})</span>}
        </span>
      );
    }
    
    return <span className="text-xs">--</span>;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <Badge 
              variant={statusInfo.badgeVariant} 
              className="text-[10px] py-0 px-1.5 mb-1"
            >
              <div className="flex items-center gap-1">
                <statusInfo.icon className="h-2.5 w-2.5" />
                {statusInfo.badgeText}
              </div>
            </Badge>
            
            {statusInfo.isConfigured && (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Próxima sincronização</p>
                  {timeUntilNext && (
                    <Badge variant="outline" className="text-[9px] px-1">
                      em {timeUntilNext}
                    </Badge>
                  )}
                </div>
                <div>
                  {nextSync && (
                    <div className="text-lg font-bold">
                      <div>{nextSync?.split(' ')[0]}</div>
                      <div>{nextSync?.split(' ')[1]}</div>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">(Horário de Brasília)</p>
                </div>
                
                {statusInfo.showLastExecution && lastSyncAt && schedule && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground">
                      Última execução para {schedule[0]}: {formatInSaoPauloTimezone(new Date(lastSyncAt), 'HH:mm')}
                    </p>
                  </div>
                )}
              </>
            )}
            
            {!statusInfo.isConfigured && (
              <div className="text-sm text-muted-foreground">
                Configure a sincronização automática para ver o próximo agendamento
              </div>
            )}
          </div>
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
};
