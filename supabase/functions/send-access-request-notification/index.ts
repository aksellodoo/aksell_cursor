import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AccessRequestNotificationRequest {
  requestId: string;
  requesterName: string;
  requesterEmail: string;
  department: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // Parse request
    const { requestId, requesterName, requesterEmail, department, role }: AccessRequestNotificationRequest = await req.json();

    console.log('Sending access request notifications for:', { requestId, requesterName });

    // Buscar todos os admins e diretores que devem ser notificados
    const { data: approvers, error: approversError } = await supabase
      .from('profiles')
      .select('id, name, email, notification_email')
      .in('role', ['admin', 'director'])
      .eq('status', 'active')
      .eq('notification_email', true);

    if (approversError) {
      console.error('Error fetching approvers:', approversError);
      throw approversError;
    }

    if (!approvers || approvers.length === 0) {
      console.log('No approvers found to notify');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No approvers to notify' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${approvers.length} approvers to notify`);

    // Criar aprovações unificadas para cada aprovador
    const approvalPromises = approvers.map(async (approver) => {
      // Criar aprovação unificada
      const { data: approval, error: approvalError } = await supabase
        .from('workflow_approvals')
        .insert({
          workflow_execution_id: null,
          step_id: 'access_request',
          approver_id: approver.id,
          approval_type: 'access_request',
          status: 'pending',
          priority: 'medium',
          record_reference: {
            access_request_id: requestId,
            requester_name: requesterName,
            requester_email: requesterEmail,
            department: department,
            role: role
          },
          approval_data: {
            type: 'access_request',
            title: `Solicitação de acesso - ${requesterName}`,
            description: `${requesterName} solicitou acesso como ${role} no departamento ${department}`
          }
        })
        .select()
        .single();

      if (approvalError) {
        console.error('Error creating approval:', approvalError);
        return null;
      }

      // Enviar email se Resend estiver configurado
      if (resend && approver.email) {
        try {
          await resend.emails.send({
            from: 'Sistema Aksell <noreply@aksell.com.br>',
            to: [approver.email],
            subject: 'Nova Solicitação de Acesso ao Sistema',
            html: `
              <h1>Nova Solicitação de Acesso</h1>
              <p>Uma nova solicitação de acesso foi recebida:</p>
              
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Nome:</strong> ${requesterName}</p>
                <p><strong>Email:</strong> ${requesterEmail}</p>
                <p><strong>Cargo solicitado:</strong> ${role}</p>
                <p><strong>Departamento:</strong> ${department}</p>
              </div>
              
              <p>Acesse o sistema para aprovar ou rejeitar esta solicitação na seção de <strong>Aprovações</strong>.</p>
              
              <br>
              <p>Atenciosamente,<br>Sistema Aksell</p>
            `
          });
          console.log(`Email sent to ${approver.email}`);
        } catch (emailError) {
          console.error(`Error sending email to ${approver.email}:`, emailError);
        }
      }

      return approval;
    });

    // Aguardar todas as aprovações serem criadas
    const results = await Promise.all(approvalPromises);
    const successCount = results.filter(r => r !== null).length;

    console.log(`Created ${successCount} approvals out of ${approvers.length} approvers`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Notifications sent to ${successCount} approvers`,
      approvers_notified: successCount
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in send-access-request-notification function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: getErrorMessage(error) 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);