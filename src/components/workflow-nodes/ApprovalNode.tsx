import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { UserCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ApprovalNodeProps {
  data: {
    label: string;
    approvalTitle?: string;
    approver?: string;
    approvers?: string[];
    approvalType?: string;
    approvalFormat?: 'single' | 'any' | 'all';
    expirationTime?: number;
    expirationUnit?: 'hours' | 'days';
  };
  selected?: boolean;
}

export const ApprovalNode = memo(({ data, selected }: ApprovalNodeProps) => {
  return (
    <TooltipProvider>
      <div className={`
        min-w-[200px] bg-background border-2 rounded-lg shadow-lg p-4
        ${selected ? 'border-primary' : 'border-border'}
        hover:border-muted-foreground transition-colors duration-200
      `}>
      <Handle type="target" position={Position.Top} className="!bg-red-600" />
      
      <div className="flex items-center gap-2 mb-2">
        <UserCheck className="w-5 h-5 text-red-600" />
        <span className="font-semibold text-sm text-foreground">
          {data.label || 'Aprovação'}
        </span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {data.approvalTitle && (
          <div>Título: {data.approvalTitle}</div>
        )}
        {data.approvalType && (
          <div>Tipo: {data.approvalType}</div>
        )}
        {data.approvalFormat && (
          <div>Formato: {data.approvalFormat === 'single' ? 'Um aprovador' : data.approvalFormat === 'any' ? 'Qualquer aprovador' : 'Todos aprovadores'}</div>
        )}
        {data.expirationTime && (
          <div>Expira em: {data.expirationTime} {data.expirationUnit === 'hours' ? 'horas' : 'dias'}</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1 mt-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Handle 
              type="source" 
              position={Position.Bottom} 
              id="approved"
              className="!bg-green-600 !left-[12.5%]" 
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Aprovado - Fluxo quando aprovação é aceita</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Handle 
              type="source" 
              position={Position.Bottom} 
              id="rejected"
              className="!bg-red-600 !left-[37.5%]" 
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Rejeitado - Fluxo quando aprovação é negada</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Handle 
              type="source" 
              position={Position.Bottom} 
              id="needs_correction"
              className="!bg-yellow-600 !left-[62.5%]" 
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Necessita Correção - Fluxo para ajustes</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Handle 
              type="source" 
              position={Position.Bottom} 
              id="expired"
              className="!bg-gray-600 !left-[87.5%]" 
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Expirado - Fluxo quando prazo é excedido</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      <div className="grid grid-cols-2 gap-1 text-[10px] mt-1 text-muted-foreground text-center">
        <span>Aprovado</span>
        <span>Rejeitado</span>
        <span>Correção</span>
        <span>Expirado</span>
      </div>
      </div>
    </TooltipProvider>
  );
});