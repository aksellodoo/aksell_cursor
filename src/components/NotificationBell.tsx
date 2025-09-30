import React, { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModernNotificationCenter } from './ModernNotificationCenter';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationCategories } from '@/hooks/useNotificationCategories';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  variant = "outline",
  size = "icon", 
  className
}) => {
  const { requestNotificationPermission } = useNotifications();
  const { totalUnread } = useNotificationCategories();

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <ModernNotificationCenter
      trigger={
        <Button 
          variant={variant} 
          size={size} 
          className={cn(
            "relative group rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-primary",
            className
          )}
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4 transition-transform group-hover:scale-110" />
          {totalUnread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 text-xs flex items-center justify-center p-0 animate-pulse border-2 border-background"
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </Badge>
          )}
        </Button>
      }
    />
  );
};