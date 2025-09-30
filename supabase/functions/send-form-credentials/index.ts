import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FormCredentialsRequest {
  form_token: string;
  recipient_name: string;
  recipient_email: string;
  generated_password: string;
  form_title: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { form_token, recipient_name, recipient_email, generated_password, form_title }: FormCredentialsRequest = await req.json();

    console.log('Enviando credenciais para:', recipient_email);

    // Template de email profissional
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Acesso ao Formulário</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">Acesso ao Formulário</h1>
            </div>
            
            <div style="margin-bottom: 25px;">
              <p>Olá <strong>${recipient_name}</strong>,</p>
              <p>Você foi convidado(a) para responder o formulário: <strong>"${form_title}"</strong>.</p>
              <p>Para acessar o formulário, utilize as credenciais abaixo:</p>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 25px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Email de acesso:</strong></p>
              <p style="margin: 0 0 15px 0; font-family: monospace; font-size: 16px; color: #1e40af;">${recipient_email}</p>
              
              <p style="margin: 0 0 10px 0;"><strong>Senha temporária:</strong></p>
              <p style="margin: 0; font-family: monospace; font-size: 16px; color: #1e40af; background-color: #e0e7ff; padding: 8px; border-radius: 4px;">${generated_password}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nahyrexnxhzutfeqxjte.lovable.app/formulario/${form_token}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Acessar Formulário
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
              <p><strong>Importante:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Esta senha é temporária e segura</li>
                <li>Guarde essas credenciais em local seguro</li>
                <li>Em caso de dúvidas, entre em contato conosco</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;">
              <p>Este é um email automático. Por favor, não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar email usando Resend
    const emailResponse = await resend.emails.send({
      from: 'Sistema Aksell <noreply@aksell.com.br>',
      to: [recipient_email],
      subject: `Acesso ao Formulário: ${form_title}`,
      html: emailHtml,
    });

    console.log('Email enviado com sucesso:', emailResponse);

    // Log do envio no banco - usar token como record_id temporariamente
    await supabase
      .from('field_audit_log')
      .insert({
        record_id: form_token.slice(0, 36), // Usar parte do token como identificador
        field_name: 'credentials_sent',
        new_value: recipient_email,
        record_type: 'form_external_access',
        changed_by: '00000000-0000-0000-0000-000000000000' // Sistema
      });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Credenciais enviadas com sucesso',
      email_id: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Erro ao enviar credenciais:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);