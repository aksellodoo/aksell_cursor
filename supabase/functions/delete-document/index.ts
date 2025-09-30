import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { getErrorMessage } from "../_shared/errorUtils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteDocumentRequest {
  document_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let document_id: string | undefined;
  let startTime = Date.now();

  try {
    // Parse request body
    const requestBody: DeleteDocumentRequest = await req.json();
    document_id = requestBody.document_id;
    
    if (!document_id) {
      throw new Error('document_id is required');
    }

    console.log('Deleting document:', document_id);

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Create Supabase client with service key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData.user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Error checking user permissions' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (profile?.role !== 'admin') {
      console.log('Non-admin user attempted to delete document:', userData.user.id);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin access required.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Admin user authorized for deletion:', userData.user.id);

    // Get document details for storage cleanup
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('storage_key, name')
      .eq('id', document_id)
      .single();

    if (fetchError) {
      console.error('Error fetching document:', fetchError);
      throw new Error('Document not found');
    }

    // Delete associated doc_chunks first (explicit deletion for safety)
    console.log('🧹 Deleting associated document chunks...');
    const { error: chunksDeleteError } = await supabase
      .from('doc_chunks')
      .delete()
      .eq('document_id', document_id);
    
    if (chunksDeleteError) {
      console.warn('⚠️ Warning: Failed to delete document chunks:', chunksDeleteError);
      // Continue with document deletion even if chunks deletion fails
      // CASCADE constraint will handle this automatically
    } else {
      console.log('✅ Document chunks deleted successfully');
    }

    // Delete from storage if storage_key exists
    if (document.storage_key) {
      console.log('Deleting file from storage:', document.storage_key);
      const { error: storageError } = await supabase.storage
        .from('docs-prod')
        .remove([document.storage_key]);
      
      if (storageError) {
        console.warn('Error deleting from storage (continuing with DB deletion):', storageError);
        // Continue with database deletion even if storage fails
      } else {
        console.log('File successfully deleted from storage');
      }
    }

    // Delete document record from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', document_id);

    if (deleteError) {
      console.error('Error deleting document from database:', deleteError);
      throw new Error('Failed to delete document from database');
    }

    console.log('Document successfully deleted:', document.name);

    // Log telemetry for successful deletion
    const processingTime = Date.now() - startTime;
    console.log('Document deletion telemetry:', {
      document_id,
      document_name: document.name,
      processing_time_ms: processingTime,
      status: 'success',
      admin_user: userData.user.id
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document deleted successfully',
        document_name: document.name
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error deleting document:', error);
    
    // Log telemetry for errors
    const processingTime = Date.now() - startTime;
    console.log('Document deletion telemetry:', {
      document_id,
      processing_time_ms: processingTime,
      status: 'error',
      error: getErrorMessage(error)
    });

    return new Response(
      JSON.stringify({ 
        error: getErrorMessage(error) || 'Internal server error',
        details: 'Failed to delete document'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});