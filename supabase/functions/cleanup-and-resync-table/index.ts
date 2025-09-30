import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupRequest {
  tableId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tableId }: CleanupRequest = await req.json();

    console.log(`🧹 Starting cleanup and re-sync for table: ${tableId}`);

    // Get dynamic table info
    const { data: dynamicTable, error: dynamicTableError } = await supabase
      .from('protheus_dynamic_tables')
      .select('*')
      .eq('protheus_table_id', tableId)
      .single();

    if (dynamicTableError || !dynamicTable) {
      throw new Error(`Tabela dinâmica não encontrada: ${dynamicTableError?.message}`);
    }

    console.log(`📋 Found dynamic table: ${dynamicTable.supabase_table_name}`);

    // Step 1: Delete all existing records from the Supabase table
    console.log(`🗑️ Cleaning up existing records from ${dynamicTable.supabase_table_name}...`);
    
    const { error: deleteError } = await supabase
      .from(dynamicTable.supabase_table_name)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (deleteError) {
      console.error('❌ Error deleting records:', deleteError);
      throw new Error(`Erro ao limpar registros: ${getErrorMessage(deleteError)}`);
    }

    console.log('✅ All existing records deleted successfully');

    // Step 2: Trigger a fresh sync
    console.log(`🔄 Triggering fresh sync for table ${tableId}...`);
    
    const { data: syncResult, error: syncError } = await supabase.functions.invoke('sync-protheus-table', {
      body: { 
        tableId: tableId,
        forceFullSync: true,
        skipBinary: true // Skip binary fields for cleanup operations
      }
    });

    if (syncError) {
      console.error('❌ Error during sync:', syncError);
      throw new Error(`Erro durante sincronização: ${getErrorMessage(syncError)}`);
    }

    console.log('✅ Fresh sync completed:', syncResult);

    // Step 3: Get final record count
    const { count: finalCount, error: countError } = await supabase
      .from(dynamicTable.supabase_table_name)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting final records:', countError);
      throw new Error(`Erro ao contar registros finais: ${getErrorMessage(countError)}`);
    }

    console.log(`📊 Final record count: ${finalCount}`);

    // Create cleanup log
    await supabase.from('protheus_sync_logs').insert({
      protheus_table_id: tableId,
      status: 'cleanup_completed',
      total_records: finalCount || 0,
      records_processed: finalCount || 0,
      records_created: finalCount || 0,
      records_updated: 0,
      records_deleted: 0,
      sync_details: {
        cleanup_performed: true,
        action: 'cleanup_and_resync',
        performed_at: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Limpeza e re-sincronização concluída com sucesso',
        finalRecordCount: finalCount,
        syncResult: syncResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: getErrorMessage(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});