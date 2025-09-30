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

    const { document_id, error_message, should_retry = false } = await req.json();

    console.log(`🚨 Handling processing error for document: ${document_id}`);
    console.log(`❌ Error: ${error_message}`);

    if (!document_id) {
      throw new Error('document_id is required');
    }

    // Atualizar status do documento
    const updateData: any = {
      updated_at: new Date().toISOString(),
      error_message: error_message || 'Erro no processamento OCR'
    };

    // Se devemos tentar novamente, manter como processando, senão rejeitar
    if (should_retry) {
      console.log('🔄 Marking for retry...');
      updateData.status = 'Processando';
      updateData.retry_count = supabase.rpc('increment', { field: 'retry_count' });
    } else {
      console.log('❌ Marking as rejected...');
      updateData.status = 'Rejeitado';
      
      // Se for erro de memória, adicionar dica para o usuário
      if (error_message?.includes('Memory limit') || error_message?.includes('timeout')) {
        updateData.error_message = 'Falha no processamento: arquivo muito grande. Tente reduzir o tamanho da imagem.';
      }
    }

    const { error: updateError } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', document_id);

    if (updateError) {
      console.error('❌ Error updating document status:', updateError);
      throw updateError;
    }

    // Se erro de memória, tentar fallback para Tesseract automaticamente
    if (error_message?.includes('Memory limit') && should_retry) {
      console.log('💾 Memory error detected, triggering Tesseract fallback...');
      
      try {
        const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke('tesseract-fallback', {
          body: { 
            document_id, 
            page_number: 1,
            reason: 'memory_limit_exceeded'
          }
        });

        if (fallbackError) {
          console.error('❌ Tesseract fallback failed:', fallbackError);
        } else {
          console.log('✅ Tesseract fallback triggered successfully');
        }
      } catch (fallbackErr) {
        console.error('❌ Exception during Tesseract fallback:', fallbackErr);
      }
    }

    console.log(`✅ Document ${document_id} error handling completed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Error handled successfully',
        document_id,
        action: should_retry ? 'marked_for_retry' : 'marked_as_rejected'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error handling processing error:', error);
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