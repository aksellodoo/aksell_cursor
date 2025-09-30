import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Repeat, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTaskSeries, CreateTaskSeriesData } from '@/hooks/useTaskSeries';
import type { Database } from '@/integrations/supabase/types';

type FixedTaskType = Database['public']['Enums']['fixed_task_type'];

interface TaskRecurrenceBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSeriesCreated: (seriesId: string) => void;
  taskData: {
    title: string;
    description?: string;
    fixed_type: FixedTaskType;
    payload?: any;
    template_id?: string;
    template_snapshot?: any;
  };
}

interface RecurrenceSettings {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  weekdays?: number[]; // 0=Sunday, 1=Monday, etc.
  monthlyType?: 'date' | 'weekday'; // "day 15" vs "2nd Tuesday"
  monthlyDate?: number; // 1-31
  monthlyWeekday?: number; // 0-6
  monthlyPosition?: number; // 1,2,3,4,-1 (last)
  time: string; // HH:MM
  timezone: string;
  endType: 'never' | 'until' | 'count';
  endDate?: Date;
  endCount?: number;
  exceptionDates: Date[];
  // Generation settings
  mode: 'on_schedule' | 'on_prev_complete';
  lookahead: number;
  catchUp: number;
  adjustPolicy: 'none' | 'previous_business_day' | 'next_business_day';
  daysBefore: number;
}

const defaultSettings: RecurrenceSettings = {
  frequency: 'weekly',
  interval: 1,
  weekdays: [5], // Friday
  time: '18:00',
  timezone: 'America/Sao_Paulo',
  endType: 'never',
  exceptionDates: [],
  mode: 'on_schedule',
  lookahead: 1,
  catchUp: 1,
  adjustPolicy: 'none',
  daysBefore: 0
};

export const TaskRecurrenceBuilder: React.FC<TaskRecurrenceBuilderProps> = ({
  isOpen,
  onClose,
  onSeriesCreated,
  taskData
}) => {
  const [settings, setSettings] = useState<RecurrenceSettings>(defaultSettings);
  const [previewDates, setPreviewDates] = useState<Date[]>([]);
  const { createSeries } = useTaskSeries();
  const [creating, setCreating] = useState(false);

  // Generate RRULE string from settings
  const generateRRule = (): string => {
    let rrule = `FREQ=${settings.frequency.toUpperCase()}`;
    
    if (settings.interval > 1) {
      rrule += `;INTERVAL=${settings.interval}`;
    }

    if (settings.frequency === 'weekly' && settings.weekdays?.length) {
      const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const weekdayStr = settings.weekdays.map(d => days[d]).join(',');
      rrule += `;BYDAY=${weekdayStr}`;
    }

    if (settings.frequency === 'monthly') {
      if (settings.monthlyType === 'date' && settings.monthlyDate) {
        rrule += `;BYMONTHDAY=${settings.monthlyDate}`;
      } else if (settings.monthlyType === 'weekday' && settings.monthlyWeekday !== undefined && settings.monthlyPosition) {
        const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        rrule += `;BYDAY=${settings.monthlyPosition}${days[settings.monthlyWeekday]}`;
      }
    }

    if (settings.endType === 'count' && settings.endCount) {
      rrule += `;COUNT=${settings.endCount}`;
    }

    return rrule;
  };

  // Generate preview dates
  const updatePreview = () => {
    try {
      const rrule = generateRRule();
      const now = new Date();
      const [hours, minutes] = settings.time.split(':').map(Number);
      
      // Create start date with time
      const dtstart = new Date(now);
      dtstart.setHours(hours, minutes, 0, 0);
      if (dtstart <= now) {
        dtstart.setDate(dtstart.getDate() + 1); // Start tomorrow if time has passed today
      }

      // Simple preview calculation (would use RRule library in production)
      const dates: Date[] = [];
      let current = new Date(dtstart);
      const until = settings.endDate || new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days ahead
      const maxCount = settings.endType === 'count' ? settings.endCount : 6;

      for (let i = 0; i < (maxCount || 6) && current <= until; i++) {
        // Simple frequency logic for preview
        if (settings.frequency === 'daily') {
          dates.push(new Date(current));
          current = new Date(current.getTime() + (settings.interval * 24 * 60 * 60 * 1000));
        } else if (settings.frequency === 'weekly') {
          // Find next occurrence based on weekdays
          while (!settings.weekdays?.includes(current.getDay()) && current <= until) {
            current = new Date(current.getTime() + (24 * 60 * 60 * 1000));
          }
          if (current <= until) {
            dates.push(new Date(current));
            current = new Date(current.getTime() + (7 * settings.interval * 24 * 60 * 60 * 1000));
          }
        } else {
          // For monthly/yearly, just add basic intervals for preview
          dates.push(new Date(current));
          if (settings.frequency === 'monthly') {
            current.setMonth(current.getMonth() + settings.interval);
          } else {
            current.setFullYear(current.getFullYear() + settings.interval);
          }
        }
      }

      // Filter out exception dates
      const filteredDates = dates.filter(date => 
        !settings.exceptionDates.some(exDate => 
          date.toDateString() === exDate.toDateString()
        )
      );

      setPreviewDates(filteredDates.slice(0, 6));
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewDates([]);
    }
  };

  const handleCreateSeries = async () => {
    try {
      setCreating(true);
      
      const [hours, minutes] = settings.time.split(':').map(Number);
      const dtstart = new Date();
      dtstart.setHours(hours, minutes, 0, 0);
      if (dtstart <= new Date()) {
        dtstart.setDate(dtstart.getDate() + 1);
      }

      const seriesData: CreateTaskSeriesData = {
        title: taskData.title,
        description: taskData.description,
        fixed_type: taskData.fixed_type,
        base_payload: taskData.payload || {},
        base_template_id: taskData.template_id,
        base_template_snapshot: taskData.template_snapshot || {},
        timezone: settings.timezone,
        dtstart: dtstart.toISOString(),
        rrule: generateRRule(),
        exdates: settings.exceptionDates.map(d => d.toISOString()),
        until_date: settings.endType === 'until' ? settings.endDate?.toISOString() : undefined,
        count_limit: settings.endType === 'count' ? settings.endCount : undefined,
        lookahead_count: settings.lookahead,
        catch_up_limit: settings.catchUp,
        generation_mode: settings.mode,
        adjust_policy: settings.adjustPolicy,
        days_before_due: settings.daysBefore
      };

      const createdSeries = await createSeries(seriesData);
      if (createdSeries) {
        onSeriesCreated(createdSeries.id);
        onClose();
      }
    } catch (error) {
      console.error('Error creating series:', error);
    } finally {
      setCreating(false);
    }
  };

  const addExceptionDate = (date: Date) => {
    setSettings(prev => ({
      ...prev,
      exceptionDates: [...prev.exceptionDates, date]
    }));
  };

  const removeExceptionDate = (date: Date) => {
    setSettings(prev => ({
      ...prev,
      exceptionDates: prev.exceptionDates.filter(d => d.getTime() !== date.getTime())
    }));
  };

  useEffect(() => {
    updatePreview();
  }, [settings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Repeat className="w-5 h-5" />
              Configurar Recorrência
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={settings.frequency} onValueChange={(value: any) => setSettings(prev => ({ ...prev, frequency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diariamente</SelectItem>
                  <SelectItem value="weekly">Semanalmente</SelectItem>
                  <SelectItem value="monthly">Mensalmente</SelectItem>
                  <SelectItem value="yearly">Anualmente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Intervalo (a cada)</Label>
              <Input
                type="number"
                min="1"
                value={settings.interval}
                onChange={(e) => setSettings(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          {/* Weekly settings */}
          {settings.frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>Dias da semana</Label>
              <div className="flex gap-2 flex-wrap">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                  <Button
                    key={index}
                    variant={settings.weekdays?.includes(index) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const weekdays = settings.weekdays || [];
                      if (weekdays.includes(index)) {
                        setSettings(prev => ({ ...prev, weekdays: weekdays.filter(d => d !== index) }));
                      } else {
                        setSettings(prev => ({ ...prev, weekdays: [...weekdays, index] }));
                      }
                    }}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly settings */}
          {settings.frequency === 'monthly' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo mensal</Label>
                <Select value={settings.monthlyType || 'date'} onValueChange={(value: any) => setSettings(prev => ({ ...prev, monthlyType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Dia específico (ex: dia 15)</SelectItem>
                    <SelectItem value="weekday">Dia da semana (ex: última sexta)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.monthlyType === 'date' && (
                <div className="space-y-2">
                  <Label>Dia do mês</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={settings.monthlyDate || 1}
                    onChange={(e) => setSettings(prev => ({ ...prev, monthlyDate: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              )}

              {settings.monthlyType === 'weekday' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Posição</Label>
                    <Select value={settings.monthlyPosition?.toString() || '1'} onValueChange={(value) => setSettings(prev => ({ ...prev, monthlyPosition: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Primeira</SelectItem>
                        <SelectItem value="2">Segunda</SelectItem>
                        <SelectItem value="3">Terceira</SelectItem>
                        <SelectItem value="4">Quarta</SelectItem>
                        <SelectItem value="-1">Última</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dia da semana</Label>
                    <Select value={settings.monthlyWeekday?.toString() || '5'} onValueChange={(value) => setSettings(prev => ({ ...prev, monthlyWeekday: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Domingo</SelectItem>
                        <SelectItem value="1">Segunda</SelectItem>
                        <SelectItem value="2">Terça</SelectItem>
                        <SelectItem value="3">Quarta</SelectItem>
                        <SelectItem value="4">Quinta</SelectItem>
                        <SelectItem value="5">Sexta</SelectItem>
                        <SelectItem value="6">Sábado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Time and timezone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input
                type="time"
                value={settings.time}
                onChange={(e) => setSettings(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Fuso horário</Label>
              <Select value={settings.timezone} onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">Brasília (BRT)</SelectItem>
                  <SelectItem value="America/New_York">Nova York (EST)</SelectItem>
                  <SelectItem value="Europe/London">Londres (GMT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* End conditions */}
          <div className="space-y-4">
            <Label>Fim da recorrência</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant={settings.endType === 'never' ? "default" : "outline"}
                onClick={() => setSettings(prev => ({ ...prev, endType: 'never' }))}
              >
                Sem fim
              </Button>
              <Button
                variant={settings.endType === 'until' ? "default" : "outline"}
                onClick={() => setSettings(prev => ({ ...prev, endType: 'until' }))}
              >
                Até data
              </Button>
              <Button
                variant={settings.endType === 'count' ? "default" : "outline"}
                onClick={() => setSettings(prev => ({ ...prev, endType: 'count' }))}
              >
                Após N vezes
              </Button>
            </div>

            {settings.endType === 'until' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {settings.endDate ? format(settings.endDate, "dd/MM/yyyy") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={settings.endDate}
                    onSelect={(date) => setSettings(prev => ({ ...prev, endDate: date }))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            )}

            {settings.endType === 'count' && (
              <Input
                type="number"
                min="1"
                placeholder="Número de ocorrências"
                value={settings.endCount || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, endCount: parseInt(e.target.value) || undefined }))}
              />
            )}
          </div>

          {/* Advanced settings */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Configurações Avançadas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Modo de geração</Label>
                <Select value={settings.mode} onValueChange={(value: any) => setSettings(prev => ({ ...prev, mode: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_schedule">Por agenda</SelectItem>
                    <SelectItem value="on_prev_complete">Após conclusão anterior</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ajuste de feriados/fins de semana</Label>
                <Select value={settings.adjustPolicy} onValueChange={(value: any) => setSettings(prev => ({ ...prev, adjustPolicy: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="previous_business_day">Dia útil anterior</SelectItem>
                    <SelectItem value="next_business_day">Próximo dia útil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Futuras mantidas (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={settings.lookahead}
                  onChange={(e) => setSettings(prev => ({ ...prev, lookahead: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Máx. perdidas (0-5)</Label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={settings.catchUp}
                  onChange={(e) => setSettings(prev => ({ ...prev, catchUp: Math.min(5, Math.max(0, parseInt(e.target.value) || 0)) }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Criar X dias antes (0-30)</Label>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.daysBefore}
                  onChange={(e) => setSettings(prev => ({ ...prev, daysBefore: Math.min(30, Math.max(0, parseInt(e.target.value) || 0)) }))}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Próximas ocorrências</h3>
            <div className="space-y-2">
              {previewDates.map((date, index) => (
                <Badge key={index} variant="outline" className="mr-2 mb-2">
                  {format(date, "dd/MM/yyyy HH:mm")}
                </Badge>
              ))}
              {previewDates.length === 0 && (
                <p className="text-muted-foreground text-sm">Nenhuma ocorrência encontrada</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSeries} disabled={creating || previewDates.length === 0}>
              {creating ? 'Criando...' : 'Criar Série Recorrente'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};