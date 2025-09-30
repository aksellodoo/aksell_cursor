import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { getErrorMessage } from '../_shared/errorUtils.ts'

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
    const { approvalId, action, comments } = await req.json();

    if (!approvalId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Set the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      supabase.auth.setSession({
        access_token: authHeader.replace('Bearer ', ''),
        refresh_token: ''
      });
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Verificar se o usuário tem permissão para aprovar esta solicitação
    const { data: approval, error: approvalError } = await supabase
      .from('workflow_approvals')
      .select('*')
      .eq('id', approvalId)
      .eq('approver_id', user.id)
      .single();

    if (approvalError || !approval) {
      return new Response(
        JSON.stringify({ error: 'Approval not found or unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    // Usar função do banco para processar a aprovação unificada
    const { data: result, error } = await supabase.rpc('process_unified_approval', {
      p_approval_id: approvalId,
      p_action: action,
      p_comments: comments
    });

    if (error) {
      console.error('Error processing unified approval:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to process approval', details: getErrorMessage(error) }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    if (!result?.success) {
      console.error('Approval processing failed:', result);
      return new Response(
        JSON.stringify({ error: result?.message || 'Failed to process approval' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Handle multi-approver scenarios
    const approvalFormat = approval.approval_data?.approval_format;
    
    if (approvalFormat === 'any' && (action === 'approved' || action === 'rejected' || action === 'needs_correction')) {
      // Cancel all other pending approvals for the same step
      try {
        console.log(`Cancelling other approvals for "any" format - step: ${approval.step_id}`);
        
        const { error: cancelError } = await supabase
          .from('workflow_approvals')
          .update({ 
            status: 'auto_cancelled',
            comments: `Cancelado automaticamente - ${action === 'approved' ? 'aprovação' : action === 'rejected' ? 'rejeição' : 'solicitação de correção'} realizada por outro aprovador`
          })
          .eq('workflow_execution_id', approval.workflow_execution_id)
          .eq('step_id', approval.step_id)
          .eq('status', 'pending')
          .neq('id', approvalId);

        if (cancelError) {
          console.error('Error cancelling other approvals:', cancelError);
        } else {
          console.log('Successfully cancelled other pending approvals for "any" format');
        }

        // Remove notifications for cancelled approvals
        const { error: notificationError } = await supabase
          .from('app_notifications')
          .delete()
          .eq('type', 'workflow_approval')
          .neq('data->>approval_id', approvalId)
          .eq('data->>workflow_execution_id', approval.workflow_execution_id)
          .eq('data->>step_id', approval.step_id);

        if (notificationError) {
          console.error('Error removing notifications for cancelled approvals:', notificationError);
        }

        // Handle access request approvals specially
        if (approval.approval_type === 'access_request') {
          const accessRequestId = approval.record_reference?.access_request_id;
          if (accessRequestId) {
            const { data: accessResult, error: accessError } = await supabase.functions.invoke(
              'process-access-approval',
              {
                body: {
                  requestId: accessRequestId,
                  approved: action === 'approved',
                  rejectionReason: action === 'rejected' ? comments : null,
                  supervisorId: approval.approver_id
                }
              }
            );
            
            if (accessError) {
              console.error('Error processing access request:', accessError);
              throw accessError;
            }
            
            console.log('Access request processed:', accessResult);
          }
        }

      } catch (cancelError) {
        console.error('Error in multi-approver cancel logic:', cancelError);
      }
    }

    if (approvalFormat === 'all' && action === 'approved') {
      // Check if all approvals for this step are now approved
      try {
        const { data: stepApprovals, error: stepError } = await supabase
          .from('workflow_approvals')
          .select('status')
          .eq('workflow_execution_id', approval.workflow_execution_id)
          .eq('step_id', approval.step_id);

        if (!stepError && stepApprovals) {
          const pendingCount = stepApprovals.filter(a => a.status === 'pending').length;
          const approvedCount = stepApprovals.filter(a => a.status === 'approved').length;
          const totalCount = stepApprovals.length;
          
          console.log(`Step ${approval.step_id}: ${approvedCount}/${totalCount} approved, ${pendingCount} pending (format: all)`);
          
          if (pendingCount === 0 && approvedCount === totalCount) {
            console.log('All approvals for "all" format are now complete - step ready to continue');
            // The workflow continuation will be handled by the existing workflow engine
          }
        }
      } catch (checkError) {
        console.error('Error checking step completion:', checkError);
      }
    }

    // Criar notificação para o iniciador do workflow (se existir)
    const { data: workflowExecution } = await supabase
      .from('workflow_executions')
      .select('triggered_by')
      .eq('id', approval.workflow_execution_id)
      .single();

    if (workflowExecution?.triggered_by) {
      const notificationTitle = action === 'approved' 
        ? 'Aprovação concedida'
        : action === 'rejected'
        ? 'Aprovação rejeitada'
        : 'Correção solicitada';

      const notificationMessage = `Sua solicitação foi ${action === 'approved' ? 'aprovada' : action === 'rejected' ? 'rejeitada' : 'marcada para correção'} por ${user.email}`;

      await supabase
        .from('app_notifications')
        .insert({
          user_id: workflowExecution.triggered_by,
          type: 'approval_update',
          title: notificationTitle,
          message: notificationMessage,
          data: {
            approval_id: approvalId,
            action,
            comments,
            approval_type: approval.approval_type,
            workflow_execution_id: approval.workflow_execution_id
          }
        });
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing unified approval:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: getErrorMessage(error) 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});