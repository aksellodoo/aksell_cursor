import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { getErrorMessage } from '../_shared/errorUtils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🧹 Cleaning up stuck documents...');

    // Update stuck document to rejected status
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'Rejeitado',
        updated_at: new Date().toISOString(),
        error_message: 'Timeout no processamento OCR - documento foi limpo automaticamente'
      })
      .eq('id', '05710d62-49f6-47a8-a228-9adec26d0c2f');

    if (updateError) {
      console.error('❌ Error updating document:', updateError);
      throw updateError;
    }

    console.log('✅ Document status updated to rejected');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Documento travado foi limpo com sucesso' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: getErrorMessage(error) 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});