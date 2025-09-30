import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  tableId: string;
  rows: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tableId, rows }: ImportRequest = await req.json();

    if (!tableId || !Array.isArray(rows)) {
      return new Response(JSON.stringify({ success: false, error: 'Parâmetros inválidos' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Authorization header required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid authentication' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    // Resolve dynamic table
    const { data: dyn, error: dynErr } = await supabase
      .from('protheus_dynamic_tables')
      .select('supabase_table_name, table_structure')
      .eq('protheus_table_id', tableId)
      .maybeSingle();

    if (dynErr || !dyn?.supabase_table_name) {
      return new Response(JSON.stringify({ success: false, error: 'Tabela dinâmica não encontrada' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
    }

    const supabaseTableName = dyn.supabase_table_name as string;
    const fieldMappings = (dyn as any)?.table_structure?.field_mappings || [];
    const allowedColsFromMapping: string[] = Array.isArray(fieldMappings)
      ? fieldMappings.map((m: any) => m.sanitizedName).filter(Boolean)
      : [];
    const technicalCols = ['id','protheus_id','record_hash','previous_record_hash','is_new_record','was_updated_last_sync','last_sync_id','last_synced_at','created_at','updated_at'];
    const allowedColumns = new Set<string>([...allowedColsFromMapping, ...technicalCols]);

    // Create sync log (CSV)
    const startIso = new Date().toISOString();
    const { data: syncLog, error: logErr } = await supabase
      .from('protheus_sync_logs')
      .insert({
        protheus_table_id: tableId,
        status: 'running',
        sync_type: 'csv',
        started_at: startIso,
        total_records: rows.length,
        records_processed: 0,
        records_created: 0,
        records_updated: 0,
        records_deleted: 0
      })
      .select()
      .single();

    if (logErr) {
      console.error('Failed to create sync log:', logErr);
      return new Response(JSON.stringify({ success: false, error: 'Erro ao criar log de sincronização' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    let created = 0;
    let updated = 0;
    const processed = rows.length;

    // Partition rows by presence of id
    const withId = rows.filter((r: any) => r && typeof r === 'object' && r.id);
    const withoutId = rows.filter((r: any) => !r || !r.id ? true : false);

    // Helper to sanitize a record against allowed columns
    const sanitize = (r: Record<string, any>) => {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(r || {})) {
        if (allowedColumns.has(k)) out[k] = v;
      }
      return out;
    };

    const nowIso = new Date().toISOString();

    // Process withId
    if (withId.length > 0) {
      // Get existing ids
      const ids = Array.from(new Set(withId.map((r: any) => r.id)));
      const existing: Set<string> = new Set();
      try {
        const { data: exists } = await supabase
          .from(supabaseTableName)
          .select('id')
          .in('id', ids);
        (exists || []).forEach((e: any) => existing.add(e.id));
      } catch (_) {}

      // Batch upsert
      const BATCH = 200;
      for (let i = 0; i < withId.length; i += BATCH) {
        const slice = withId.slice(i, i + BATCH).map((r: any) => ({
          ...sanitize(r),
          is_new_record: existing.has(r.id) ? false : true,
          was_updated_last_sync: true,
          last_sync_id: syncLog.id,
          last_synced_at: nowIso,
        }));
        const { error } = await supabase
          .from(supabaseTableName)
          .upsert(slice, { onConflict: 'id', ignoreDuplicates: false });
        if (error) {
          console.error('Upsert error (withId batch):', error.message);
          // Continue processing other batches
        }
      }

      created += withId.filter((r: any) => !existing.has(r.id)).length;
      updated += withId.filter((r: any) => existing.has(r.id)).length;
    }

    // Process withoutId -> inserts
    if (withoutId.length > 0) {
      const BATCH = 200;
      for (let i = 0; i < withoutId.length; i += BATCH) {
        const slice = withoutId.slice(i, i + BATCH).map((r: any) => ({
          ...sanitize(r as any),
          is_new_record: true,
          was_updated_last_sync: true,
          last_sync_id: syncLog.id,
          last_synced_at: nowIso,
        }));
        const { error } = await supabase
          .from(supabaseTableName)
          .insert(slice);
        if (error) {
          console.error('Insert error (withoutId batch):', error.message);
        }
      }
      created += withoutId.length;
    }

    // Update log
    const finishIso = new Date().toISOString();
    await supabase
      .from('protheus_sync_logs')
      .update({
        status: 'completed',
        finished_at: finishIso,
        records_processed: processed,
        records_created: created,
        records_updated: updated
      })
      .eq('id', syncLog.id);

    return new Response(JSON.stringify({ success: true, syncLogId: syncLog.id, stats: { processed, created, updated } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (err) {
    console.error('💥 import-protheus-csv error:', err);
    return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
