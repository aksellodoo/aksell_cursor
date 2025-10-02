import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  invitation_id: string;
  contact_id: string;
  contact_name: string;
  contact_email: string;
  form_id: string;
  form_title: string;
  form_description?: string;
  estimated_minutes?: number;
  deadline?: string;
  creator_name: string;
  access_token: string;
  channel: 'email' | 'whatsapp' | 'telegram';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const {
      contact_name,
      contact_email,
      form_title,
      form_description,
      estimated_minutes,
      deadline,
      creator_name,
      access_token,
      channel
    }: InvitationRequest = await req.json();

    if (channel !== 'email') {
      return new Response(
        JSON.stringify({ success: false, error: 'Only email channel is currently supported' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const formUrl = `https://nahyrexnxhzutfeqxjte.lovable.app/formulario/publico/${access_token}`;

    const deadlineText = deadline
      ? new Date(deadline).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Não definido';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">
              <h1 style="color: #2563eb; margin: 0;">Solicitação de Preenchimento</h1>
            </div>

            <div style="margin-bottom: 25px;">
              <p>Olá <strong>${contact_name}</strong>,</p>
              <p>A pedido de <strong>${creator_name}</strong> em nome da <strong>Aksell Nutrition Ltda.</strong>, solicitamos sua colaboração no preenchimento do seguinte formulário:</p>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 25px 0;">
              <h2 style="margin: 0 0 10px 0; color: #1e40af; font-size: 18px;">📋 ${form_title}</h2>
              ${form_description ? `<p style="margin: 0 0 15px 0; color: #475569;">${form_description}</p>` : ''}

              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                ${estimated_minutes ? `
                  <p style="margin: 5px 0; color: #64748b;">
                    <strong>⏱️ Tempo estimado:</strong> ~${estimated_minutes} minutos
                  </p>
                ` : ''}
                <p style="margin: 5px 0; color: #64748b;">
                  <strong>📅 Prazo para resposta:</strong> ${deadlineText}
                </p>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${formUrl}"
                 style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                Preencher Formulário
              </a>
            </div>

            <div style="margin-top: 25px; padding: 15px; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>ℹ️ Informação importante:</strong> Este formulário não requer login ou senha. Suas respostas são importantes para nós e serão tratadas com confidencialidade.
              </p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
              <p style="margin: 0 0 10px 0;">Atenciosamente,</p>
              <p style="margin: 0; font-weight: bold;">Aksell Nutrition Ltda.</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">Sistema de Gestão</p>
            </div>

            <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #9ca3af;">
              <p style="margin: 0;">📧 Este é um email automático gerado pelo sistema.</p>
              <p style="margin: 5px 0 0 0;">Por favor, não responda este email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: 'Aksell Nutrition <noreply@aksell.com.br>',
      to: [contact_email],
      subject: `Solicitação de Preenchimento - ${form_title}`,
      html: emailHtml,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({
      success: true,
      message: 'Convite enviado com sucesso',
      email_id: emailResponse.data?.id
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error sending invitation:', error);

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
