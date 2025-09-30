import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ProtheusTable {
  id: string;
  table_name: string;
  description: string;
  query_interval_value: number;
  query_interval_unit: 'seconds' | 'minutes' | 'hours' | 'days';
  fetch_all_fields: boolean;
  create_supabase_table: boolean;
  extra_database_fields: boolean;
  enable_sha256_hash: boolean;
  log_hash_changes: boolean;
  detect_new_records: boolean;
  detect_deleted_records: boolean;
  is_active: boolean;
  linked_outside_protheus: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  supabase_table_name?: string;
  selected_fields?: string[];
  sync_type?: string;
  sync_schedule?: string[];
  cron_expression?: string;
  next_due_at?: string;
}

interface CreateProtheusTableData {
  table_name: string;
  description: string;
  key_fields: string;
  query_interval_value: number;
  query_interval_unit: 'seconds' | 'minutes' | 'hours' | 'days';
  fetch_all_fields: boolean;
  create_supabase_table: boolean;
  extra_database_fields: boolean;
  enable_sha256_hash: boolean;
  log_hash_changes: boolean;
  detect_new_records: boolean;
  detect_deleted_records: boolean;
  selected_fields?: string[];
}

export const useProtheusTables = () => {
  const [tables, setTables] = useState<ProtheusTable[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTables = async () => {
    try {
      setLoading(true);
      
      // Fetch protheus tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('protheus_tables')
        .select('*')
        .order('created_at', { ascending: false });

      if (tablesError) throw tablesError;

      // Fetch dynamic tables mapping
      const { data: dynamicTablesData, error: dynamicError } = await supabase
        .from('protheus_dynamic_tables')
        .select('protheus_table_id, supabase_table_name');

      if (dynamicError) throw dynamicError;

      // Create a map of protheus_table_id to supabase_table_name
      const dynamicTablesMap = new Map(
        (dynamicTablesData || []).map(dt => [dt.protheus_table_id, dt.supabase_table_name])
      );

      // Map the data to include supabase_table_name
      const tablesWithSupabaseName = (tablesData || []).map((table: any) => ({
        ...table,
        supabase_table_name: dynamicTablesMap.get(table.id) || null
      }));
      
      setTables(tablesWithSupabaseName as ProtheusTable[]);
    } catch (error) {
      console.error('Error fetching Protheus tables:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tabelas Protheus",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTable = async (
    tableData: CreateProtheusTableData, 
    extraFields?: Array<{
      field_name: string;
      field_type: string;
      is_required: boolean;
      default_value: string | null;
    }>
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Primeiro criar a tabela
      const { data: tableResult, error: tableError } = await supabase
        .from('protheus_tables')
        .insert({
          ...tableData,
          created_by: user.id
        })
        .select()
        .single();

      if (tableError) throw tableError;

      // Se há campos extras para criar, criar cada um
      if (extraFields && extraFields.length > 0) {
        const fieldsToInsert = extraFields.map(field => ({
          protheus_table_id: tableResult.id,
          field_name: field.field_name,
          field_type: field.field_type,
          is_required: field.is_required,
          default_value: field.default_value,
          compute_mode: (field as any).compute_mode || 'none',
          compute_expression: (field as any).compute_expression || null,
          compute_separator: (field as any).compute_separator || null,
          compute_options: (field as any).compute_options || {}
        }));

        const { error: fieldsError } = await supabase
          .from('protheus_table_extra_fields')
          .insert(fieldsToInsert);

        if (fieldsError) {
          console.error('Error creating extra fields:', fieldsError);
          // Não falhar a criação da tabela por causa dos campos extras
          toast({
            title: "Aviso",
            description: "Tabela criada, mas houve erro ao criar alguns campos extras",
            variant: "destructive",
          });
        }
      }

      // Se configurado para criar tabela Supabase, criar automaticamente
      if (tableData.create_supabase_table) {
        try {
          const { data: createResult, error: createError } = await supabase.functions.invoke(
            'create-protheus-sync-table',
            {
              body: {
                tableConfig: tableResult,
                sampleData: [] // Será descoberto na primeira sincronização
              }
            }
          );

          if (createError || !createResult?.success) {
            console.error('Error creating sync table:', createError);
            toast({
              title: "Aviso",
              description: "Tabela criada, mas houve erro ao criar tabela de sincronização. Tente criar manualmente.",
              variant: "destructive",
            });
          }
        } catch (syncError) {
          console.error('Error in sync table creation:', syncError);
        }
      }

      toast({
        title: "Sucesso",
        description: "Tabela Protheus criada com sucesso",
      });

      // Force refresh the tables list
      await fetchTables();
      return tableResult;
    } catch (error: any) {
      console.error('Error creating Protheus table:', error);
      
      if (error.code === '23505') {
        toast({
          title: "Erro",
          description: "Já existe uma tabela com este nome",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro", 
          description: "Erro ao criar tabela Protheus",
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const updateTable = async (id: string, tableData: Partial<CreateProtheusTableData>) => {
    try {
      const { data, error } = await supabase
        .from('protheus_tables')
        .update(tableData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tabela Protheus atualizada com sucesso",
      });

      // Force refresh the tables list
      await fetchTables();
      return data;
    } catch (error: any) {
      console.error('Error updating Protheus table:', error);
      
      if (error.code === '23505') {
        toast({
          title: "Erro",
          description: "Já existe uma tabela com este nome",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar tabela Protheus", 
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const deleteTable = async (id: string) => {
    try {
      // Primeiro verificar se a tabela está linkada fora do Protheus
      const { data: tableInfo, error: fetchError } = await supabase
        .from('protheus_tables')
        .select('linked_outside_protheus, table_name')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (tableInfo?.linked_outside_protheus) {
        toast({
          title: "Operação não permitida",
          description: "Esta tabela está linkada fora do Protheus e não pode ser deletada.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('protheus_tables')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso", 
        description: "Tabela Protheus removida com sucesso",
      });

      await fetchTables();
    } catch (error: any) {
      console.error('Error deleting Protheus table:', error);
      
      // Verificar se é o erro do trigger de proteção
      if (error.code === '42501' && error.message.includes('linkada fora do Protheus')) {
        toast({
          title: "Operação não permitida",
          description: "Esta tabela está linkada fora do Protheus e não pode ser deletada.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao remover tabela Protheus",
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const toggleTableStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('protheus_tables')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Tabela ${isActive ? 'ativada' : 'desativada'} com sucesso`,
      });

      await fetchTables();
    } catch (error) {
      console.error('Error toggling table status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da tabela",
        variant: "destructive",
      });
      throw error;
    }
  };

  const cleanSupabaseTable = async (tableId: string) => {
    try {
      // Verificar se a tabela está linkada fora do Protheus antes de tentar limpar
      const { data: tableInfo, error: fetchError } = await supabase
        .from('protheus_tables')
        .select('linked_outside_protheus, table_name')
        .eq('id', tableId)
        .single();

      if (fetchError) throw fetchError;

      if (tableInfo?.linked_outside_protheus) {
        toast({
          title: "Operação não permitida",
          description: "Esta tabela está linkada fora do Protheus e não pode ser deletada.",
          variant: "destructive",
        });
        return { success: false, message: "Tabela protegida contra exclusão" };
      }

      const { data, error } = await supabase.functions.invoke('clean-protheus-table', {
        body: { tableId }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Sucesso",
          description: data.message,
        });
        await fetchTables();
        return { success: true, message: data.message };
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Error cleaning Supabase table:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao limpar tabela Supabase';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, message: errorMessage };
    }
  };

  const updateSupabaseTableStructure = async (tableId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-supabase-table-structure', {
        body: { tableId }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Sucesso",
          description: data.message,
        });
        await fetchTables();
        return { success: true, message: data.message };
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Error updating Supabase table structure:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar estrutura da tabela Supabase';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, message: errorMessage };
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const updateSyncSettings = async (tableId: string, syncSettings: {
    sync_type: string;
    query_interval_value: number;
    query_interval_unit: string;
    sync_schedule?: string[];
    cron_expression?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('protheus_tables')
        .update(syncSettings)
        .eq('id', tableId);

      if (error) throw error;

      await fetchTables();
    } catch (error) {
      console.error('Error updating sync settings:', error);
      throw error;
    }
  };

  const toggleLinkedOutsideProtheus = async (id: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('protheus_tables')
        .update({ linked_outside_protheus: value })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Linkado fora Protheus ${value ? 'ativado' : 'desativado'} com sucesso`,
      });

      await fetchTables();
    } catch (error) {
      console.error('Error toggling linked outside protheus:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status de linkado fora Protheus",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    tables,
    loading,
    fetchTables,
    createTable,
    updateTable,
    deleteTable,
    toggleTableStatus,
    cleanSupabaseTable,
    updateSupabaseTableStructure,
    updateSyncSettings,
    toggleLinkedOutsideProtheus
  };
};
