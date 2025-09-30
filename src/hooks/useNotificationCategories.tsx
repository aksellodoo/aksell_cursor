import { useMemo } from 'react';
import { useNotifications } from './useNotifications';

export interface NotificationCounts {
  all: number;
  mentions: number;
  system: number;
}

export const useNotificationCategories = () => {
  const { notifications, unreadCount } = useNotifications();

  const categorizedNotifications = useMemo(() => {
    return {
      all: notifications,
      mentions: notifications.filter(n => 
        n.type.includes('mention') || 
        n.type.includes('chatter')
      ),
      system: notifications.filter(n => 
        !['mention', 'chatter'].some(type => 
          n.type.includes(type)
        )
      )
    };
  }, [notifications]);

  const unreadCounts: NotificationCounts = useMemo(() => {
    return {
      all: unreadCount,
      mentions: categorizedNotifications.mentions.filter(n => !n.is_read).length,
      system: categorizedNotifications.system.filter(n => !n.is_read).length
    };
  }, [notifications, unreadCount, categorizedNotifications]);

  return {
    categorizedNotifications,
    unreadCounts,
    totalUnread: unreadCounts.all
  };
};