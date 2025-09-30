import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userEmail: string;
  userName: string;
  userId: string;
  createdBy?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, userId, createdBy }: WelcomeEmailRequest = await req.json();

    console.log('Sending welcome email to:', userEmail);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate custom password reset token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Create SHA-256 hash of the token
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const tokenHash = Array.from(new Uint8Array(hashBuffer), byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');

    // Validate createdBy as UUID if provided
    let validatedCreatedBy = null;
    if (createdBy) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(createdBy)) {
        validatedCreatedBy = createdBy;
      }
    }

    // Insert token into password_reset_tokens table
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        reset_type: 'new_user',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        created_by: validatedCreatedBy
      });

    if (tokenError) {
      console.error('Error creating password reset token:', tokenError);
      throw new Error(`Failed to create password reset token: ${tokenError.message}`);
    }

    // Create custom reset link to our application
    const resetLink = `https://aksell.com.br/definir-senha?token=${token}`;
    
    console.log('Generated custom reset link:', resetLink);

    // Enhanced welcome email template
    const { error: emailError } = await resend.emails.send({
      from: 'Sistema Aksell <noreply@aksell.com.br>',
      to: [userEmail],
      subject: 'Bem-vindo(a) à Aksell Nutrition',
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap" rel="stylesheet" />
    <title>Bem-vindo à Aksell Nutrition</title>
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
        color: var(--color-text-secondary);
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

      .credentials-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        margin: 20px 0;
        border-left: 4px solid var(--color-primary);
      }

      .security-note {
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 8px;
        padding: 16px;
        margin: 20px 0;
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
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="top-bar"></div>
        <div class="header" style="text-align: center;">
          <div style="display: inline-block;">
            <img src="https://i.postimg.cc/TRzcNJD3/aksell-assina-princ-color-rgb-2000px-72ppi-removebg.png" alt="Aksell" style="height:50px;width:auto;" />
          </div>
          <div class="tagline" style="color: #8B4513; margin-top: 12px;">transformando o simples em singular</div>
        </div>
        <div class="content">
          <div class="title">Bem-vindo à Aksell Nutrition!</div>
          <p>Olá, <strong>${userName}</strong>!</p>
          <p>Sua solicitação de acesso à Aksell Nutrition foi <strong>aprovada</strong>!</p>
          
          <p>Para começar a usar o sistema, você precisa configurar sua senha de acesso. Clique no botão abaixo:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: var(--color-primary); 
                      color: white; 
                      text-decoration: none; 
                      padding: 16px 32px; 
                      border-radius: 8px; 
                      font-weight: 600; 
                      display: inline-block; 
                      font-size: 16px;
                      transition: background-color 0.3s ease;">
              🔐 Configurar Minha Senha
            </a>
          </div>
          
          <div class="credentials-box">
            <h3 style="margin: 0 0 16px 0; color: var(--color-dark);">📧 Suas Credenciais de Acesso:</h3>
            <p><strong>Email de login:</strong> ${userEmail}</p>
            <p><strong>Senha:</strong> Será definida por você no próximo passo</p>
          </div>
          
          <div class="security-note">
            <h4 style="margin: 0 0 12px 0; color: #92400e;">🔒 Importante - Configuração da Senha:</h4>
            <ul style="margin: 0; color: #92400e;">
              <li>O link de configuração de senha <strong>expira em 24 horas</strong></li>
              <li>Use uma senha forte com pelo menos 10 caracteres</li>
              <li>Inclua letras maiúsculas, minúsculas, números e símbolos</li>
              <li>Nunca compartilhe suas credenciais com terceiros</li>
              <li>Mantenha suas informações de acesso em local seguro</li>
            </ul>
          </div>
          
          <h3 style="color: var(--color-dark);">🚀 Próximos passos:</h3>
          <ol>
            <li>Clique no botão "Configurar Minha Senha" acima</li>
            <li>Defina uma senha segura para sua conta</li>
            <li>Faça login no sistema com seu email e nova senha</li>
            <li>Complete seu perfil com suas informações</li>
            <li>Explore as funcionalidades disponíveis no sistema</li>
          </ol>
          
          <p>Se você encontrar qualquer dificuldade ou tiver dúvidas, entre em contato com o suporte técnico.</p>
          
          <p><strong>Data de criação da conta:</strong> ${new Intl.DateTimeFormat('pt-BR', { 
            timeZone: 'America/Sao_Paulo', 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          }).format(new Date())}</p>
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
      `,
    });

    if (emailError) {
      console.error('Error sending welcome email:', emailError);
      throw new Error(`Failed to send welcome email: ${emailError.message}`);
    }

    console.log('Welcome email sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully' 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);