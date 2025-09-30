import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { correctionId } = await req.json();

    if (!correctionId) {
      return new Response(
        JSON.stringify({ error: 'correctionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing correction resubmission:', correctionId);

    // Buscar dados da correção
    const { data: correction, error: correctionError } = await supabase
      .from('workflow_corrections')
      .select('*')
      .eq('id', correctionId)
      .eq('status', 'pending')
      .single();

    if (correctionError || !correction) {
      console.error('Error fetching correction:', correctionError);
      return new Response(
        JSON.stringify({ error: 'Correction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Marcar correção como resolvida
    const { error: updateCorrectionError } = await supabase
      .from('workflow_corrections')
      .update({ 
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resubmitted_at: new Date().toISOString()
      })
      .eq('id', correctionId);

    if (updateCorrectionError) {
      console.error('Error updating correction:', updateCorrectionError);
      throw updateCorrectionError;
    }

    // Atualizar aprovação para pending novamente
    const { error: updateApprovalError } = await supabase
      .from('workflow_approvals')
      .update({ 
        status: 'pending',
        comments: null,
        approved_at: null,
        approved_by: null
      })
      .eq('id', correction.approval_id);

    if (updateApprovalError) {
      console.error('Error updating approval:', updateApprovalError);
      throw updateApprovalError;
    }

    // Notificar o aprovador sobre a resubmissão
    const { error: notificationError } = await supabase
      .from('app_notifications')
      .insert({
        user_id: correction.requested_by,
        type: 'approval_resubmitted',
        title: 'Aprovação reenviada',
        message: 'Uma aprovação foi reenviada após correções.',
        data: {
          approval_id: correction.approval_id,
          correction_id: correctionId,
          workflow_execution_id: correction.workflow_execution_id
        }
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Approval resubmitted successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing resubmission:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});