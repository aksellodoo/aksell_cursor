import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RRule } from 'rrule';

export interface RecurrenceSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  // Configurações mensais
  monthlyType: 'day' | 'weekday';
  monthlyDay?: number;
  monthlyWeekday?: number; // 0=domingo, 6=sábado
  monthlyWeekPosition?: number; // 1=primeira, -1=última
  // Horário e timezone
  hour: number;
  minute: number;
  timezone: string;
  // Exceções
  exdates: string[]; // ISO date strings
  // Fim
  endType: 'never' | 'date' | 'count';
  endDate?: string;
  endCount?: number;
  // Configurações avançadas
  generationMode: 'on_schedule' | 'on_prev_complete';
  lookaheadCount: number;
  catchUpLimit: number;
  adjustPolicy: 'none' | 'previous_business_day' | 'next_business_day';
  daysBeforeDue: number;
}

interface RecurrenceSectionProps {
  value: RecurrenceSettings;
  onChange: (settings: RecurrenceSettings) => void;
}

const defaultSettings: RecurrenceSettings = {
  enabled: false,
  frequency: 'weekly',
  interval: 1,
  monthlyType: 'day',
  hour: 9,
  minute: 0,
  timezone: 'America/Sao_Paulo',
  exdates: [],
  endType: 'never',
  generationMode: 'on_schedule',
  lookaheadCount: 1,
  catchUpLimit: 1,
  adjustPolicy: 'none',
  daysBeforeDue: 0,
};

export const RecurrenceSection: React.FC<RecurrenceSectionProps> = ({
  value,
  onChange
}) => {
  const [newExdate, setNewExdate] = useState('');

  // Garantir que value sempre tenha os defaults
  const settings = { ...defaultSettings, ...value };

  const updateSettings = (updates: Partial<RecurrenceSettings>) => {
    onChange({ ...settings, ...updates });
  };

  // Gerar RRULE para preview
  const generateRRule = useMemo(() => {
    if (!settings.enabled) return null;

    try {
      const options: any = {
        freq: {
          daily: RRule.DAILY,
          weekly: RRule.WEEKLY,
          monthly: RRule.MONTHLY,
          yearly: RRule.YEARLY,
        }[settings.frequency],
        interval: settings.interval,
      };

      // Configurações mensais
      if (settings.frequency === 'monthly' && settings.monthlyType === 'weekday') {
        if (settings.monthlyWeekday !== undefined && settings.monthlyWeekPosition !== undefined) {
          options.byweekday = [settings.monthlyWeekday];
          options.bysetpos = [settings.monthlyWeekPosition];
        }
      } else if (settings.frequency === 'monthly' && settings.monthlyDay) {
        options.bymonthday = [settings.monthlyDay];
      }

      // Fim
      if (settings.endType === 'date' && settings.endDate) {
        options.until = new Date(settings.endDate + 'T23:59:59');
      } else if (settings.endType === 'count' && settings.endCount) {
        options.count = settings.endCount;
      }

      return new RRule(options);
    } catch (error) {
      console.warn('Erro ao gerar RRule:', error);
      return null;
    }
  }, [settings]);

  // Preview das próximas datas
  const previewDates = useMemo(() => {
    if (!generateRRule) return [];

    try {
      const now = new Date();
      const dates = generateRRule.between(now, new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), true);
      
      // Filtrar exceções
      const filteredDates = dates.filter(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return !settings.exdates.includes(dateStr);
      });

      return filteredDates.slice(0, 6);
    } catch (error) {
      console.warn('Erro ao gerar preview:', error);
      return [];
    }
  }, [generateRRule, settings.exdates]);

  const addExdate = () => {
    if (newExdate && !settings.exdates.includes(newExdate)) {
      updateSettings({ exdates: [...settings.exdates, newExdate].sort() });
      setNewExdate('');
    }
  };

  const removeExdate = (date: string) => {
    updateSettings({ exdates: settings.exdates.filter(d => d !== date) });
  };

  if (!settings.enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recorrência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => updateSettings({ enabled })}
            />
            <Label>Tornar tarefa recorrente</Label>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recorrência
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => updateSettings({ enabled })}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Frequência e Intervalo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Select
              value={settings.frequency}
              onValueChange={(frequency: any) => updateSettings({ frequency })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diária</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>A cada</Label>
            <Input
              type="number"
              min={1}
              max={999}
              value={settings.interval}
              onChange={(e) => updateSettings({ interval: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        {/* Configurações mensais */}
        {settings.frequency === 'monthly' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo mensal</Label>
              <Select
                value={settings.monthlyType}
                onValueChange={(monthlyType: any) => updateSettings({ monthlyType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia específico do mês</SelectItem>
                  <SelectItem value="weekday">Dia da semana específico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.monthlyType === 'day' && (
              <div className="space-y-2">
                <Label>Dia do mês</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={settings.monthlyDay || 1}
                  onChange={(e) => updateSettings({ monthlyDay: parseInt(e.target.value) || 1 })}
                />
              </div>
            )}

            {settings.monthlyType === 'weekday' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Posição</Label>
                  <Select
                    value={settings.monthlyWeekPosition?.toString()}
                    onValueChange={(value) => updateSettings({ monthlyWeekPosition: parseInt(value) })}
                  >
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
                  <Select
                    value={settings.monthlyWeekday?.toString()}
                    onValueChange={(value) => updateSettings({ monthlyWeekday: parseInt(value) })}
                  >
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

        {/* Horário */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Hora</Label>
            <Input
              type="number"
              min={0}
              max={23}
              value={settings.hour}
              onChange={(e) => updateSettings({ hour: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label>Minuto</Label>
            <Input
              type="number"
              min={0}
              max={59}
              value={settings.minute}
              onChange={(e) => updateSettings({ minute: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={settings.timezone}
              onValueChange={(timezone) => updateSettings({ timezone })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Sao_Paulo">São Paulo (BRT)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Exceções */}
        <div className="space-y-3">
          <Label>Exceções (pular datas)</Label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={newExdate}
              onChange={(e) => setNewExdate(e.target.value)}
              placeholder="Data a pular"
            />
            <Button onClick={addExdate} size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {settings.exdates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {settings.exdates.map(date => (
                <Badge key={date} variant="secondary" className="flex items-center gap-1">
                  {format(new Date(date), 'dd/MM/yyyy')}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0"
                    onClick={() => removeExdate(date)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Término */}
        <div className="space-y-4">
          <Label>Término</Label>
          <Select
            value={settings.endType}
            onValueChange={(endType: any) => updateSettings({ endType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Sem fim</SelectItem>
              <SelectItem value="date">Até data específica</SelectItem>
              <SelectItem value="count">Após N ocorrências</SelectItem>
            </SelectContent>
          </Select>

          {settings.endType === 'date' && (
            <Input
              type="date"
              value={settings.endDate || ''}
              onChange={(e) => updateSettings({ endDate: e.target.value })}
            />
          )}

          {settings.endType === 'count' && (
            <Input
              type="number"
              min={1}
              max={9999}
              value={settings.endCount || ''}
              onChange={(e) => updateSettings({ endCount: parseInt(e.target.value) || undefined })}
              placeholder="Número de ocorrências"
            />
          )}
        </div>

        {/* Configurações avançadas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Geração</Label>
            <Select
              value={settings.generationMode}
              onValueChange={(generationMode: any) => updateSettings({ generationMode })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on_schedule">No horário agendado</SelectItem>
                <SelectItem value="on_prev_complete">Ao concluir anterior</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Lookahead</Label>
            <Select
              value={settings.lookaheadCount.toString()}
              onValueChange={(value) => updateSettings({ lookaheadCount: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 futura</SelectItem>
                <SelectItem value="2">2 futuras</SelectItem>
                <SelectItem value="3">3 futuras</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Catch-up</Label>
            <Select
              value={settings.catchUpLimit.toString()}
              onValueChange={(value) => updateSettings({ catchUpLimit: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Desabilitado</SelectItem>
                <SelectItem value="1">1 atrasada</SelectItem>
                <SelectItem value="2">2 atrasadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ajuste FDS/Feriado</Label>
            <Select
              value={settings.adjustPolicy}
              onValueChange={(adjustPolicy: any) => updateSettings({ adjustPolicy })}
            >
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
            <Label>Criar X dias antes</Label>
            <Input
              type="number"
              min={0}
              max={7}
              value={settings.daysBeforeDue}
              onChange={(e) => updateSettings({ daysBeforeDue: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Próximas 6 ocorrências
          </Label>
          
          {previewDates.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {previewDates.map((date, index) => (
                <div
                  key={index}
                  className="text-sm p-2 rounded border bg-muted/20"
                >
                  {format(date, 'EEE, dd/MM/yyyy', { locale: ptBR })}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Nenhuma ocorrência futura
            </div>
          )}
        </div>

        {/* Aviso */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            <strong>Nota:</strong> Não criamos ocorrências infinitas. O sistema mantém apenas as próximas {settings.lookaheadCount} tarefa(s) futura(s).
          </p>
        </div>
      </CardContent>
    </Card>
  );
};