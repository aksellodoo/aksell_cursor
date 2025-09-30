import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovalRequest {
  requestId: string;
  approved: boolean;
  rejectionReason?: string;
  supervisorId?: string;
  editedData?: {
    role: string;
    department: string;
    department_id: string;
    notification_types: Record<string, { app: boolean; email: boolean }>;
    is_leader?: boolean;
  };
}

interface PasswordResetRequest {
  email: string;
  resetType: string;
  adminId?: string;
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
    console.log('Starting access approval process...');
    
    // Get authorization header to verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, message: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('Missing required environment variables');
    }
    
    // Initialize user client for authentication verification
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user authentication and get user ID
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Authenticated user:', user.id);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { requestId, approved, rejectionReason, supervisorId, editedData }: ApprovalRequest = await req.json();

    console.log('Processing access request approval:', { requestId, approved, editedData });

    // Primeiro: Remover notificações e aprovações pendentes ANTES de processar
    console.log('Cleaning up notifications and pending approvals...');
    
    // Remover todas as outras aprovações pendentes para esta solicitação
    const { error: cancelError } = await supabase
      .from('workflow_approvals')
      .update({ status: 'auto_cancelled' })
      .eq('approval_type', 'access_request')
      .eq('status', 'pending')
      .filter('record_reference->>access_request_id', 'eq', requestId);
    
    if (cancelError) {
      console.error('Error cancelling other approvals:', cancelError);
    }
    
    // Remover notificações relacionadas à solicitação para todos os outros aprovadores
    const { error: notifError } = await supabase
      .from('app_notifications')
      .delete()
      .eq('type', 'access_request')
      .filter('data->>access_request_id', 'eq', requestId);
    
    if (notifError) {
      console.error('Error removing notifications:', notifError);
    }

    // Segundo: Process approval through database function with edited data
    const approvalParams = {
      request_id: requestId,
      approved: approved,
      rejection_reason: rejectionReason || null,
      supervisor_id: supervisorId || null,
      edited_data: editedData || null,
      current_user_id: user.id
    };

    console.log('Calling process_access_request_approval with params:', approvalParams);

    const { data: approvalResult, error: approvalError } = await supabase
      .rpc('process_access_request_approval', approvalParams);

    if (approvalError) {
      console.error('Error processing approval:', approvalError);
      throw approvalError;
    }

    console.log('Approval result:', approvalResult);

    if (!approvalResult?.success) {
      return new Response(JSON.stringify(approvalResult || { success: false, message: 'Unknown error' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Determine final leader flag and role
    const { data: pendingReq } = await supabase
      .from('pending_access_requests')
      .select('is_leader')
      .eq('id', requestId)
      .maybeSingle();

    const isLeaderFinal = (editedData && (editedData as any).is_leader === true) || pendingReq?.is_leader === true;
    const roleFinal = isLeaderFinal ? 'user' : approvalResult.role;

    // Terceiro: If approved, create user in Supabase Auth and send password setup link
    if (approved && approvalResult.user_id && approvalResult.email) {
      console.log('Creating user in Supabase Auth for:', approvalResult.email);
      
      // Generate secure random password (won't be shared)
      const tempPassword = generateSecurePassword();
      
      let finalAuthUserId = null;
      
      // Create user in auth with a temporary random password
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: approvalResult.email,
        password: tempPassword, // Senha temporária aleatória que não será enviada
        email_confirm: true,
        user_metadata: {
          name: approvalResult.name
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        
        // Se o usuário já existe no auth, tenta buscar o ID dele
        if (authError.message?.includes('already registered')) {
          console.log('User already exists in auth, trying to get user ID...');
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(user => user.email === approvalResult.email);
          if (existingUser) {
            console.log('Found existing user:', existingUser.id);
            finalAuthUserId = existingUser.id;
          } else {
            throw new Error('Could not find existing user');
          }
        } else {
          throw authError;
        }
      } else {
        console.log('Auth user created successfully:', authUser.user.id);
        finalAuthUserId = authUser.user.id;
      }

      // Now update/insert the profile with the correct auth user ID
      if (finalAuthUserId) {
        console.log('Updating profile with auth user ID:', finalAuthUserId);
        
        // First, delete the old profile record if it exists
        await supabase
          .from('profiles')
          .delete()
          .eq('id', approvalResult.user_id);

        // Then insert the new profile with the correct auth user ID
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: finalAuthUserId,
            name: approvalResult.name,
            email: approvalResult.email,
            role: roleFinal,
            department: approvalResult.department,
            department_id: approvalResult.department_id,
            status: 'pending_password_setup',
            is_leader: isLeaderFinal,
            notification_app: true,
            notification_email: true,
            notification_types: approvalResult.notification_types || {
              changes: { app: true, email: true },
              chatter: { app: true, email: true },
              mentions: { app: true, email: true },
              assignments: { app: true, email: true },
              approvals: { app: true, email: true },
              corrections: { app: true, email: true },
              tasks: { app: true, email: true },
              access_requests: { app: true, email: true }
            },
            created_by: finalAuthUserId
          });

        if (insertError) {
          console.error('Error inserting profile:', insertError);
          // Try update instead if insert fails
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              name: approvalResult.name,
              email: approvalResult.email,
              role: roleFinal,
              department: approvalResult.department,
              department_id: approvalResult.department_id,
              status: 'pending_password_setup',
              is_leader: isLeaderFinal
            })
            .eq('id', finalAuthUserId);
          
          if (updateError) {
            console.error('Error updating profile:', updateError);
          }
        }

        // Send welcome email with custom password reset token
        console.log('Sending welcome email with custom reset link...');
        
        try {
          // Send welcome email with user ID so it can generate custom token
          const welcomeEmailResponse = await supabase.functions.invoke('send-welcome-email', {
            body: {
              userEmail: approvalResult.email,
              userName: approvalResult.name,
              userId: finalAuthUserId,
              createdBy: user.id // ID do aprovador
            }
          });

          if (welcomeEmailResponse.error) {
            console.error('Error sending welcome email:', welcomeEmailResponse.error);
            // Don't fail the approval because of email issues
          } else {
            console.log('Welcome email sent successfully to:', approvalResult.email);
          }
          
        } catch (emailError) {
          console.error('Error with password setup process:', emailError);
          // Don't fail the approval because of email issues
        }

        console.log('User setup completed successfully');
      }
    }

    // Para rejeições, NÃO enviar email (deve ser silencioso conforme especificação)
    // Apenas logar o motivo para auditoria
    if (!approved && rejectionReason) {
      console.log(`Access request ${requestId} rejected. Reason: ${rejectionReason}`);
    }

    return new Response(JSON.stringify(approvalResult), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in process-access-approval function:', error);
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

// Helper functions
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(handler);