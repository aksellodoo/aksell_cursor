import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IntervalSyncConfigProps {
  value: number;
  unit: string;
  onValueChange: (value: number) => void;
  onUnitChange: (unit: string) => void;
  disabled?: boolean;
}

export const IntervalSyncConfig = ({ 
  value, 
  unit, 
  onValueChange, 
  onUnitChange, 
  disabled 
}: IntervalSyncConfigProps) => {
  const intervalUnits = [
    { value: 'seconds', label: 'Segundos' },
    { value: 'minutes', label: 'Minutos' },
    { value: 'hours', label: 'Horas' },
    { value: 'days', label: 'Dias' }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="interval_value">Intervalo de Consulta *</Label>
        <Input
          id="interval_value"
          type="number"
          min="1"
          value={value}
          onChange={(e) => onValueChange(parseInt(e.target.value) || 1)}
          required
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="interval_unit">Unidade de Tempo</Label>
        <Select value={unit} onValueChange={onUnitChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a unidade" />
          </SelectTrigger>
          <SelectContent>
            {intervalUnits.map((intervalUnit) => (
              <SelectItem key={intervalUnit.value} value={intervalUnit.value}>
                {intervalUnit.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};