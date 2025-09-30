import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { RotateCcw } from 'lucide-react';

interface LoopNodeProps {
  data: {
    label: string;
    loopType?: string;
    maxIterations?: number;
  };
  selected?: boolean;
}

export const LoopNode = memo(({ data, selected }: LoopNodeProps) => {
  return (
    <div className={`
      min-w-[200px] bg-background border-2 rounded-lg shadow-lg p-4
      ${selected ? 'border-primary' : 'border-border'}
      hover:border-muted-foreground transition-colors duration-200
    `}>
      <Handle type="target" position={Position.Top} className="!bg-orange-600" />
      
      <div className="flex items-center gap-2 mb-2">
        <RotateCcw className="w-5 h-5 text-orange-600" />
        <span className="font-semibold text-sm text-foreground">
          {data.label || 'Loop'}
        </span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {data.loopType && (
          <div>Tipo: {data.loopType === 'count' ? 'Contador' : 'Condicional'}</div>
        )}
        {data.maxIterations && (
          <div>Max iterações: {data.maxIterations}</div>
        )}
      </div>

      <div className="flex justify-between mt-3">
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="continue"
          className="!bg-green-600 !left-1/4" 
        />
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="exit"
          className="!bg-red-600 !left-3/4" 
        />
      </div>
      
      <div className="flex justify-between text-xs mt-1 text-muted-foreground">
        <span>Continuar</span>
        <span>Sair</span>
      </div>
    </div>
  );
});