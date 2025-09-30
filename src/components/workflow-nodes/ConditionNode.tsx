import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

interface ConditionNodeProps {
  data: {
    label: string;
    conditionField?: string;
    conditionOperator?: string;
    conditionValue?: string;
  };
  selected?: boolean;
}

export const ConditionNode = memo(({ data, selected }: ConditionNodeProps) => {
  return (
    <div className={`
      min-w-[200px] bg-background border-2 rounded-lg shadow-lg p-4
      ${selected ? 'border-primary' : 'border-border'}
      hover:border-muted-foreground transition-colors duration-200
    `}>
      <Handle type="target" position={Position.Top} className="!bg-purple-600" />
      
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="w-5 h-5 text-purple-600" />
        <span className="font-semibold text-sm text-foreground">
          {data.label || 'Condição'}
        </span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {data.conditionField && (
          <div>Campo: {data.conditionField}</div>
        )}
        {data.conditionOperator && (
          <div>Operador: {data.conditionOperator}</div>
        )}
        {data.conditionValue && (
          <div>Valor: {data.conditionValue}</div>
        )}
      </div>

      <div className="flex justify-between mt-3">
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="true"
          className="!bg-green-600 !left-1/4" 
        />
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="false"
          className="!bg-red-600 !left-3/4" 
        />
      </div>
      
      <div className="flex justify-between text-xs mt-1 text-muted-foreground">
        <span>Verdadeiro</span>
        <span>Falso</span>
      </div>
    </div>
  );
});