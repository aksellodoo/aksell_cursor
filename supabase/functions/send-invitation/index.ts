import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getErrorMessage } from '../_shared/errorUtils.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  name: string;
  role: string;
  department: string;
  department_id: string;
  is_employee: boolean;
  employee_id: string | null;
  company_relationship: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, name, role, department, department_id, is_employee, employee_id, company_relationship }: InvitationRequest = await req.json();

    console.log("Processing invitation for:", { email, name, role, department, is_employee, employee_id, company_relationship });

    // Use admin API to invite user - this generates a proper invitation token
    const { data: authData, error: authError } = await supabaseClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          name,
          role,
          department,
          department_id,
          employee_id,
          company_relationship
        },
        redirectTo: `${Deno.env.get("SITE_URL")}/auth/complete-signup`
      }
    );

    if (authError) {
      console.error("Error inviting user:", authError);
      return new Response(
        JSON.stringify({ error: "Failed to invite user", details: authError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Determine user status description
    let statusDescription = "";
    if (is_employee && employee_id) {
      // Get employee info
      const { data: employeeData } = await supabaseClient
        .from('employees')
        .select('full_name, position')
        .eq('id', employee_id)
        .single();
      
      if (employeeData) {
        statusDescription = `Funcionário: ${employeeData.full_name} - ${employeeData.position}`;
      }
    } else if (company_relationship) {
      statusDescription = `Relação: ${company_relationship}`;
    }

    // For admin.inviteUserByEmail, the invitation link will be sent automatically by Supabase
    // We'll create our custom link that will work with the token from the URL
    const invitationLink = `${Deno.env.get("SITE_URL")}/auth/complete-signup`;

    // Send custom invitation email with improved Ficha Certa design
    const emailResponse = await resend.emails.send({
      from: "Sistema Aksell <noreply@aksell.com.br>",
      to: [email],
      subject: "Convite para acessar a Aksell Nutrition",
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap" rel="stylesheet" />
    <title>Convite para a Aksell Nutrition</title>
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

      .details-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        margin: 24px 0;
        border-left: 4px solid var(--color-primary);
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #e2e8f0;
      }

      .detail-item:last-child {
        border-bottom: none;
      }

      .detail-label {
        font-weight: 500;
        color: var(--color-text-secondary);
      }

      .detail-value {
        font-weight: 600;
        color: var(--color-text-main);
      }

      .button-container {
        text-align: center;
        margin: 32px 0;
      }

      .button {
        background: var(--color-primary);
        color: #ffffff;
        text-decoration: none;
        padding: 14px 32px;
        border-radius: 8px;
        font-weight: 600;
        display: inline-block;
        transition: background 0.2s ease;
      }

      .button:hover {
        background: var(--color-button-hover);
      }

      .note {
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 8px;
        padding: 16px;
        margin: 24px 0;
        color: #92400e;
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
        .detail-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
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
          <div class="title">Convite para a Aksell Nutrition</div>
          <p>Olá, <strong>${name}</strong>!</p>
          <p>Você foi convidado para fazer parte da Aksell Nutrition, nossa plataforma de gestão de recursos humanos. Estamos felizes em tê-lo em nossa equipe!</p>
          
          <div class="details-card">
            <h3 style="margin: 0 0 16px 0; color: var(--color-dark);">Seus dados de acesso</h3>
            <div class="detail-item">
              <span class="detail-label">Nome</span>
              <span class="detail-value">${name}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email</span>
              <span class="detail-value">${email}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Função</span>
              <span class="detail-value">${role}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Departamento</span>
              <span class="detail-value">${department}</span>
            </div>
            ${statusDescription ? `
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value">${statusDescription}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="button-container">
            <a href="${invitationLink}" class="button">Ativar minha conta</a>
          </div>
          
          <div class="note">
            <strong>Próximos passos:</strong> Clique no botão acima para definir sua senha e acessar a plataforma. Você terá acesso completo às funcionalidades conforme seu perfil.
          </div>
          
          <p style="font-size: 14px; color: #9CA3AF;">
            Se o botão acima não funcionar, copie e cole este link no seu navegador:<br />
            <span style="font-family: monospace; word-break: break-all; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${invitationLink}</span>
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
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Convite enviado com sucesso",
        user_id: authData.user?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: getErrorMessage(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);