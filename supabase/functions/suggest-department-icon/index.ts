import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getErrorMessage } from '../_shared/errorUtils.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lista de ícones disponíveis do Lucide React
const AVAILABLE_ICONS = [
  'Building2', 'Users', 'Calculator', 'Banknote', 'Scale',
  'Cpu', 'Server', 'Megaphone', 'ShoppingCart', 'Package',
  'Truck', 'BadgeCheck', 'Briefcase', 'Factory', 'Warehouse',
  'Store', 'GraduationCap', 'Beaker', 'Heart', 'Wrench',
  'Hammer', 'Shield', 'Phone', 'Mail', 'Globe'
];

serve(async (req) => {
  console.log('Suggest Department Icon function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { departmentName } = await req.json();

    if (!departmentName || departmentName.trim() === '') {
      throw new Error('Department name is required');
    }

    console.log('Suggesting icon for department:', departmentName);

    const systemPrompt = `Você é um especialista em identificação de ícones apropriados para departamentos corporativos.
Sua tarefa é sugerir o ícone mais adequado da biblioteca Lucide React baseado no nome do departamento fornecido.

Ícones disponíveis e seus usos típicos:
- Building2: Departamentos gerais, administrativos
- Users: RH, Recursos Humanos, Pessoal, People
- Calculator: Contabilidade, Controladoria
- Banknote: Financeiro, Fiscal, Tesouraria
- Scale: Jurídico, Legal, Compliance
- Cpu: TI, Tecnologia, Sistemas, Desenvolvimento
- Server: Infraestrutura, Data Center
- Megaphone: Marketing, Comunicação
- ShoppingCart: Vendas, Comercial
- Package: Compras, Suprimentos, Procurement
- Truck: Logística, Expedição, Transporte
- BadgeCheck: Qualidade, QA, QC
- Briefcase: Diretoria, Executivo, Board
- Factory: Produção, Manufatura
- Warehouse: Armazém, Estoque
- Store: Loja, Varejo
- GraduationCap: Treinamento, Educação
- Beaker: Pesquisa, Laboratório, P&D
- Heart: Saúde, Bem-estar
- Wrench: Manutenção, Facilities
- Hammer: Obras, Construção
- Shield: Segurança, Security
- Phone: Suporte, Atendimento
- Mail: Correspondência, Comunicação interna
- Globe: Internacional, Global

Responda EXCLUSIVAMENTE com um JSON válido no formato:
{
  "icon": "NomeDoIcone",
  "confidence": 0.95,
  "reasoning": "Explicação breve da escolha"
}

IMPORTANTE:
- icon: Deve ser exatamente um dos nomes da lista acima
- confidence: Número entre 0.1 e 1.0 indicando confiança na sugestão
- reasoning: Explicação curta (1 frase) do porquê dessa escolha`;

    const userPrompt = `Sugira o ícone mais adequado para este departamento:

Nome do departamento: "${departmentName}"

Analise o nome e sugira o ícone que melhor representa este departamento.`;

    console.log('Sending request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.3,
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

    try {
      const jsonResponse = JSON.parse(suggestion);

      // Validar se o ícone sugerido está na lista
      const suggestedIcon = jsonResponse.icon || 'Building2';
      const validIcon = AVAILABLE_ICONS.includes(suggestedIcon) ? suggestedIcon : 'Building2';

      console.log('Suggested icon:', validIcon, 'Confidence:', jsonResponse.confidence);

      return new Response(JSON.stringify({
        icon: validIcon,
        confidence: jsonResponse.confidence || 0.8,
        reasoning: jsonResponse.reasoning || 'Ícone sugerido baseado no nome do departamento',
        tokensUsed: data.usage?.total_tokens || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.log('Failed to parse JSON, using default icon');
      return new Response(JSON.stringify({
        icon: 'Building2',
        confidence: 0.5,
        reasoning: 'Usando ícone padrão devido a erro no processamento',
        tokensUsed: data.usage?.total_tokens || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in suggest-department-icon function:', error);
    return new Response(JSON.stringify({
      error: getErrorMessage(error),
      icon: 'Building2',
      confidence: 0,
      reasoning: 'Erro durante o processamento',
      tokensUsed: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
