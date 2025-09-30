import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Check, X, Loader2, TestTube2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTestWhatsApp } from '@/hooks/useTestWhatsApp';

interface WhatsAppConnectionStatusProps {
  userId: string;
  isConnected: boolean;
  phone?: string | null;
  onStatusChange?: () => void;
}

export const WhatsAppConnectionStatus: React.FC<WhatsAppConnectionStatusProps> = ({
  userId,
  isConnected,
  phone,
  onStatusChange
}) => {
  const [phoneNumber, setPhoneNumber] = useState(phone || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { testWhatsAppNotification, isTesting } = useTestWhatsApp();

  const handleSendVerification = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Por favor, insira um número de telefone');
      return;
    }

    setIsVerifying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-verification', {
        body: {
          userId,
          phone: phoneNumber
        }
      });

      if (error) {
        console.error('Error sending verification:', error);
        toast.error('Erro ao enviar código: ' + (error.message || 'Erro desconhecido'));
        return;
      }

      if (data?.success) {
        toast.success('Código de verificação enviado! Verifique seu WhatsApp.');
        setCodeSent(true);
      } else {
        toast.error('Erro ao enviar código: ' + (data?.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Error sending verification:', error);
      toast.error('Erro ao enviar código. Tente novamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      toast.error('Por favor, insira o código de verificação');
      return;
    }

    setIsVerifying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-whatsapp-code', {
        body: {
          userId,
          code: verificationCode
        }
      });

      if (error) {
        console.error('Error verifying code:', error);
        toast.error('Erro ao verificar código: ' + (error.message || 'Erro desconhecido'));
        return;
      }

      if (data?.success) {
        toast.success('WhatsApp conectado com sucesso!');
        setCodeSent(false);
        setVerificationCode('');
        onStatusChange?.();
      } else {
        toast.error('Código inválido: ' + (data?.error || 'Código incorreto'));
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast.error('Erro ao verificar código. Tente novamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          whatsapp_phone: null,
          whatsapp_verified: false,
          whatsapp_verification_code: null,
          whatsapp_verification_expires_at: null,
          whatsapp_chat_id: null,
          notification_whatsapp: false,
        })
        .eq('id', userId);

      if (error) {
        console.error('Error disconnecting WhatsApp:', error);
        toast.error('Erro ao desconectar WhatsApp');
        return;
      }

      toast.success('WhatsApp desconectado com sucesso');
      setPhoneNumber('');
      setCodeSent(false);
      setVerificationCode('');
      onStatusChange?.();
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      toast.error('Erro ao desconectar WhatsApp');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleTestMessage = () => {
    testWhatsAppNotification(userId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-600" />
          Conexão WhatsApp
        </CardTitle>
        <CardDescription>
          Configure sua conexão WhatsApp para receber notificações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {isConnected ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                <Check className="w-3 h-3 mr-1" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                <X className="w-3 h-3 mr-1" />
                Não conectado
              </Badge>
            )}
          </div>
          {isConnected && phone && (
            <span className="text-sm text-muted-foreground">{phone}</span>
          )}
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            {!codeSent ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-phone">Número do WhatsApp</Label>
                  <Input
                    id="whatsapp-phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isVerifying}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite seu número completo com DDD (sem o +55)
                  </p>
                </div>
                <Button
                  onClick={handleSendVerification}
                  disabled={isVerifying || !phoneNumber.trim()}
                  className="w-full"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando código...
                    </>
                  ) : (
                    'Validar Conexão'
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Código de Verificação</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={isVerifying}
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o código de 6 dígitos que você recebeu no WhatsApp
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleVerifyCode}
                    disabled={isVerifying || !verificationCode.trim()}
                    className="flex-1"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      'Verificar Código'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCodeSent(false);
                      setVerificationCode('');
                    }}
                    disabled={isVerifying}
                  >
                    Voltar
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleTestMessage}
                disabled={isTesting}
                className="flex-1"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando teste...
                  </>
                ) : (
                  <>
                    <TestTube2 className="w-4 h-4 mr-2" />
                    Testar Envio
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="flex-1"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Desconectando...
                  </>
                ) : (
                  'Desconectar'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};