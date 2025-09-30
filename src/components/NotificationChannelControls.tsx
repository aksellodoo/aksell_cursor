import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Mail, MessageSquare } from 'lucide-react';

interface NotificationChannels {
  app: boolean;
  email: boolean;
  telegram: boolean;
  whatsapp: boolean;
}

interface NotificationChannelControlsProps {
  channels: NotificationChannels;
  onChange: (channels: NotificationChannels) => void;
  telegramEnabled?: boolean;
  whatsappEnabled?: boolean;
}

export const NotificationChannelControls: React.FC<NotificationChannelControlsProps> = ({
  channels,
  onChange,
  telegramEnabled = false,
  whatsappEnabled = false
}) => {
  const updateChannel = (channel: keyof NotificationChannels, value: boolean) => {
    onChange({
      ...channels,
      [channel]: value
    });
  };

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-blue-600" />
        <Switch
          checked={channels.app}
          onCheckedChange={(checked) => updateChannel('app', checked)}
        />
        <Label className="text-xs">App</Label>
      </div>

      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-green-600" />
        <Switch
          checked={channels.email}
          onCheckedChange={(checked) => updateChannel('email', checked)}
        />
        <Label className="text-xs">Email</Label>
      </div>

      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-blue-500" />
        <Switch
          checked={channels.telegram}
          onCheckedChange={(checked) => updateChannel('telegram', checked)}
          disabled={!telegramEnabled}
        />
        <Label className="text-xs">Telegram</Label>
        {!telegramEnabled && (
          <Badge variant="secondary" className="text-xs">Não conectado</Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-green-600" />
        <Switch
          checked={channels.whatsapp}
          onCheckedChange={(checked) => updateChannel('whatsapp', checked)}
          disabled={!whatsappEnabled}
        />
        <Label className="text-xs">WhatsApp</Label>
        {!whatsappEnabled && (
          <Badge variant="secondary" className="text-xs">Não conectado</Badge>
        )}
      </div>
    </div>
  );
};