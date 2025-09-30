import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ResetMfaRequest {
  target_user_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Atualizado: aceitar SERVICE_ROLE_KEY (preferencial), SERVICE_ROLE ou SUPABASE_SERVICE_ROLE_KEY
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const SERVICE_ROLE_KEY =
    Deno.env.get("SERVICE_ROLE_KEY") ??
    Deno.env.get("SERVICE_ROLE") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    "";

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "Supabase secrets missing. Configure SUPABASE_URL, SUPABASE_ANON_KEY e SERVICE_ROLE_KEY (ou SERVICE_ROLE).",
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body: ResetMfaRequest = await req.json().catch(() => ({ target_user_id: "" } as any));
    const targetUserId = body?.target_user_id?.trim();
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "target_user_id é obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check caller role
    const { data: callerProfile, error: profErr } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("id", userData.user.id)
      .single();

    if (profErr || !callerProfile || !(callerProfile.role === "admin" || callerProfile.role === "director")) {
      return new Response(JSON.stringify({ error: "Permissão negada" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // List factors for the target user (admin API)
    // Note: requires supabase-js >= 2.42 with admin MFA methods
    let factors: any[] = [];
    try {
      // @ts-ignore - admin.mfa methods may not have TS types in older versions
      const { data: listRes, error: listErr } = await (serviceClient as any).auth.admin.mfa.listFactors({ user_id: targetUserId });
      if (listErr) throw listErr;
      const all = (listRes as any)?.all ?? (listRes as any)?.factors ?? [];
      const totpList = (listRes as any)?.totp ?? all.filter((f: any) => f.factor_type === "totp");
      factors = Array.isArray(totpList) ? totpList : [];
    } catch (e) {
      console.error("Erro ao listar fatores MFA (admin):", e);
      return new Response(JSON.stringify({ error: "Falha ao listar fatores MFA. Verifique versão do supabase-js." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let removed = 0;
    for (const f of factors) {
      try {
        // @ts-ignore - admin.mfa methods may not have TS types in older versions
        const { error: delErr } = await (serviceClient as any).auth.admin.mfa.deleteFactor(f.id);
        if (delErr) {
          console.error("Erro ao deletar fator:", delErr);
        } else {
          removed += 1;
        }
      } catch (e) {
        console.error("Exceção ao deletar fator:", e);
      }
    }

    // Update profile flags
    const { error: upErr } = await serviceClient
      .from("profiles")
      .update({ mfa_required: false, mfa_enforced_at: null, mfa_last_verified_at: null })
      .eq("id", targetUserId);

    if (upErr) {
      console.warn("Falha ao atualizar flags de perfil após reset MFA:", upErr);
    }

    // Audit log
    await serviceClient
      .from("field_audit_log")
      .insert({
        record_id: targetUserId,
        field_name: "mfa_reset",
        old_value: "enabled",
        new_value: "disabled",
        changed_by: userData.user.id,
        record_type: "user",
      });

    return new Response(JSON.stringify({ success: true, removed_factors: removed }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("admin-reset-mfa error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
