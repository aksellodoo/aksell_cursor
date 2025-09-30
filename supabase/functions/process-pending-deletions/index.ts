
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessPendingDeletionsRequest {
  tableId: string;
  recordKeys?: string[]; // Optional: specific records to process
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

    const { tableId, recordKeys }: ProcessPendingDeletionsRequest = await req.json();

    console.log(`🗑️ Processing pending deletions for table: ${tableId}`);

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

    // Build the deletion query
    let deleteQuery = supabase
      .from(dynamicTable.supabase_table_name)
      .delete()
      .eq('pending_deletion', true);

    // If specific record keys are provided, filter by them
    if (recordKeys && recordKeys.length > 0) {
      console.log(`🎯 Processing specific records: ${recordKeys.length} keys`);
      // Assuming protheus_id is the key field - adjust if different
      deleteQuery = deleteQuery.in('protheus_id', recordKeys);
    }

    // Execute the deletion
    const { data: deletedRecords, error: deleteError } = await deleteQuery.select();

    if (deleteError) {
      console.error('❌ Error deleting pending records:', deleteError);
      throw new Error(`Erro ao deletar registros pendentes: ${deleteError.message}`);
    }

    const deletedCount = deletedRecords?.length || 0;
    console.log(`✅ Successfully deleted ${deletedCount} pending deletion records`);

    // Get remaining pending deletion count
    const { count: remainingCount, error: countError } = await supabase
      .from(dynamicTable.supabase_table_name)
      .select('*', { count: 'exact', head: true })
      .eq('pending_deletion', true);

    if (countError) {
      console.error('❌ Error counting remaining records:', countError);
    }

    // Log the cleanup activity
    await supabase.from('protheus_sync_logs').insert({
      protheus_table_id: tableId,
      status: 'pending_deletions_processed',
      total_records: 0,
      records_processed: deletedCount,
      records_created: 0,
      records_updated: 0,
      records_deleted: deletedCount,
      sync_details: {
        pending_deletions_processed: true,
        deleted_count: deletedCount,
        remaining_pending_count: remainingCount || 0,
        specific_keys_processed: recordKeys || null,
        performed_at: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Exclusões pendentes processadas com sucesso',
        deletedCount: deletedCount,
        remainingPendingCount: remainingCount || 0,
        processedKeys: recordKeys || 'all_pending'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Process pending deletions error:', error);
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
