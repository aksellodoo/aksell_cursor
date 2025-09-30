

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanTableRequest {
  tableId: string;
}

serve(async (req) => {
  console.log(`[clean-protheus-table] ${req.method} request received`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { tableId }: CleanTableRequest = await req.json();

    if (!tableId) {
      throw new Error('tableId é obrigatório');
    }

    console.log(`[clean-protheus-table] Iniciando limpeza completa para tabela ID: ${tableId}`);

    // 1. Buscar informações da tabela Protheus e verificar se está linkada fora do Protheus
    const { data: protheusTable, error: protheusError } = await supabase
      .from('protheus_tables')
      .select('table_name, linked_outside_protheus')
      .eq('id', tableId)
      .single();

    if (protheusError || !protheusTable) {
      throw new Error(`Tabela Protheus não encontrada: ${protheusError?.message}`);
    }

    // Verificar se a tabela está protegida
    if (protheusTable.linked_outside_protheus) {
      console.log(`[clean-protheus-table] Tabela ${protheusTable.table_name} está linkada fora do Protheus - operação bloqueada`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Esta tabela está linkada fora do Protheus e não pode ser deletada.',
          tableName: protheusTable.table_name,
          protected: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      );
    }

    console.log(`[clean-protheus-table] Tabela encontrada: ${protheusTable.table_name}`);

    // 2. Buscar o nome da tabela Supabase correspondente
    const { data: dynamicTable, error: dynamicError } = await supabase
      .from('protheus_dynamic_tables')
      .select('supabase_table_name')
      .eq('protheus_table_id', tableId)
      .maybeSingle();

    const supabaseTableName = dynamicTable?.supabase_table_name;
    
    // Estrutura para coletar resultados de cada operação
    const cleanupResults = {
      syncLogs: { success: false, error: null as string | null },
      extraFields: { success: false, error: null as string | null },
      supabaseTable: { success: false, error: null as string | null },
      dynamicMapping: { success: false, error: null as string | null },
      mainRecord: { success: false, error: null as string | null }
    };

    // **ETAPA 1: Limpar logs de sincronização**
    console.log(`[clean-protheus-table] 1/5 - Limpando logs de sincronização...`);
    try {
      const { error: logsError } = await supabase
        .from('protheus_sync_logs')
        .delete()
        .eq('protheus_table_id', tableId);

      if (logsError) {
        cleanupResults.syncLogs.error = logsError.message;
        console.error(`[clean-protheus-table] Erro ao limpar logs: ${logsError.message}`);
      } else {
        cleanupResults.syncLogs.success = true;
        console.log(`[clean-protheus-table] ✓ Logs de sincronização limpos`);
      }
    } catch (error) {
      cleanupResults.syncLogs.error = String(error);
      console.error(`[clean-protheus-table] Erro ao limpar logs: ${error}`);
    }

    // **ETAPA 2: Remover campos extras**
    console.log(`[clean-protheus-table] 2/5 - Removendo campos extras...`);
    try {
      const { error: extraFieldsError } = await supabase
        .from('protheus_table_extra_fields')
        .delete()
        .eq('protheus_table_id', tableId);

      if (extraFieldsError) {
        cleanupResults.extraFields.error = extraFieldsError.message;
        console.error(`[clean-protheus-table] Erro ao remover campos extras: ${extraFieldsError.message}`);
      } else {
        cleanupResults.extraFields.success = true;
        console.log(`[clean-protheus-table] ✓ Campos extras removidos`);
      }
    } catch (error) {
      cleanupResults.extraFields.error = String(error);
      console.error(`[clean-protheus-table] Erro ao remover campos extras: ${error}`);
    }

    // **ETAPA 3: Deletar tabela Supabase física**
    console.log(`[clean-protheus-table] 3/5 - Deletando tabela Supabase física...`);
    if (supabaseTableName) {
      try {
        // Substituído: usar RPC seguro drop_dynamic_table
        const { data: dropResult, error: dropError } = await supabase.rpc('drop_dynamic_table', {
          p_table_name: supabaseTableName
        });

        if (dropError) {
          cleanupResults.supabaseTable.error = dropError.message;
          console.error(`[clean-protheus-table] Erro ao deletar tabela via RPC: ${dropError.message}`);
        } else if (!dropResult?.success) {
          const errMsg = dropResult?.error || 'Falha ao remover a tabela (retorno sem sucesso)';
          cleanupResults.supabaseTable.error = errMsg;
          console.error(`[clean-protheus-table] Erro ao deletar tabela: ${errMsg}`);
        } else {
          cleanupResults.supabaseTable.success = true;
          console.log(`[clean-protheus-table] ✓ Tabela ${supabaseTableName} deletada`);
        }
      } catch (error) {
        cleanupResults.supabaseTable.error = String(error);
        console.error(`[clean-protheus-table] Erro ao deletar tabela: ${error}`);
      }
    } else {
      cleanupResults.supabaseTable.success = true;
      console.log(`[clean-protheus-table] ✓ Nenhuma tabela Supabase para deletar`);
    }

    // **ETAPA 4: Remover mapeamento da tabela dinâmica**
    console.log(`[clean-protheus-table] 4/5 - Removendo mapeamento...`);
    try {
      const { error: mappingError } = await supabase
        .from('protheus_dynamic_tables')
        .delete()
        .eq('protheus_table_id', tableId);

      if (mappingError) {
        cleanupResults.dynamicMapping.error = mappingError.message;
        console.error(`[clean-protheus-table] Erro ao remover mapeamento: ${mappingError.message}`);
      } else {
        cleanupResults.dynamicMapping.success = true;
        console.log(`[clean-protheus-table] ✓ Mapeamento removido`);
      }
    } catch (error) {
      cleanupResults.dynamicMapping.error = String(error);
      console.error(`[clean-protheus-table] Erro ao remover mapeamento: ${error}`);
    }

    // **ETAPA 5: Remover registro principal da tabela Protheus**
    console.log(`[clean-protheus-table] 5/5 - Removendo registro principal...`);
    try {
      const { error: mainRecordError } = await supabase
        .from('protheus_tables')
        .delete()
        .eq('id', tableId);

      if (mainRecordError) {
        cleanupResults.mainRecord.error = mainRecordError.message;
        console.error(`[clean-protheus-table] Erro ao remover registro principal: ${mainRecordError.message}`);
      } else {
        cleanupResults.mainRecord.success = true;
        console.log(`[clean-protheus-table] ✓ Registro principal removido`);
      }
    } catch (error) {
      cleanupResults.mainRecord.error = String(error);
      console.error(`[clean-protheus-table] Erro ao remover registro principal: ${error}`);
    }

    // Verificar se houve algum sucesso
    const hasAnySuccess = Object.values(cleanupResults).some(result => result.success);
    const hasAnyError = Object.values(cleanupResults).some(result => result.error !== null);

    // Criar relatório detalhado
    const successOperations = Object.entries(cleanupResults)
      .filter(([_, result]) => result.success)
      .map(([key, _]) => key);

    const failedOperations = Object.entries(cleanupResults)
      .filter(([_, result]) => result.error !== null)
      .map(([key, result]) => ({ operation: key, error: result.error }));

    console.log(`[clean-protheus-table] Limpeza concluída. Sucessos: ${successOperations.length}/5`);
    
    if (failedOperations.length > 0) {
      console.log(`[clean-protheus-table] Operações com falha: ${failedOperations.map(f => f.operation).join(', ')}`);
    }

    // Determinar status da resposta
    const isCompleteSuccess = successOperations.length === 5 && failedOperations.length === 0;
    const isPartialSuccess = hasAnySuccess;

    return new Response(
      JSON.stringify({
        success: isCompleteSuccess,
        partial_success: isPartialSuccess && !isCompleteSuccess,
        message: isCompleteSuccess 
          ? `Tabela ${protheusTable.table_name} foi completamente limpa`
          : isPartialSuccess 
            ? `Limpeza parcial da tabela ${protheusTable.table_name}. Algumas operações falharam.`
            : `Falha na limpeza da tabela ${protheusTable.table_name}`,
        tableName: protheusTable.table_name,
        supabaseTableName: supabaseTableName,
        details: {
          successful_operations: successOperations,
          failed_operations: failedOperations,
          cleanup_results: cleanupResults
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: isPartialSuccess ? 200 : 500
      }
    );

  } catch (error) {
    console.error('[clean-protheus-table] Erro crítico:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        details: 'Falha crítica durante o processo de limpeza'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
