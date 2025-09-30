import React from 'react';
import { Bell, BellOff, Check, CheckCheck, Trash2, ArrowRight, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface NotificationCenterProps {
  trigger?: React.ReactNode;
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  trigger, 
  className = "" 
}) => {
  const { 
    notifications, 
    unreadCount, 
    loading,
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  const navigate = useNavigate();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return '🏷️';
      case 'chatter_message':
        return '📨';
      case 'reply':
        return '↩️';
      case 'change':
        return '🔄';
      case 'assignment':
        return '📋';
      case 'workflow_approval':
        return '✅';
      case 'workflow_approved':
        return '✅';
      case 'workflow_rejected':
        return '❌';
      case 'document_expiry':
        return '📄';
      default:
        return '🔔';
    }
  };

  const handleNavigateToChatter = (notification: any) => {
    const { data } = notification;
    if (data?.navigation_url && data?.record_id) {
      // Marcar como lida primeiro
      if (!notification.is_read) {
        markAsRead(notification.id);
      }
      
      // Navegar para a página
      navigate(data.navigation_url);
      
      // Aqui poderíamos implementar lógica para abrir o chatter específico
      // Por enquanto navegamos para a página correspondente
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="relative">
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 text-xs flex items-center justify-center p-0"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <h3 className="font-semibold text-foreground">Notificações</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">
              <div className="animate-pulse">Carregando notificações...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 transition-colors ${
                    !notification.is_read 
                      ? 'bg-accent/30 border-l-4 border-l-primary' 
                      : 'hover:bg-accent/20'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="text-xl flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-medium leading-snug ${
                          !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.title}
                        </h4>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Marcar como lida"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title="Excluir notificação"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {notification.data?.record_name && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <span className="font-medium">{notification.data.page_name}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span>{notification.data.record_name}</span>
                        </div>
                      )}
                      
                      {notification.message && (
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                          "{notification.message}"
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                        
                        {(notification.type === 'mention' || notification.type === 'chatter_message') && 
                         notification.data?.navigation_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNavigateToChatter(notification)}
                            className="text-xs h-7 px-3"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Ver Conversa
                          </Button>
                        )}
                        
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-3 border-t bg-muted/30">
            <p className="text-xs text-center text-muted-foreground">
              {notifications.length} notificação{notifications.length !== 1 ? 'ões' : ''} 
              {unreadCount > 0 && ` • ${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};