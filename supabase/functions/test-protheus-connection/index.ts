import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  console.log('🚀 test-protheus-connection chamada - method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
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
      console.error('❌ Erro ao fazer parse do JSON na test-protheus-connection:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `JSON inválido: ${parseError instanceof Error ? parseError.message : String(parseError)}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const { endpoint, config, requestData } = requestBody;

    console.log('📨 Dados recebidos:', {
      endpoint,
      hasConfig: !!config,
      configType: config?.connection_type,
      isActive: config?.is_active,
      hasRequestData: !!requestData
    });

    if (!config || !config.is_active) {
      console.error('❌ Configuração inválida:', { hasConfig: !!config, isActive: config?.is_active });
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração inativa ou inválida' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Get the appropriate configuration based on connection type
    const connectionConfig = config.connection_type === 'aksell' 
      ? config.aksell_config 
      : config.totvs_config;

    if (!connectionConfig.url || !connectionConfig.apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Configuração ${config.connection_type} incompleta: URL ou API Key não definidos` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Check if endpoint is enabled
    const endpoints = config.endpoints_documentation?.endpoints || [];
    const endpointConfig = endpoints.find((ep: any) => ep.path === endpoint);
    
    if (!endpointConfig || !endpointConfig.enabled) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Endpoint ${endpoint} não está habilitado` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Build the full URL
    const fullUrl = `${connectionConfig.url.replace(/\/$/, '')}${endpoint}`;
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method: endpoint === '/sql' ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': connectionConfig.apiKey,
      },
      signal: AbortSignal.timeout(30000), // 30 seconds timeout
    };

    if (endpoint === '/sql' && requestData?.query) {
      let query = requestData.query.trim();
      const queryUpper = query.toUpperCase();
      
      // Validate that it's a SELECT query
      if (!queryUpper.startsWith('SELECT')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Apenas queries SELECT são permitidas' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }
      
      // Check for forbidden keywords
      const forbiddenKeywords = ['DELETE', 'DROP', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE'];
      if (forbiddenKeywords.some(keyword => queryUpper.includes(keyword))) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Query contém comandos não permitidos' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }

      // BLOB Protection Logic
      let modifiedQuery = query;
      let meta: any = {};

      // Check if it's a simple SELECT * FROM table query
      const simpleSelectMatch = query.match(/^\s*select\s+\*\s+from\s+([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\s*(?:where|order\s+by|$)/i);
      
      if (simpleSelectMatch) {
        const tableName = simpleSelectMatch[1];
        
        try {
          // Get table schema from protheus_dynamic_tables
          const { data: tableInfo } = await supabaseClient
            .from('protheus_dynamic_tables')
            .select('field_mappings')
            .eq('supabase_table_name', tableName.toLowerCase().replace('.', '_'))
            .single();

          if (tableInfo?.field_mappings) {
            const binaryFields: string[] = [];
            const safeFields: string[] = [];
            
            for (const [fieldName, fieldInfo] of Object.entries(tableInfo.field_mappings as Record<string, any>)) {
              const fieldType = fieldInfo.type?.toLowerCase() || '';
              const isBinary = fieldType.includes('blob') || 
                              fieldType.includes('clob') || 
                              fieldType.includes('raw') || 
                              fieldType.includes('long') || 
                              fieldType.includes('varbinary') || 
                              fieldType.includes('bytea') ||
                              fieldName.toLowerCase().includes('doclog') ||
                              fieldName.toLowerCase().includes('anexo') ||
                              fieldName.toLowerCase().includes('documento');
              
              if (isBinary) {
                binaryFields.push(fieldName);
              } else {
                safeFields.push(fieldName);
              }
            }
            
            if (binaryFields.length > 0 && safeFields.length > 0) {
              // Replace SELECT * with safe projection
              modifiedQuery = query.replace(/select\s+\*/i, `SELECT ${safeFields.join(', ')}`);
              meta = {
                projectionApplied: true,
                excludedBinaryFields: binaryFields,
                note: 'binary-columns-excluded'
              };
            }
          }
        } catch (error) {
          console.log('Could not get table schema for binary field detection:', error);
        }
      } else {
        // Check for explicit binary field selection
        const binaryFieldPatterns = [
          /\bds_doclog\b/i,
          /\banexo\b/i,
          /\bdocumento\b/i,
          /\blob\b/i,
          /\bclob\b/i
        ];
        
        for (const pattern of binaryFieldPatterns) {
          if (pattern.test(query)) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'Campo(s) binário(s) não são suportados no Teste SQL. Use a sincronização (download via /download/:id).' 
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400 
              }
            );
          }
        }
      }

      requestOptions.body = JSON.stringify({ query: modifiedQuery });
      
      // Store meta for later use
      (requestOptions as any).meta = meta;
    }

    // Make the request
    const startTime = Date.now();
    const response = await fetch(fullUrl, requestOptions);
    const responseTime = Date.now() - startTime;

    // Safe stringify function to avoid circular references
    const safeStringify = (obj: any): string => {
      const seen = new Set();
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      });
    };

    let responseData: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Normalize response data (objects with numeric keys to arrays)
    if (typeof responseData === 'object' && responseData !== null && !Array.isArray(responseData)) {
      const keys = Object.keys(responseData);
      const isNumericKeys = keys.every(key => !isNaN(Number(key)));
      if (isNumericKeys && keys.length > 0) {
        responseData = keys.sort((a, b) => Number(a) - Number(b)).map(key => responseData[key]);
      }
    }

    // Debug logs para SQL queries
    if (endpoint === '/sql') {
      console.log('Oracle/Protheus SQL Response:', responseData);
      console.log('Oracle/Protheus SQL Response type:', typeof responseData);
      console.log('Oracle/Protheus SQL Response length:', Array.isArray(responseData) ? responseData.length : 'not array');
      console.log('Oracle/Protheus SQL Response keys:', typeof responseData === 'object' ? Object.keys(responseData) : 'no keys');
      console.log('Oracle/Protheus SQL Response structure:', safeStringify(responseData).substring(0, 500));
      console.log('Meta information:', (requestOptions as any).meta || {});
    }

    // Log the usage
    const { data: authData } = await supabaseClient.auth.getUser();
    const userId = authData?.user?.id;

    if (userId) {
      try {
        await supabaseClient.from('protheus_usage_logs').insert({
          user_id: userId,
          config_id: config.id,
          endpoint_used: endpoint,
          request_data: requestData || {},
          response_data: safeStringify(responseData),
          response_status: response.status.toString(),
          response_time_ms: responseTime,
          error_message: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        });
      } catch (logError) {
        console.error('Failed to log usage:', logError);
      }
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: responseData
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status 
        }
      );
    }

    const result = {
      success: true, 
      data: responseData,
      responseTime,
      endpoint,
      timestamp: new Date().toISOString(),
      ...((requestOptions as any).meta && Object.keys((requestOptions as any).meta).length > 0 ? { meta: (requestOptions as any).meta } : {})
    };

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in test-protheus-connection:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        type: error.name === 'TimeoutError' ? 'timeout' : 'network_error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});