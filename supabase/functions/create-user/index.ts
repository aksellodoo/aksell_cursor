import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  name: string;
  email: string;
  password?: string;
  role: string;
  department_id?: string;
  is_employee: boolean;
  employee_id?: string;
  is_leader?: boolean;
  company_relationship?: string;
  can_change_password: boolean;
  notification_app: boolean;
  notification_email: boolean;
  notification_frequency: string;
  notification_types: {
    changes: boolean;
    chatter: boolean;
    mentions: boolean;
    assignments: boolean;
  };
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
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Initialize Resend client
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Parse request body
    const userData: CreateUserRequest = await req.json();

    console.log('Creating user with data:', { ...userData, password: '[REDACTED]' });

    // Validação: se é funcionário, deve ter employee_id
    if (userData.is_employee && !userData.employee_id) {
      throw new Error('employee_id é obrigatório quando is_employee é true');
    }

    const finalRole = userData.is_leader ? 'user' : userData.role;

    // Create user in Supabase Auth
    const authCreateParams: any = {
      email: userData.email,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: userData.name,
        role: finalRole,
        department_id: userData.department_id
      }
    };

    // Only add password if provided
    if (userData.password) {
      authCreateParams.password = userData.password;
    }

    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser(authCreateParams);

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Erro ao criar usuário: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado');
    }

    console.log('User created in auth:', authData.user.id);

    // Get department name if department_id is provided
    let departmentName = 'Geral';
    if (userData.department_id) {
      const { data: deptData } = await supabaseClient
        .from('departments')
        .select('name')
        .eq('id', userData.department_id)
        .single();
      
      if (deptData) {
        departmentName = deptData.name;
      }
    }

    // Create or update profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        role: finalRole,
        department: departmentName,
        department_id: userData.department_id,
        employee_id: userData.employee_id || null,
        status: 'active',
        is_leader: userData.is_leader ?? false,
        company_relationship: userData.company_relationship,
        can_change_password: userData.can_change_password,
        notification_app: userData.notification_app,
        notification_email: userData.notification_email,
        notification_frequency: userData.notification_frequency,
        notification_types: userData.notification_types,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      throw new Error(`Erro ao criar perfil: ${profileError.message}`);
    }

    console.log('Profile created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário criado com sucesso!',
        user_id: authData.user.id 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in create-user function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: getErrorMessage(error) || 'Erro interno do servidor' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);