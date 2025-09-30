import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export const SimpleNotificationTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configs, setConfigs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['new', 'updated']);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['app']);

  const availableTables = [
    { value: 'protheus_sa3010_fc3d70f6', label: 'SA3010 - Vendedores' },
    { value: 'protheus_sa1010_80f17f00', label: 'SA1010 - Clientes' },
    { value: 'protheus_sa2010_72a51158', label: 'SA2010 - Fornecedores' }
  ];

  const statusOptions = ['new', 'updated', 'deleted'];
  const channelOptions = [
    { value: 'app', label: 'App' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'email', label: 'Email' }
  ];

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_notification_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error loading configs:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_log')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o log",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestConfig = async () => {
    if (!selectedTable) {
      toast({
        title: "Erro",
        description: "Selecione uma tabela",
        variant: "destructive"
      });
      return;
    }

    try {
      setTesting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const channels = {
        app: selectedChannels.includes('app'),
        whatsapp: selectedChannels.includes('whatsapp'),
        telegram: selectedChannels.includes('telegram'),
        email: selectedChannels.includes('email')
      };

      const { error } = await supabase
        .from('user_notification_configs')
        .insert({
          user_id: user.id,
          protheus_table_name: selectedTable,
          enabled_statuses: selectedStatuses,
          channels: channels,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração criada com sucesso"
      });

      await loadConfigs();
    } catch (error) {
      console.error('Error creating config:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar configuração",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const triggerNotifications = async () => {
    try {
      setTesting(true);
      
      const { data, error } = await supabase.functions.invoke('send-protheus-notifications');
      
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Notificações processadas: ${JSON.stringify(data)}`
      });

      await loadLogs();
    } catch (error) {
      console.error('Error triggering notifications:', error);
      toast({
        title: "Erro",
        description: "Erro ao disparar notificações",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  React.useEffect(() => {
    loadConfigs();
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste Simplificado de Notificações Protheus</CardTitle>
          <CardDescription>
            Nova arquitetura com apenas 2 tabelas e 1 função
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tabela Protheus</label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma tabela" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map(table => (
                    <SelectItem key={table.value} value={table.value}>
                      {table.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <div className="flex gap-2 mt-1">
                {statusOptions.map(status => (
                  <label key={status} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStatuses([...selectedStatuses, status]);
                        } else {
                          setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                        }
                      }}
                    />
                    <span className="text-sm">{status}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Canais</label>
            <div className="flex gap-4 mt-1">
              {channelOptions.map(channel => (
                <label key={channel.value} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedChannels.includes(channel.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedChannels([...selectedChannels, channel.value]);
                      } else {
                        setSelectedChannels(selectedChannels.filter(c => c !== channel.value));
                      }
                    }}
                  />
                  <span className="text-sm">{channel.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={createTestConfig} disabled={testing}>
              Criar Configuração
            </Button>
            <Button onClick={triggerNotifications} disabled={testing}>
              Disparar Notificações
            </Button>
            <Button onClick={loadConfigs} disabled={loading} variant="outline">
              Recarregar Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurações ({configs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {configs.map(config => (
                <div key={config.id} className="p-2 border rounded">
                  <div className="font-medium text-sm">{config.protheus_table_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Status: {config.enabled_statuses?.join(', ')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Canais: {Object.entries(config.channels || {})
                      .filter(([, enabled]) => enabled)
                      .map(([channel]) => channel)
                      .join(', ')}
                  </div>
                  <Badge variant={config.is_active ? 'default' : 'secondary'}>
                    {config.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))}
              {configs.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  Nenhuma configuração encontrada
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log de Notificações ({logs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.map(log => (
                <div key={log.id} className="p-2 border rounded">
                  <div className="font-medium text-sm">{log.protheus_table_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Record: {log.record_id} | Status: {log.record_status}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Enviado: {new Date(log.sent_at).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Canais: {Object.entries(log.channels_used || {})
                      .filter(([, used]) => used)
                      .map(([channel]) => channel)
                      .join(', ')}
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  Nenhum log encontrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};