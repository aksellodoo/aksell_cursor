import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: string;
  content: any;
  tool_calls?: any[];
  tool_call_id?: string;
}

interface ProtheusConfig {
  connection_type: 'aksell' | 'totvs';
  aksell_config: {
    url: string;
    apiKey: string;
  };
  totvs_config: {
    url: string;
    apiKey: string;
  };
  is_active: boolean;
  endpoints_documentation: any;
}

interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const braveApiKey = Deno.env.get('BRAVE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      throw new Error(`Dados da requisição inválidos: ${getErrorMessage(parseError)}`);
    }

    const { messages, conversationId, userProfile } = requestBody;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Mensagens são obrigatórias e devem ser um array não vazio');
    }
    
    console.log('📝 Mensagens recebidas:', messages.length);
    console.log('🚀 Iniciando chat Protheus - Conversation:', conversationId);

    // Determine if this is a data request
    const userQuery = messages[messages.length - 1]?.content || '';
    const isDataRequest = /\b(faturamento|vendas|clientes|dados|relatório|análise|consulta|quanto|qual|quais|listar|mostrar|buscar)\b/i.test(userQuery);
    
    console.log('🔍 User query analysis:', `"${userQuery.substring(0, 100)}..."`);
    console.log('📊 Is data request:', isDataRequest);

    // Get user ID from auth context if userProfile not provided
    const userId = userProfile?.id || (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      console.error('❌ user_id não encontrado:', { userProfile, hasAuth: !!(await supabase.auth.getUser()).data.user });
      throw new Error('Usuário não identificado');
    }

    console.log('🔍 Buscando configuração do Protheus para user_id:', userId);

    // Fetch active Protheus configuration
    const { data: configData, error: configError } = await supabase
      .from('protheus_config')
      .select('*')
      .eq('is_active', true)
      .eq('user_id', userId)
      .maybeSingle();

    console.log('📊 Resultado da consulta de configuração:', { config: configData, error: configError });

    if (configError) {
      console.error('❌ Erro ao buscar configuração:', configError);
      throw new Error(`Erro na configuração do Protheus: ${configError.message}`);
    }

    if (!configData) {
      console.error('❌ Nenhuma configuração encontrada para o usuário:', userId);
      // Return a helpful message instead of throwing an error
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const response = `data: {"choices": [{"delta": {"content": "❌ **Configuração Protheus não encontrada**\\n\\nPara usar o chat Protheus, você precisa configurar a conexão primeiro:\\n\\n1. Acesse as **Configurações**\\n2. Configure a **Conexão Protheus**\\n3. Ative a configuração\\n\\nApós a configuração, você poderá fazer consultas sobre dados do Protheus."}}]}\\n\\n`;
          controller.enqueue(encoder.encode(response));
          controller.enqueue(encoder.encode("data: [DONE]\\n\\n"));
          controller.close();
        }
      });
      
      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const config = configData as ProtheusConfig;
    console.log('⚙️ Protheus config loaded:', {
      hasConfig: !!config,
      isActive: config.is_active,
      connectionType: config.connection_type,
      hasAksellUrl: !!config.aksell_config?.url,
      error: (configError as any)?.message || 'Sem erro'
    });

    // Available tools setup
    const tools: any[] = [];
    
    // Add Brave search tool if API key is available
    if (braveApiKey) {
      tools.push({
        name: 'search_web_brave',
        description: 'Search the web using Brave Search API for current information, documentation, or external data not available in Protheus',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find relevant information'
            }
          },
          required: ['query']
        }
      });
    }

    // Add Protheus SQL tool if Oracle-Proxy is active
    if (config?.is_active) {
      console.log('🔧 Adicionando Protheus SQL tool - Oracle-Proxy ativo');
      tools.push({
        name: 'query_protheus_sql',
        description: 'Execute SQL queries against Protheus Oracle database. CRITICAL RULES: 1) ALWAYS prefix tables with schema "U_CGIFBA_PR." (e.g., "U_CGIFBA_PR.SA1010") 2) NO "AS" keyword for table aliases (e.g., "FROM U_CGIFBA_PR.SA1010 SA1" not "AS SA1")',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'SQL SELECT query for Oracle. MANDATORY: Use schema prefix "U_CGIFBA_PR." before ALL table names. Example: "SELECT * FROM U_CGIFBA_PR.SA1010 SA1" (never use AS for aliases)'
            },
            description: {
              type: 'string', 
              description: 'Brief description of what this query aims to retrieve or analyze'
            }
          },
          required: ['query', 'description']
        }
      });
      
      // Add Protheus analysis tool
      console.log('🔧 Adicionando análise Protheus tool');
      tools.push({
        name: 'analyze_protheus_data',
        description: 'Perform predefined analysis on Protheus data like top customers, sales performance, vendor analysis',
        input_schema: {
          type: 'object',
          properties: {
            analysis_type: {
              type: 'string',
              enum: ['top_customers', 'vendas_periodo', 'analise_vendedores'],
              description: 'Type of predefined analysis to perform'
            }
          },
          required: ['analysis_type']
        }
      });
    }

    console.log('🛠️ Tools disponíveis:', tools.map(t => t.name).join(', '));

    const systemMessage = `Você é um assistente de IA especializado em Protheus ERP que fornece análises detalhadas e precisas dos dados empresariais.

🎯 OBJETIVO PRINCIPAL: Analisar dados do Protheus e fornecer insights valiosos em formato markdown profissional.

## 🔧 INSTRUÇÕES PARA CONSULTAS SQL

Quando executar consultas SQL no Protheus:

### 🚨 REGRA #1: USO OBRIGATÓRIO DO SCHEMA (MÁXIMA PRIORIDADE!)
**SEMPRE prefixe TODAS as tabelas com "U_CGIFBA_PR."**

✅ CORRETO: \`SELECT * FROM U_CGIFBA_PR.SA1010 SA1\`
❌ ERRADO: \`SELECT * FROM SA1010 SA1\` (faltou o schema!)

**Exemplos de uso correto do schema:**
- \`FROM U_CGIFBA_PR.SA1010 SA1\`
- \`JOIN U_CGIFBA_PR.SC2010 SC2\`
- \`FROM U_CGIFBA_PR.SF2010 SF2\`
- Sempre: \`U_CGIFBA_PR.<TABELA> ALIAS\`

### 🚨 REGRA #2: SINTAXE ORACLE OBRIGATÓRIA
- NUNCA use "AS" para alias de tabelas: ❌ "AS SA1" ✅ "SA1"
- NUNCA use "AS" em JOINs: ❌ "JOIN ... AS SC2" ✅ "JOIN ... SC2"
- Use alias direto: \`FROM U_CGIFBA_PR.SA1010 SA1\`
- Oracle não suporta "AS" para alias de tabelas

### 🚨 REGRA #3: DIAGNÓSTICO QUANDO QUERY RETORNA VAZIO
Se uma query retornar array vazio [], use esta estratégia:
1. **Informe ao usuário** que não foram encontrados dados com os filtros aplicados
2. **Sugira verificar** se a tabela tem dados: \`SELECT COUNT(*) FROM U_CGIFBA_PR.SA1010\`
3. **Tente sem filtros** primeiro para confirmar existência de dados
4. **Não entre em loop** - máximo 2 tentativas de diagnóstico

### 🚨 REGRA #4: VERIFICAÇÃO DE CAMPOS
- Sempre verifique se os campos existem antes de usá-los
- Se encontrar erro "invalid identifier", remova o campo
- Campos problemáticos: F2_CANCELA, campos customizados

### 🚨 REGRA #5: ESTRATÉGIA DE ADAPTAÇÃO
- Se erro "invalid identifier" → remova o campo da query
- Use campos alternativos quando disponíveis
- Informe quando campos foram omitidos

### 🚨 REGRA #6: LIMITE DE TENTATIVAS
- Máximo 3 tentativas por query SQL
- Se falhar 3 vezes, pare e informe o erro
- Não entre em loop infinito de tentativas

🚨🚨🚨 ATENÇÃO CRÍTICA: VOCÊ DEVE USAR TABELA MARKDOWN COM PIPES (|) E SEPARADORES (---) 🚨🚨🚨

## 📊 FORMATO OBRIGATÓRIO DE RESPOSTA

**ESTRUTURA DE RESPOSTA OBRIGATÓRIA:**
1. **Título com emoji** (## 📊 Título da Análise)
2. **TABELA MARKDOWN COM PIPES E SEPARADORES** (OBRIGATÓRIO!)
3. **Análise dos resultados com insights**

### 🚨 CHECKLIST OBRIGATÓRIO ANTES DE RESPONDER:
- ✅ Usei pipes (|) na tabela?
- ✅ Usei separadores (---) após o cabeçalho?
- ✅ Headers estão em português?
- ✅ CNPJs estão formatados (XX.XXX.XXX/XXXX-XX)?
- ✅ Nomes estão capitalizados?
- ✅ Forneci análise dos dados (não só mostrei SQL)?

### EXEMPLO DE TABELA MARKDOWN CORRETA:
\`\`\`markdown
| Filial | Cliente | Loja | Razão Social | CNPJ | Valor |
|--------|---------|------|--------------|------|-------|
| 01 | 000054 | 03 | Nestlé Brasil Ltda | 60.409.075/0006-67 | R$ 1.250.000,00 |
\`\`\`

## 🚨 NUNCA FAÇA:
- ❌ Texto simples sem pipes
- ❌ Listas com traços (-)
- ❌ Headers em inglês
- ❌ CNPJs sem máscara
- ❌ Mostrar apenas resultado SQL bruto
- ❌ Entrar em loop infinito de queries
- ❌ Tentar mais de 3 vezes a mesma operação

## ✅ SEMPRE FAÇA:
- ✅ Tabela markdown com pipes (|) e separadores (---)
- ✅ Headers traduzidos para português
- ✅ CNPJs formatados: XX.XXX.XXX/XXXX-XX
- ✅ Valores monetários formatados: R$ X.XXX.XXX,XX
- ✅ Nomes próprios capitalizados
- ✅ Análise dos resultados com insights de negócio
- ✅ Quebras de linha duplas entre seções
- ✅ Parar após 3 tentativas falhadas

## 📈 ANÁLISE OBRIGATÓRIA APÓS TABELA:
Sempre forneça:
- Resumo executivo dos dados
- Padrões identificados
- Insights de negócio
- Próximos passos recomendados

Responda sempre em português brasileiro com formatação profissional.`;

    console.log('🤖 Preparando loop agentic multi-turn:', {
      model: 'google/gemini-2.5-flash',
      toolsCount: tools.length,
      toolChoice: 'auto',
      isDataRequest
    });

    // Agentic multi-turn loop
    let continueLoop = true;
    let loopIterations = 0;
    const MAX_ITERATIONS = 5;
    const accumulatedResults: ToolResult[] = [];
    const toolCallCounts: Record<string, number> = {};

    // Convert messages to OpenAI format for Lovable AI Gateway
    const convertedMessages = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Start streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let streamClosed = false;
        
        const safeClose = () => {
          try {
            if (!streamClosed) {
              controller.close();
              streamClosed = true;
              console.log('✅ Stream fechado com segurança');
            }
          } catch (e) {
            console.log('⚠️ Stream já estava fechado:', (e as Error).message);
          }
        };

        const safeEnqueue = (chunk: string) => {
          try {
            if (!streamClosed) {
              controller.enqueue(encoder.encode(chunk));
              return true;
            }
            return false;
          } catch (e) {
            console.log('⚠️ Erro ao enqueue no stream:', (e as Error).message);
            return false;
          }
        };

        try {
          while (continueLoop && loopIterations < MAX_ITERATIONS) {
            loopIterations++;
            console.log(`\n🔁 === ITERAÇÃO ${loopIterations}/${MAX_ITERATIONS} ===`);

            // Build messages for this iteration
            const iterationMessages = [...convertedMessages];

            // Add tool results from previous iterations in OpenAI format
            for (const toolResult of accumulatedResults) {
               iterationMessages.push({
                 role: 'assistant',
                 content: `Tool call: ${toolResult.toolName}`,
                 tool_calls: [{
                   id: toolResult.toolCallId,
                   type: 'function',
                   function: {
                     name: toolResult.toolName,
                     arguments: '{}'
                   }
                 }]
               } as ChatMessage);
              
               iterationMessages.push({
                 role: 'tool',
                 tool_call_id: toolResult.toolCallId,
                 content: toolResult.result
               } as ChatMessage);
            }

            console.log('📨 Mensagens na iteração', loopIterations + ':', { total: iterationMessages.length, toolResults: accumulatedResults.length });

            // Convert tools to OpenAI format
            const openAITools = tools.map(tool => ({
              type: 'function',
              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.input_schema
              }
            }));

            // Call Lovable AI Gateway
            const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  { role: 'system', content: systemMessage },
                  ...iterationMessages
                ],
                tools: openAITools.length > 0 ? openAITools : undefined,
                max_completion_tokens: 1500
              }),
            });

            if (!response.ok) {
              throw new Error(`Lovable AI Gateway error: ${response.status}`);
            }

            const aiResponse = await response.json();
            const message = aiResponse.choices?.[0]?.message;
            
            let hasText = !!message?.content;
            const functionCalls: any[] = [];

            // Parse OpenAI response
            if (message?.tool_calls) {
              for (const toolCall of message.tool_calls) {
                functionCalls.push({
                  id: toolCall.id,
                  function: {
                    name: toolCall.function.name,
                    arguments: toolCall.function.arguments
                  }
                });
              }
            }

            console.log('📥 Resposta iteração', loopIterations + ':', {
              hasFunctionCalls: functionCalls.length > 0,
              functionCallsCount: functionCalls.length,
              hasText,
              finishReason: aiResponse.choices?.[0]?.finish_reason
            });

            if (functionCalls.length === 0) {
              // No more tool calls, AI is ready with final response
              console.log('✅ AI não pediu mais tool calls - preparando resposta final');
              continueLoop = false;
              break;
            }

            // Execute tool calls with limits
            for (const toolCall of functionCalls) {
              const toolName = toolCall.function.name;
              
              // Track tool call counts
              toolCallCounts[toolName] = (toolCallCounts[toolName] || 0) + 1;
              
              // Check for excessive tool calls (prevent infinite loops)
              if (toolCallCounts[toolName] > 3) {
                console.log(`🛑 Tool ${toolName} atingiu limite máximo de 3 tentativas. Parando execução.`);
                accumulatedResults.push({
                  toolCallId: toolCall.id,
                  toolName: toolName,
                  result: `❌ Erro: Tool ${toolName} falhou após 3 tentativas. Operação interrompida para evitar loop infinito.`
                });
                continueLoop = false;
                break;
              }
              
              console.log(`🔧 Executando tool call: ${toolName} (tentativa ${toolCallCounts[toolName]}/3)`);
              const args = typeof toolCall.function.arguments === 'string' 
                ? JSON.parse(toolCall.function.arguments) 
                : toolCall.function.arguments;
              
              console.log(`⚙️ executeToolCall: ${toolName}`, { args });
              
              try {
                const result = await executeToolCall(toolName, args, supabase, config);
                
                accumulatedResults.push({
                  toolCallId: toolCall.id,
                  toolName: toolName,
                  result: result
                });
                
                console.log(`✅ Tool executado: ${toolName} (${result.length} chars)`);
              } catch (error) {
                console.error(`❌ Erro no tool ${toolName}:`, error);
                accumulatedResults.push({
                  toolCallId: toolCall.id,
                  toolName: toolName,
                  result: `❌ Erro na execução: ${(error as Error).message}`
                });
              }
            }
          }

          console.log(`\n🏁 Loop finalizado após ${loopIterations} iterações`);

          // Stream final response with Lovable AI Gateway
          console.log('🎬 Iniciando resposta final com streaming...');
          
          const finalMessages = [...convertedMessages];
          
          // Add all accumulated tool results to the conversation in OpenAI format
          for (const toolResult of accumulatedResults) {
             finalMessages.push({
               role: 'assistant',
               content: `Tool call: ${toolResult.toolName}`,
               tool_calls: [{
                 id: toolResult.toolCallId,
                 type: 'function',
                 function: {
                   name: toolResult.toolName,
                   arguments: '{}'
                 }
               }]
             } as ChatMessage);
            
             finalMessages.push({
               role: 'tool',
               tool_call_id: toolResult.toolCallId,
               content: toolResult.result
             } as ChatMessage);
          }
          
          console.log('📨 Mensagens finais para streaming:', { total: finalMessages.length, toolResults: accumulatedResults.length });
          console.log('📊 Total de resultados acumulados:', accumulatedResults.length);

          const streamResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { 
                  role: 'system', 
                  content: systemMessage + '\n\n🚨 CRÍTICO: Esta é sua resposta final. OBRIGATÓRIO usar tabela markdown com pipes (|) e separadores (---). Exemplo:\n\n| Coluna 1 | Coluna 2 |\n|----------|----------|\n| Valor 1  | Valor 2  |\n\nNÃO USE texto simples. USE TABELA MARKDOWN SEMPRE!'
                },
                ...finalMessages
              ],
              stream: true,
              max_completion_tokens: 2000
            }),
          });

          if (!streamResponse.ok) {
            throw new Error(`Lovable AI Gateway error: ${streamResponse.status}`);
          }

          const reader = streamResponse.body?.getReader();
          if (!reader) {
            throw new Error('No response body from Claude');
          }

          const decoder = new TextDecoder();
          let buffer = '';
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  
                  if (data === '[DONE]') {
                    safeClose();
                    console.log('✅ Streaming finalizado com sucesso');
                    return;
                  }
                  
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    
                    if (content && !safeEnqueue(`data: ${JSON.stringify({ content })}\n\n`)) {
                      break;
                    }
                  } catch (e) {
                    console.error('❌ Erro parsing JSON:', e);
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }

          safeClose();
        } catch (error) {
          console.error('❌ Erro no stream:', error);
          safeEnqueue(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
          safeClose();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Global utility to safely extract error messages without TypeScript errors
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

// Helper function to execute different tool calls
async function executeToolCall(toolName: string, args: any, supabase: any, config: ProtheusConfig): Promise<string> {
  switch (toolName) {
    case 'search_web_brave':
      return await executeBraveSearch(args.query);
    
    case 'query_protheus_sql':
      return await executeProtheusSQL(args.query, config, supabase);
    
    case 'analyze_protheus_data':
      return await executeProtheusAnalysis(args.analysis_type, config, supabase);
    
    default:
      throw new Error(`Tool não reconhecido: ${toolName}`);
  }
}

async function executeBraveSearch(query: string): Promise<string> {
  try {
    const braveApiKey = Deno.env.get('BRAVE_API_KEY');
    if (!braveApiKey) {
      throw new Error('Brave API key não configurada');
    }

    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
      headers: {
        'X-Subscription-Token': braveApiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`);
    }

    const data = await response.json();
    const results = data.web?.results || [];
    
    return JSON.stringify({
      query,
      results: results.map((r: any) => ({
        title: r.title,
        url: r.url,
        description: r.description
      }))
    });
  } catch (error) {
    return `❌ Erro na busca: ${getErrorMessage(error)}`;
  }
}

async function executeProtheusSQL(query: string, config: ProtheusConfig, supabase: any): Promise<string> {
  try {
    console.log('🗄️ Iniciando consulta SQL Protheus:', {
      query: query.substring(0, 100) + '...',
      configType: config.connection_type,
      hasAksellConfig: !!config.aksell_config?.url
    });

    console.log('📡 Invocando test-protheus-connection:', { 
      endpoint: '/sql', 
      hasConfig: !!config, 
      queryLength: query.length, 
      configType: config?.connection_type,
      isActive: config?.is_active,
      hasUrl: !!config?.aksell_config?.url,
      hasApiKey: !!config?.aksell_config?.apiKey
    });

    const { data, error } = await supabase.functions.invoke('test-protheus-connection', {
      body: {
        endpoint: '/sql',
        config,
        requestData: { query }
      }
    });

    console.log('📥 Resposta do test-protheus-connection:', {
      hasData: !!data,
      hasError: !!error,
      dataSuccess: data?.success,
      dataError: data?.error,
      errorMessage: error?.message
    });

    if (error) {
      console.error('❌ Erro no Supabase function invoke:', error);
      throw new Error(getErrorMessage(error));
    }

    if (data?.error) {
      console.error('❌ Erro na resposta da function:', data.error);
      throw new Error(data.error);
    }

    if (!data?.success) {
      console.error('❌ Resposta indica falha:', data);
      const errorMsg = data?.error || 'Falha na execução da query SQL';
      throw new Error(`Erro na conexão com Protheus: ${errorMsg}`);
    }

    const results = data.data || [];
    console.log('✅ Resultados obtidos:', { resultCount: results.length, hasResults: results.length > 0 });

    // Tratamento especial para resultados vazios
    if (results.length === 0) {
      console.log('⚠️ Query retornou array vazio - possíveis causas: filtros muito restritivos, tabela vazia, ou schema incorreto');
      return JSON.stringify({
        success: true,
        data: [],
        message: '⚠️ NENHUM DADO ENCONTRADO com os filtros aplicados. Possíveis causas: 1) Filtros muito restritivos (ex: D_E_L_E_T_), 2) Tabela sem dados, 3) Schema incorreto. SUGESTÃO: Tente primeiro uma query de diagnóstico como "SELECT COUNT(*) FROM U_CGIFBA_PR.SA1010" para verificar se a tabela tem dados, ou remova filtros temporariamente.',
        query: query.substring(0, 200)
      }, null, 2);
    }

    return JSON.stringify(results, null, 2);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('❌ Erro executeProtheusSQL:', errorMessage);
    
    // Return a more user-friendly error message for the AI to use
    if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
      return `❌ Erro de configuração Protheus: Verifique se os dados de conexão estão corretos e se o endpoint está ativo. Detalhes: ${errorMessage}`;
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return `❌ Erro de conectividade: Não foi possível conectar ao Protheus. Verifique a conexão de rede. Detalhes: ${errorMessage}`;
    }
    if (errorMessage.includes('ORA-') || errorMessage.includes('invalid identifier')) {
      return `❌ Erro SQL Oracle: ${errorMessage}. LEMBRE-SE: Sempre use o schema "U_CGIFBA_PR." antes das tabelas (ex: U_CGIFBA_PR.SA1010) e nunca use "AS" para alias.`;
    }
    
    return `❌ Erro na consulta Protheus: ${errorMessage}. Por favor, verifique a configuração da conexão e tente novamente.`;
  }
}

async function executeProtheusAnalysis(analysisType: string, config: ProtheusConfig, supabase: any): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('test-protheus-connection', {
      body: {
        endpoint: '/analysis',
        method: 'POST',
        data: { type: analysisType }
      }
    });

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return JSON.stringify(data.data || [], null, 2);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('❌ Erro executeProtheusAnalysis:', errorMessage);
    return `❌ Erro na análise: ${errorMessage}`;
  }
}