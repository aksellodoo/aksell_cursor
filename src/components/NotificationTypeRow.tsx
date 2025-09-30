import React from 'react';
import { Label } from '@/components/ui/label';
import { NotificationChannelControls } from './NotificationChannelControls';

interface NotificationChannels {
  app: boolean;
  email: boolean;
  telegram: boolean;
  whatsapp: boolean;
}

interface NotificationTypeRowProps {
  title: string;
  description: string;
  channels: NotificationChannels;
  onChange: (channels: NotificationChannels) => void;
  telegramEnabled?: boolean;
  whatsappEnabled?: boolean;
}

export const NotificationTypeRow: React.FC<NotificationTypeRowProps> = ({
  title,
  description,
  channels,
  onChange,
  telegramEnabled = false,
  whatsappEnabled = false
}) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0">
      <div className="space-y-0.5 flex-1">
        <Label className="text-sm font-medium">{title}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="ml-4">
        <NotificationChannelControls
          channels={channels}
          onChange={onChange}
          telegramEnabled={telegramEnabled}
          whatsappEnabled={whatsappEnabled}
        />
      </div>
    </div>
  );
};