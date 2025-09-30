import React, { useState } from 'react';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  ArrowRight, 
  MessageCircle, 
  X,
  Filter,
  MoreHorizontal,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationCategories } from '@/hooks/useNotificationCategories';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface ModernNotificationCenterProps {
  trigger?: React.ReactNode;
  className?: string;
}

type NotificationType = 'all' | 'mentions' | 'system';

export const ModernNotificationCenter: React.FC<ModernNotificationCenterProps> = ({ 
  trigger, 
  className = "" 
}) => {
  const { 
    loading,
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  const { categorizedNotifications, unreadCounts, totalUnread } = useNotificationCategories();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<NotificationType>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'workflow_approval':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'workflow_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'workflow_rejected':
        return <X className="h-4 w-4 text-red-500" />;
      case 'correction_requested':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'mention':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'chatter_message':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'document_expiry':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'access_request':
        return <User className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (type: string) => {
    switch (type) {
      case 'workflow_approval':
      case 'correction_requested':
        return 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20';
      case 'workflow_rejected':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20';
      case 'workflow_approved':
        return 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20';
      case 'mention':
      case 'chatter_message':
        return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
      default:
        return 'border-l-muted-foreground/20 bg-muted/20';
    }
  };

  const handleNotificationAction = (notification: any, action: 'navigate' | 'approve' | 'reject') => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    switch (action) {
      case 'navigate':
        if (notification.data?.navigation_url) {
          navigate(notification.data.navigation_url);
        }
        break;
    }
  };

  const renderNotificationCard = (notification: any) => (
    <Card 
      key={notification.id}
      className={`mb-3 transition-all duration-200 hover:shadow-md border-l-4 ${
        !notification.is_read 
          ? getPriorityColor(notification.type)
          : 'border-l-muted-foreground/20 bg-muted/10'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className={`text-sm font-semibold leading-tight ${
                !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {notification.title}
              </h4>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!notification.is_read && (
                    <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                      <Check className="h-4 w-4 mr-2" />
                      Marcar como lida
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => deleteNotification(notification.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {notification.data?.record_name && (
              <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                <span className="font-medium">{notification.data.page_name}</span>
                <ArrowRight className="h-3 w-3" />
                <span>{notification.data.record_name}</span>
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              {notification.message}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>

              <div className="flex gap-2">
                {(notification.type === 'mention' || notification.type === 'chatter_message') && 
                 notification.data?.navigation_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNotificationAction(notification, 'navigate')}
                    className="text-xs h-7 px-3"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Ver Conversa
                  </Button>
                )}

                {notification.data?.navigation_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNotificationAction(notification, 'navigate')}
                    className="text-xs h-7 px-3"
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Abrir
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="relative">
      <Bell className="h-5 w-5" />
      {totalUnread > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 text-xs flex items-center justify-center p-0 animate-pulse"
        >
          {totalUnread > 99 ? '99+' : totalUnread}
        </Badge>
      )}
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[420px] p-0 max-h-[600px]">
        <div className="sticky top-0 bg-background border-b z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <h3 className="font-semibold text-foreground">Notificações</h3>
              {totalUnread > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totalUnread}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {totalUnread > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Todas lidas
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as NotificationType)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-none bg-muted/50">
              <TabsTrigger value="all" className="text-xs relative overflow-visible">
                Todas
                {unreadCounts.all > 0 && (
                  <Badge variant="destructive" className="absolute -top-3 -right-3 h-6 w-6 text-xs font-bold flex items-center justify-center p-0 border-2 border-background shadow-lg animate-pulse z-20">
                    {unreadCounts.all > 99 ? '99+' : unreadCounts.all}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="mentions" className="text-xs relative overflow-visible">
                Menções
                {unreadCounts.mentions > 0 && (
                  <Badge variant="destructive" className="absolute -top-3 -right-3 h-6 w-6 text-xs font-bold flex items-center justify-center p-0 border-2 border-background shadow-lg animate-pulse z-20">
                    {unreadCounts.mentions > 99 ? '99+' : unreadCounts.mentions}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="system" className="text-xs relative overflow-visible">
                Sistema
                {unreadCounts.system > 0 && (
                  <Badge variant="destructive" className="absolute -top-3 -right-3 h-6 w-6 text-xs font-bold flex items-center justify-center p-0 border-2 border-background shadow-lg animate-pulse z-20">
                    {unreadCounts.system > 99 ? '99+' : unreadCounts.system}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="max-h-[400px]">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando notificações...</p>
            </div>
          ) : (
            <Tabs value={selectedTab} className="w-full">
              {(['all', 'mentions', 'system'] as NotificationType[]).map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-0">
                  <ScrollArea className="h-[400px]">
                    <div className="p-3 space-y-0">
                      {categorizedNotifications[tab].length === 0 ? (
                        <div className="p-8 text-center">
                          <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">
                            {tab === 'all' ? 'Nenhuma notificação' : `Nenhuma notificação de ${tab}`}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-0 group">
                          {categorizedNotifications[tab].map(renderNotificationCard)}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>

        {categorizedNotifications.all.length > 0 && (
          <div className="sticky bottom-0 bg-background border-t p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {categorizedNotifications[selectedTab].length} notificação{categorizedNotifications[selectedTab].length !== 1 ? 'ões' : ''}
              </span>
              {unreadCounts[selectedTab] > 0 && (
                <span className="font-medium text-primary">
                  {unreadCounts[selectedTab]} não lida{unreadCounts[selectedTab] !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};