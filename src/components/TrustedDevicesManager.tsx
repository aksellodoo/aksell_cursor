import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Monitor, Smartphone, Calendar, Clock } from 'lucide-react';
import { useTrustedDevice } from '@/hooks/useTrustedDevice';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TrustedDevice {
  id: string;
  device_fingerprint: string;
  device_name: string;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
  last_used_at: string;
  expires_at: string;
  is_active: boolean;
}

export const TrustedDevicesManager = () => {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { listTrustedDevices, revokeTrustedDevice, loading } = useTrustedDevice();

  const loadDevices = async () => {
    setRefreshing(true);
    try {
      const deviceList = await listTrustedDevices();
      setDevices(deviceList);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleRevokeDevice = async (deviceId: string, deviceName: string) => {
    if (!confirm(`Tem certeza que deseja revogar a confiança do dispositivo "${deviceName}"?`)) {
      return;
    }

    const success = await revokeTrustedDevice(deviceId);
    if (success) {
      setDevices(devices.filter(d => d.id !== deviceId));
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes('android') || name.includes('iphone') || name.includes('ios')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getStatusBadge = (device: TrustedDevice) => {
    const now = new Date();
    const expiresAt = new Date(device.expires_at);
    
    if (!device.is_active) {
      return <Badge variant="destructive">Revogado</Badge>;
    }
    
    if (expiresAt <= now) {
      return <Badge variant="secondary">Expirado</Badge>;
    }
    
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 7) {
      return <Badge variant="outline">Expira em {daysUntilExpiry} dias</Badge>;
    }
    
    return <Badge variant="default">Ativo</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Dispositivos Confiáveis
            </CardTitle>
            <CardDescription>
              Gerencie os dispositivos que não exigem 2FA por tempo limitado
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDevices}
            disabled={refreshing || loading}
          >
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dispositivo confiável encontrado</p>
            <p className="text-sm mt-1">
              Dispositivos serão listados aqui quando você marcar "Confiar neste dispositivo" durante o login
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    {getDeviceIcon(device.device_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{device.device_name}</h3>
                      {getStatusBadge(device)}
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Criado: {formatDate(device.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Último uso: {formatDate(device.last_used_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Expira: {formatDate(device.expires_at)}</span>
                      </div>
                      {device.ip_address && (
                        <div className="text-xs opacity-70">
                          IP: {device.ip_address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {device.is_active && new Date(device.expires_at) > new Date() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeDevice(device.id, device.device_name)}
                      disabled={loading}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {devices.length > 0 && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm mb-2">💡 Dicas de Segurança</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Revogue dispositivos que você não reconhece</li>
              <li>• Dispositivos expiram automaticamente após o período configurado</li>
              <li>• Use apenas em dispositivos pessoais e seguros</li>
              <li>• Administradores podem forçar nova autenticação em caso de segurança</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};