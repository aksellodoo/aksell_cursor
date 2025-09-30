import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { InfoIcon } from 'lucide-react';

interface CronSyncConfigProps {
  expression: string;
  onChange: (expression: string) => void;
  disabled?: boolean;
}

export const CronSyncConfig = ({ expression, onChange, disabled }: CronSyncConfigProps) => {
  const [isValid, setIsValid] = useState(true);

  const validateCron = (expr: string) => {
    // Basic cron validation - 5 or 6 parts separated by spaces
    const parts = expr.trim().split(/\s+/);
    const valid = parts.length === 5 || parts.length === 6;
    setIsValid(valid);
    return valid;
  };

  const handleChange = (value: string) => {
    onChange(value);
    if (value) {
      validateCron(value);
    } else {
      setIsValid(true);
    }
  };

  const presetExpressions = [
    { label: 'A cada hora', value: '0 * * * *' },
    { label: 'Meio-dia diário', value: '0 12 * * *' },
    { label: 'Meia-noite diária', value: '0 0 * * *' },
    { label: '2x ao dia (12h e 00h)', value: '0 0,12 * * *' },
    { label: 'A cada 6 horas', value: '0 */6 * * *' },
    { label: 'Segunda-feira 9h', value: '0 9 * * 1' }
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cron_expression">Expressão Cron *</Label>
        <Input
          id="cron_expression"
          value={expression}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="0 12 * * * (meio-dia todos os dias)"
          disabled={disabled}
          className={!isValid && expression ? 'border-destructive' : ''}
        />
        {!isValid && expression && (
          <p className="text-sm text-destructive">
            Formato inválido. Use o padrão: minuto hora dia mês dia-da-semana
          </p>
        )}
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>Formato:</strong> minuto hora dia mês dia-da-semana
          <br />
          <strong>Exemplo:</strong> <code>0 12 * * *</code> = todo dia ao meio-dia
        </AlertDescription>
      </Alert>

      {!disabled && (
        <div className="space-y-2">
          <Label className="text-sm">Expressões Predefinidas</Label>
          <div className="grid grid-cols-1 gap-2">
            {presetExpressions.map((preset) => (
              <Button
                key={preset.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleChange(preset.value)}
                className="justify-between h-auto p-3"
              >
                <span>{preset.label}</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {preset.value}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};