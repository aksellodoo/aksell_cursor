import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovalEmailRequest {
  approvalId: string;
  approverEmail: string;
  approverName: string;
  approvalData: any;
  workflowTitle: string;
  requesterName: string;
  priority: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      approvalId, 
      approverEmail, 
      approverName, 
      approvalData, 
      workflowTitle,
      requesterName,
      priority 
    }: ApprovalEmailRequest = await req.json();

    // Gerar tokens de aprovação seguros
    const approveToken = await supabase.rpc('generate_approval_token');
    const rejectToken = await supabase.rpc('generate_approval_token');

    // Hash dos tokens para armazenamento seguro
    const encoder = new TextEncoder();
    const approveTokenHash = await crypto.subtle.digest('SHA-256', encoder.encode(approveToken.data));
    const rejectTokenHash = await crypto.subtle.digest('SHA-256', encoder.encode(rejectToken.data));
    
    const approveHashHex = Array.from(new Uint8Array(approveTokenHash))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const rejectHashHex = Array.from(new Uint8Array(rejectTokenHash))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    // Armazenar tokens no banco
    await supabase.from('approval_tokens').insert([
      {
        approval_id: approvalId,
        token_hash: approveHashHex,
        action: 'approve',
        created_by: approvalData.triggered_by
      },
      {
        approval_id: approvalId,
        token_hash: rejectHashHex,
        action: 'reject',
        created_by: approvalData.triggered_by
      }
    ]);

    const siteUrl = Deno.env.get('SITE_URL') || 'https://nahyrexnxhzutfeqxjte.lovable.app';
    const approveUrl = `${siteUrl}/approve?token=${approveToken.data}&action=approve`;
    const rejectUrl = `${siteUrl}/approve?token=${rejectToken.data}&action=reject`;

    const priorityColor = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#10b981';
    const priorityText = priority === 'high' ? 'Alta' : priority === 'medium' ? 'Média' : 'Baixa';

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap" rel="stylesheet" />
    <title>Nova Aprovação Pendente – Aksell Nutrition</title>
    <style>
      :root {
        --color-primary: #FC5D33;
        --color-dark: #540E21;
        --color-light-bg: #F9F5F2;
        --color-text-main: #333333;
        --color-text-secondary: #666666;
        --color-button-hover: #e14d1a;
      }

      body {
        margin: 0;
        padding: 0;
        background: var(--color-light-bg);
        font-family: 'Sora', Arial, sans-serif;
      }

      .wrapper {
        width: 100%;
        padding: 24px 0;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
      }

      .top-bar {
        height: 6px;
        background: var(--color-dark);
      }

      .header {
        padding: 32px 24px;
        text-align: left;
        border-bottom: 1px solid #f0f0f0;
      }

      .aksell-logo {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .aksell-logo .name {
        font-size: 22px;
        font-weight: 700;
        color: var(--color-primary);
        line-height: 1;
      }

      .tagline {
        margin-top: 8px;
        font-size: 14px;
        color: var(--color-dark);
        font-weight: 600;
      }

      .content {
        padding: 32px 24px;
        color: var(--color-text-main);
        font-size: 16px;
        line-height: 1.6;
      }

      .title {
        font-size: 24px;
        font-weight: 700;
        color: var(--color-dark);
        margin-bottom: 16px;
      }

      .approval-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
        margin: 24px 0;
        border-left: 4px solid var(--color-primary);
      }

      .priority-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 16px;
        background-color: ${priorityColor};
        color: white;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #e2e8f0;
      }

      .detail-row:last-child {
        border-bottom: none;
      }

      .detail-label {
        font-weight: 600;
        color: var(--color-text-main);
      }

      .detail-value {
        color: var(--color-text-secondary);
      }

      .button-container {
        text-align: center;
        margin: 32px 0;
      }

      .button {
        display: inline-block;
        padding: 14px 28px;
        margin: 0 8px;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.2s ease;
      }

      .btn-approve {
        background-color: #10b981;
        color: white;
      }

      .btn-reject {
        background-color: var(--color-primary);
        color: white;
      }

      .footer {
        background: var(--color-light-bg);
        padding: 24px;
        text-align: center;
        font-size: 12px;
        color: var(--color-text-secondary);
      }

      @media only screen and (max-width: 600px) {
        .container {
          margin: 0 16px;
        }
        .header {
          padding: 24px 20px;
        }
        .content {
          padding: 24px 20px;
        }
        .detail-row {
          flex-direction: column;
          gap: 4px;
        }
        .button {
          display: block;
          margin: 8px 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="top-bar"></div>
        <div class="header">
          <div class="aksell-logo">
            <img src="https://i.postimg.cc/TRzcNJD3/aksell-assina-princ-color-rgb-2000px-72ppi-removebg.png" alt="Aksell Nutrition" style="height:40px;width:auto;" />
            <div>
              <div class="name">Aksell Nutrition</div>
            </div>
          </div>
          <div class="tagline">Inovação e excelência em nutrição.</div>
        </div>
        <div class="content">
          <div class="title">Nova Aprovação Pendente</div>
          <p>Olá, <strong>${approverName}</strong>!</p>
          <p>Você recebeu uma nova solicitação de aprovação que requer sua atenção.</p>
          
          <div class="approval-card">
            <div class="priority-badge">
              Prioridade: ${priorityText}
            </div>
            
            <h3 style="margin: 0 0 16px 0; color: var(--color-dark);">${workflowTitle}</h3>
            
            <div class="detail-row">
              <span class="detail-label">Solicitante:</span>
              <span class="detail-value">${requesterName}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Data da Solicitação:</span>
              <span class="detail-value">${new Date().toLocaleDateString('pt-BR')}</span>
            </div>
            
            ${approvalData.description ? `
            <div style="margin-top: 16px;">
              <div class="detail-label">Descrição:</div>
              <div style="background-color: white; padding: 12px; border-radius: 6px; margin-top: 8px; border-left: 4px solid var(--color-primary);">
                ${approvalData.description}
              </div>
            </div>
            ` : ''}
          </div>
          
          <div class="button-container">
            <a href="${approveUrl}" class="button btn-approve">✓ Aprovar</a>
            <a href="${rejectUrl}" class="button btn-reject">✗ Rejeitar</a>
          </div>
          
          <p style="font-size: 14px; color: #9CA3AF;">
            Se os botões acima não funcionarem, copie e cole os links no seu navegador:<br />
            <strong>Aprovar:</strong> <span style="font-family: monospace; word-break: break-all; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${approveUrl}</span><br />
            <strong>Rejeitar:</strong> <span style="font-family: monospace; word-break: break-all; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${rejectUrl}</span>
          </p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Aksell Nutrition<br />
          Este é um e‑mail automático. Para dúvidas ou suporte, entre em contato com nossa equipe.<br />
          Indaiatuba, São Paulo, Brasil
        </div>
      </div>
    </div>
  </body>
</html>
    `;

    const { error } = await resend.emails.send({
      from: 'Sistema de Workflow <noreply@aksell.com.br>',
      to: [approverEmail],
      subject: `🔔 Nova Aprovação: ${workflowTitle} (Prioridade ${priorityText})`,
      html: html,
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }

    console.log(`Email de aprovação enviado para ${approverEmail}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email de aprovação enviado com sucesso',
      tokens: { approve: approveHashHex.substring(0, 8), reject: rejectHashHex.substring(0, 8) }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-approval-email function:', error);
    return new Response(JSON.stringify({ 
      error: getErrorMessage(error),
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);