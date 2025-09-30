import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckSquare } from 'lucide-react';

interface TaskNodeProps {
  data: {
    label: string;
    taskTitle?: string;
    assignedTo?: string;
    priority?: string;
  };
  selected?: boolean;
}

export const TaskNode = memo(({ data, selected }: TaskNodeProps) => {
  return (
    <div className={`
      min-w-[200px] bg-background border-2 rounded-lg shadow-lg p-4
      ${selected ? 'border-primary' : 'border-border'}
      hover:border-muted-foreground transition-colors duration-200
    `}>
      <Handle type="target" position={Position.Top} className="!bg-blue-600" />
      
      <div className="flex items-center gap-2 mb-2">
        <CheckSquare className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-sm text-foreground">
          {data.label || 'Tarefa'}
        </span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {data.taskTitle && (
          <div>Título: {data.taskTitle}</div>
        )}
        {data.assignedTo && (
          <div>Atribuído: {data.assignedTo}</div>
        )}
        {data.priority && (
          <div className={`
            inline-block px-2 py-1 rounded text-xs font-medium
            ${data.priority === 'high' || data.priority === 'urgent' 
              ? 'bg-red-100 text-red-800' 
              : data.priority === 'medium' 
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
            }
          `}>
            {data.priority === 'low' && 'Baixa'}
            {data.priority === 'medium' && 'Média'}
            {data.priority === 'high' && 'Alta'}
            {data.priority === 'urgent' && 'Urgente'}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-blue-600" />
    </div>
  );
});