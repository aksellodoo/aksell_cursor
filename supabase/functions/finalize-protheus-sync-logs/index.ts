import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { getErrorMessage } from '../_shared/errorUtils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FinalizeRequest {
  syncLogId?: string;
  tableId?: string;
  forceTerminate?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 finalize-protheus-sync-logs function started');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header and extract the JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    const requestBody: FinalizeRequest = await req.json();
    const { syncLogId, tableId, forceTerminate } = requestBody;

    console.log('📋 Request:', { syncLogId, tableId, forceTerminate, userId: user.id });

    if (forceTerminate) {
      // Force terminate specific log or all long-running logs
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      let query = supabase
        .from('protheus_sync_logs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error_message: 'Sincronização encerrada forçadamente (tempo limite excedido)'
        })
        .eq('status', 'running');

      if (syncLogId) {
        query = query.eq('id', syncLogId);
        console.log(`🚫 Force terminating specific sync log: ${syncLogId}`);
      } else {
        query = query.lt('started_at', tenMinutesAgo);
        console.log(`🚫 Force terminating all sync logs running for >10 minutes (before ${tenMinutesAgo})`);
      }

      const { data: updatedLogs, error: updateError } = await query.select('id, table_id');

      if (updateError) {
        console.error('❌ Error force terminating sync logs:', updateError);
        throw updateError;
      }

      console.log(`✅ Force terminated ${updatedLogs?.length || 0} sync logs`);

      // Update last_sync_at for affected tables
      if (updatedLogs && updatedLogs.length > 0) {
        for (const log of updatedLogs) {
          if (log.table_id) {
            const { error: tableUpdateError } = await supabase
              .from('protheus_tables')
              .update({ last_sync_at: new Date().toISOString() })
              .eq('id', log.table_id);

            if (tableUpdateError) {
              console.error(`⚠️ Failed to update last_sync_at for table ${log.table_id}:`, tableUpdateError);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          terminated_count: updatedLogs?.length || 0,
          message: syncLogId 
            ? 'Sincronização específica encerrada forçadamente'
            : `${updatedLogs?.length || 0} sincronizações longas encerradas forçadamente`
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Normal finalization
    let targetSyncLogId = syncLogId;
    
    // If tableId is provided but syncLogId is not, find the latest running sync for this table
    if (!targetSyncLogId && tableId) {
      const { data: latestSync, error: findError } = await supabase
        .from('protheus_sync_logs')
        .select('id')
        .eq('table_id', tableId)
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (latestSync && !findError) {
        targetSyncLogId = latestSync.id;
        console.log(`🔍 Found latest running sync for table ${tableId}: ${targetSyncLogId}`);
      }
    }

    if (targetSyncLogId) {
      const { data: syncLog, error: fetchError } = await supabase
        .from('protheus_sync_logs')
        .select('*')
        .eq('id', targetSyncLogId)
        .single();

      if (fetchError || !syncLog) {
        throw new Error(`Sync log not found: ${targetSyncLogId}`);
      }

      if (syncLog.status !== 'running') {
        return new Response(
          JSON.stringify({
            success: true,
            message: `Sync log já está com status: ${syncLog.status}`
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const { error: updateError } = await supabase
        .from('protheus_sync_logs')
        .update({
          status: 'completed',
          finished_at: new Date().toISOString()
        })
        .eq('id', targetSyncLogId);

      if (updateError) {
        throw updateError;
      }

      // Update table's last_sync_at
      if (syncLog.table_id) {
        const { error: tableUpdateError } = await supabase
          .from('protheus_tables')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', syncLog.table_id);

        if (tableUpdateError) {
          console.error('Failed to update table last_sync_at:', tableUpdateError);
        }
      }

      console.log(`✅ Sync log ${targetSyncLogId} finalized successfully`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Sync log finalizado com sucesso'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    throw new Error('Parâmetros inválidos: forneça syncLogId ou tableId');

  } catch (error) {
    console.error('❌ Error in finalize-protheus-sync-logs:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: getErrorMessage(error),
        message: 'Erro ao finalizar sincronização'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});