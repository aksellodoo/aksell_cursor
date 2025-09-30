import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductImageRequest {
  molecular_formula: string;
  product_format: 'solid' | 'liquid';
  product_id: string;
}

interface ProductImageResponse {
  success: boolean;
  image_url?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const { molecular_formula, product_format, product_id }: ProductImageRequest = await req.json();

    if (!molecular_formula || !product_format) {
      throw new Error('Fórmula molecular e formato do produto são obrigatórios');
    }

    console.log('Generating product image for:', { molecular_formula, product_format, product_id });

    // Create format-specific prompt
    let prompt = '';
    if (product_format === 'solid') {
      prompt = `Crie uma imagem hiper-realista de um composto químico sólido representado pela fórmula molecular ${molecular_formula}. 
Mostre-o em forma de pó, grãos ou cristais, com aparência física natural (considerando cor e textura típicas do composto). 
Coloque-o sobre uma superfície lisa e neutra, com iluminação suave e estilo fotográfico realista. 
A fórmula ${molecular_formula} deve aparecer escrita abaixo em letras pretas simples, sem efeitos, centralizada. 
Fundo limpo e padronizado, sem outros elementos visuais.`;
    } else if (product_format === 'liquid') {
      prompt = `Crie uma imagem hiper-realista de um composto químico líquido representado pela fórmula molecular ${molecular_formula}. 
Mostre-o em forma líquida, com aparência física natural (considerando cor e aparência típicas do composto). 
Coloque-o dentro um recipiente de vidro transparente, com iluminação suave e estilo fotográfico realista. 
A fórmula ${molecular_formula} deve aparecer escrita abaixo em letras pretas simples, sem efeitos, centralizada. 
Fundo limpo e padronizado, sem outros elementos visuais.`;
    } else {
      throw new Error('Formato de produto inválido. Use "solid" ou "liquid".');
    }

    console.log('Generated prompt:', prompt);

    // Call OpenAI API (gpt-image-1 doesn't support response_format parameter)
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
        output_format: 'png'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`Erro da API OpenAI: ${errorData.error?.message || 'Erro desconhecido'}`);
    }

    const data = await response.json();
    console.log('OpenAI response received, checking format...');

    if (!data.data || !data.data[0]) {
      throw new Error('Resposta inválida da API OpenAI');
    }

    let imageData: string;
    
    // Try to get base64 data (default for gpt-image-1)
    if (data.data[0].b64_json) {
      imageData = data.data[0].b64_json;
      console.log('Using b64_json format from OpenAI');
    } else if (data.data[0].url) {
      // Fallback: download from URL and convert to base64
      console.log('Using URL format, downloading image...');
      const imageResponse = await fetch(data.data[0].url);
      if (!imageResponse.ok) {
        throw new Error('Falha ao baixar imagem da URL fornecida pela OpenAI');
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    } else {
      throw new Error('Nenhum dado de imagem ou URL retornado pela API');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuração do Supabase não encontrada');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert base64 to ArrayBuffer for proper blob handling
    const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
    
    // Sanitize product_id for filename (remove accents, spaces, special chars)
    const sanitizedProductId = product_id
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-zA-Z0-9]/g, '-')   // Replace special chars with dash
      .replace(/-+/g, '-')             // Replace multiple dashes with single
      .replace(/^-|-$/g, '')           // Remove leading/trailing dashes
      .toLowerCase();
    
    // Generate unique filename with sanitized product ID
    const timestamp = Date.now();
    const filename = `product-${sanitizedProductId}-${timestamp}.png`;
    
    console.log('Uploading image to storage:', filename);

    // Upload to Supabase Storage with proper content type
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('site-products')
      .upload(filename, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('site-products')
      .getPublicUrl(filename);

    console.log('Image uploaded successfully:', publicUrl);

    return new Response(JSON.stringify({
      success: true,
      image_url: publicUrl,
      prompt_used: prompt
    } as ProductImageResponse & { prompt_used: string }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-product-image function:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Erro inesperado ao gerar imagem do produto';

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    } as ProductImageResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});