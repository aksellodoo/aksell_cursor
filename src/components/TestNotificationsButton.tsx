import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const TestNotificationsButton: React.FC = () => {
  const [isTestingNotifications, setIsTestingNotifications] = useState(false);

  const testProtheusNotifications = async () => {
    setIsTestingNotifications(true);
    try {
      console.log('⚡ Executando teste de notificações Protheus...');
      
      const { data, error } = await supabase.functions.invoke('automated-protheus-notifications', {
        body: { 
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('❌ Erro no teste de notificações:', error);
        toast.error(`Erro: ${error.message}`);
        return;
      }

      console.log('✅ Teste de notificações Protheus completo:', data);
      
      if (data?.success) {
        toast.success('Teste de notificações Protheus executado com sucesso!');
      } else {
        toast.error('Teste falhou');
      }
    } catch (error) {
      console.error('❌ Erro na função de notificações:', error);
      toast.error('Erro inesperado');
    } finally {
      setIsTestingNotifications(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Teste de Sistema</h3>
      
      <Button 
        onClick={testProtheusNotifications}
        disabled={isTestingNotifications}
        variant="outline"
        className="flex items-center gap-2"
      >
        {isTestingNotifications ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Executando...
          </>
        ) : (
          'Testar Notificações Protheus'
        )}
      </Button>
    </div>
  );
};