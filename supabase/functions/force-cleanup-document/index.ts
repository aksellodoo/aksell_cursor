import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { getErrorMessage } from '../_shared/errorUtils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { document_id } = await req.json();
    
    if (!document_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'document_id is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`🚨 Force cleanup requested for document: ${document_id}`)
    
    // Verificar se documento existe e seu status atual
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, name, status, chunk_count')
      .eq('id', document_id)
      .single()

    if (docError || !document) {
      console.error(`❌ Document not found: ${docError?.message}`)
      return new Response(JSON.stringify({
        success: false,
        error: 'Document not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`📋 Document found: ${document.name} (status: ${document.status})`)

    // Verificar se existem chunks verbatim para este documento
    const { data: chunks, error: chunkError } = await supabase
      .from('doc_chunks')
      .select('id, embedding_type')
      .eq('document_id', document_id)
      .limit(10)

    if (chunkError) {
      console.error(`❌ Error checking chunks: ${chunkError.message}`)
    }

    const verbatimChunks = chunks?.filter(chunk => chunk.embedding_type === 'verbatim') || []
    const hasVerbatimChunks = verbatimChunks.length > 0

    console.log(`📊 Found ${chunks?.length || 0} total chunks, ${verbatimChunks.length} verbatim chunks`)

    let newStatus = 'Rejeitado'
    let errorMessage: string | null = 'Processamento forçado a parar pelo usuário'

    if (hasVerbatimChunks) {
      newStatus = 'Aprovado'
      errorMessage = null
      console.log(`✅ Document has verbatim chunks - will mark as Aprovado`)
    } else {
      console.log(`❌ Document has no verbatim chunks - will mark as Rejeitado`)
    }

    // Atualizar status do documento
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        status: newStatus,
        processing_status: 'completed',
        updated_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
        error_message: errorMessage,
        chunk_count: chunks?.length || 0
      })
      .eq('id', document_id)

    if (updateError) {
      console.error(`❌ Failed to update document: ${getErrorMessage(updateError)}`)
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to update document: ${getErrorMessage(updateError)}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`✅ Force cleanup completed: Document ${document.name} updated to ${newStatus}`)

    return new Response(JSON.stringify({
      success: true,
      message: `Document force-cleaned successfully`,
      document: {
        id: document_id,
        name: document.name,
        old_status: document.status,
        new_status: newStatus,
        chunks_found: chunks?.length || 0,
        verbatim_chunks: verbatimChunks.length,
        has_content: hasVerbatimChunks
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Error in force cleanup:', error)
    return new Response(JSON.stringify({
      success: false,
      error: getErrorMessage(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})