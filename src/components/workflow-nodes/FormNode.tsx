import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText } from 'lucide-react';

interface FormNodeProps {
  data: {
    label: string;
    formTitle?: string;
    fields?: Array<{
      name: string;
      type: string;
      required: boolean;
    }>;
  };
  selected?: boolean;
}

export const FormNode = memo(({ data, selected }: FormNodeProps) => {
  return (
    <div className={`
      min-w-[200px] bg-background border-2 rounded-lg shadow-lg p-4
      ${selected ? 'border-primary' : 'border-border'}
      hover:border-muted-foreground transition-colors duration-200
    `}>
      <Handle type="target" position={Position.Top} className="!bg-blue-600" />
      
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-sm text-foreground">
          {data.label || 'Formulário'}
        </span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {data.formTitle && (
          <div>Título: {data.formTitle}</div>
        )}
        {data.fields && data.fields.length > 0 && (
          <div>Campos: {data.fields.length}</div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-blue-600" />
    </div>
  );
});