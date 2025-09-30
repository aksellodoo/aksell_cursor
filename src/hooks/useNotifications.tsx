import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('app_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('app_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('app_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('app_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Show browser notification (guarded)
  const showBrowserNotification = (title: string, message: string, data?: any) => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      const n = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        tag: (data && (data.id || data.tag)) || 'general'
      });

      n.onclick = () => {
        window.focus();
        // Optionally navigate using data payload
        n.close();
      };
    } catch (e) {
      console.warn('Browser notifications are not available:', e);
    }
  };
  // Request notification permission (guarded)
  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as AppNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show browser notification
          showBrowserNotification(newNotification.title, newNotification.message, newNotification.data);

          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Test Telegram notification
  const testTelegramNotification = async () => {
    if (!user) return;

    try {
      // First, get the user's telegram chat_id from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('telegram_chat_id, name')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.telegram_chat_id) {
        toast({
          title: "Telegram não vinculado",
          description: "Você precisa vincular sua conta ao Telegram primeiro.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
        body: {
          chat_id: profile.telegram_chat_id,
          title: 'Teste de Notificação - FichaCerta',
          message: `Olá ${profile.name}! Esta é uma notificação de teste do FichaCerta. Sua conta está funcionando perfeitamente! 🎉`,
          notification_type: 'system_test',
          data: { test: true, user_id: user.id }
        }
      });

      if (error) throw error;

      toast({
        title: "Teste enviado com sucesso!",
        description: "Verifique seu Telegram para ver a notificação de teste.",
      });
    } catch (error) {
      console.error('Error testing Telegram notification:', error);
      toast({
        title: "Erro no teste",
        description: "Verifique se sua conta está vinculada ao Telegram corretamente.",
        variant: "destructive",
      });
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    requestNotificationPermission,
    testTelegramNotification
  };
};