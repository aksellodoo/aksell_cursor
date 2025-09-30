// Edge function de teste para verificar infraestrutura Supabase
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('🔔 ECOAR - Request method:', req.method);
  console.log('🔔 ECOAR - Request URL:', req.url);

  try {
    let data: any = {};
    let bodyText = '';

    if (req.method === 'POST') {
      // Tentar ler o body
      try {
        bodyText = await req.text();
        console.log('🔔 ECOAR - Body raw text length:', bodyText.length);
        console.log('🔔 ECOAR - Body preview:', bodyText.substring(0, 200));
        
        if (bodyText) {
          data = JSON.parse(bodyText);
          console.log('🔔 ECOAR - Body parsed successfully:', data);
        } else {
          console.log('🔔 ECOAR - Body is empty');
        }
      } catch (error) {
        console.log('🔔 ECOAR - Body parsing error:', error);
        data = { error: 'Failed to parse body', bodyText };
      }
    } else if (req.method === 'GET') {
      // Para GET, usar query parameters
      const url = new URL(req.url);
      const params = Object.fromEntries(url.searchParams.entries());
      data = { queryParams: params };
      console.log('🔔 ECOAR - Query params:', params);
    }

    const response = {
      success: true,
      method: req.method,
      timestamp: new Date().toISOString(),
      received: data,
      bodyLength: bodyText.length,
      echo: data
    };

    console.log('🔔 ECOAR - Sending response:', response);

    return new Response(JSON.stringify(response), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error) {
    console.error('🔔 ECOAR - Error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});