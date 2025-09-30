import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurado');
    }

    const { groupId } = await req.json();
    console.log('Suggesting name for group:', groupId);

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar membros do grupo usando RPC que já resolve nomes
    const { data: membersData, error: membersError } = await supabase.rpc('get_purchases_group_members', {
      p_id_grupo: groupId
    });

    if (membersError) {
      throw new Error(`Erro ao buscar membros: ${membersError.message}`);
    }

    // Verificar se há membros
    if (!membersData || membersData.length === 0) {
      console.log('No members found, returning fallback suggestion');
      return new Response(JSON.stringify({ 
        suggestedName: `Grupo ${groupId}`,
        supplierNames: [],
        warning: 'Grupo não possui membros para análise'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Found members:', membersData.length);

    // Coletar nomes dos fornecedores do campo display_name do RPC
    const supplierNames = [];

    for (const member of membersData) {
      if (member.display_name && member.display_name.trim()) {
        supplierNames.push(member.display_name.trim());
      }
    }

    // Remover duplicatas e nomes vazios
    const uniqueNames = [...new Set(supplierNames.filter(name => name && name.length > 0))];
    console.log('Unique supplier names collected:', uniqueNames);

    // Se não conseguiu coletar nomes válidos, retornar fallback
    if (uniqueNames.length === 0) {
      console.log('No valid names collected, returning fallback');
      return new Response(JSON.stringify({ 
        suggestedName: `Grupo ${groupId}`,
        supplierNames: uniqueNames,
        warning: 'Não foi possível coletar nomes válidos dos fornecedores'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Tentar gerar sugestão com OpenAI
    try {
      const prompt = `Baseado nos seguintes nomes de empresas fornecedoras, sugira um nome conciso para um grupo econômico de compras:

${uniqueNames.map(name => `- ${name}`).join('\n')}

INSTRUÇÕES:
- NÃO inclua a palavra "Grupo" na resposta
- Seja conciso e direto
- Use a marca/empresa principal se houver uma clara
- Se houver múltiplas empresas relacionadas, use o nome da marca/holding principal
- Responda apenas com o nome sugerido, sem explicações

Exemplos:
- Se for "Nestlé do Brasil", "Nestlé Foods", etc. → resposta: "Nestlé"
- Se for "Unilever Brasil", "Unilever Higiene" → resposta: "Unilever"

Nome sugerido:`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 50,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error:', errorData, 'Status:', response.status);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const suggestedName = data.choices[0]?.message?.content?.trim();

      if (!suggestedName) {
        throw new Error('Resposta vazia da OpenAI');
      }

      console.log('OpenAI suggested name:', suggestedName);

      return new Response(JSON.stringify({ 
        suggestedName,
        supplierNames: uniqueNames 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (openaiError) {
      console.error('OpenAI error:', openaiError);
      
      // Fallback: usar o nome mais comum ou primeiro nome
      const fallbackName = uniqueNames.length === 1 
        ? uniqueNames[0]
        : uniqueNames.sort((a, b) => a.length - b.length)[0]; // Nome mais curto

      console.log('Using fallback name:', fallbackName);

      return new Response(JSON.stringify({ 
        suggestedName: fallbackName,
        supplierNames: uniqueNames,
        warning: 'IA indisponível. Sugestão baseada nos nomes dos fornecedores.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in suggest-purchases-group-name:', error);
    return new Response(JSON.stringify({ 
      error: getErrorMessage(error) || 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});