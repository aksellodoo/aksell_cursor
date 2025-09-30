import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bell } from 'lucide-react';

interface NotificationNodeProps {
  data: {
    label: string;
    notificationTitle?: string;
    notificationRecipient?: string;
  };
  selected?: boolean;
}

export const NotificationNode = memo(({ data, selected }: NotificationNodeProps) => {
  return (
    <div className={`
      min-w-[200px] bg-background border-2 rounded-lg shadow-lg p-4
      ${selected ? 'border-primary' : 'border-border'}
      hover:border-muted-foreground transition-colors duration-200
    `}>
      <Handle type="target" position={Position.Top} className="!bg-green-600" />
      
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-5 h-5 text-green-600" />
        <span className="font-semibold text-sm text-foreground">
          {data.label || 'Notificação'}
        </span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {data.notificationTitle && (
          <div>Título: {data.notificationTitle}</div>
        )}
        {data.notificationRecipient && (
          <div>Para: {data.notificationRecipient}</div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-green-600" />
    </div>
  );
});