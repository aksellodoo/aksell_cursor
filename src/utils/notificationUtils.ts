import { supabase } from '@/integrations/supabase/client';

export interface NotificationData {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

export interface NotificationChannels {
  app?: boolean;
  email?: boolean;
  telegram?: boolean;
  whatsapp?: boolean;
}

/**
 * Função utilitária para enviar notificações através de múltiplos canais
 */
export const sendNotification = async (
  notification: NotificationData,
  channels: NotificationChannels = { app: true, email: false, telegram: false, whatsapp: false }
) => {
  const results = {
    app: { success: false, error: null as any },
    email: { success: false, error: null as any },
    telegram: { success: false, error: null as any },
    whatsapp: { success: false, error: null as any }
  };

  try {
    // 1. Buscar preferências do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id, name, email, 
        notification_app, notification_email, notification_telegram, notification_whatsapp,
        notification_types, telegram_chat_id, whatsapp_verified, whatsapp_phone
      `)
      .eq('id', notification.user_id)
      .single();

    if (profileError) {
      throw profileError;
    }

    // 2. Enviar notificação no app (se habilitado)
    if (channels.app && profile.notification_app) {
      try {
        const { error: appError } = await supabase
          .from('app_notifications')
          .insert([notification]);

        if (appError) {
          results.app.error = appError;
        } else {
          results.app.success = true;
        }
      } catch (error) {
        results.app.error = error;
      }
    }

    // 3. Enviar por email (se habilitado e configurado)
    if (channels.email && profile.notification_email) {
      try {
        // Verificar se o tipo de notificação específico está habilitado para email
        const notificationTypes = profile.notification_types || {};
        const typeConfig = notificationTypes[notification.type];
        
        const emailEnabled = typeConfig?.email !== false;
        
        if (emailEnabled) {
          const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
            body: {
              to: profile.email,
              subject: notification.title,
              message: notification.message,
              notification_type: notification.type,
              data: notification.data
            }
          });

          if (emailError) {
            results.email.error = emailError;
          } else {
            results.email.success = true;
          }
        }
      } catch (error) {
        results.email.error = error;
      }
    }

    // 4. Enviar por Telegram (se habilitado e configurado)
    if (channels.telegram && 
        profile.notification_telegram && 
        profile.telegram_chat_id) {
      try {
        // Verificar se o tipo de notificação específico está habilitado para telegram
        const notificationTypes = profile.notification_types || {};
        const typeConfig = notificationTypes[notification.type];
        
        const telegramEnabled = typeConfig?.telegram !== false;
        
        if (telegramEnabled) {
          const { error: telegramError } = await supabase.functions.invoke('send-telegram-notification', {
            body: {
              chat_id: profile.telegram_chat_id,
              title: notification.title,
              message: notification.message,
              notification_type: notification.type,
              data: notification.data
            }
          });

          if (telegramError) {
            results.telegram.error = telegramError;
          } else {
            results.telegram.success = true;
          }
        }
      } catch (error) {
        results.telegram.error = error;
      }
    }

    // 5. Enviar por WhatsApp (se habilitado e configurado)
    if (channels.whatsapp && 
        profile.notification_whatsapp && 
        profile.whatsapp_verified) {
      try {
        // Verificar se o tipo de notificação específico está habilitado para WhatsApp
        const notificationTypes = profile.notification_types || {};
        const typeConfig = notificationTypes[notification.type];
        
        const whatsappEnabled = typeConfig?.whatsapp !== false;
        
        if (whatsappEnabled) {
          const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp-message', {
            body: {
              userId: profile.id,
              message: `*${notification.title}*\n\n${notification.message}\n\n---\n*Aksell Nutrition*`
            }
          });

          if (whatsappError) {
            results.whatsapp.error = whatsappError;
          } else {
            results.whatsapp.success = true;
          }
        }
      } catch (error) {
        results.whatsapp.error = error;
      }
    }

  } catch (error) {
    console.error('Error in sendNotification:', error);
    results.app.error = error;
    results.email.error = error;
    results.telegram.error = error;
    results.whatsapp.error = error;
  }

  return results;
};

/**
 * Função para enviar notificações em massa para múltiplos usuários
 */
export const sendBulkNotifications = async (
  notifications: NotificationData[],
  channels: NotificationChannels = { app: true, email: false, telegram: false, whatsapp: false }
) => {
  const results = [];
  
  for (const notification of notifications) {
    const result = await sendNotification(notification, channels);
    results.push({
      user_id: notification.user_id,
      ...result
    });
  }
  
  return results;
};

/**
 * Tipos de notificação suportados
 */
export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed', 
  TASK_DUE_SOON: 'task_due_soon',
  APPROVAL_REQUEST: 'approval_request',
  APPROVAL_APPROVED: 'approval_approved',
  APPROVAL_REJECTED: 'approval_rejected',
  ACCESS_REQUEST: 'access_request',
  CHATTER_MESSAGE: 'chatter_message',
  MENTION: 'mention',
  FORM_PUBLISHED: 'form_published',
  DOCUMENT_EXPIRY: 'document_expiry',
  SHARE_EXPIRED: 'share_expired',
  WORKFLOW_NOTIFICATION: 'workflow_notification',
  SYSTEM_TEST: 'system_test'
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];