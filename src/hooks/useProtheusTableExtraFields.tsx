import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProtheusTableExtraField {
  id: string;
  protheus_table_id: string;
  field_name: string;
  field_type: string;
  is_required: boolean;
  default_value: string | null;
  created_at: string;
  updated_at: string;
  // Computed field metadata
  compute_mode: string;
  compute_expression: string | null;
  compute_separator: string | null;
  compute_options?: any;
}

export interface CreateProtheusTableExtraFieldData {
  field_name: string;
  field_type: string;
  is_required: boolean;
  default_value?: string;
  compute_mode?: string;
  compute_expression?: string;
  compute_separator?: string;
  compute_options?: any;
}

export const SUPABASE_FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'varchar', label: 'Texto Limitado (VARCHAR)' },
  { value: 'integer', label: 'Número Inteiro' },
  { value: 'bigint', label: 'Número Inteiro Grande' },
  { value: 'smallint', label: 'Número Inteiro Pequeno' },
  { value: 'numeric', label: 'Número Decimal' },
  { value: 'real', label: 'Número com Ponto Flutuante' },
  { value: 'boolean', label: 'Verdadeiro/Falso' },
  { value: 'date', label: 'Data' },
  { value: 'timestamp', label: 'Data e Hora' },
  { value: 'timestamptz', label: 'Data e Hora com Timezone' },
  { value: 'time', label: 'Horário' },
  { value: 'uuid', label: 'Identificador Único' },
  { value: 'jsonb', label: 'Dados JSON' },
  { value: 'text[]', label: 'Array de Texto' },
  { value: 'integer[]', label: 'Array de Números' },
  { value: 'bytea', label: 'Dados Binários' }
];

export const useProtheusTableExtraFields = (tableId?: string) => {
  const [fields, setFields] = useState<ProtheusTableExtraField[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchExtraFields = async (targetTableId?: string) => {
    if (!targetTableId && !tableId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('protheus_table_extra_fields')
        .select('*')
        .eq('protheus_table_id', targetTableId || tableId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar campos extras:', error);
      toast.error('Erro ao carregar campos extras');
    } finally {
      setLoading(false);
    }
  };

  const createExtraField = async (tableId: string, fieldData: CreateProtheusTableExtraFieldData) => {
    try {
      const { data, error } = await supabase
        .from('protheus_table_extra_fields')
        .insert({
          protheus_table_id: tableId,
          ...fieldData
        })
        .select()
        .single();

      if (error) throw error;
      
      setFields(prev => [...prev, data]);
      toast.success('Campo extra criado com sucesso!');
      return data;
    } catch (error: any) {
      console.error('Erro ao criar campo extra:', error);
      if (error.code === '23505') {
        toast.error('Já existe um campo com este nome nesta tabela');
      } else {
        toast.error('Erro ao criar campo extra');
      }
      throw error;
    }
  };

  const updateExtraField = async (id: string, fieldData: Partial<CreateProtheusTableExtraFieldData>) => {
    try {
      const { data, error } = await supabase
        .from('protheus_table_extra_fields')
        .update(fieldData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setFields(prev => prev.map(field => field.id === id ? data : field));
      toast.success('Campo extra atualizado com sucesso!');
      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar campo extra:', error);
      if (error.code === '23505') {
        toast.error('Já existe um campo com este nome nesta tabela');
      } else {
        toast.error('Erro ao atualizar campo extra');
      }
      throw error;
    }
  };

  const deleteExtraField = async (id: string) => {
    try {
      const { error } = await supabase
        .from('protheus_table_extra_fields')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setFields(prev => prev.filter(field => field.id !== id));
      toast.success('Campo extra removido com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover campo extra:', error);
      toast.error('Erro ao remover campo extra');
      throw error;
    }
  };

  useEffect(() => {
    if (tableId) {
      fetchExtraFields(tableId);
    }
  }, [tableId]);

  return {
    fields,
    loading,
    fetchExtraFields,
    createExtraField,
    updateExtraField,
    deleteExtraField
  };
};