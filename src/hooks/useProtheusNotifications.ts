import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface NotificationConfig {
  id: string;
  user_id: string;
  protheus_table_name: string;
  enabled_statuses: string[];
  channels: any; // JSON type from Supabase
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationFormData {
  protheus_table_name: string;
  enabled_statuses: string[];
  notification_channels: string[];
}

// Legacy interfaces for backward compatibility  
export interface ProtheusNotificationConfig {
  id: string;
  user_id: string;
  protheus_table_id: string;
  record_statuses: string[];
  notification_channels: string[]; // Array format for UI
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProtheusNotificationFormData {
  protheus_table_id: string;
  record_statuses: string[];
  notification_channels: string[];
}

export interface ProtheusTableWithNotifications {
  id: string;
  table_name: string;
  description?: string;
  notification_config?: ProtheusNotificationConfig;
}

export interface ProtheusTableOption {
  id: string;
  table_name: string;
  description?: string;
  notification_config?: NotificationConfig;
}

export const useProtheusNotifications = (targetUserId?: string) => {
  const [notifications, setNotifications] = useState<NotificationConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      console.log('🔄 Iniciando fetchNotifications...', { targetUserId });
      setLoading(true);
      setError(null);
      
      // Implementar fallback para problemas de schema cache
      try {
        let query = supabase
          .from('user_notification_configs')
          .select('*');
        
        if (targetUserId) {
          query = query.eq('user_id', targetUserId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Erro na query user_notification_configs:', error);
          // Se o erro for relacionado ao schema cache, usar fallback vazio
          if (error.message?.includes('schema cache') || error.code === 'PGRST200') {
            console.log('⚠️ Problema de schema cache detectado, usando fallback vazio');
            setNotifications([]);
            setError('Configurações de notificação temporariamente indisponíveis');
            return;
          }
          throw error;
        }
        
        console.log('✅ Notificações carregadas:', data?.length || 0);
        setNotifications(data || []);
      } catch (queryError: any) {
        console.error('❌ Erro na consulta de notificações:', queryError);
        // Fallback gracioso para qualquer erro de query
        setNotifications([]);
        setError('Não foi possível carregar as configurações de notificação');
      }
    } catch (error: any) {
      console.error('❌ Erro geral ao buscar notificações:', error);
      setNotifications([]);
      setError('Erro interno ao carregar notificações');
      
      // Só mostrar toast se não for erro de schema cache
      if (!error.message?.includes('schema cache')) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações de notificação",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  const saveNotification = async (config: NotificationFormData) => {
    try {
      setSaving(true);

      // Convert channels array to JSON object format
      const channelsObject = {
        app: config.notification_channels.includes('app'),
        email: config.notification_channels.includes('email'),
        telegram: config.notification_channels.includes('telegram'),
        whatsapp: config.notification_channels.includes('whatsapp'),
      };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Determinar o user_id para salvar a configuração
      const configUserId = targetUserId || user.id;

      // Get the Supabase table name from protheus_table_id
      const { data: dynamicTable } = await supabase
        .from('protheus_dynamic_tables')
        .select('supabase_table_name')
        .eq('protheus_table_id', config.protheus_table_name)
        .single();

      const supabaseTableName = dynamicTable?.supabase_table_name || config.protheus_table_name;

      // Check if notification already exists for this table
      const existingNotification = notifications.find(
        n => n.protheus_table_name === supabaseTableName
      );

      if (existingNotification) {
        // Update existing
        const { error } = await supabase
          .from('user_notification_configs')
          .update({
            enabled_statuses: config.enabled_statuses,
            channels: channelsObject,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingNotification.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('user_notification_configs')
          .insert({
            user_id: configUserId,
            protheus_table_name: supabaseTableName,
            enabled_statuses: config.enabled_statuses,
            channels: channelsObject,
            created_by: user.id,
          });

        if (error) throw error;
      }

      await fetchNotifications();
      
      toast({
        title: "Sucesso",
        description: "Configuração de notificação salva com sucesso",
      });

      return true;
    } catch (error) {
      console.error('Erro ao salvar notificação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('user_notification_configs')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      await fetchNotifications();
      
      toast({
        title: "Sucesso",
        description: "Configuração removida com sucesso",
      });
    } catch (error) {
      console.error('Erro ao remover notificação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a configuração",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getTablesWithNotifications = useCallback(async (): Promise<ProtheusTableOption[]> => {
    try {
      // Fetch all protheus tables from database
      const { data: protheusTables, error: tablesError } = await supabase
        .from('protheus_tables')
        .select('id, table_name, description')
        .order('table_name');

      if (tablesError) {
        console.error('Error fetching protheus tables:', tablesError);
        return [];
      }

      if (!protheusTables) {
        return [];
      }

      // Fetch dynamic table mappings
      const { data: dynamicTables, error: dynamicError } = await supabase
        .from('protheus_dynamic_tables')
        .select('protheus_table_id, supabase_table_name');

      if (dynamicError) {
        console.error('Error fetching dynamic table mappings:', dynamicError);
        return [];
      }

      const dynamicTableMap = new Map(
        dynamicTables?.map(dt => [dt.protheus_table_id, dt.supabase_table_name]) || []
      );

      return protheusTables.map(table => {
        const supabaseTableName = dynamicTableMap.get(table.id);
        const notification = notifications.find(n => n.protheus_table_name === supabaseTableName);
        
        return {
          id: table.id,
          table_name: table.table_name,
          description: table.description,
          notification_config: notification,
        };
      });
    } catch (error) {
      console.error('Erro ao buscar tabelas:', error);
      return [];
    }
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    saving,
    error,
    fetchNotifications,
    saveNotification,
    deleteNotification,
    getTablesWithNotifications,
  };
};