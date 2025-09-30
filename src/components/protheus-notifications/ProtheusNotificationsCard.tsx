import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings, Trash2, Database, Edit } from 'lucide-react';
import { useProtheusNotifications } from '@/hooks/useProtheusNotifications';
import { useProtheusTablesSelect } from '@/hooks/useProtheusTablesSelect';
import { ProtheusTableSelectorModal } from './ProtheusTableSelectorModal';
import { NotificationDiagnostic } from '@/components/NotificationDiagnostic';
import type { RecordStatus, NotificationChannel } from '@/types/protheus-notifications';

const statusLabels: Record<RecordStatus, string> = {
  new: 'Novos',
  updated: 'Atualizados',
  deleted: 'Excluídos',
};

const channelLabels: Record<NotificationChannel, string> = {
  app: 'App',
  email: 'Email',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
};

const channelColors: Record<NotificationChannel, string> = {
  app: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  email: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  telegram: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  whatsapp: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
};

interface ProtheusNotificationsCardProps {
  telegramEnabled?: boolean;
  whatsappEnabled?: boolean;
  targetUserId?: string;
  targetUserName?: string;
}

export const ProtheusNotificationsCard: React.FC<ProtheusNotificationsCardProps> = ({
  telegramEnabled = false,
  whatsappEnabled = false,
  targetUserId,
  targetUserName,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [editingNotification, setEditingNotification] = useState<any>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const { 
    notifications, 
    loading, 
    error, 
    deleteNotification, 
    saveNotification, 
    getTablesWithNotifications 
  } = useProtheusNotifications(targetUserId);
  
  useEffect(() => {
    const loadTables = async () => {
      try {
        console.log('🔄 Carregando tabelas Protheus...');
        const tablesData = await getTablesWithNotifications();
        console.log('✅ Tabelas carregadas:', tablesData.length);
        setTables(tablesData);
      } catch (error) {
        console.error('❌ Erro ao carregar tabelas:', error);
        setTables([]);
      }
    };
    loadTables();
  }, [getTablesWithNotifications]);

  const getTableName = (supabaseTableName: string) => {
    // Find table by checking if supabaseTableName matches the dynamic table name
    for (const table of tables) {
      // Check if this notification's table name matches any dynamic table name for this protheus table
      if (supabaseTableName.includes(table.id.slice(0, 8))) {
        return table.table_name;
      }
    }
    return supabaseTableName;
  };

  const getTableDescription = (supabaseTableName: string) => {
    // Find table by checking if supabaseTableName matches the dynamic table name
    for (const table of tables) {
      // Check if this notification's table name matches any dynamic table name for this protheus table
      if (supabaseTableName.includes(table.id.slice(0, 8))) {
        return table.description;
      }
    }
    return '';
  };

  const handleSave = async (tableId: string, statuses: string[], channels: string[]) => {
    try {
      await saveNotification({
        protheus_table_name: tableId,
        enabled_statuses: statuses,
        notification_channels: channels
      });
      setModalOpen(false);
      setEditingNotification(null);
      return true;
    } catch (error) {
      console.error('Error saving notification:', error);
      return false;
    }
  };

  const handleEdit = (notification: any) => {
    setEditingNotification(notification);
    setModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Notificações de Tabelas Protheus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Configure notificações para mudanças em tabelas específicas do Protheus
              </p>
              {targetUserName && (
                <p className="text-xs text-orange-600 mt-1">
                  Configurando para: <strong>{targetUserName}</strong>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setModalOpen(true)} 
                size="sm"
                disabled={loading || !!error}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar Tabelas
              </Button>
              <Button 
                onClick={() => setShowDiagnostic(!showDiagnostic)}
                variant="outline"
                size="sm"
                disabled={loading || !!error}
              >
                <Bell className="w-4 h-4 mr-2" />
                {showDiagnostic ? 'Ocultar' : 'Diagnóstico'}
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm">Carregando configurações...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-8 text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">Configurações temporariamente indisponíveis</p>
              <p className="text-xs mt-1">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                O restante da página continua funcionando normalmente
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && notifications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma tabela configurada para notificações</p>
              <p className="text-xs">Clique em "Configurar Tabelas" para começar</p>
            </div>
          )}

          {/* Notifications List */}
          {!loading && !error && notifications.length > 0 && (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{getTableName(notification.protheus_table_name)}</h4>
                      {getTableDescription(notification.protheus_table_name) && (
                        <p className="text-sm text-muted-foreground">
                          {getTableDescription(notification.protheus_table_name)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(notification)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Status monitorados: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {notification.enabled_statuses.map((status) => (
                          <Badge key={status} variant="secondary" className="text-xs">
                            {statusLabels[status as RecordStatus] || status}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium">Canais de notificação: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(notification.channels || {})
                          .filter(([, enabled]) => enabled)
                          .map(([channel]) => (
                            <Badge 
                              key={channel} 
                              className={`text-xs ${channelColors[channel as NotificationChannel] || 'bg-gray-100 text-gray-800'}`}
                            >
                              {channelLabels[channel as NotificationChannel] || channel}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showDiagnostic && (
        <div className="mt-6">
          <NotificationDiagnostic />
        </div>
      )}

      <ProtheusTableSelectorModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingNotification(null);
        }}
        tables={tables}
        onSave={handleSave}
        editingNotification={editingNotification}
      />
    </>
  );
};