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

    console.log('🧹 Starting document cleanup...');

    // Get request body if provided
    const body = await req.json().catch(() => ({}));
    const documentId = body.document_id;

    if (documentId) {
      // Clean specific document
      console.log(`🎯 Cleaning specific document: ${documentId}`);
      
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          status: 'Rejeitado',
          updated_at: new Date().toISOString(),
          error_message: 'Documento limpo devido a problemas de processamento'
        })
        .eq('id', documentId);

      if (updateError) {
        console.error('❌ Error updating document:', updateError);
        throw updateError;
      }

      console.log(`✅ Document ${documentId} cleaned successfully`);
    } else {
      // Clean all stuck documents (processing for more than 10 minutes)
      console.log('🔍 Looking for stuck documents...');
      
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data: stuckDocs, error: findError } = await supabase
        .from('documents')
        .select('id, name, created_at')
        .eq('status', 'Processando')
        .lt('created_at', tenMinutesAgo);

      if (findError) {
        console.error('❌ Error finding stuck documents:', findError);
        throw findError;
      }

      if (stuckDocs && stuckDocs.length > 0) {
        console.log(`🚨 Found ${stuckDocs.length} stuck documents`);
        
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            status: 'Rejeitado',
            updated_at: new Date().toISOString(),
            error_message: 'Timeout no processamento - documento foi limpo automaticamente'
          })
          .eq('status', 'Processando')
          .lt('created_at', tenMinutesAgo);

        if (updateError) {
          console.error('❌ Error updating stuck documents:', updateError);
          throw updateError;
        }

        console.log(`✅ Cleaned ${stuckDocs.length} stuck documents`);
      } else {
        console.log('✅ No stuck documents found');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: documentId 
          ? `Documento ${documentId} foi limpo com sucesso`
          : 'Limpeza de documentos travados concluída'
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