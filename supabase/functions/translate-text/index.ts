import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRequest {
  text: string;
  context?: string;
  targetLanguage?: string;
}

function getContextualPrompt(context: string): string {
  const basePrompt = 'Translate the following text from Portuguese to English. Provide ONLY the direct translation without any quotes, explanations, prefixes, suffixes, or additional formatting.';
  
  switch (context) {
    case 'product_name':
      return basePrompt + ' This is a chemical/industrial product name. Keep technical terms accurate and use industry standard terminology.';
    case 'application':
      return basePrompt + ' This is a product application or use case. Focus on industry-specific terminology and keep it concise.';
    case 'compound_type':
      return basePrompt + ' This is a chemical compound type. Use precise chemical terminology.';
    case 'cas_note':
      return basePrompt + ' This is a note about CAS (Chemical Abstracts Service) information. Keep technical accuracy.';
    case 'family':
      return basePrompt + ' This is a product family name. Keep it professional and industry-appropriate.';
    case 'segment':
      return basePrompt + ' This is a market segment or product category. Use business/industry terminology.';
    case 'privacy_policy_html':
      return 'Translate the following HTML content from Portuguese to English. PRESERVE ALL HTML tags, attributes, and structure exactly as they are. Only translate the visible text content inside the tags. This is a privacy policy document (LGPD compliance) - use formal, clear legal language appropriate for privacy policies. Provide ONLY the translated HTML without any quotes, explanations, or additional formatting.';
    case 'html_content':
      return 'Translate the following HTML content from Portuguese to English. PRESERVE ALL HTML tags, attributes, and structure exactly as they are. Only translate the visible text content inside the tags. Provide ONLY the translated HTML without any quotes, explanations, or additional formatting.';
    default:
      return basePrompt;
  }
}

function splitHtmlIntoChunks(html: string, maxChunkSize: number = 3000): string[] {
  const chunks: string[] = [];
  
  // Split by major HTML sections while preserving structure
  const sections = html.split(/(<\/(?:h[1-6]|div|section|p|ul|ol|li)>)/gi);
  
  let currentChunk = '';
  
  for (const section of sections) {
    // If adding this section would exceed the limit and we have content, start new chunk
    if (currentChunk.length + section.length > maxChunkSize && currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      currentChunk = section;
    } else {
      currentChunk += section;
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  // If no good splits were found, fall back to simple character-based splitting
  if (chunks.length === 0 || chunks.some(chunk => chunk.length > maxChunkSize * 1.5)) {
    const fallbackChunks: string[] = [];
    let start = 0;
    
    while (start < html.length) {
      let end = start + maxChunkSize;
      
      // Try to find a good breaking point (space, tag boundary)
      if (end < html.length) {
        const spaceIndex = html.lastIndexOf(' ', end);
        const tagIndex = html.lastIndexOf('>', end);
        end = Math.max(spaceIndex, tagIndex, start + maxChunkSize / 2);
      }
      
      fallbackChunks.push(html.substring(start, end));
      start = end;
    }
    
    return fallbackChunks;
  }
  
  return chunks;
}

async function translateHtmlChunks(chunks: string[], prompt: string, openAIApiKey: string): Promise<string> {
  const translatedChunks: string[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Translating chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: prompt
            },
            {
              role: 'user',
              content: chunk.trim()
            }
          ],
          max_tokens: 4000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`OpenAI API error for chunk ${i + 1}:`, response.status, errorData);
        throw new Error(`Translation failed for chunk ${i + 1}`);
      }

      const data = await response.json();
      const translation = data?.choices?.[0]?.message?.content;
      const finishReason = data?.choices?.[0]?.finish_reason;
      
      if (finishReason === 'length') {
        console.warn(`Chunk ${i + 1} was truncated due to max_tokens limit`);
      }

      if (!translation) {
        throw new Error(`No translation received for chunk ${i + 1}`);
      }

      // Clean up the translation
      const cleanTranslation = translation.replace(/^["']|["']$/g, '').trim();
      translatedChunks.push(cleanTranslation);
      
      console.log(`Chunk ${i + 1} translated successfully (${cleanTranslation.length} chars)`);
      
      // Small delay to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`Error translating chunk ${i + 1}:`, error);
      throw error;
    }
  }
  
  return translatedChunks.join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { text, context = 'general', targetLanguage = 'english' }: TranslationRequest = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required and must be a string' }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const prompt = getContextualPrompt(context);

    console.log(`Translating "${text.substring(0, 100)}..." with context "${context}"`);

    let translation: string;

    // Handle long HTML content with chunking
    if (context === 'privacy_policy_html' || context === 'html_content') {
      const textLength = text.length;
      console.log(`HTML content length: ${textLength} characters`);
      
      if (textLength > 3000) {
        console.log('Using chunked translation for long HTML content');
        const chunks = splitHtmlIntoChunks(text, 3000);
        console.log(`Split into ${chunks.length} chunks`);
        
        translation = await translateHtmlChunks(chunks, prompt, openAIApiKey);
      } else {
        // Single request for shorter content
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: prompt
              },
              {
                role: 'user',
                content: text.trim()
              }
            ],
            max_tokens: 4000,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('OpenAI API error:', response.status, errorData);
          return new Response(
            JSON.stringify({ error: 'Translation service temporarily unavailable' }), 
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const data = await response.json();
        translation = data?.choices?.[0]?.message?.content;
        const finishReason = data?.choices?.[0]?.finish_reason;
        
        if (finishReason === 'length') {
          console.warn('Translation was truncated due to max_tokens limit');
        }
      }
    } else {
      // Standard translation for non-HTML content
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: prompt
            },
            {
              role: 'user',
              content: text.trim()
            }
          ],
          max_tokens: 200,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error:', response.status, errorData);
        return new Response(
          JSON.stringify({ error: 'Translation service temporarily unavailable' }), 
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const data = await response.json();
      translation = data?.choices?.[0]?.message?.content;
    }

    if (!translation) {
      throw new Error('No translation received from OpenAI');
    }

    // Remove quotes if present
    translation = translation.replace(/^["']|["']$/g, '').trim();

    console.log(`Translation successful: ${translation.length} characters generated`);

    return new Response(JSON.stringify({
      translation,
      originalText: text,
      context,
      targetLanguage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in translate-text function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error during translation' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});