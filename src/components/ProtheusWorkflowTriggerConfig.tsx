import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Database, Info, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProtheusWorkflowTriggerConfigProps {
  triggerConfig: any;
  onConfigChange: (config: any) => void;
}

const statusOptions = [
  { value: 'new', label: 'Novos registros', description: 'Disparado quando um novo registro é criado na tabela' },
  { value: 'updated', label: 'Registros alterados', description: 'Disparado quando um registro é modificado' },
  { value: 'unchanged', label: 'Registros não alterados', description: 'Disparado durante sincronização mesmo sem mudanças (pode gerar muitos eventos)' },
  { value: 'deleted', label: 'Registros deletados', description: 'Disparado quando um registro é removido da tabela' }
];

export const ProtheusWorkflowTriggerConfig: React.FC<ProtheusWorkflowTriggerConfigProps> = ({
  triggerConfig,
  onConfigChange
}) => {
  const [selectedTableId, setSelectedTableId] = useState(triggerConfig?.table_id || '');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(triggerConfig?.statuses || []);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch available Protheus tables
  const { data: protheusTables, isLoading } = useQuery({
    queryKey: ['protheus-tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('protheus_tables')
        .select('id, table_name, description, is_active')
        .eq('is_active', true)
        .order('table_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Update config when selections change
  useEffect(() => {
    if (selectedTableId && selectedStatuses.length > 0) {
      onConfigChange({
        table_id: selectedTableId,
        statuses: selectedStatuses
      });
    }
  }, [selectedTableId, selectedStatuses, onConfigChange]);

  const handleStatusToggle = (status: string, checked: boolean) => {
    if (checked) {
      setSelectedStatuses(prev => [...prev, status]);
    } else {
      setSelectedStatuses(prev => prev.filter(s => s !== status));
    }
  };

  const selectedTable = protheusTables?.find(table => table.id === selectedTableId);
  const hasUnchangedStatus = selectedStatuses.includes('unchanged');

  const handleSyncNow = async () => {
    if (!selectedTableId) {
      toast.error('Selecione uma tabela antes de sincronizar');
      return;
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-protheus-table', {
        body: { 
          tableId: selectedTableId,
          skipBinary: true // Skip binary fields for workflow test syncs
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Sincronização iniciada para ${selectedTable?.table_name}`);
      } else {
        toast.error(`Erro na sincronização: ${data.error}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erro ao iniciar sincronização');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configuração do Trigger Protheus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Table Selection */}
          <div className="space-y-2">
            <Label htmlFor="protheus-table">Tabela Protheus</Label>
            <Select value={selectedTableId} onValueChange={setSelectedTableId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma tabela Protheus..." />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Carregando tabelas...</SelectItem>
                ) : (
                  protheusTables?.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{table.table_name}</span>
                        {table.description && (
                          <span className="text-sm text-muted-foreground">{table.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!isLoading && protheusTables?.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma tabela Protheus encontrada. Configure tabelas Protheus antes de criar triggers.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Selected Table Info */}
          {selectedTable && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{selectedTable.table_name}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="ml-auto"
                >
                  <PlayCircle className="h-3 w-3 mr-1" />
                  {isSyncing ? 'Sincronizando...' : 'Sync Agora'}
                </Button>
              </div>
              {selectedTable.description && (
                <p className="text-sm text-muted-foreground">{selectedTable.description}</p>
              )}
            </div>
          )}

          {/* Status Selection */}
          <div className="space-y-2">
            <Label>Estados do Registro</Label>
            <div className="space-y-3">
              {statusOptions.map((option) => (
                <div key={option.value} className="flex items-start space-x-3">
                  <Checkbox
                    id={`status-${option.value}`}
                    checked={selectedStatuses.includes(option.value)}
                    onCheckedChange={(checked) => handleStatusToggle(option.value, checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label 
                      htmlFor={`status-${option.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Volume Warning for 'unchanged' status */}
          {hasUnchangedStatus && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Atenção:</strong> A opção "Registros não alterados" pode gerar um grande volume de eventos 
                durante as sincronizações, pois será disparada para todos os registros processados, mesmo que não tenham mudado. 
                Use com cuidado em tabelas com muitos registros.
              </AlertDescription>
            </Alert>
          )}

          {/* Configuration Preview */}
          {selectedTableId && selectedStatuses.length > 0 && (
            <div className="rounded-lg border p-3 bg-muted/10">
              <h4 className="text-sm font-medium mb-2">Configuração Atual:</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><strong>Tabela:</strong> {selectedTable?.table_name}</p>
                <p><strong>Estados:</strong> {selectedStatuses.join(', ')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payload Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Dados Disponíveis no Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-2 text-muted-foreground">
            <p>Os seguintes dados estarão disponíveis nas ações do workflow:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><code>table_name</code> - Nome da tabela Supabase</li>
              <li><code>record_id</code> - ID do registro no Supabase</li>
              <li><code>protheus_id</code> - ID do registro no Protheus</li>
              <li><code>record_status</code> - Estado do registro (new, updated, unchanged, deleted)</li>
              <li><code>sync_log_id</code> - ID do log de sincronização</li>
              <li><code>old_data</code> - Dados completos do registro (apenas para deleted)</li>
              <li><code>deleted_at</code> - Timestamp da deleção (apenas para deleted)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
