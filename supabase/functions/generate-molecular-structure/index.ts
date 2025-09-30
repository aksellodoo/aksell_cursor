import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MolecularStructureRequest {
  molecular_formula: string;
  product_id: string;
}

interface MolecularStructureResponse {
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
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not found');
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { molecular_formula, product_id }: MolecularStructureRequest = await req.json();
    
    if (!molecular_formula || !product_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Molecular formula and product ID are required' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Generating molecular structure for formula: ${molecular_formula}`);

    // Create specialized prompt for molecular structure
    const prompt = `Create a detailed 2D molecular structure diagram for the chemical compound with molecular formula "${molecular_formula}". 

Requirements:
- Show all atoms as labeled circles with element symbols (C, H, O, N, etc.)
- Display chemical bonds as clear lines connecting atoms
- Use standard chemical notation with proper bond angles
- Include lone pairs and formal charges where relevant
- White background with high contrast black text and lines
- Scientific diagram style, clean and professional
- Ensure the structure is chemically accurate and follows IUPAC conventions
- Make it suitable for educational/technical documentation

Style: Technical scientific diagram, clean lines, high contrast, professional appearance.`;

    // Generate image using OpenAI gpt-image-1 model
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        size: '1024x1024',
        quality: 'high',
        background: 'opaque',
        output_format: 'png',
        n: 1
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to generate molecular structure image' 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log('OpenAI response structure:', JSON.stringify(data, null, 2));
    
    // gpt-image-1 returns base64 directly in the response
    let base64Image;
    if (data.data && data.data[0]) {
      // Handle both possible response formats
      base64Image = data.data[0].b64_json || data.data[0].url;
      
      // If it's a URL, we need to fetch the image and convert to base64
      if (base64Image && base64Image.startsWith('http')) {
        console.log('Converting URL to base64...');
        const imageResponse = await fetch(base64Image);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image from URL: ${imageResponse.status}`);
        }
        const arrayBuffer = await imageResponse.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        base64Image = btoa(String.fromCharCode(...uint8Array));
      }
    }
    
    if (!base64Image) {
      console.error('No image data found in response:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No image data received from OpenAI',
          debug: data
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://nahyrexnxhzutfeqxjte.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not found');
      return new Response(
        JSON.stringify({ success: false, error: 'Supabase service key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert base64 to blob
    const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
    
    // Create filename with timestamp to avoid conflicts
    const timestamp = new Date().getTime();
    const filename = `molecular-structures/${product_id}/${timestamp}.png`;

    console.log(`Uploading image to storage: ${filename}`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-molecular-images')
      .upload(filename, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to upload image to storage' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('product-molecular-images')
      .getPublicUrl(filename);

    const image_url = publicUrlData.publicUrl;

    console.log(`Successfully generated and uploaded molecular structure: ${image_url}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        image_url 
      } as MolecularStructureResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-molecular-structure function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});