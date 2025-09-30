import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExternalAuthRequest {
  email: string;
  password: string;
  form_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      // Login
      const { email, password, form_id }: ExternalAuthRequest = await req.json();

      // Rate limiting: block brute-force by IP/email within 10 minutes
      const clientIpHeader = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '';
      const clientIp = clientIpHeader.split(',')[0].trim() || 'unknown';
      const enc = new TextEncoder();
      const ipHashBytes = await crypto.subtle.digest('SHA-256', enc.encode(clientIp));
      const ipHash = Array.from(new Uint8Array(ipHashBytes)).map(b => b.toString(16).padStart(2, '0')).join('');
      const emailLc = email.toLowerCase();
      const windowStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const { count: ipFails } = await supabase
        .from('form_external_login_attempts')
        .select('id', { head: true, count: 'exact' })
        .eq('ip_hash', ipHash)
        .eq('success', false)
        .gte('attempted_at', windowStart);

      const { count: emailFails } = await supabase
        .from('form_external_login_attempts')
        .select('id', { head: true, count: 'exact' })
        .eq('email_lower', emailLc)
        .eq('success', false)
        .gte('attempted_at', windowStart);

      if ((ipFails ?? 0) >= 10 || (emailFails ?? 0) >= 5) {
        return new Response(
          JSON.stringify({ error: 'Muitas tentativas. Tente novamente mais tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar destinatário externo
      let query = supabase
        .from('form_external_recipients')
        .select('*, forms!inner(*)')
        .eq('email', email.toLowerCase())
        .eq('is_active', true);

      if (form_id) {
        query = query.eq('form_id', form_id);
      }

      const { data: recipients, error } = await query;

      if (error) throw error;

      if (!recipients || recipients.length === 0) {
        // Log failed attempt
        await supabase
          .from('form_external_login_attempts')
          .insert({ email_lower: emailLc, ip_hash: ipHash, user_agent: req.headers.get('user-agent') || null, form_id: form_id || null, success: false });
        return new Response(
          JSON.stringify({ error: 'Credenciais inválidas' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Verificar senha usando a função verify_password
      let validRecipient = null;
      for (const recipient of recipients) {
        if (!recipient.password_hash) {
          console.warn(`Recipient ${recipient.email} has no password hash`);
          continue;
        }

        const { data: passwordValid } = await supabase.rpc('verify_password', {
          stored_hash: recipient.password_hash,
          provided_password: password
        });

        if (passwordValid) {
          validRecipient = recipient;
          break;
        }
      }

      if (!validRecipient) {
        // Log failed attempt
        await supabase
          .from('form_external_login_attempts')
          .insert({ email_lower: emailLc, ip_hash: ipHash, user_agent: req.headers.get('user-agent') || null, form_id: form_id || null, success: false });
        return new Response(
          JSON.stringify({ error: 'Credenciais inválidas' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Gerar token de sessão
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      // Criar sessão
      const { error: sessionError } = await supabase
        .from('form_external_sessions')
        .insert({
          recipient_id: validRecipient.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        });

      if (sessionError) throw sessionError;

      // Atualizar estatísticas do destinatário
      await supabase
        .from('form_external_recipients')
        .update({
          last_access: new Date().toISOString(),
          access_count: (validRecipient.access_count || 0) + 1
        })
        .eq('id', validRecipient.id);

      // Log successful attempt (non-blocking)
      await supabase
        .from('form_external_login_attempts')
        .insert({ email_lower: emailLc, ip_hash: ipHash, user_agent: req.headers.get('user-agent') || null, form_id: validRecipient.form_id || form_id || null, success: true });

      return new Response(
        JSON.stringify({
          success: true,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          recipient: {
            id: validRecipient.id,
            name: validRecipient.name,
            email: validRecipient.email
          },
          form: {
            id: validRecipient.forms.id,
            title: validRecipient.forms.title,
            description: validRecipient.forms.description
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } else if (req.method === 'GET') {
      // Verificar sessão
      const url = new URL(req.url);
      const sessionToken = url.searchParams.get('session_token');

      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: 'Token de sessão requerido' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: session, error } = await supabase
        .from('form_external_sessions')
        .select(`
          *,
          form_external_recipients!inner(
            *,
            forms!inner(*)
          )
        `)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error || !session) {
        return new Response(
          JSON.stringify({ error: 'Sessão inválida ou expirada' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          valid: true,
          recipient: {
            id: session.form_external_recipients.id,
            name: session.form_external_recipients.name,
            email: session.form_external_recipients.email
          },
          form: {
            id: session.form_external_recipients.forms.id,
            title: session.form_external_recipients.forms.title,
            description: session.form_external_recipients.forms.description,
            fields_definition: session.form_external_recipients.forms.fields_definition
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } else if (req.method === 'DELETE') {
      // Logout
      const { session_token } = await req.json();

      if (session_token) {
        await supabase
          .from('form_external_sessions')
          .update({ is_active: false })
          .eq('session_token', session_token);
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in external-form-auth function:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);