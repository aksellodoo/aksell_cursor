
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function randomState(length = 32) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

interface StartBody {
  redirectUri: string;
  scopes?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MS_TENANT_ID = Deno.env.get("MS_TENANT_ID");
    const MS_CLIENT_ID = Deno.env.get("MS_CLIENT_ID");

    if (!MS_TENANT_ID || !MS_CLIENT_ID) {
      return new Response(
        JSON.stringify({ error: "Microsoft secrets not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { redirectUri, scopes }: StartBody = await req.json();
    if (!redirectUri) {
      return new Response(
        JSON.stringify({ error: "redirectUri is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const state = randomState(40);
    const scope =
      (scopes && scopes.length ? scopes : [
        "openid",
        "profile",
        "email",
        "offline_access",
        "User.Read",
        "Mail.Read",
        "Mail.Send",
      ]).join(" ");

    const authUrl = new URL(`https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/authorize`);
    authUrl.searchParams.set("client_id", MS_CLIENT_ID);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("response_mode", "query");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("state", state);

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString(), state }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("ms-auth-start error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
