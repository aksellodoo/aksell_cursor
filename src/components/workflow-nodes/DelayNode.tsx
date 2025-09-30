import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';

interface DelayNodeProps {
  data: {
    label: string;
    delayType?: string;
    delayAmount?: string;
    delayUnit?: string;
    delayUntilDate?: string;
  };
  selected?: boolean;
}

export const DelayNode = memo(({ data, selected }: DelayNodeProps) => {
  const getDelayDescription = () => {
    if (data.delayType === 'duration' && data.delayAmount && data.delayUnit) {
      return `${data.delayAmount} ${data.delayUnit}`;
    }
    if (data.delayType === 'until_date' && data.delayUntilDate) {
      return `Até ${new Date(data.delayUntilDate).toLocaleString()}`;
    }
    return 'Configurar tempo';
  };

  return (
    <div className={`
      min-w-[200px] bg-background border-2 rounded-lg shadow-lg p-4
      ${selected ? 'border-primary' : 'border-border'}
      hover:border-muted-foreground transition-colors duration-200
    `}>
      <Handle type="target" position={Position.Top} className="!bg-orange-600" />
      
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-5 h-5 text-orange-600" />
        <span className="font-semibold text-sm text-foreground">
          {data.label || 'Aguardar'}
        </span>
      </div>

      <div className="text-xs text-muted-foreground">
        {getDelayDescription()}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-orange-600" />
    </div>
  );
});