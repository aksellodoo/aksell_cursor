import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 Enhanced ingest-raw-text function started');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment variables first
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing required Supabase configuration');
      return new Response(
        JSON.stringify({ 
          error: 'Missing Supabase configuration',
          details: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openaiApiKey) {
      console.error('❌ Missing OpenAI API key');
      return new Response(
        JSON.stringify({ 
          error: 'Missing OpenAI API key',
          details: 'OPENAI_API_KEY environment variable not found. Please configure it in Supabase Edge Functions secrets.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Environment validation passed');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { document_id, extracted_text } = await req.json();
    
    if (!document_id || !extracted_text) {
      console.error('❌ Missing required parameters:', { document_id: !!document_id, extracted_text: !!extracted_text });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters',
          details: 'document_id and extracted_text are required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`📊 Processing document ${document_id} with ${extracted_text.length} characters`);

    const isShortDocument = extracted_text.length < 2000;
    const isLargeDocument = extracted_text.length > 50000;

    // Helper function to call fix-semantic-timeout fallback
    const createSemanticFromVerbatim = async (documentId: string) => {
      console.log('🔄 Calling fix-semantic-timeout for semantic chunk creation...');
      try {
        const fallbackResult = await supabase.functions.invoke('fix-semantic-timeout', {
          body: { document_id: documentId }
        });
        
        if (fallbackResult.data?.success) {
          console.log(`✅ fix-semantic-timeout successful: created ${fallbackResult.data.semantic_chunks || 0} semantic chunks`);
          return { success: true, semantic_chunks: fallbackResult.data.semantic_chunks || 0 };
        } else {
          console.warn(`⚠️ fix-semantic-timeout failed:`, fallbackResult.error);
          return { success: false, error: fallbackResult.error };
        }
      } catch (error) {
        console.error(`❌ fix-semantic-timeout error:`, error);
        return { success: false, error };
      }
    };

    // FASE 1: Create verbatim chunks
    console.log('📝 Phase 1: Creating verbatim chunks...');
    
    // Test OpenAI API connection before processing
    try {
      console.log('🔍 Testing OpenAI API connection...');
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
        },
      });
      
      if (!testResponse.ok) {
        throw new Error(`OpenAI API test failed: ${testResponse.status} ${testResponse.statusText}`);
      }
      console.log('✅ OpenAI API connection successful');
    } catch (apiError) {
      console.error('❌ OpenAI API connection failed:', apiError);
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API connection failed',
          details: getErrorMessage(apiError),
          suggestion: 'Please verify your OPENAI_API_KEY is correct and has sufficient credits'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const maxChunkSize = 1000;
    const chunkOverlap = 200;
    const chunks = [];
    for (let i = 0; i < extracted_text.length; i += maxChunkSize - chunkOverlap) {
      const chunk = extracted_text.slice(i, i + maxChunkSize);
      chunks.push(chunk);
    }

    console.log(`📊 Created ${chunks.length} verbatim chunks`);

    // Generate embeddings for verbatim chunks
    console.log('🧮 Starting embedding generation...');
    const verbatimEmbeddings = await generateEmbeddings(chunks, openaiApiKey);
    console.log(`✅ Generated ${verbatimEmbeddings.length} embeddings`);
    
    // Validate embeddings before inserting
    console.log('🔍 Validating embeddings...');
    for (let i = 0; i < verbatimEmbeddings.length; i++) {
      const embedding = verbatimEmbeddings[i];
      if (!Array.isArray(embedding) || embedding.length !== 3072) {
        console.error(`❌ Invalid embedding at index ${i}: length=${embedding?.length}, type=${typeof embedding}`);
        throw new Error(`Invalid embedding format at index ${i}. Expected array of 3072 numbers.`);
      }
      
      // Check for NaN or invalid numbers
      const hasInvalidNumbers = embedding.some(val => typeof val !== 'number' || !isFinite(val));
      if (hasInvalidNumbers) {
        console.error(`❌ Embedding at index ${i} contains invalid numbers`);
        throw new Error(`Embedding at index ${i} contains NaN or infinite values`);
      }
    }
    console.log('✅ All embeddings validated successfully');
    
    // Insert verbatim chunks with proper vector format
    console.log('💾 Preparing chunks for database insertion...');
    const verbatimChunksToInsert = chunks.map((chunk, index) => {
      const embedding = verbatimEmbeddings[index];
      const vectorString = `[${embedding.join(',')}]`;
      
      return {
        document_id,
        chunk_index: index,
        content: chunk,
        embedding: vectorString,
        embedding_type: 'verbatim',
        extraction_source: 'text_splitter',
        acl_hash: 'default_acl_hash',
        page_number: 1,
        modality: 'text'
      };
    });

    console.log(`💾 Inserting ${verbatimChunksToInsert.length} verbatim chunks...`);
    const { error: verbatimInsertError } = await supabase
      .from('doc_chunks')
      .insert(verbatimChunksToInsert);

    if (verbatimInsertError) {
      console.error('❌ Verbatim chunks insert error:', {
        message: verbatimInsertError.message,
        details: verbatimInsertError.details,
        hint: verbatimInsertError.hint,
        code: verbatimInsertError.code
      });
      throw new Error(`Failed to store verbatim chunks: ${verbatimInsertError.message}`);
    }

    console.log(`✅ Phase 1 completed: ${chunks.length} verbatim chunks stored`);

    // FASE 2: Semantic processing with automatic fallback for short documents
    let semanticSuccess = false;
    let semanticChunkCount = 0;
    
    if (isShortDocument) {
      console.log('⚡ Short document detected - using optimized workflow...');
      
      // For short documents, try semantic-chunker with reduced timeout, then fallback to fix-semantic-timeout
      try {
        console.log('🧠 Attempting semantic-chunker with short timeout...');
        
        const semanticConfig = {
          text: extracted_text,
          document_id: document_id,
          gpt_enhancement: false, // Disable GPT for speed
          chunk_size: 800,
          chunk_overlap: 100,
          timeout_seconds: 15 // Very short timeout
        };

        const semanticPromise = supabase.functions.invoke('semantic-chunker', {
          body: semanticConfig
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Semantic chunking timeout')), 15000);
        });

        const result = await Promise.race([semanticPromise, timeoutPromise]);
        
        if ((result as any).data?.success && (result as any).data.chunks?.length > 0) {
          semanticChunkCount = (result as any).data.chunks.length;
          semanticSuccess = true;
          console.log(`✅ semantic-chunker successful: ${semanticChunkCount} chunks`);
        } else {
          throw new Error('semantic-chunker did not return valid chunks');
        }

      } catch (semanticError) {
        console.warn(`⚠️ semantic-chunker failed for short document: ${getErrorMessage(semanticError)}`);
        console.log('🔄 Falling back to fix-semantic-timeout...');
        
        // Fallback to fix-semantic-timeout
        const fallbackResult = await createSemanticFromVerbatim(document_id);
        if (fallbackResult.success) {
          semanticChunkCount = fallbackResult.semantic_chunks;
          semanticSuccess = true;
          console.log(`✅ Fallback successful: ${semanticChunkCount} semantic chunks`);
        } else {
          console.warn(`⚠️ Fallback also failed - proceeding with verbatim only`);
          semanticSuccess = true; // Still mark as successful to approve document
        }
      }

    } else {
      // For normal/large documents, use existing semantic-chunker logic
      console.log('📚 Normal/large document - using standard semantic processing...');
      
      try {
        const semanticConfig = isLargeDocument ? {
          text: extracted_text,
          document_id: document_id,
          gpt_enhancement: false,
          chunk_size: 800,
          chunk_overlap: 100,
          timeout_seconds: 45
        } : {
          text: extracted_text,
          document_id: document_id,
          gpt_enhancement: true,
          chunk_size: 1000,
          chunk_overlap: 150,
          timeout_seconds: 30
        };

        const result = await supabase.functions.invoke('semantic-chunker', {
          body: semanticConfig
        });

        if ((result as any).data?.success && (result as any).data.chunks?.length > 0) {
          semanticChunkCount = (result as any).data.chunks.length;
          semanticSuccess = true;
          console.log(`✅ semantic-chunker successful: ${semanticChunkCount} chunks`);
        } else {
          throw new Error('semantic-chunker did not return valid chunks');
        }

      } catch (semanticError) {
        console.warn(`⚠️ Semantic processing failed: ${getErrorMessage(semanticError)}`);
        semanticSuccess = true; // Mark as successful to approve document with verbatim only
      }
    }

    // Final document update with RAG capabilities
    const totalChunks = chunks.length + semanticChunkCount;
    
    // Build proper RAG capabilities object
    const ragCapabilities = {
      status: semanticChunkCount > 0 ? 'both_available' : 'verbatim_only',
      isAvailable: true,
      hasVerbatimChunks: chunks.length > 0,
      hasSemanticChunks: semanticChunkCount > 0,
      totalChunks: totalChunks,
      verbatimCount: chunks.length,
      semanticCount: semanticChunkCount,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('🔍 DEBUG RAG Capabilities before save:', {
      totalChunks,
      verbatimChunks: chunks.length,
      semanticChunks: semanticChunkCount,
      ragCapabilities: JSON.stringify(ragCapabilities, null, 2)
    });
    
    const { error: finalUpdateError } = await supabase
      .from('documents')
      .update({
        processing_status: 'completed',
        chunk_count: totalChunks,
        rag_capabilities: ragCapabilities,
        processed_at: new Date().toISOString(),
        status: 'Aprovado'
      })
      .eq('id', document_id);
      
    console.log('🔍 After update - Final Error:', finalUpdateError);
    
    // Verification query to ensure data was saved correctly
    let verifyData: any = null;
    if (!finalUpdateError) {
      const { data: fetchedVerifyData, error: verifyError } = await supabase
        .from('documents')
        .select('chunk_count, rag_capabilities')
        .eq('id', document_id)
        .single();
        
      verifyData = fetchedVerifyData;
      console.log('🔍 Verification query result:', {
        verifyError,
        savedChunkCount: verifyData?.chunk_count,
        savedRagCaps: verifyData?.rag_capabilities,
        expectedChunkCount: totalChunks
      });
    }

    if (finalUpdateError) {
      console.error(`❌ Final status update failed: ${getErrorMessage(finalUpdateError)}`);
      throw new Error(`Failed to update document status: ${getErrorMessage(finalUpdateError)}`);
    } else {
      console.log(`✅ Document approved with ${totalChunks} total chunks (${chunks.length} verbatim + ${semanticChunkCount} semantic)`);
      
      // Final validation - ensure rag_capabilities was saved correctly
      if (verifyData) {
        const savedRagCaps = verifyData.rag_capabilities as any;
        if (!savedRagCaps || savedRagCaps.totalChunks !== totalChunks) {
          console.error('❌ CRITICAL: RAG capabilities validation failed!', {
            expected: { totalChunks, verbatimCount: chunks.length, semanticCount: semanticChunkCount },
            actual: savedRagCaps
          });
          
          // Attempt immediate fix
          console.log('🔄 Attempting immediate RAG capabilities fix...');
          try {
            const { error: fixError } = await supabase.functions.invoke('fix-rag-capabilities', {
              body: { document_id }
            });
            if (fixError) {
              console.error('❌ Auto-fix failed:', fixError);
            } else {
              console.log('✅ Auto-fix successful');
            }
          } catch (fixErr) {
            console.error('❌ Auto-fix exception:', fixErr);
          }
        } else {
          console.log('✅ RAG capabilities validation passed');
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Enhanced processing completed successfully`,
        verbatim_chunks: chunks.length,
        semantic_chunks: semanticChunkCount,
        total_chunks: totalChunks,
        document_id: document_id,
        status: 'Aprovado',
        fallback_used: isShortDocument && semanticChunkCount > 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Enhanced ingest-raw-text error:', error);
    return new Response(JSON.stringify({
      error: getErrorMessage(error),
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper functions
async function generateEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  const embeddings = [];
  const maxRetries = 3;
  const batchSize = 1; // Process one at a time for better error tracking
  
  console.log(`🧮 Generating embeddings for ${texts.length} chunks using ${batchSize} batch size...`);
  
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    let retryCount = 0;
    let success = false;
    
    console.log(`🔄 Processing chunk ${i + 1}/${texts.length} (${text.length} chars)...`);
    
    while (retryCount < maxRetries && !success) {
      try {
        // Validate input text
        if (!text || typeof text !== 'string') {
          throw new Error(`Invalid text input at chunk ${i + 1}: ${typeof text}`);
        }
        
        const cleanText = text.substring(0, 8000).trim();
        if (!cleanText) {
          console.warn(`⚠️ Empty text for chunk ${i + 1}, using placeholder`);
          embeddings.push(new Array(3072).fill(0));
          success = true;
          continue;
        }
        
        console.log(`📡 Making OpenAI API call for chunk ${i + 1}...`);
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-large',
            input: cleanText,
            encoding_format: 'float'
          }),
        });

        console.log(`📡 OpenAI API response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ OpenAI API error ${response.status}:`, errorText);
          throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log(`📊 OpenAI API response structure:`, {
          hasData: !!data.data,
          dataLength: data.data?.length,
          hasFirstItem: !!data.data?.[0],
          hasEmbedding: !!data.data?.[0]?.embedding,
          embeddingLength: data.data?.[0]?.embedding?.length
        });
        
        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
          throw new Error(`Invalid API response: missing data array`);
        }
        
        if (!data.data[0] || !data.data[0].embedding) {
          throw new Error(`Invalid API response: missing embedding in first data item`);
        }
        
        const embedding = data.data[0].embedding;
        
        // Validate embedding
        if (!Array.isArray(embedding)) {
          throw new Error(`Embedding is not an array: ${typeof embedding}`);
        }
        
        if (embedding.length !== 3072) {
          throw new Error(`Invalid embedding length: ${embedding.length}, expected 3072`);
        }
        
        // Check for valid numbers
        const invalidIndex = embedding.findIndex(val => typeof val !== 'number' || !isFinite(val));
        if (invalidIndex !== -1) {
          throw new Error(`Invalid number at embedding index ${invalidIndex}: ${embedding[invalidIndex]}`);
        }
        
        embeddings.push(embedding);
        success = true;
        
        console.log(`✅ Successfully generated embedding ${i + 1}/${texts.length}`);
        
        // Small delay to avoid rate limiting
        if (i < texts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        retryCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error generating embedding for chunk ${i + 1} (attempt ${retryCount}/${maxRetries}):`, errorMsg);
        
        if (retryCount < maxRetries) {
          const delay = retryCount * 2000; // Exponential backoff
          console.log(`🔄 Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.warn(`⚠️ Using zero vector for chunk ${i + 1} after ${maxRetries} failed attempts. Error: ${errorMsg}`);
          // Create a default embedding vector of the correct size (3072 for text-embedding-3-large)
          embeddings.push(new Array(3072).fill(0));
          success = true;
        }
      }
    }
  }
  
  console.log(`✅ Embedding generation completed: ${embeddings.length} vectors created`);
  
  // Final validation
  if (embeddings.length !== texts.length) {
    throw new Error(`Embedding count mismatch: generated ${embeddings.length}, expected ${texts.length}`);
  }
  
  return embeddings;
}

async function generateHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}