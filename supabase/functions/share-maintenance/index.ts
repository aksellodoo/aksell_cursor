import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { getErrorMessage } from '../_shared/errorUtils.ts';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Starting share maintenance job...');

    // Handle expired shares
    const { error: expiredError } = await supabase.rpc('handle_expired_shares');
    if (expiredError) {
      console.error('❌ Error handling expired shares:', expiredError);
      throw expiredError;
    }

    // Send expiring share notifications
    const { error: expiringError } = await supabase.rpc('notify_expiring_shares');
    if (expiringError) {
      console.error('❌ Error notifying about expiring shares:', expiringError);
      throw expiringError;
    }

    console.log('✅ Share maintenance job completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Share maintenance completed',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Share maintenance job failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: getErrorMessage(error),
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});