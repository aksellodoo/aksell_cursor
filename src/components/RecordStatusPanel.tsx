
import { StatusBadge } from './StatusBadge';
import { LoadingSpinner } from './LoadingSpinner';
import { Trash2 } from 'lucide-react';

interface RecordStatusPanelProps {
  data: Array<Record<string, any>>;
  loading: boolean;
  hoveredRowIndex?: number;
  onRowHover?: (index: number | undefined) => void;
  onItemClick?: (index: number) => void;
  lastSyncLogId?: string | null;
}

export function RecordStatusPanel({ 
  data, 
  loading, 
  hoveredRowIndex, 
  onRowHover,
  onItemClick,
  lastSyncLogId
}: RecordStatusPanelProps) {
  if (loading) {
    return (
      <div className="w-48 border-l bg-card flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-48 border-l bg-card flex flex-col">
      <div className="p-2 border-b bg-muted/50 sticky top-0 z-10">
        <h3 className="text-sm font-medium text-foreground">Status dos Registros</h3>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="p-1 space-y-0">
          {data.map((record, index) => {
            const isHovered = hoveredRowIndex === index;
            const isPendingDeletion = record?.pending_deletion === true;
            
            // Debug log para investigar o problema
            if (record.a3_cod === '000001') {
              console.log('🔍 Debug status panel Jorge Junior:', {
                record_status: record.record_status,
                was_updated_last_sync: record.was_updated_last_sync,
                is_new_record: record.is_new_record,
                last_sync_id: record.last_sync_id,
                lastSyncLogId: lastSyncLogId,
                pending_deletion: record.pending_deletion
              });
            }
            
            // Calculate status - PRIORIZAR o campo record_status do banco quando disponível
            let statusValue: 'new' | 'updated' | 'unchanged' | 'deleted';
            
            if (isPendingDeletion) {
              statusValue = 'deleted';
            } else if (record?.record_status) {
              // Usar record_status diretamente do banco
              statusValue = record.record_status as 'new' | 'updated' | 'unchanged';
            } else {
              // Fallback para lógica anterior
              const isNew = record?.is_new_record === true && record?.last_sync_id === lastSyncLogId;
              const isUpdated = record?.was_updated_last_sync === true;
              statusValue = isNew ? 'new' : isUpdated ? 'updated' : 'unchanged';
            }
            
            return (
              <div
                key={index}
                className={`h-9 px-2 flex items-center rounded border transition-colors cursor-pointer ${
                  isHovered 
                    ? 'bg-primary/10 border-primary/20' 
                    : isPendingDeletion
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-background border-border hover:bg-muted/50'
                }`}
                onMouseEnter={() => onRowHover?.(index)}
                onMouseLeave={() => onRowHover?.(undefined)}
                onClick={() => onItemClick?.(index)}
              >
                <div className="flex items-center gap-2 w-full">
                  {isPendingDeletion && (
                    <Trash2 className="h-3 w-3 text-orange-600 flex-shrink-0" />
                  )}
                  <StatusBadge
                    status={statusValue}
                    recordHash={record.record_hash}
                    updatedAt={record.updated_at}
                    isPendingDeletion={isPendingDeletion}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
