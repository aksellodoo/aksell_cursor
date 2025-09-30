import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Copy, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TelegramWebhookSetup } from './TelegramWebhookSetup';

interface TelegramSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

export const TelegramSetupModal: React.FC<TelegramSetupModalProps> = ({
  open,
  onOpenChange,
  userId,
  onSuccess
}) => {
  const [setupCode, setSetupCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  // Verificar status atual do Telegram
  useEffect(() => {
    if (open) {
      checkTelegramStatus(true); // Marca como verificação inicial
    }
  }, [open, userId]);

  // Verificar periodicamente se a conta foi vinculada
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (open && setupCode && !isLinked) {
      interval = setInterval(() => {
        checkTelegramStatus();
      }, 3000); // Verificar a cada 3 segundos
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [open, setupCode, isLinked]);

  const checkTelegramStatus = async (isInitialCheck = false) => {
    try {
      setIsChecking(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('telegram_chat_id, telegram_username, telegram_setup_code, telegram_setup_code_expires_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking Telegram status:', error);
        return;
      }

      const wasLinkedBefore = isLinked;

      if (data.telegram_chat_id) {
        setIsLinked(true);
        setTelegramUsername(data.telegram_username || '');
        setSetupCode('');
        setExpiresAt(null);
        
        // Só chama onSuccess se não era uma verificação inicial E se não estava linkado antes
        if (!isInitialCheck && !wasLinkedBefore && onSuccess) {
          onSuccess();
          toast({
            title: "Conta vinculada com sucesso!",
            description: "Agora você receberá notificações via Telegram.",
          });
        }
      } else if (data.telegram_setup_code) {
        setSetupCode(data.telegram_setup_code);
        setExpiresAt(data.telegram_setup_code_expires_at ? new Date(data.telegram_setup_code_expires_at) : null);
      }
    } catch (error) {
      console.error('Error checking Telegram status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const generateSetupCode = async () => {
    try {
      setIsGenerating(true);
      
      // Gerar código via função do banco
      const { data: codeResult, error: codeError } = await supabase
        .rpc('generate_telegram_setup_code');

      if (codeError) {
        throw codeError;
      }

      const code = codeResult;
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      // Salvar código no perfil do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          telegram_setup_code: code,
          telegram_setup_code_expires_at: expiresAt.toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      setSetupCode(code);
      setExpiresAt(expiresAt);
      
      toast({
        title: "Código gerado com sucesso!",
        description: "Use o código no Telegram para vincular sua conta.",
      });
    } catch (error) {
      console.error('Error generating setup code:', error);
      toast({
        title: "Erro ao gerar código",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Comando copiado para a área de transferência.",
    });
  };

  const unlinkTelegram = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          telegram_chat_id: null,
          telegram_username: null,
          notification_telegram: false
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      setIsLinked(false);
      setTelegramUsername('');
      
      toast({
        title: "Conta desvinculada",
        description: "Sua conta do Telegram foi desvinculada com sucesso.",
      });
    } catch (error) {
      console.error('Error unlinking Telegram:', error);
      toast({
        title: "Erro ao desvincular",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) {
      return "Expirado";
    }
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            Configurar Telegram
          </DialogTitle>
          <DialogDescription>
            Configure as notificações via Telegram para receber atualizações em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLinked ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <h3 className="font-semibold text-green-700">Conta Vinculada</h3>
                    <p className="text-sm text-muted-foreground">
                      {telegramUsername ? `@${telegramUsername}` : 'Telegram conectado'}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={unlinkTelegram}
                  variant="outline"
                  className="w-full"
                >
                  Desvincular Conta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Como configurar:</h3>
                  <ol className="space-y-2 text-sm">
                    <li className="flex gap-2">
                      <Badge variant="outline" className="min-w-[20px] h-5 text-xs">1</Badge>
                      <span>Adicione o bot no Telegram: 
                        <Button
                          variant="link"
                          className="h-auto p-1 text-blue-600"
                          onClick={() => window.open('https://t.me/FichaCertaBot', '_blank')}
                        >
                          @FichaCertaBot
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <Badge variant="outline" className="min-w-[20px] h-5 text-xs">2</Badge>
                      <span>Gere um código de vinculação abaixo</span>
                    </li>
                    <li className="flex gap-2">
                      <Badge variant="outline" className="min-w-[20px] h-5 text-xs">3</Badge>
                      <span>Envie o comando no Telegram</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>

              {!setupCode ? (
                <Button 
                  onClick={generateSetupCode}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating && <LoadingSpinner className="mr-2" />}
                  Gerar Código de Vinculação
                </Button>
              ) : (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        Código gerado - Expira em: {expiresAt && formatTimeRemaining(expiresAt)}
                      </span>
                    </div>
                    
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-muted-foreground mb-2">
                        Envie este comando no Telegram:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-gray-100 px-2 py-1 rounded">
                          /link {setupCode}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(`/link ${setupCode}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {isChecking && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                        <LoadingSpinner className="h-4 w-4" />
                        Aguardando vinculação...
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateSetupCode}
                        disabled={isGenerating}
                        className="flex-1"
                      >
                        Gerar Novo Código
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => window.open('https://t.me/FichaCertaBot', '_blank')}
                        className="flex-1"
                      >
                        Abrir Telegram
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Seção administrativa para configurar webhook */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium mb-3">Configuração Administrativa</h4>
            <TelegramWebhookSetup />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};