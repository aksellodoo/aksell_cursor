import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface SyncTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SyncTypeSelector = ({ value, onChange, disabled }: SyncTypeSelectorProps) => {
  const syncTypes = [
    { value: 'interval', label: 'Intervalo Simples', description: 'Sincroniza a cada X minutos/horas/dias' },
    { value: 'schedule', label: 'Horários Específicos', description: 'Sincroniza em horários determinados do dia' },
    { value: 'cron', label: 'Expressão Cron', description: 'Configuração avançada com expressões cron' }
  ];

  return (
    <div className="space-y-2">
      <Label>Tipo de Sincronização</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o tipo de sincronização" />
        </SelectTrigger>
        <SelectContent>
          {syncTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              <div className="flex flex-col">
                <span className="font-medium">{type.label}</span>
                <span className="text-xs text-muted-foreground">{type.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};