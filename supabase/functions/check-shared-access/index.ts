import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recordType, recordId } = await req.json();

    if (!recordType || !recordId) {
      throw new Error('recordType and recordId are required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Set the auth header for the supabase client
    supabase.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: ''
    });

    console.log(`🔍 Checking shared access for ${recordType}:${recordId}`);

    // Use the RPC function to check access
    const { data: hasAccess, error } = await supabase.rpc('check_shared_record_access', {
      p_record_type: recordType,
      p_record_id: recordId,
      p_user_id: (await supabase.auth.getUser()).data.user?.id
    });

    if (error) {
      console.error('❌ Error checking shared access:', error);
      throw error;
    }

    console.log(`✅ Access check result: ${hasAccess}`);

    return new Response(
      JSON.stringify({
        hasAccess: Boolean(hasAccess),
        recordType,
        recordId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Shared access check failed:', error);
    
    return new Response(
      JSON.stringify({
        hasAccess: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});