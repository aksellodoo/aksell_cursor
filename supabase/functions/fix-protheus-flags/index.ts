import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FixRequest {
  tableId: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔧 fix-protheus-flags started");
    const { tableId }: FixRequest = await req.json();

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

    // Validate auth
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

    // Get table name
    const { data: dyn, error: dynErr } = await supabaseAdmin
      .from("protheus_dynamic_tables")
      .select("supabase_table_name")
      .eq("protheus_table_id", tableId)
      .maybeSingle();

    if (dynErr || !dyn?.supabase_table_name) {
      console.error("Dynamic table not found:", dynErr);
      return new Response(JSON.stringify({ success: false, error: "Dynamic table not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const supabaseTableName = dyn.supabase_table_name as string;
    console.log("🗄️ Target table:", supabaseTableName);

    // Get latest sync log ID
    const { data: latestSync } = await supabaseAdmin
      .from("protheus_sync_logs")
      .select("id")
      .eq("protheus_table_id", tableId)
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestSyncId = latestSync?.id;
    console.log("🔄 Latest sync ID:", latestSyncId);

    // Fix is_new_record flags
    const { count: fixedNewCount, error: fixNewErr } = await supabaseAdmin
      .from(supabaseTableName)
      .update({ is_new_record: false }, { count: 'exact' })
      .eq("is_new_record", true)
      .not("last_sync_id", "eq", latestSyncId || "");

    if (fixNewErr) {
      console.error("Failed to fix new flags:", fixNewErr);
      return new Response(JSON.stringify({ success: false, error: "Failed to fix new flags" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Ensure soft delete columns exist
    try {
      console.log("🔧 Ensuring soft delete columns exist...");
      
      // Add pending_deletion column
      const { error: pendingColErr } = await supabaseAdmin.rpc('execute_sql', {
        sql_statement: `ALTER TABLE public."${supabaseTableName}" ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN NOT NULL DEFAULT FALSE`
      });

      if (pendingColErr) {
        console.warn("Could not add pending_deletion column (may already exist):", pendingColErr);
      } else {
        console.log("✅ Ensured pending_deletion column exists");
      }

      // Add pending_deletion_at column
      const { error: pendingAtColErr } = await supabaseAdmin.rpc('execute_sql', {
        sql_statement: `ALTER TABLE public."${supabaseTableName}" ADD COLUMN IF NOT EXISTS pending_deletion_at TIMESTAMPTZ NULL`
      });

      if (pendingAtColErr) {
        console.warn("Could not add pending_deletion_at column (may already exist):", pendingAtColErr);
      } else {
        console.log("✅ Ensured pending_deletion_at column exists");
      }

      // Create index for better performance
      const { error: indexErr } = await supabaseAdmin.rpc('execute_sql', {
        sql_statement: `CREATE INDEX IF NOT EXISTS "${supabaseTableName}_pending_deletion_idx" ON public."${supabaseTableName}" (pending_deletion)`
      });

      if (indexErr) {
        console.warn("Could not create index (may already exist):", indexErr);
      } else {
        console.log("✅ Ensured pending_deletion index exists");
      }

    } catch (e) {
      console.warn("Soft delete columns setup failed (may already exist):", e);
    }

    console.log(`✅ Fixed ${fixedNewCount || 0} records with incorrect new flags`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Flags de sincronização corrigidas com sucesso",
        stats: { 
          fixed_new_records: fixedNewCount || 0,
          latest_sync_id: latestSyncId 
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    console.error("💥 fix-protheus-flags error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});