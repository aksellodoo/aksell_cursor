import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { TelegramConnectionStatus } from '@/components/TelegramConnectionStatus';

interface User {
  id: string;
  name: string;
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
}

interface TelegramTabProps {
  user: User;
  refreshUserData: () => Promise<void>;
}

export const TelegramTab = ({ user, refreshUserData }: TelegramTabProps) => {
  const getStatusIcon = () => {
    if (!user.telegram_chat_id) {
      return <XCircle className="w-5 h-5 text-destructive" />;
    }
    return <CheckCircle className="w-5 h-5 text-success" />;
  };

  const getStatusText = () => {
    if (!user.telegram_chat_id) {
      return "Não conectado";
    }
    return "Conectado e ativo";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Telegram Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Status da Conexão Telegram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
            {getStatusIcon()}
            <div>
              <p className="font-medium">{getStatusText()}</p>
              {user.telegram_username && (
                <p className="text-sm text-muted-foreground">
                  Username: @{user.telegram_username}
                </p>
              )}
              {user.telegram_chat_id && (
                <p className="text-sm text-muted-foreground">
                  Chat ID: {user.telegram_chat_id}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Telegram</CardTitle>
        </CardHeader>
        <CardContent>
          <TelegramConnectionStatus
            userId={user.id}
            isConnected={!!user.telegram_chat_id}
            username={user.telegram_username || undefined}
            onStatusChange={refreshUserData}
          />
        </CardContent>
      </Card>

      {/* Telegram Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Como conectar:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Clique em "Conectar Telegram" e siga as instruções</li>
              <li>Você será redirecionado para o bot do Telegram</li>
              <li>Envie o comando solicitado para ativar as notificações</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Recursos:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Receba notificações instantâneas no Telegram</li>
              <li>Interaja com o sistema através de comandos</li>
              <li>Histórico de mensagens preservado</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Privacidade:</h4>
            <p className="text-sm text-muted-foreground">
              Apenas as informações necessárias para envio de notificações são armazenadas. 
              Você pode desconectar a qualquer momento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};