import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { WhatsAppConnectionStatus } from '@/components/WhatsAppConnectionStatus';

interface User {
  id: string;
  name: string;
  whatsapp_phone?: string | null;
  whatsapp_verified?: boolean;
}

interface WhatsAppTabProps {
  user: User;
  refreshUserData: () => Promise<void>;
}

export const WhatsAppTab = ({ user, refreshUserData }: WhatsAppTabProps) => {
  const getStatusIcon = () => {
    if (!user.whatsapp_phone) {
      return <XCircle className="w-5 h-5 text-destructive" />;
    }
    if (user.whatsapp_verified) {
      return <CheckCircle className="w-5 h-5 text-success" />;
    }
    return <AlertCircle className="w-5 h-5 text-warning" />;
  };

  const getStatusText = () => {
    if (!user.whatsapp_phone) {
      return "Não configurado";
    }
    if (user.whatsapp_verified) {
      return "Conectado e verificado";
    }
    return "Configurado, aguardando verificação";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* WhatsApp Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Status da Conexão WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
            {getStatusIcon()}
            <div>
              <p className="font-medium">{getStatusText()}</p>
              {user.whatsapp_phone && (
                <p className="text-sm text-muted-foreground">
                  Telefone: {user.whatsapp_phone}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          <WhatsAppConnectionStatus
            userId={user.id}
            isConnected={!!user.whatsapp_verified}
            phone={user.whatsapp_phone}
            onStatusChange={refreshUserData}
          />
        </CardContent>
      </Card>

      {/* WhatsApp Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Como funciona:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Configure seu número de telefone com DDD</li>
              <li>Aguarde a verificação automática</li>
              <li>As notificações serão enviadas via WhatsApp conforme suas preferências</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Privacidade:</h4>
            <p className="text-sm text-muted-foreground">
              Seu número será usado exclusivamente para envio de notificações do sistema. 
              Não compartilhamos essas informações com terceiros.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};