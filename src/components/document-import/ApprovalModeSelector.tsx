import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ApprovalModeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const approvalModes = [
  {
    value: 'single',
    label: 'Aprovação única',
    description: 'Apenas um aprovador precisa aprovar'
  },
  {
    value: 'any',
    label: 'Qualquer aprovador',
    description: 'Qualquer um dos aprovadores pode aprovar'
  },
  {
    value: 'all',
    label: 'Todos os aprovadores',
    description: 'Todos os aprovadores devem aprovar'
  }
];

export const ApprovalModeSelector: React.FC<ApprovalModeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className
}) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Selecionar modo de aprovação..." />
      </SelectTrigger>
      <SelectContent>
        {approvalModes.map((mode) => (
          <SelectItem key={mode.value} value={mode.value}>
            <div>
              <div className="font-medium">{mode.label}</div>
              <div className="text-sm text-muted-foreground">{mode.description}</div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};