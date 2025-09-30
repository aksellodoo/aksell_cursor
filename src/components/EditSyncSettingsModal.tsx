import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SyncTypeSelector } from '@/components/sync-config/SyncTypeSelector';
import { IntervalSyncConfig } from '@/components/sync-config/IntervalSyncConfig';
import { ScheduleSyncConfig } from '@/components/sync-config/ScheduleSyncConfig';
import { CronSyncConfig } from '@/components/sync-config/CronSyncConfig';
import { NextSyncPreview } from '@/components/sync-config/NextSyncPreview';

interface ProtheusTable {
  id: string;
  table_name: string;
  sync_type?: string;
  query_interval_value: number;
  query_interval_unit: 'seconds' | 'minutes' | 'hours' | 'days';
  sync_schedule?: string[];
  cron_expression?: string;
  last_sync_at?: string;
  next_due_at?: string;
}

interface EditSyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: ProtheusTable | null;
  onSave: (tableId: string, syncSettings: SyncSettings) => Promise<void>;
}

interface SyncSettings {
  sync_type: string;
  query_interval_value: number;
  query_interval_unit: string;
  sync_schedule?: string[];
  cron_expression?: string;
}

export const EditSyncSettingsModal = ({ isOpen, onClose, table, onSave }: EditSyncSettingsModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Initialize form state with current table values
  const [syncType, setSyncType] = useState('interval');
  const [intervalValue, setIntervalValue] = useState(30);
  const [intervalUnit, setIntervalUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>('minutes');
  const [schedule, setSchedule] = useState<string[]>([]);
  const [cronExpression, setCronExpression] = useState('');

  // Reset form when table changes or modal opens
  const resetForm = () => {
    if (table) {
      setSyncType(table.sync_type || 'interval');
      setIntervalValue(table.query_interval_value || 30);
      setIntervalUnit(table.query_interval_unit || 'minutes');
      setSchedule(table.sync_schedule || []);
      setCronExpression(table.cron_expression || '');
    }
  };

  // Re-hydrate form state when modal opens and table data is available
  useEffect(() => {
    if (isOpen && table) {
      resetForm();
    }
  }, [isOpen, table]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!table) return;

    try {
      setLoading(true);

      const syncSettings: SyncSettings = {
        sync_type: syncType,
        query_interval_value: intervalValue,
        query_interval_unit: intervalUnit,
        ...(syncType === 'schedule' && { sync_schedule: schedule }),
        ...(syncType === 'cron' && { cron_expression: cronExpression }),
      };

      await onSave(table.id, syncSettings);
      
      toast({
        title: "Configurações atualizadas",
        description: `Configurações de sincronização da tabela ${table.table_name} foram atualizadas com sucesso.`,
      });
      
      handleClose();
    } catch (error) {
      console.error('Error updating sync settings:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar configurações de sincronização",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    switch (syncType) {
      case 'interval':
        return intervalValue > 0;
      case 'schedule':
        return schedule.length > 0;
      case 'cron':
        return cronExpression.trim() !== '';
      default:
        return false;
    }
  };

  if (!table) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Configurações de Sincronização</DialogTitle>
          <DialogDescription>
            Edite as configurações de sincronização para a tabela <strong>{table.table_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sync Type Selection */}
          <div className="space-y-2">
            <Label>Tipo de Sincronização</Label>
            <SyncTypeSelector 
              value={syncType} 
              onChange={setSyncType}
            />
          </div>

          {/* Sync Configuration based on type */}
          {syncType === 'interval' && (
          <IntervalSyncConfig
            value={intervalValue}
            unit={intervalUnit}
            onValueChange={setIntervalValue}
            onUnitChange={(unit) => setIntervalUnit(unit as 'seconds' | 'minutes' | 'hours' | 'days')}
          />
          )}

          {syncType === 'schedule' && (
            <ScheduleSyncConfig
              schedule={schedule}
              onChange={setSchedule}
            />
          )}

          {syncType === 'cron' && (
            <CronSyncConfig
              expression={cronExpression}
              onChange={setCronExpression}
            />
          )}

          {/* Next Sync Preview */}
          <NextSyncPreview
            syncType={syncType}
            intervalValue={intervalValue}
            intervalUnit={intervalUnit}
            schedule={schedule}
            cronExpression={cronExpression}
            lastSyncAt={table.last_sync_at || undefined}
            nextDueAt={table.next_due_at || undefined}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !isFormValid()}
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};