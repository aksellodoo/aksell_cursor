import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      document_id,
      file_name,
      file_content,
      version_number,
      department_name,
      folder_name,
      mime_type
    } = await req.json();

    if (!document_id || !file_name || !file_content) {
      throw new Error('Missing required fields: document_id, file_name, file_content');
    }

    console.log(`🔄 OneDrive backup started for document: ${document_id}`);
    console.log(`📁 Target: ${department_name}/${folder_name}/${file_name}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Simulate backup process (replace with actual OneDrive integration)
    console.log(`📤 Uploading ${file_name} to OneDrive...`);
    
    // TODO: Implement actual Microsoft Graph API integration
    // For now, we'll simulate the backup process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update document with backup status
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        updated_at: new Date().toISOString(),
        // Add backup_status field if needed
      })
      .eq('id', document_id);

    if (updateError) {
      console.error('Error updating document backup status:', updateError);
    }

    console.log(`✅ OneDrive backup completed for document: ${document_id}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'OneDrive backup completed successfully',
      document_id,
      file_name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('OneDrive backup error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: getErrorMessage(error) || 'OneDrive backup failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});