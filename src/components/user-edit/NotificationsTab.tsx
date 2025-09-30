import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell } from 'lucide-react';
import { NotificationTypeRow } from '@/components/NotificationTypeRow';
import { ProtheusNotificationsCard } from '@/components/protheus-notifications';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

interface NotificationsTabProps {
  formData: any;
  setFormData: (data: any) => void;
  updateNotificationType: (type: string, channels: any) => void;
  getNotificationChannels: (type: string) => any;
  targetUserId?: string;
  targetUserName?: string;
}

export const NotificationsTab = ({ 
  formData, 
  setFormData, 
  updateNotificationType, 
  getNotificationChannels,
  targetUserId,
  targetUserName
}: NotificationsTabProps) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* General Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Configurações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">Receber notificações por email</p>
              </div>
              <Switch
                checked={formData.notification_email}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notification_email: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações no App</Label>
                <p className="text-sm text-muted-foreground">Receber notificações dentro do aplicativo</p>
              </div>
              <Switch
                checked={formData.notification_app}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notification_app: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification_frequency">Frequência de Notificações</Label>
              <Select 
                value={formData.notification_frequency} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, notification_frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instantânea</SelectItem>
                  <SelectItem value="hourly">Por hora</SelectItem>
                  <SelectItem value="daily">Diária</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <NotificationTypeRow
            title="Mudanças no Sistema"
            description="Alterações em registros, atualizações de status"
            channels={getNotificationChannels('changes')}
            onChange={(channels) => updateNotificationType('changes', channels)}
            telegramEnabled={formData.notification_telegram}
            whatsappEnabled={formData.notification_whatsapp}
          />
          
          <NotificationTypeRow
            title="Conversas (Chatter)"
            description="Novas mensagens em conversas que você participa"
            channels={getNotificationChannels('chatter')}
            onChange={(channels) => updateNotificationType('chatter', channels)}
            telegramEnabled={formData.notification_telegram}
            whatsappEnabled={formData.notification_whatsapp}
          />
          
          <NotificationTypeRow
            title="Menções"
            description="Quando você é mencionado em comentários"
            channels={getNotificationChannels('mentions')}
            onChange={(channels) => updateNotificationType('mentions', channels)}
            telegramEnabled={formData.notification_telegram}
            whatsappEnabled={formData.notification_whatsapp}
          />
          
          <NotificationTypeRow
            title="Atribuições"
            description="Quando tarefas são atribuídas a você"
            channels={getNotificationChannels('assignments')}
            onChange={(channels) => updateNotificationType('assignments', channels)}
            telegramEnabled={formData.notification_telegram}
            whatsappEnabled={formData.notification_whatsapp}
          />
        </CardContent>
      </Card>

      {/* Protheus Table Notifications */}
      <SectionErrorBoundary sectionName="Notificações Protheus">
        <ProtheusNotificationsCard
          telegramEnabled={formData.notification_telegram}
          whatsappEnabled={formData.notification_whatsapp}
          targetUserId={targetUserId}
          targetUserName={targetUserName}
        />
      </SectionErrorBoundary>
    </div>
  );
};