import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { 
  ProtheusTableWithNotifications, 
  RecordStatus, 
  NotificationChannel 
} from '@/types/protheus-notifications';

interface ProtheusTableSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: any[];
  onSave: (tableId: string, statuses: string[], channels: string[]) => Promise<boolean>;
  editingNotification?: any;
}

const statusLabels: Record<RecordStatus, string> = {
  new: 'Novo',
  updated: 'Atualizado',
  deleted: 'Removido',
};

const channelLabels: Record<NotificationChannel, string> = {
  app: 'App',
  email: 'Email',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
};

export const ProtheusTableSelectorModal: React.FC<ProtheusTableSelectorModalProps> = ({
  open,
  onOpenChange,
  tables,
  onSave,
  editingNotification,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['new', 'updated']);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['app']);
  const [saving, setSaving] = useState(false);

  const filteredTables = tables.filter(table =>
    table.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (table.description && table.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setSelectedTable('');
    setSelectedStatuses(['new', 'updated']);
    setSelectedChannels(['app']);
    setSearchTerm('');
  };

  // Pré-preencher dados quando editando
  useEffect(() => {
    if (editingNotification) {
      // Encontrar a tabela correspondente
      const matchingTable = tables.find(table => 
        editingNotification.protheus_table_name.includes(table.id.slice(0, 8))
      );
      
      if (matchingTable) {
        setSelectedTable(matchingTable.id);
      }
      
      setSelectedStatuses(editingNotification.enabled_statuses || []);
      
      // Converter channels object para array
      const enabledChannels = Object.entries(editingNotification.channels || {})
        .filter(([, enabled]) => enabled)
        .map(([channel]) => channel);
      setSelectedChannels(enabledChannels);
    } else {
      resetForm();
    }
  }, [editingNotification, tables]);

  const handleSave = async () => {
    if (!selectedTable) {
      toast({
        title: "Erro",
        description: "Selecione uma tabela",
        variant: "destructive",
      });
      return;
    }

    if (selectedStatuses.length === 0) {
      toast({
        title: "Erro", 
        description: "Selecione pelo menos um status",
        variant: "destructive",
      });
      return;
    }

    if (selectedChannels.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um canal",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const success = await onSave(selectedTable, selectedStatuses, selectedChannels);
      if (success) {
        onOpenChange(false);
        resetForm();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setSelectedStatuses([...selectedStatuses, status]);
    } else {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    }
  };

  const handleChannelChange = (channel: string, checked: boolean) => {
    if (checked) {
      setSelectedChannels([...selectedChannels, channel]);
    } else {
      setSelectedChannels(selectedChannels.filter(c => c !== channel));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingNotification ? 'Editar Configuração Protheus' : 'Configurar Notificações Protheus'}
          </DialogTitle>
          <DialogDescription>
            {editingNotification 
              ? 'Modifique os status e canais de notificação para a tabela selecionada.'
              : 'Selecione uma tabela e configure os tipos de notificação que deseja receber.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar tabelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Selecionar Tabela</h4>
            <div className="max-h-48 overflow-y-auto border rounded-md">
              {filteredTables.map((table) => (
                <div
                  key={table.id}
                  className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 ${
                    selectedTable === table.id ? 'bg-primary/10 border-primary' : ''
                  }`}
                  onClick={() => setSelectedTable(table.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{table.table_name}</div>
                      {table.description && (
                        <div className="text-sm text-muted-foreground">{table.description}</div>
                      )}
                    </div>
                    {table.notification_config && (
                      <Badge variant="secondary" className="text-xs">
                        Configurado
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Status a Monitorar</h4>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(statusLabels) as string[]).map((status) => (
                <label
                  key={status}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={(checked) => handleStatusChange(status, !!checked)}
                  />
                  <span className="text-sm">{statusLabels[status]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Channel Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Canais de Notificação</h4>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(channelLabels) as string[]).map((channel) => (
                <label
                  key={channel}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedChannels.includes(channel)}
                    onCheckedChange={(checked) => handleChannelChange(channel, !!checked)}
                  />
                  <span className="text-sm">{channelLabels[channel]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};