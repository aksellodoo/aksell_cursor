import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FormNotificationRequest {
  form_id: string;
  publication_data: {
    publication_status: string;
    internal_recipients: {
      specificUsers: string[];
      departmentSelections: string[];
      roleSelections: string[];
    };
    external_recipients: Array<{
      name: string;
      email: string;
      password: string;
    }>;
  };
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

    const { form_id, publication_data }: FormNotificationRequest = await req.json();

    // Buscar dados do formulário
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', form_id)
      .single();

    if (formError) throw formError;

    const notifications = [];

    // Notificar usuários internos
    if (publication_data.publication_status === 'published_internal' || 
        publication_data.publication_status === 'published_mixed') {
      
      // Notificar usuários específicos
      for (const userId of publication_data.internal_recipients.specificUsers) {
        notifications.push({
          user_id: userId,
          type: 'form_published',
          title: 'Novo formulário disponível',
          message: `O formulário "${form.title}" foi publicado e está disponível para preenchimento.`,
          data: {
            form_id: form_id,
            form_title: form.title,
            form_description: form.description,
            publication_status: publication_data.publication_status
          }
        });
      }

      // Notificar por departamentos
      if (publication_data.internal_recipients.departmentSelections.length > 0) {
        const { data: departmentUsers } = await supabase
          .from('profiles')
          .select('id')
          .in('department_id', publication_data.internal_recipients.departmentSelections)
          .eq('status', 'active');

        if (departmentUsers) {
          for (const user of departmentUsers) {
            notifications.push({
              user_id: user.id,
              type: 'form_published',
              title: 'Novo formulário do seu departamento',
              message: `O formulário "${form.title}" foi publicado para o seu departamento.`,
              data: {
                form_id: form_id,
                form_title: form.title,
                form_description: form.description,
                publication_status: publication_data.publication_status
              }
            });
          }
        }
      }

      // Notificar por funções
      if (publication_data.internal_recipients.roleSelections.length > 0) {
        const { data: roleUsers } = await supabase
          .from('profiles')
          .select('id')
          .in('role', publication_data.internal_recipients.roleSelections)
          .eq('status', 'active');

        if (roleUsers) {
          for (const user of roleUsers) {
            notifications.push({
              user_id: user.id,
              type: 'form_published',
              title: 'Novo formulário para sua função',
              message: `O formulário "${form.title}" foi publicado para usuários com sua função.`,
              data: {
                form_id: form_id,
                form_title: form.title,
                form_description: form.description,
                publication_status: publication_data.publication_status
              }
            });
          }
        }
      }
    }

    // Inserir notificações no banco
    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('app_notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error inserting notifications:', notificationError);
      }
    }

    // Send Telegram notifications to users who have it enabled
    let telegramNotificationsSent = 0;
    for (const notification of notifications) {
      try {
        // Get user's Telegram preferences and chat_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('telegram_chat_id, telegram_username, notification_telegram, notification_types')
          .eq('id', notification.user_id)
          .single();

        if (profile?.telegram_chat_id && 
            profile.notification_telegram && 
            profile.notification_types?.forms?.telegram !== false) {
          
          // Send Telegram notification
          const telegramResponse = await supabase.functions.invoke('send-telegram-notification', {
            body: {
              chat_id: profile.telegram_chat_id,
              title: notification.title,
              message: notification.message,
              notification_type: 'form_published',
              data: notification.data
            }
          });

          if (!telegramResponse.error) {
            telegramNotificationsSent++;
          }
        }
      } catch (error) {
        console.error('Error sending Telegram notification:', error);
      }
    }

    // TODO: Enviar emails para destinatários externos (se configurado)
    if (publication_data.external_recipients.length > 0) {
      console.log('External recipients email sending not implemented yet');
      // Aqui seria a integração com Resend ou outro serviço de email
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_sent: notifications.length,
        telegram_notifications_sent: telegramNotificationsSent,
        external_recipients: publication_data.external_recipients.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-form-notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);