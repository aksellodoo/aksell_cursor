import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Globe } from 'lucide-react';

interface WebhookNodeProps {
  data: {
    label: string;
    url?: string;
    method?: string;
  };
  selected?: boolean;
}

export const WebhookNode = memo(({ data, selected }: WebhookNodeProps) => {
  return (
    <div className={`
      min-w-[200px] bg-background border-2 rounded-lg shadow-lg p-4
      ${selected ? 'border-primary' : 'border-border'}
      hover:border-muted-foreground transition-colors duration-200
    `}>
      <Handle type="target" position={Position.Top} className="!bg-purple-600" />
      
      <div className="flex items-center gap-2 mb-2">
        <Globe className="w-5 h-5 text-purple-600" />
        <span className="font-semibold text-sm text-foreground">
          {data.label || 'Webhook'}
        </span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {data.method && (
          <div>Método: {data.method.toUpperCase()}</div>
        )}
        {data.url && (
          <div className="truncate">URL: {data.url}</div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-purple-600" />
    </div>
  );
});