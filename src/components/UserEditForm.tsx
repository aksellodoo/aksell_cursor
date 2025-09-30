import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserEditTabs } from '@/components/user-edit';

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

interface UserEditFormProps {
  user: User;
  onUserUpdate: (user: User) => void;
  refreshUserData: () => Promise<void>;
}

export const UserEditForm = ({ user, onUserUpdate, refreshUserData }: UserEditFormProps) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'user',
    department_id: user.department_id || 'none',
    is_leader: user.is_leader || false,
    notification_email: user.notification_email ?? true,
    notification_app: user.notification_app ?? true,
    notification_telegram: user.notification_telegram ?? false,
    notification_whatsapp: user.notification_whatsapp ?? false,
    notification_frequency: user.notification_frequency || 'instant',
    notification_types: user.notification_types || {
      changes: true,
      chatter: true,
      mentions: true,
      assignments: true
    },
    employee_id: user.employee_id || 'none',
    company_relationship: user.company_relationship || 'none',
    supervisor_id: user.supervisor_id || 'none'
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      department_id: user.department_id || 'none',
      is_leader: user.is_leader || false,
      notification_email: user.notification_email ?? true,
      notification_app: user.notification_app ?? true,
      notification_telegram: user.notification_telegram ?? false,
      notification_whatsapp: user.notification_whatsapp ?? false,
      notification_frequency: user.notification_frequency || 'instant',
      notification_types: user.notification_types || {
        changes: true,
        chatter: true,
        mentions: true,
        assignments: true
      },
      employee_id: user.employee_id || 'none',
      company_relationship: user.company_relationship || 'none',
      supervisor_id: user.supervisor_id || 'none'
    });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department_id: formData.department_id === 'none' ? null : formData.department_id,
          is_leader: formData.is_leader,
          notification_email: formData.notification_email,
          notification_app: formData.notification_app,
          notification_telegram: formData.notification_telegram,
          notification_frequency: formData.notification_frequency,
          notification_types: formData.notification_types,
          employee_id: formData.employee_id === 'none' ? null : formData.employee_id,
          company_relationship: formData.company_relationship === 'none' ? null : formData.company_relationship,
          supervisor_id: formData.supervisor_id === 'none' ? null : formData.supervisor_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select(`
          *,
          department:departments(name, color)
        `)
        .single();

      if (error) throw error;

      onUserUpdate(data);
      toast({
        title: "Sucesso",
        description: "Dados do usuário atualizados com sucesso!",
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados do usuário",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Update notification type helper
  const updateNotificationType = (type: string, channels: { app: boolean; email: boolean; telegram: boolean; whatsapp: boolean }) => {
    setFormData(prev => ({
      ...prev,
      notification_types: {
        ...prev.notification_types,
        [type]: channels
      }
    }));
  };

  // Get notification channels for a type
  const getNotificationChannels = (type: string) => {
    const typeConfig = formData.notification_types?.[type];
    
    // If it's a boolean (old format), convert to new format
    if (typeof typeConfig === 'boolean') {
      return {
        app: typeConfig,
        email: typeConfig && formData.notification_email,
        telegram: typeConfig && formData.notification_telegram,
        whatsapp: typeConfig && formData.notification_whatsapp
      };
    }
    
    // If it's already an object, return it
    if (typeof typeConfig === 'object' && typeConfig !== null) {
      return {
        app: typeConfig.app ?? true,
        email: typeConfig.email ?? false,
        telegram: typeConfig.telegram ?? false,
        whatsapp: typeConfig.whatsapp ?? false
      };
    }
    
    // Default configuration
    return {
      app: true,
      email: false,
      telegram: false,
      whatsapp: false
    };
  };

  return (
    <UserEditTabs
      user={user}
      onUserUpdate={onUserUpdate}
      refreshUserData={refreshUserData}
      formData={formData}
      setFormData={setFormData}
      handleSave={handleSave}
      saving={saving}
      updateNotificationType={updateNotificationType}
      getNotificationChannels={getNotificationChannels}
    />
  );
};