import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCurrentSaoPauloTime } from '@/utils/timezoneUtils';

interface ScheduleSyncConfigProps {
  schedule: string[];
  onChange: (schedule: string[]) => void;
  disabled?: boolean;
}

export const ScheduleSyncConfig = ({ schedule, onChange, disabled }: ScheduleSyncConfigProps) => {
  const [newTime, setNewTime] = useState('');

  const addTime = () => {
    if (newTime && !schedule.includes(newTime)) {
      onChange([...schedule, newTime].sort());
      setNewTime('');
    }
  };

  const removeTime = (timeToRemove: string) => {
    onChange(schedule.filter(time => time !== timeToRemove));
  };

  const addPresetTime = (time: string) => {
    if (!schedule.includes(time)) {
      onChange([...schedule, time].sort());
    }
  };

  const presetTimes = [
    { label: 'Meio-dia', value: '12:00' },
    { label: 'Meia-noite', value: '00:00' },
    { label: '06:00', value: '06:00' },
    { label: '18:00', value: '18:00' }
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Horários de Sincronização (Horário de Brasília)</Label>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Agora: {getCurrentSaoPauloTime()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            disabled={disabled}
            placeholder="HH:MM"
          />
          <Button 
            type="button" 
            onClick={addTime} 
            disabled={disabled || !newTime || schedule.includes(newTime)}
            size="icon"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {schedule.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Horários configurados ({schedule.length})
          </Label>
          <div className="flex flex-wrap gap-2">
            {schedule.map((time) => (
              <Badge key={time} variant="secondary" className="flex items-center gap-1">
                {time}
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => removeTime(time)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {!disabled && (
        <div className="space-y-2">
          <Label className="text-sm">Horários Sugeridos</Label>
          <div className="flex flex-wrap gap-2">
            {presetTimes.map((preset) => (
              <Button
                key={preset.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addPresetTime(preset.value)}
                disabled={schedule.includes(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {schedule.length === 0 && (
        <Alert>
          <AlertDescription>
            Adicione pelo menos um horário para sincronização diária.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};