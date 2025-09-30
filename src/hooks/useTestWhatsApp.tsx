import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useTestWhatsApp = () => {
  const [isTesting, setIsTesting] = useState(false);

  const testWhatsAppNotification = async (userId: string) => {
    setIsTesting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          userId,
          message: 'Teste de notificação WhatsApp',
          isTest: true
        }
      });

      if (error) {
        console.error('Error testing WhatsApp:', error);
        toast.error('Erro ao testar WhatsApp: ' + (error.message || 'Erro desconhecido'));
        return;
      }

      if (data?.success) {
        toast.success('Mensagem de teste enviada com sucesso! Verifique seu WhatsApp.');
      } else {
        toast.error('Erro ao enviar mensagem de teste: ' + (data?.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Error testing WhatsApp:', error);
      toast.error('Erro ao testar WhatsApp. Tente novamente.');
    } finally {
      setIsTesting(false);
    }
  };

  return {
    testWhatsAppNotification,
    isTesting
  };
};