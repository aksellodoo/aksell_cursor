import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRequest {
  texts: Array<{
    text: string;
    context: string;
    targetField: string;
  }>;
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
    default:
      return basePrompt;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { texts }: TranslationRequest = await req.json();
    
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Invalid request: texts array is required');
    }

    console.log(`Starting batch translation for ${texts.length} texts`);

    const translations = [];

    // Process translations with rate limiting (one at a time to avoid API limits)
    for (const item of texts) {
      const { text, context, targetField } = item;
      
      if (!text?.trim()) {
        translations.push({
          targetField,
          translation: '',
          originalText: text,
          context,
          success: true
        });
        continue;
      }

      try {
        const prompt = getContextualPrompt(context);
        
        console.log(`Translating "${text}" with context "${context}" for field "${targetField}"`);

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
                content: text
              }
            ],
            max_tokens: 200,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        let translation = data?.choices?.[0]?.message?.content;
        
        if (!translation) {
          throw new Error('No translation received from OpenAI');
        }

        // Remove quotes if present
        translation = translation.replace(/^["']|["']$/g, '').trim();

        console.log(`Translation successful: "${text}" -> "${translation}"`);

        translations.push({
          targetField,
          translation,
          originalText: text,
          context,
          success: true
        });

        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Translation failed for "${text}":`, error);
        translations.push({
          targetField,
          translation: '',
          originalText: text,
          context,
          success: false,
          error: getErrorMessage(error)
        });
      }
    }

    console.log(`Batch translation completed. ${translations.filter(t => t.success).length}/${texts.length} successful`);

    return new Response(JSON.stringify({
      translations,
      total: texts.length,
      successful: translations.filter(t => t.success).length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in translate-batch function:', error);
    return new Response(JSON.stringify({ 
      error: getErrorMessage(error),
      translations: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});