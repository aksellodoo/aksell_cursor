import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Utility function to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  return String(error);
}

// Utility function to clean JSON response from markdown code blocks
function cleanJsonResponse(text: string): string {
  return text
    .replace(/```json\s*/g, '')
    .replace(/```\s*$/g, '')
    .trim();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lista de ícones disponíveis do Lucide React (67 ícones)
const AVAILABLE_ICONS = [
  // Básicos
  'Building2', 'Home', 'Briefcase',
  // Pessoas/RH
  'Users', 'UsersRound', 'UserCheck', 'UserPlus', 'Contact',
  // Financeiro
  'Calculator', 'Banknote', 'CreditCard', 'Coins', 'DollarSign', 'Receipt',
  // Jurídico/Segurança
  'Scale', 'Shield', 'ShieldCheck', 'ShieldAlert', 'Lock', 'Key',
  // TI/Tecnologia
  'Cpu', 'Server', 'Database', 'Settings', 'Cog', 'Zap',
  // Marketing/Comunicação
  'Megaphone', 'Presentation', 'Radio', 'Rss', 'Video', 'Mic',
  // Vendas/Comercial
  'ShoppingCart', 'Store', 'Target', 'TrendingUp',
  // Operações/Logística
  'Package', 'Truck', 'Warehouse', 'Factory', 'Wrench', 'Hammer',
  // Qualidade/P&D
  'BadgeCheck', 'Beaker', 'GraduationCap', 'Award',
  // Documentos
  'FileText', 'Files', 'FolderOpen', 'Clipboard', 'Notebook', 'FileCheck', 'BookOpen', 'Archive', 'Inbox',
  // Análise
  'BarChart', 'LineChart', 'PieChart', 'Activity',
  // Comunicação
  'Phone', 'Mail',
  // Outros
  'Heart', 'Globe', 'MapPin', 'Flag'
];

serve(async (req) => {
  console.log('=== Suggest Department Icon function called ===');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  if (req.method === 'OPTIONS') {
    console.log('Returning CORS preflight response');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('OpenAI API Key configured:', !!openAIApiKey);

    if (!openAIApiKey) {
      console.error('ERROR: OpenAI API key not configured in environment');
      throw new Error('OpenAI API key not configured');
    }

    const requestBody = await req.json();
    console.log('Request body:', requestBody);

    const { departmentName } = requestBody;

    if (!departmentName || departmentName.trim() === '') {
      throw new Error('Department name is required');
    }

    console.log('Suggesting icon for department:', departmentName);

    const systemPrompt = `Você é um especialista em identificação de ícones apropriados para departamentos corporativos.
Sua tarefa é sugerir o ícone mais adequado da biblioteca Lucide React (67 ícones disponíveis) baseado no nome do departamento fornecido.

CATEGORIAS DE ÍCONES:
1. BÁSICOS: Building2 (geral), Home (matriz), Briefcase (executivo)
2. PESSOAS/RH: Users, UsersRound (equipe), UserCheck (aprovação), UserPlus (recrutamento), Contact
3. FINANCEIRO: Calculator (contábil), Banknote (fiscal), CreditCard (pagamentos), Coins (tesouraria), DollarSign, Receipt
4. JURÍDICO/SEGURANÇA: Scale (jurídico), Shield, ShieldCheck (compliance), ShieldAlert (auditoria), Lock, Key
5. TI/TECH: Cpu, Server (infra), Database (BI/dados), Settings, Cog, Zap (automação)
6. MARKETING/COMUNICAÇÃO: Megaphone, Presentation, Radio, Rss, Video, Mic
7. VENDAS/COMERCIAL: ShoppingCart, Store (varejo), Target (metas), TrendingUp
8. OPERAÇÕES/LOGÍSTICA: Package (compras), Truck (logística), Warehouse, Factory (produção), Wrench (manutenção/ferramentas), Hammer (obras)
9. QUALIDADE/P&D: BadgeCheck (QA), Beaker (pesquisa), GraduationCap (treinamento), Award
10. DOCUMENTOS: FileText, Files, FolderOpen, Clipboard, Notebook, FileCheck, BookOpen, Archive, Inbox
11. ANÁLISE: BarChart, LineChart, PieChart, Activity
12. OUTROS: Phone, Mail, Heart (saúde), Globe (internacional), MapPin (filiais), Flag

Responda EXCLUSIVAMENTE com JSON válido:
{
  "icon": "NomeExatoDoIcone",
  "confidence": 0.95,
  "reasoning": "Breve explicação (1 frase)"
}

REGRAS:
- icon: Deve ser EXATAMENTE um dos 67 ícones listados acima (case-sensitive)
- confidence: 0.1 a 1.0
- reasoning: Máximo 1 frase explicando a escolha`;

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
        response_format: { type: "json_object" },
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
    console.log('Raw OpenAI suggestion:', suggestion);

    try {
      const cleanedResponse = cleanJsonResponse(suggestion);
      console.log('Cleaned JSON response:', cleanedResponse);
      const jsonResponse = JSON.parse(cleanedResponse);

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
    console.error('=== ERROR in suggest-department-icon function ===');
    console.error('Error type:', typeof error);
    console.error('Error:', error);
    console.error('Error message:', getErrorMessage(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    const errorResponse = {
      error: getErrorMessage(error),
      icon: 'Building2',
      confidence: 0,
      reasoning: 'Erro durante o processamento',
      tokensUsed: 0
    };

    console.error('Returning error response:', errorResponse);

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
