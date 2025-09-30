import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentRecord {
  id: string;
  description: string;
  expiry_date: string;
  notify_before_expiry: string;
  notify_users: string[] | null;
  notify_department_id: string | null;
  record_type: string;
  record_id: string;
  uploader_name: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting document expiry check...');

    // Call the database function to check for expiring documents
    const { error: functionError } = await supabase.rpc('check_document_expiry_notifications');

    if (functionError) {
      console.error('Error calling check_document_expiry_notifications:', functionError);
      throw functionError;
    }

    console.log('Document expiry check completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document expiry notifications processed successfully' 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in check-document-expiry function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error) || 'Internal server error',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
});