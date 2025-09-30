
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExchangeBody {
  code: string;
  redirectUri: string;
  state?: string;
}

const formEncode = (data: Record<string, string>) =>
  Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const MS_TENANT_ID = Deno.env.get("MS_TENANT_ID");
  const MS_CLIENT_ID = Deno.env.get("MS_CLIENT_ID");
  const MS_CLIENT_SECRET = Deno.env.get("MS_CLIENT_SECRET");

  try {
    if (!MS_TENANT_ID || !MS_CLIENT_ID || !MS_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: "Microsoft secrets not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body: ExchangeBody = await req.json();
    if (!body.code || !body.redirectUri) {
      return new Response(
        JSON.stringify({ error: "code and redirectUri are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Exchange code for tokens
    const tokenEndpoint = `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`;
    const tokenRes = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formEncode({
        client_id: MS_CLIENT_ID,
        client_secret: MS_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: body.code,
        redirect_uri: body.redirectUri,
      }),
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Token exchange error:", tokenJson);
      return new Response(
        JSON.stringify({ error: "Failed to exchange code for token", details: tokenJson }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const access_token: string = tokenJson.access_token;
    const refresh_token: string = tokenJson.refresh_token;
    const expires_in: number = tokenJson.expires_in;
    const token_type: string = tokenJson.token_type;
    const scope: string = tokenJson.scope;

    const expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

    // Fetch Microsoft profile
    const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const me = await meRes.json();
    if (!meRes.ok) {
      console.error("Graph /me error:", me);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Microsoft profile", details: me }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const ms_account_id = me.id as string;
    const display_name = me.displayName as string;
    const email = (me.mail || me.userPrincipalName) as string;

    // Check if Microsoft account already exists (by ms_account_id only)
    console.log("Checking for existing Microsoft account with ID:", ms_account_id);
    const { data: existingByMsId, error: findMsErr } = await supabase
      .from("microsoft_accounts")
      .select("*")
      .eq("ms_account_id", ms_account_id)
      .limit(1);

    if (findMsErr) {
      console.error("Find account by ms_account_id error:", findMsErr);
      return new Response(
        JSON.stringify({ error: "Failed to query microsoft_accounts" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if current user already has a Microsoft account
    const { data: existingByUserId, error: findUserErr } = await supabase
      .from("microsoft_accounts")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

    if (findUserErr) {
      console.error("Find account by user_id error:", findUserErr);
      return new Response(
        JSON.stringify({ error: "Failed to query user's microsoft_accounts" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let accountId: string | null = null;

    // Scenario 1: Microsoft account exists and belongs to current user
    if (existingByMsId && existingByMsId.length > 0 && existingByMsId[0].user_id === user.id) {
      console.log("Microsoft account exists and belongs to current user - updating");
      accountId = existingByMsId[0].id;
      const { error: updAccErr } = await supabase
        .from("microsoft_accounts")
        .update({
          display_name,
          email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", accountId);
      if (updAccErr) {
        console.error("Update account error:", updAccErr);
      }
    }
    // Scenario 2: Microsoft account exists but belongs to different user
    else if (existingByMsId && existingByMsId.length > 0 && existingByMsId[0].user_id !== user.id) {
      console.log("Microsoft account exists but belongs to different user");
      return new Response(
        JSON.stringify({ 
          error: "Microsoft account is already connected to another user", 
          code: "ACCOUNT_ALREADY_LINKED",
          details: "This Microsoft account is already connected to a different user in the system"
        }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    // Scenario 3: Current user has different Microsoft account - replace it
    else if (existingByUserId && existingByUserId.length > 0) {
      console.log("User has existing Microsoft account - replacing with new one");
      
      // Delete old tokens first
      const { error: delOldTokErr } = await supabase
        .from("ms_oauth_tokens")
        .delete()
        .eq("microsoft_account_id", existingByUserId[0].id);
      if (delOldTokErr) {
        console.warn("Delete old tokens warning:", delOldTokErr);
      }

      // Update existing account with new Microsoft account details
      const { error: updAccErr } = await supabase
        .from("microsoft_accounts")
        .update({
          ms_account_id,
          display_name,
          email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingByUserId[0].id);
      
      if (updAccErr) {
        console.error("Update account error:", updAccErr);
        return new Response(
          JSON.stringify({ error: "Failed to update microsoft_account" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      accountId = existingByUserId[0].id;
    }
    // Scenario 4: New Microsoft account for new user
    else {
      console.log("Creating new Microsoft account for user");
      const { data: insAcc, error: insAccErr } = await supabase
        .from("microsoft_accounts")
        .insert({
          user_id: user.id,
          ms_account_id,
          display_name,
          email,
        })
        .select("id")
        .limit(1);
      if (insAccErr) {
        console.error("Insert account error:", insAccErr);
        return new Response(
          JSON.stringify({ error: "Failed to create microsoft_account" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      accountId = insAcc?.[0]?.id;
    }

    if (!accountId) {
      return new Response(
        JSON.stringify({ error: "Account not found/created" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Clean previous tokens for this account
    const { error: delTokErr } = await supabase
      .from("ms_oauth_tokens")
      .delete()
      .eq("microsoft_account_id", accountId);
    if (delTokErr) {
      console.warn("Delete old tokens warning:", delTokErr);
    }

    // Insert new tokens
    const { error: insTokErr } = await supabase
      .from("ms_oauth_tokens")
      .insert({
        microsoft_account_id: accountId,
        access_token,
        refresh_token,
        expires_at,
        token_type,
        scope,
      });
    if (insTokErr) {
      console.error("Insert tokens error:", insTokErr);
      return new Response(
        JSON.stringify({ error: "Failed to store tokens" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        account: { id: accountId, display_name, email, ms_account_id },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("ms-auth-exchange error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
