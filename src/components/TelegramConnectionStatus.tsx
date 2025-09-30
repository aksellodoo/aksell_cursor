import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Settings, TestTube, Unlink, ExternalLink } from 'lucide-react';
import { TelegramSetupModal } from './TelegramSetupModal';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TelegramConnectionStatusProps {
  userId: string;
  isConnected: boolean;
  username?: string;
  onStatusChange?: () => void;
}

export const TelegramConnectionStatus: React.FC<TelegramConnectionStatusProps> = ({
  userId,
  isConnected,
  username,
  onStatusChange
}) => {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const { testTelegramNotification } = useNotifications();
  const { toast } = useToast();

  const handleUnlink = async () => {
    try {
      setIsUnlinking(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          telegram_chat_id: null,
          telegram_username: null,
          notification_telegram: false
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Conta desvinculada",
        description: "Sua conta do Telegram foi desvinculada com sucesso.",
      });

      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error unlinking Telegram:', error);
      toast({
        title: "Erro ao desvincular",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await testTelegramNotification();
    } catch (error) {
      console.error('Error testing notification:', error);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Status Connection */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isConnected ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {isConnected ? 'Conectado' : 'Não conectado'}
                    </span>
                    {isConnected && (
                      <Badge variant="secondary" className="text-xs">
                        @{username}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isConnected 
                      ? 'Recebendo notificações via Telegram' 
                      : 'Configure para receber notificações'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {!isConnected ? (
                <>
                  <Button
                    onClick={() => setShowSetupModal(true)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Configurar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://t.me/FichaCertaBot', '_blank')}
                    className="flex items-center gap-2"
                  >
                    Acessar Bot
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleTestNotification}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <TestTube className="w-4 h-4" />
                    Testar Envio
                  </Button>
                  <Button
                    onClick={() => setShowSetupModal(true)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Reconfigurar
                  </Button>
                  <Button
                    onClick={handleUnlink}
                    disabled={isUnlinking}
                    size="sm"
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Unlink className="w-4 h-4" />
                    {isUnlinking ? 'Desvinculando...' : 'Desvincular'}
                  </Button>
                </>
              )}
            </div>

            {/* Bot Link */}
            <div className="text-xs text-muted-foreground">
              Bot oficial: 
              <Button
                variant="link"
                className="h-auto p-1 text-xs"
                onClick={() => window.open('https://t.me/FichaCertaBot', '_blank')}
              >
                @FichaCertaBot
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TelegramSetupModal
        open={showSetupModal}
        onOpenChange={setShowSetupModal}
        userId={userId}
        onSuccess={() => {
          setShowSetupModal(false);
          if (onStatusChange) {
            onStatusChange();
          }
        }}
      />
    </>
  );
};