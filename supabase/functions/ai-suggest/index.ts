
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getErrorMessage } from '../_shared/errorUtils.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('AI Suggest function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { sourceValues, task, instructions, outputType = 'text', context } = await req.json();
    console.log('Request data:', { task, outputType, hasContext: !!context });

    // Enhanced system prompt for corporate naming
    let systemPrompt = `Você é um especialista em análise empresarial e identificação de marcas corporativas.`;
    
    switch (task) {
      case 'extract':
        systemPrompt += ` Sua especialidade é extrair nomes de marcas e razões sociais principais a partir de dados de unidades empresariais, evitando nomes genéricos.`;
        break;
      default:
        systemPrompt += ` Sua tarefa é ${task} baseado nos dados fornecidos seguindo as instruções específicas.`;
    }

    systemPrompt += ` Seja preciso, profissional e focado na identificação da marca principal.`;

    const userPrompt = `${instructions}

Dados fornecidos:
${JSON.stringify(sourceValues, null, 2)}

${context ? `Contexto adicional: ${JSON.stringify(context, null, 2)}` : ''}

${outputType === 'json' ? `
Responda EXCLUSIVAMENTE com um JSON válido no formato:
{
  "suggestion": "Nome da marca/empresa principal",
  "confidence": 0.95,
  "reasoning": "Explicação breve da escolha"
}

IMPORTANTE: 
- suggestion: Nome limpo e profissional (máximo 3 palavras)
- confidence: Número entre 0.1 e 1.0
- reasoning: Explicação em 1-2 frases
` : 'Responda apenas com o nome da marca/empresa principal.'}`;

    console.log('Sending request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: outputType === 'json' ? 300 : 150,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received, tokens used:', data.usage?.total_tokens);
    
    const suggestion = data.choices[0]?.message?.content?.trim() || '';

    // Handle JSON output
    if (outputType === 'json') {
      try {
        const jsonResponse = JSON.parse(suggestion);
        console.log('Parsed JSON response:', jsonResponse);
        
        return new Response(JSON.stringify({
          suggestion: jsonResponse.suggestion || suggestion,
          confidence: jsonResponse.confidence || 0.8,
          reasoning: jsonResponse.reasoning || 'Análise baseada nos dados fornecidos',
          tokensUsed: data.usage?.total_tokens || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.log('Failed to parse JSON, using fallback');
        return new Response(JSON.stringify({
          suggestion: suggestion,
          confidence: 0.7,
          reasoning: 'Sugestão gerada com base na análise dos dados',
          tokensUsed: data.usage?.total_tokens || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle text output
    return new Response(JSON.stringify({
      suggestion,
      confidence: 0.85,
      reasoning: 'Análise baseada nos dados empresariais fornecidos',
      tokensUsed: data.usage?.total_tokens || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-suggest function:', error);
    return new Response(JSON.stringify({ 
      error: getErrorMessage(error),
      suggestion: '',
      confidence: 0,
      reasoning: 'Erro durante o processamento',
      tokensUsed: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
