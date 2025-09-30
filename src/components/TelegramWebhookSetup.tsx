import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";

export const TelegramWebhookSetup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'unknown' | 'configured' | 'error'>('unknown');
  const { toast } = useToast();
  const { testTelegramNotification } = useNotifications();

  const setupWebhook = async () => {
    setIsLoading(true);
    try {
      console.log('Setting up Telegram webhook...');
      
      const { data, error } = await supabase.functions.invoke('setup-telegram-webhook', {
        body: {}
      });

      if (error) {
        console.error('Error calling setup function:', error);
        throw error;
      }

      console.log('Webhook setup response:', data);

      if (data.success) {
        setWebhookStatus('configured');
        toast({
          title: "Webhook configurado",
          description: "O webhook do Telegram foi configurado com sucesso!",
        });
      } else {
        throw new Error(data.error || 'Failed to setup webhook');
      }
    } catch (error) {
      console.error('Error setting up webhook:', error);
      setWebhookStatus('error');
      toast({
        title: "Erro na configuração",
        description: error.message || "Erro ao configurar webhook do Telegram",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração Telegram
        </CardTitle>
        <CardDescription>
          Configure o webhook para receber mensagens do bot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {webhookStatus === 'unknown' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Status do webhook: Desconhecido</span>
          </div>
        )}
        
        {webhookStatus === 'configured' && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Webhook configurado com sucesso!</span>
          </div>
        )}
        
        {webhookStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Erro na configuração do webhook</span>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={setupWebhook} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Configurando..." : "Configurar Webhook"}
          </Button>
          
          <Button 
            onClick={testTelegramNotification}
            variant="outline"
            className="w-full"
          >
            Testar Notificação Telegram
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-2">
          <p>
            <strong>Configuração:</strong> Este botão configura o webhook do bot para receber mensagens dos usuários.
            Execute apenas se o bot não estiver respondendo aos comandos.
          </p>
          <p>
            <strong>Teste:</strong> Use o botão "Testar Notificação" para verificar se sua conta está vinculada corretamente ao Telegram.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};