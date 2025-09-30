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

    const { approvalId, correctionDetails } = await req.json();

    if (!approvalId || !correctionDetails) {
      return new Response(
        JSON.stringify({ error: 'approvalId and correctionDetails are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing correction request for approval:', approvalId);

    // Buscar dados da aprovação
    const { data: approval, error: approvalError } = await supabase
      .from('workflow_approvals')
      .select('*')
      .eq('id', approvalId)
      .single();

    if (approvalError || !approval) {
      console.error('Error fetching approval:', approvalError);
      return new Response(
        JSON.stringify({ error: 'Approval not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados da execução do workflow
    const { data: workflowExecution, error: executionError } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', approval.workflow_execution_id)
      .single();

    if (executionError || !workflowExecution) {
      console.error('Error fetching workflow execution:', executionError);
      return new Response(
        JSON.stringify({ error: 'Workflow execution not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar status da aprovação para needs_correction
    const { error: updateApprovalError } = await supabase
      .from('workflow_approvals')
      .update({ 
        status: 'needs_correction',
        comments: correctionDetails,
        approved_at: new Date().toISOString(),
        approved_by: approval.approver_id
      })
      .eq('id', approvalId);

    if (updateApprovalError) {
      console.error('Error updating approval:', updateApprovalError);
      throw updateApprovalError;
    }

    // Criar registro na tabela de correções
    const { error: correctionError } = await supabase
      .from('workflow_corrections')
      .insert({
        workflow_execution_id: approval.workflow_execution_id,
        approval_id: approvalId,
        requested_by: approval.approver_id,
        assigned_to: workflowExecution.triggered_by,
        correction_details: correctionDetails,
        status: 'pending'
      });

    if (correctionError) {
      console.error('Error creating correction:', correctionError);
      throw correctionError;
    }

    // Notificar o usuário que solicitou a aprovação
    const { error: notificationError } = await supabase
      .from('app_notifications')
      .insert({
        user_id: workflowExecution.triggered_by,
        type: 'correction_requested',
        title: 'Correção solicitada',
        message: 'Uma correção foi solicitada em sua aprovação pendente.',
        data: {
          approval_id: approvalId,
          workflow_execution_id: approval.workflow_execution_id,
          correction_details: correctionDetails
        }
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Correction requested successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing correction request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});