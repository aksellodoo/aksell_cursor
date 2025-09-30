import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Save, Clock } from 'lucide-react';
import { ProfileTab } from './ProfileTab';
import { EmailTab } from './EmailTab';
import { NotificationsTab } from './NotificationsTab';
import { WhatsAppTab } from './WhatsAppTab';
import { TelegramTab } from './TelegramTab';
import { UserHistoryModal } from '@/components/UserHistoryModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department_id: string | null;
  department?: { name: string; color: string; };
  is_leader: boolean;
  notification_email?: boolean;
  notification_app?: boolean;
  notification_telegram?: boolean;
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
  notification_whatsapp?: boolean;
  whatsapp_phone?: string | null;
  whatsapp_verified?: boolean;
  notification_frequency?: string;
  notification_types?: any;
  employee_id?: string | null;
  company_relationship?: string | null;
  supervisor_id?: string | null;
}

interface UserEditTabsProps {
  user: User;
  onUserUpdate: (user: User) => void;
  refreshUserData: () => Promise<void>;
  formData: any;
  setFormData: (data: any) => void;
  handleSave: () => Promise<void>;
  saving: boolean;
  updateNotificationType: (type: string, channels: any) => void;
  getNotificationChannels: (type: string) => any;
}

export const UserEditTabs = ({
  user,
  onUserUpdate,
  refreshUserData,
  formData,
  setFormData,
  handleSave,
  saving,
  updateNotificationType,
  getNotificationChannels
}: UserEditTabsProps) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Editar Usuário</h2>
          <p className="text-sm text-muted-foreground">Configure as informações e permissões do usuário</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Histórico
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="w-full justify-start bg-muted/30 px-6 py-2 rounded-none border-b">
            <TabsTrigger value="profile" className="flex-1 max-w-40">
              Perfil e Acesso
            </TabsTrigger>
            <TabsTrigger value="email" className="flex-1 max-w-40">
              Email e Office 365
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 max-w-40">
              Notificações
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex-1 max-w-40">
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="telegram" className="flex-1 max-w-40">
              Telegram
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="profile" className="h-full m-0 p-6">
              <ProfileTab
                user={user}
                formData={formData}
                setFormData={setFormData}
              />
            </TabsContent>

            <TabsContent value="email" className="h-full m-0 p-6">
              <EmailTab
                user={user}
                refreshUserData={refreshUserData}
              />
            </TabsContent>

            <TabsContent value="notifications" className="h-full m-0 p-6">
              <NotificationsTab
                formData={formData}
                setFormData={setFormData}
                updateNotificationType={updateNotificationType}
                getNotificationChannels={getNotificationChannels}
                targetUserId={user.id}
                targetUserName={user.name}
              />
            </TabsContent>

            <TabsContent value="whatsapp" className="h-full m-0 p-6">
              <WhatsAppTab
                user={user}
                refreshUserData={refreshUserData}
              />
            </TabsContent>

            <TabsContent value="telegram" className="h-full m-0 p-6">
              <TelegramTab
                user={user}
                refreshUserData={refreshUserData}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <UserHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          userId={user.id}
          userName={user.name}
        />
      )}
    </div>
  );
};