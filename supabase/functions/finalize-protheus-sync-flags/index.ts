
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FinalizeRequest {
  tableId: string;
  syncLogId?: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 finalize-protheus-sync-flags started");
    const { tableId, syncLogId }: FinalizeRequest = await req.json();

    if (!tableId) {
      return new Response(JSON.stringify({ success: false, error: "tableId is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env");
      return new Response(JSON.stringify({ success: false, error: "Server misconfiguration" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Validate auth (require a valid Bearer token)
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Authorization header required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Invalid authentication" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    console.log("👤 Authenticated user:", user.id);

    // Resolve table name from protheus_dynamic_tables
    const { data: dyn, error: dynErr } = await supabaseAdmin
      .from("protheus_dynamic_tables")
      .select("supabase_table_name")
      .eq("protheus_table_id", tableId)
      .maybeSingle();

    if (dynErr || !dyn?.supabase_table_name) {
      console.error("Dynamic table not found:", dynErr);
      return new Response(JSON.stringify({ success: false, error: "Dynamic table not found for this Protheus table" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const supabaseTableName = dyn.supabase_table_name as string;
    console.log("🗄️ Target table:", supabaseTableName);

    // Fetch target sync log (latest if not provided)
    let targetLog: {
      id: string;
      created_at?: string | null;
      started_at?: string | null;
      finished_at?: string | null;
    } | null = null;

    if (syncLogId) {
      const { data: log, error: logErr } = await supabaseAdmin
        .from("protheus_sync_logs")
        .select("id, created_at, started_at, finished_at")
        .eq("id", syncLogId)
        .maybeSingle();

      if (logErr || !log) {
        console.error("Sync log not found with provided syncLogId:", logErr);
        return new Response(JSON.stringify({ success: false, error: "Sync log not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }
      targetLog = log as any;
    } else {
      const { data: logs, error: logsErr } = await supabaseAdmin
        .from("protheus_sync_logs")
        .select("id, created_at, started_at, finished_at")
        .eq("protheus_table_id", tableId)
        .order("finished_at", { ascending: false, nullsFirst: false })
        .limit(1);

      if (logsErr || !logs || logs.length === 0) {
        console.error("No sync logs found for table:", logsErr);
        return new Response(JSON.stringify({ success: false, error: "No sync logs found for this table" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }
      targetLog = logs[0] as any;
    }

    const startTimeIso =
      targetLog?.started_at ||
      targetLog?.created_at ||
      new Date(Date.parse(targetLog?.finished_at || new Date().toISOString()) - 60_000).toISOString();
    const endTimeIso = targetLog?.finished_at || new Date().toISOString();

    console.log("⏱️ Window:", { startTimeIso, endTimeIso, syncLogId: targetLog?.id });

    // Step 1: clear previous flags
    const { error: clearErr } = await supabaseAdmin
      .from(supabaseTableName)
      .update({ was_updated_last_sync: false })
      .eq("was_updated_last_sync", true);

    if (clearErr) {
      console.warn("Failed to clear previous flags (non-fatal):", clearErr);
    }

    // Step 2: mark records updated in the time window
    // Only mark existing records (not new ones) that were actually updated in this sync
    const { error: markErr } = await supabaseAdmin
      .from(supabaseTableName)
      .update({
        was_updated_last_sync: true,
        last_synced_at: endTimeIso,
      })
      .eq("last_sync_id", targetLog?.id || null)
      .eq("is_new_record", false)
      .gte("updated_at", startTimeIso)
      .lte("updated_at", endTimeIso);

    // Step 3: Clear is_new_record flag for records that are no longer new
    // Records are no longer "new" if they were not created in this specific sync
    const { count: clearedNewCount, error: clearNewErr } = await supabaseAdmin
      .from(supabaseTableName)
      .update({ is_new_record: false }, { count: 'exact' })
      .eq("is_new_record", true)
      .not("last_sync_id", "eq", targetLog?.id || null);

    console.log(`🧹 Cleared is_new_record flag from ${clearedNewCount || 0} records that are no longer new`);

    if (markErr) {
      console.error("Failed to mark updated rows:", markErr);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to mark updated rows", details: markErr.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Optional: compute count of rows flagged (approximate by selecting count in same window)
    const { count, error: cntErr } = await supabaseAdmin
      .from(supabaseTableName)
      .select("id", { count: "exact", head: true })
      .eq("last_sync_id", targetLog?.id || null);

    if (cntErr) {
      console.warn("Count after mark failed (non-fatal):", cntErr);
    }

    console.log("✅ Finalized flags. Window updates:", count ?? "unknown");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Flags de última sincronização atualizadas com sucesso",
        stats: { updated_in_window: count ?? null, startTimeIso, endTimeIso, syncLogId: targetLog?.id || null },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    console.error("💥 finalize-protheus-sync-flags error:", err);
    return new Response(
      JSON.stringify({ success: false, error: getErrorMessage(err) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
