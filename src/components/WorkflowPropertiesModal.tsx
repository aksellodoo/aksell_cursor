import React, { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { FullscreenDialogContent } from './ui/fullscreen-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Calendar } from './ui/calendar';
import { Switch } from './ui/switch';
import { 
  X, 
  AlertTriangle, 
  Settings, 
  Users, 
  Eye,
  ChevronDown,
  Check,
  Clock,
  Zap,
  Calendar as CalendarIcon,
  Repeat,
  UserX,
  BarChart3,
  FileText,
  Globe,
  GitBranch,
  RotateCcw,
  Plus,
  Trash2,
  Database
} from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';
import { useDepartments } from '@/hooks/useDepartments';
import { AdvancedApproverSelector, ApprovalSelection } from './AdvancedApproverSelector';
import { ProtheusWorkflowTriggerConfig } from './ProtheusWorkflowTriggerConfig';
import { cn } from '@/lib/utils';

interface WorkflowPropertiesModalProps {
  node: Node | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNode: (nodeId: string, newData: any) => void;
}

export const WorkflowPropertiesModal = ({ 
  node, 
  isOpen,
  onClose,
  onUpdateNode
}: WorkflowPropertiesModalProps) => {
  const [nodeData, setNodeData] = useState(node?.data || {});
  const [activeSection, setActiveSection] = useState('general');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const { profiles } = useProfiles();
  const { departments, loading: departmentsLoading } = useDepartments();

  useEffect(() => {
    if (node) {
      setNodeData(node.data);
    }
  }, [node]);

  const handleDataChange = (key: string, value: any) => {
    if (!node) return;
    
    const newData = { ...nodeData, [key]: value };
    setNodeData(newData);
    onUpdateNode(node.id, newData);
    
    // Validar o nó após mudança
    validateNode(newData);
  };

  const validateNode = (data: any) => {
    if (!node) return;
    
    const errors: string[] = [];
    
    if (node.type === 'triggerNode') {
      if (!data.triggerType) {
        errors.push('Tipo de trigger é obrigatório');
      }
      if (data.triggerType === 'status_change' && !data.statusTrigger) {
        errors.push('Status para disparar o trigger é obrigatório');
      }
      if (data.triggerType === 'date_time' && !data.triggerDateTime) {
        errors.push('Data/hora do trigger é obrigatória');
      }
      if (data.triggerType === 'recurring' && !data.recurringType) {
        errors.push('Tipo de recorrência é obrigatório');
      }
      if (data.triggerType === 'user_inactivity' && !data.inactivityDays) {
        errors.push('Número de dias de inatividade é obrigatório');
      }
      if (data.triggerType === 'system_event' && !data.systemEvent) {
        errors.push('Evento do sistema é obrigatório');
      }
    }
    
    if (node.type === 'taskNode') {
      if (!data.taskTitle?.trim()) {
        errors.push('Título da tarefa é obrigatório');
      }
      if (!data.assignedTo) {
        errors.push('É necessário atribuir a tarefa para um usuário');
      }
    }
    
    if (node.type === 'approvalNode') {
      if (!data.approvalTitle?.trim()) {
        errors.push('Título da aprovação é obrigatório');
      }
      if (!data.approvalFormat) {
        errors.push('Formato de aprovação é obrigatório');
      }
      if (data.approvalFormat === 'single' && !data.singleApprover) {
        errors.push('É necessário selecionar um aprovador único');
      }
      if (data.approvalFormat !== 'single' && !data.approverSelection) {
        errors.push('É necessário selecionar aprovadores');
      }
    }
    
    if (node.type === 'conditionNode') {
      if (!data.conditionField) {
        errors.push('Campo da condição é obrigatório');
      }
      if (!data.conditionOperator) {
        errors.push('Operador da condição é obrigatório');
      }
      if (!data.conditionValue?.trim()) {
        errors.push('Valor da condição é obrigatório');
      }
    }
    
    if (node.type === 'delayNode') {
      if (!data.delayType) {
        errors.push('Tipo de atraso é obrigatório');
      }
      if (data.delayType === 'duration' && (!data.delayAmount || !data.delayUnit)) {
        errors.push('Quantidade e unidade do atraso são obrigatórias');
      }
      if (data.delayType === 'until_date' && !data.delayUntilDate) {
        errors.push('Data para continuar é obrigatória');
      }
    }
    
    if (node.type === 'loopNode') {
      if (!data.loopType) {
        errors.push('Tipo de loop é obrigatório');
      }
      if (data.loopType === 'count' && !data.maxIterations) {
        errors.push('Número máximo de iterações é obrigatório');
      }
      if (data.loopType === 'condition' && (!data.loopConditionField || !data.loopConditionValue)) {
        errors.push('Campo e valor da condição do loop são obrigatórios');
      }
    }
    
    if (node.type === 'formNode') {
      if (!data.formTitle?.trim()) {
        errors.push('Título do formulário é obrigatório');
      }
    }
    
    if (node.type === 'webhookNode') {
      if (!data.url?.trim()) {
        errors.push('URL do webhook é obrigatória');
      }
      if (!data.method) {
        errors.push('Método HTTP é obrigatório');
      }
    }
    
    if (node.type === 'notificationNode') {
      if (!data.notificationTitle?.trim()) {
        errors.push('Título da notificação é obrigatório');
      }
      if (!data.notificationMessage?.trim()) {
        errors.push('Mensagem da notificação é obrigatória');
      }
      if (!data.notificationRecipient) {
        errors.push('Destinatário da notificação é obrigatório');
      }
    }
    
    setValidationErrors(errors);
  };

  // Custom Select Component with Popover
  const CustomSelect = ({ 
    value, 
    onValueChange, 
    options, 
    placeholder = "Selecione uma opção",
    className = ""
  }: {
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    className?: string;
  }) => {
    const [open, setOpen] = useState(false);
    const selectedOption = options.find(opt => opt.value === value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
          >
            {selectedOption ? selectedOption.label : placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 z-[200] bg-popover border shadow-lg">
          <div className="max-h-60 overflow-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className="flex cursor-pointer items-center px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const getNodeTitle = () => {
    if (!node) return '';
    
    const typeMap: Record<string, string> = {
      'triggerNode': 'Configurar Trigger',
      'taskNode': 'Configurar Tarefa',
      'approvalNode': 'Configurar Aprovação',
      'notificationNode': 'Configurar Notificação',
      'conditionNode': 'Configurar Condição',
      'delayNode': 'Configurar Atraso',
      'formNode': 'Configurar Formulário',
      'webhookNode': 'Configurar Webhook',
      'loopNode': 'Configurar Loop'
    };
    
    return typeMap[node.type] || 'Configurar Node';
  };

  const renderGeneralSection = () => {
    if (node?.type === 'triggerNode') {
      return renderTriggerSection();
    }
    if (node?.type === 'taskNode') {
      return renderTaskSection();
    }
    if (node?.type === 'approvalNode') {
      return renderApprovalSection();
    }
    if (node?.type === 'conditionNode') {
      return renderConditionSection();
    }
    if (node?.type === 'delayNode') {
      return renderDelaySection();
    }
    if (node?.type === 'loopNode') {
      return renderLoopSection();
    }
    if (node?.type === 'formNode') {
      return renderFormSection();
    }
    if (node?.type === 'webhookNode') {
      return renderWebhookSection();
    }
    if (node?.type === 'notificationNode') {
      return renderNotificationSection();
    }
    
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="nodeLabel" className="text-sm font-medium">
              Rótulo do Node
            </Label>
            <Input
              id="nodeLabel"
              value={nodeData.label as string || ''}
              onChange={(e) => handleDataChange('label', e.target.value)}
              placeholder="Digite um rótulo descritivo"
              className="mt-1"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderTriggerSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="nodeLabel" className="text-sm font-medium">
            Rótulo do Trigger
          </Label>
          <Input
            id="nodeLabel"
            value={nodeData.label as string || ''}
            onChange={(e) => handleDataChange('label', e.target.value)}
            placeholder="Nome do trigger"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            <Zap className="inline-block w-4 h-4 mr-2" />
            Tipo de Trigger
          </Label>
          <CustomSelect
            value={nodeData.triggerType as string || 'manual'}
            onValueChange={(value) => handleDataChange('triggerType', value)}
            options={[
              { value: 'manual', label: 'Manual - Executado manualmente' },
              { value: 'status_change', label: 'Mudança de Status' },
              { value: 'date_time', label: 'Data/Hora Específica' },
              { value: 'recurring_interval', label: 'Recorrente - Intervalo' },
              { value: 'recurring_schedule', label: 'Recorrente - Cronograma' },
              { value: 'recurring_monthly', label: 'Recorrente - Mensal' },
              { value: 'user_inactivity', label: 'Inatividade do Usuário' },
              { value: 'system_event', label: 'Evento do Sistema' },
              { value: 'protheus_record_change', label: 'Mudança em Tabela Protheus' }
            ]}
          />
        </div>

        {nodeData.triggerType === 'status_change' && (
          <>
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Status que irá disparar
              </Label>
              <CustomSelect
                value={nodeData.statusTrigger as string || ''}
                onValueChange={(value) => handleDataChange('statusTrigger', value)}
                options={[
                  { value: 'pending', label: 'Pendente' },
                  { value: 'in_progress', label: 'Em Andamento' },
                  { value: 'completed', label: 'Concluído' },
                  { value: 'cancelled', label: 'Cancelado' },
                  { value: 'expired', label: 'Expirado' }
                ]}
                placeholder="Selecione o status"
              />
            </div>
          </>
        )}

        {nodeData.triggerType === 'date_time' && (
          <>
            <div>
              <Label htmlFor="triggerDate" className="text-sm font-medium">
                <CalendarIcon className="inline-block w-4 h-4 mr-2" />
                Data/Hora do Trigger
              </Label>
              <Input
                id="triggerDate"
                type="datetime-local"
                value={nodeData.triggerDateTime as string || ''}
                onChange={(e) => handleDataChange('triggerDateTime', e.target.value)}
                className="mt-1"
              />
            </div>
          </>
        )}

        {nodeData.triggerType === 'recurring_interval' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="intervalAmount" className="text-sm font-medium">
                  Quantidade
                </Label>
                <Input
                  id="intervalAmount"
                  type="number"
                  min="1"
                  value={nodeData.intervalAmount as number || 1}
                  onChange={(e) => handleDataChange('intervalAmount', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  Unidade
                </Label>
                <CustomSelect
                  value={nodeData.intervalUnit as string || 'minutes'}
                  onValueChange={(value) => handleDataChange('intervalUnit', value)}
                  options={[
                    { value: 'minutes', label: 'Minutos' },
                    { value: 'hours', label: 'Horas' },
                    { value: 'days', label: 'Dias' },
                    { value: 'weeks', label: 'Semanas' }
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        {nodeData.triggerType === 'recurring_schedule' && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Dias da Semana
              </Label>
              <div className="grid grid-cols-7 gap-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`schedule-day-${index}`}
                      checked={(nodeData.scheduleDays as number[] || []).includes(index)}
                      onCheckedChange={(checked) => {
                        const days = (nodeData.scheduleDays as number[] || []);
                        if (checked) {
                          handleDataChange('scheduleDays', [...days, index]);
                        } else {
                          handleDataChange('scheduleDays', days.filter(d => d !== index));
                        }
                      }}
                    />
                    <Label htmlFor={`schedule-day-${index}`} className="text-xs">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="scheduleTime" className="text-sm font-medium">
                Hora
              </Label>
              <Input
                id="scheduleTime"
                type="time"
                value={nodeData.scheduleTime as string || '09:00'}
                onChange={(e) => handleDataChange('scheduleTime', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        )}

        {nodeData.triggerType === 'recurring_monthly' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="monthlyDay" className="text-sm font-medium">
                  Dia do Mês
                </Label>
                <Input
                  id="monthlyDay"
                  type="number"
                  min="1"
                  max="31"
                  value={nodeData.monthlyDay as number || 1}
                  onChange={(e) => handleDataChange('monthlyDay', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="monthlyTime" className="text-sm font-medium">
                  Hora
                </Label>
                <Input
                  id="monthlyTime"
                  type="time"
                  value={nodeData.monthlyTime as string || '09:00'}
                  onChange={(e) => handleDataChange('monthlyTime', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {(nodeData.triggerType?.toString().startsWith('recurring_')) && (
          <>
            <Separator className="my-6" />
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <Clock className="inline-block w-4 h-4 mr-2" />
                Configurações de Término
              </h4>
              <RadioGroup
                value={nodeData.recurrenceEndType as string || 'infinite'}
                onValueChange={(value) => handleDataChange('recurrenceEndType', value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="infinite" id="infinite" />
                  <Label htmlFor="infinite">Executar indefinidamente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="until_date" id="until_date" />
                  <Label htmlFor="until_date">Até uma data específica</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="count" id="count" />
                  <Label htmlFor="count">Número específico de execuções</Label>
                </div>
              </RadioGroup>
              
              {nodeData.recurrenceEndType === 'until_date' && (
                <div>
                  <Label htmlFor="recurrenceEndDate" className="text-sm font-medium">
                    Data Final
                  </Label>
                  <Input
                    id="recurrenceEndDate"
                    type="date"
                    value={nodeData.recurrenceEndDate as string || ''}
                    onChange={(e) => handleDataChange('recurrenceEndDate', e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
              
              {nodeData.recurrenceEndType === 'count' && (
                <div>
                  <Label htmlFor="recurrenceCount" className="text-sm font-medium">
                    Número de Execuções
                  </Label>
                  <Input
                    id="recurrenceCount"
                    type="number"
                    min="1"
                    value={nodeData.recurrenceCount as number || 1}
                    onChange={(e) => handleDataChange('recurrenceCount', parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <Separator className="my-6" />
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <X className="inline-block w-4 h-4 mr-2" />
                Exclusões Avançadas
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="excludeWeekends"
                    checked={nodeData.excludeWeekends as boolean || false}
                    onCheckedChange={(checked) => handleDataChange('excludeWeekends', checked)}
                  />
                  <Label htmlFor="excludeWeekends">Excluir fins de semana</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="excludeHolidays"
                    checked={nodeData.excludeHolidays as boolean || false}
                    onCheckedChange={(checked) => handleDataChange('excludeHolidays', checked)}
                  />
                  <Label htmlFor="excludeHolidays">Excluir feriados nacionais</Label>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Datas Específicas para Excluir
                </Label>
                <div className="space-y-2">
                  {((nodeData.excludeSpecificDates as string[]) || []).map((date, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => {
                          const dates = [...((nodeData.excludeSpecificDates as string[]) || [])];
                          dates[index] = e.target.value;
                          handleDataChange('excludeSpecificDates', dates);
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const dates = ((nodeData.excludeSpecificDates as string[]) || []).filter((_, i) => i !== index);
                          handleDataChange('excludeSpecificDates', dates);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const dates = [...((nodeData.excludeSpecificDates as string[]) || []), ''];
                      handleDataChange('excludeSpecificDates', dates);
                    }}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Data
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="my-6" />
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <Settings className="inline-block w-4 h-4 mr-2" />
                Controles de Execução
              </h4>
              <div>
                <Label htmlFor="maxExecutions" className="text-sm font-medium">
                  Limite Máximo de Execuções (opcional)
                </Label>
                <Input
                  id="maxExecutions"
                  type="number"
                  min="1"
                  placeholder="Deixe vazio para ilimitado"
                  value={nodeData.maxExecutions as number || ''}
                  onChange={(e) => handleDataChange('maxExecutions', e.target.value ? parseInt(e.target.value) : null)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-sm font-medium">
                  Data Final do Trigger (opcional)
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={nodeData.endDate as string || ''}
                  onChange={(e) => handleDataChange('endDate', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </>
        )}

        {nodeData.triggerType === 'user_inactivity' && (
          <>
            <div>
              <Label htmlFor="inactivityDays" className="text-sm font-medium">
                <UserX className="inline-block w-4 h-4 mr-2" />
                Dias de Inatividade
              </Label>
              <Input
                id="inactivityDays"
                type="number"
                min="1"
                value={nodeData.inactivityDays as number || 7}
                onChange={(e) => handleDataChange('inactivityDays', parseInt(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Número de dias sem atividade para disparar o trigger
              </p>
            </div>
          </>
        )}

        {nodeData.triggerType === 'system_event' && (
          <>
            <div>
              <Label className="text-sm font-medium mb-3 block">
                <BarChart3 className="inline-block w-4 h-4 mr-2" />
                Evento do Sistema
              </Label>
              <CustomSelect
                value={nodeData.systemEvent as string || ''}
                onValueChange={(value) => handleDataChange('systemEvent', value)}
                options={[
                  { value: 'user_created', label: 'Usuário Criado' },
                  { value: 'task_overdue', label: 'Tarefa em Atraso' },
                  { value: 'approval_expired', label: 'Aprovação Expirada' },
                  { value: 'system_backup', label: 'Backup do Sistema' }
                ]}
                placeholder="Selecione o evento"
              />
            </div>
          </>
        )}

        {nodeData.triggerType === 'protheus_record_change' && (
          <div className="mt-6">
            <ProtheusWorkflowTriggerConfig
              triggerConfig={nodeData}
              onConfigChange={(config) => {
                handleDataChange('table_id', config.table_id);
                handleDataChange('statuses', config.statuses);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderTaskSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="nodeLabel" className="text-sm font-medium">
            Nome da Tarefa
          </Label>
          <Input
            id="nodeLabel"
            value={nodeData.label as string || ''}
            onChange={(e) => handleDataChange('label', e.target.value)}
            placeholder="Nome da tarefa"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="taskTitle" className="text-sm font-medium">
            Título da Tarefa
          </Label>
          <Input
            id="taskTitle"
            value={nodeData.taskTitle as string || ''}
            onChange={(e) => handleDataChange('taskTitle', e.target.value)}
            placeholder="Ex: Revisar documentos"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="taskDescription" className="text-sm font-medium">
            Descrição da Tarefa
          </Label>
          <Textarea
            id="taskDescription"
            value={nodeData.taskDescription as string || ''}
            onChange={(e) => handleDataChange('taskDescription', e.target.value)}
            placeholder="Descreva a tarefa..."
            className="mt-1 min-h-[100px]"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            Atribuir Tarefa Para
          </Label>
          <CustomSelect
            value={nodeData.assignedTo as string || ''}
            onValueChange={(value) => handleDataChange('assignedTo', value)}
            options={profiles.map(profile => ({
              value: profile.id,
              label: `${profile.name} - ${profile.department || 'Sem departamento'}`
            }))}
            placeholder="Selecione um usuário"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            Prioridade da Tarefa
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'low', label: 'Baixa', color: 'bg-green-100 text-green-800' },
              { value: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
              { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
              { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800' }
            ].map((priority) => (
              <button
                key={priority.value}
                onClick={() => handleDataChange('priority', priority.value)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                  nodeData.priority === priority.value
                    ? `${priority.color} border-current`
                    : "bg-muted text-muted-foreground border-border hover:bg-accent"
                )}
              >
                {priority.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="dueDate" className="text-sm font-medium">
            Data de Vencimento (Opcional)
          </Label>
          <Input
            id="dueDate"
            type="datetime-local"
            value={nodeData.dueDate as string || ''}
            onChange={(e) => handleDataChange('dueDate', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  const renderApprovalSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="nodeLabel" className="text-sm font-medium">
            Nome da Aprovação
          </Label>
          <Input
            id="nodeLabel"
            value={nodeData.label as string || ''}
            onChange={(e) => handleDataChange('label', e.target.value)}
            placeholder="Nome da aprovação"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="approvalTitle" className="text-sm font-medium">
            Título da Aprovação
          </Label>
          <Input
            id="approvalTitle"
            value={nodeData.approvalTitle as string || ''}
            onChange={(e) => handleDataChange('approvalTitle', e.target.value)}
            placeholder="Ex: Aprovação de Despesa"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="approvalDescription" className="text-sm font-medium">
            Descrição da Aprovação
          </Label>
          <Textarea
            id="approvalDescription"
            value={nodeData.approvalDescription as string || ''}
            onChange={(e) => handleDataChange('approvalDescription', e.target.value)}
            placeholder="Descreva o que deve ser aprovado..."
            className="mt-1 min-h-[100px]"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            Formato de Aprovação
          </Label>
          <CustomSelect
            value={nodeData.approvalFormat as string || 'single'}
            onValueChange={(value) => handleDataChange('approvalFormat', value)}
            options={[
              { value: 'single', label: 'Um único aprovador' },
              { value: 'any', label: 'Qualquer um dos aprovadores' },
              { value: 'all', label: 'Todos os aprovadores obrigatoriamente' }
            ]}
          />
        </div>

        {nodeData.approvalFormat === 'single' && (
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Aprovador Único
            </Label>
            <CustomSelect
              value={nodeData.singleApprover as string || ''}
              onValueChange={(value) => handleDataChange('singleApprover', value)}
              options={profiles.map(profile => ({
                value: profile.id,
                label: `${profile.name} - ${profile.department || 'Sem departamento'}`
              }))}
              placeholder="Selecione o aprovador"
            />
          </div>
        )}

        <div>
          <Label htmlFor="expirationDays" className="text-sm font-medium">
            Prazo para Aprovação (dias)
          </Label>
          <Input
            id="expirationDays"
            type="number"
            min="1"
            value={nodeData.expirationDays as number || 3}
            onChange={(e) => handleDataChange('expirationDays', parseInt(e.target.value))}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Número de dias para expirar a aprovação automaticamente
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="allowCorrections"
            checked={nodeData.allowCorrections as boolean || false}
            onCheckedChange={(checked) => handleDataChange('allowCorrections', checked)}
          />
          <Label htmlFor="allowCorrections" className="text-sm font-medium">
            Permitir Correções
          </Label>
        </div>
      </div>
    </div>
  );

  const renderConditionSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="nodeLabel" className="text-sm font-medium">
            Nome da Condição
          </Label>
          <Input
            id="nodeLabel"
            value={nodeData.label as string || ''}
            onChange={(e) => handleDataChange('label', e.target.value)}
            placeholder="Nome da condição"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            <GitBranch className="inline-block w-4 h-4 mr-2" />
            Campo a Verificar
          </Label>
          <CustomSelect
            value={nodeData.conditionField as string || ''}
            onValueChange={(value) => handleDataChange('conditionField', value)}
            options={[
              { value: 'status', label: 'Status' },
              { value: 'priority', label: 'Prioridade' },
              { value: 'assignedTo', label: 'Usuário Atribuído' },
              { value: 'department', label: 'Departamento' },
              { value: 'amount', label: 'Valor/Quantidade' },
              { value: 'custom', label: 'Campo Personalizado' }
            ]}
            placeholder="Selecione o campo"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            Operador
          </Label>
          <CustomSelect
            value={nodeData.conditionOperator as string || 'equals'}
            onValueChange={(value) => handleDataChange('conditionOperator', value)}
            options={[
              { value: 'equals', label: 'Igual a' },
              { value: 'not_equals', label: 'Diferente de' },
              { value: 'greater_than', label: 'Maior que' },
              { value: 'less_than', label: 'Menor que' },
              { value: 'contains', label: 'Contém' },
              { value: 'not_contains', label: 'Não contém' },
              { value: 'starts_with', label: 'Começa com' },
              { value: 'ends_with', label: 'Termina com' }
            ]}
          />
        </div>

        <div>
          <Label htmlFor="conditionValue" className="text-sm font-medium">
            Valor de Comparação
          </Label>
          <Input
            id="conditionValue"
            value={nodeData.conditionValue as string || ''}
            onChange={(e) => handleDataChange('conditionValue', e.target.value)}
            placeholder="Digite o valor para comparação"
            className="mt-1"
          />
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-2">Preview da Condição</h4>
          <p className="text-sm text-muted-foreground">
            Se <strong>{String(nodeData.conditionField || 'campo')}</strong> {' '}
            <strong>{
              String(nodeData.conditionOperator) === 'equals' ? 'for igual a' :
              String(nodeData.conditionOperator) === 'not_equals' ? 'for diferente de' :
              String(nodeData.conditionOperator) === 'greater_than' ? 'for maior que' :
              String(nodeData.conditionOperator) === 'less_than' ? 'for menor que' :
              String(nodeData.conditionOperator) === 'contains' ? 'contiver' :
              String(nodeData.conditionOperator) === 'not_contains' ? 'não contiver' :
              String(nodeData.conditionOperator) === 'starts_with' ? 'começar com' :
              String(nodeData.conditionOperator) === 'ends_with' ? 'terminar com' :
              String(nodeData.conditionOperator || 'operador')
            }</strong> {' '}
            <strong>{String(nodeData.conditionValue || 'valor')}</strong>, seguir para "Verdadeiro", caso contrário seguir para "Falso"
          </p>
        </div>
      </div>
    </div>
  );

  const renderDelaySection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="nodeLabel" className="text-sm font-medium">
            Nome do Atraso
          </Label>
          <Input
            id="nodeLabel"
            value={nodeData.label as string || ''}
            onChange={(e) => handleDataChange('label', e.target.value)}
            placeholder="Nome do atraso"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            <Clock className="inline-block w-4 h-4 mr-2" />
            Tipo de Atraso
          </Label>
          <RadioGroup
            value={nodeData.delayType as string || 'duration'}
            onValueChange={(value) => handleDataChange('delayType', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="duration" id="duration" />
              <Label htmlFor="duration">Duração específica</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="until_date" id="until_date" />
              <Label htmlFor="until_date">Aguardar até data específica</Label>
            </div>
          </RadioGroup>
        </div>

        {nodeData.delayType === 'duration' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delayAmount" className="text-sm font-medium">
                  Quantidade
                </Label>
                <Input
                  id="delayAmount"
                  type="number"
                  min="1"
                  value={nodeData.delayAmount as number || 1}
                  onChange={(e) => handleDataChange('delayAmount', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Unidade
                </Label>
                <CustomSelect
                  value={nodeData.delayUnit as string || 'minutes'}
                  onValueChange={(value) => handleDataChange('delayUnit', value)}
                  options={[
                    { value: 'minutes', label: 'Minutos' },
                    { value: 'hours', label: 'Horas' },
                    { value: 'days', label: 'Dias' },
                    { value: 'weeks', label: 'Semanas' },
                    { value: 'months', label: 'Meses' }
                  ]}
                />
              </div>
            </div>
          </>
        )}

        {nodeData.delayType === 'until_date' && (
          <div>
            <Label htmlFor="delayUntilDate" className="text-sm font-medium">
              Data/Hora para Continuar
            </Label>
            <Input
              id="delayUntilDate"
              type="datetime-local"
              value={nodeData.delayUntilDate as string || ''}
              onChange={(e) => handleDataChange('delayUntilDate', e.target.value)}
              className="mt-1"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderLoopSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="nodeLabel" className="text-sm font-medium">
            Nome do Loop
          </Label>
          <Input
            id="nodeLabel"
            value={nodeData.label as string || ''}
            onChange={(e) => handleDataChange('label', e.target.value)}
            placeholder="Nome do loop"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            <RotateCcw className="inline-block w-4 h-4 mr-2" />
            Tipo de Loop
          </Label>
          <RadioGroup
            value={nodeData.loopType as string || 'count'}
            onValueChange={(value) => handleDataChange('loopType', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="count" id="count" />
              <Label htmlFor="count">Número específico de iterações</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="condition" id="condition" />
              <Label htmlFor="condition">Baseado em condição</Label>
            </div>
          </RadioGroup>
        </div>

        {nodeData.loopType === 'count' && (
          <div>
            <Label htmlFor="maxIterations" className="text-sm font-medium">
              Número Máximo de Iterações
            </Label>
            <Input
              id="maxIterations"
              type="number"
              min="1"
              max="100"
              value={nodeData.maxIterations as number || 5}
              onChange={(e) => handleDataChange('maxIterations', parseInt(e.target.value))}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Máximo de 100 iterações por questões de segurança
            </p>
          </div>
        )}

        {nodeData.loopType === 'condition' && (
          <>
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Campo a Verificar
              </Label>
              <CustomSelect
                value={nodeData.loopConditionField as string || ''}
                onValueChange={(value) => handleDataChange('loopConditionField', value)}
                options={[
                  { value: 'status', label: 'Status' },
                  { value: 'count', label: 'Contador' },
                  { value: 'custom', label: 'Campo Personalizado' }
                ]}
                placeholder="Selecione o campo"
              />
            </div>

            <div>
              <Label htmlFor="loopConditionValue" className="text-sm font-medium">
                Valor para Parar o Loop
              </Label>
              <Input
                id="loopConditionValue"
                value={nodeData.loopConditionValue as string || ''}
                onChange={(e) => handleDataChange('loopConditionValue', e.target.value)}
                placeholder="Valor de parada"
                className="mt-1"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderFormSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="nodeLabel" className="text-sm font-medium">
            Nome do Formulário
          </Label>
          <Input
            id="nodeLabel"
            value={nodeData.label as string || ''}
            onChange={(e) => handleDataChange('label', e.target.value)}
            placeholder="Nome do formulário"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="formTitle" className="text-sm font-medium">
            <FileText className="inline-block w-4 h-4 mr-2" />
            Título do Formulário
          </Label>
          <Input
            id="formTitle"
            value={nodeData.formTitle as string || ''}
            onChange={(e) => handleDataChange('formTitle', e.target.value)}
            placeholder="Ex: Solicitação de Férias"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="formDescription" className="text-sm font-medium">
            Descrição do Formulário
          </Label>
          <Textarea
            id="formDescription"
            value={nodeData.formDescription as string || ''}
            onChange={(e) => handleDataChange('formDescription', e.target.value)}
            placeholder="Descreva o propósito do formulário..."
            className="mt-1 min-h-[100px]"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            Campos do Formulário
          </Label>
          <div className="space-y-3">
            {(nodeData.fields as any[] || []).map((field: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <span className="text-sm font-medium">{field.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">({field.type})</span>
                  {field.required && <Badge variant="secondary" className="ml-2 text-xs">Obrigatório</Badge>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const fields = (nodeData.fields as any[] || []);
                    handleDataChange('fields', fields.filter((_, i) => i !== index));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={() => {
                const fields = (nodeData.fields as any[] || []);
                handleDataChange('fields', [
                  ...fields,
                  { name: 'Novo Campo', type: 'text', required: false }
                ]);
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Campo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWebhookSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="nodeLabel" className="text-sm font-medium">
            Nome do Webhook
          </Label>
          <Input
            id="nodeLabel"
            value={nodeData.label as string || ''}
            onChange={(e) => handleDataChange('label', e.target.value)}
            placeholder="Nome do webhook"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="webhookUrl" className="text-sm font-medium">
            <Globe className="inline-block w-4 h-4 mr-2" />
            URL do Webhook
          </Label>
          <Input
            id="webhookUrl"
            value={nodeData.url as string || ''}
            onChange={(e) => handleDataChange('url', e.target.value)}
            placeholder="https://api.exemplo.com/webhook"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            Método HTTP
          </Label>
          <CustomSelect
            value={nodeData.method as string || 'POST'}
            onValueChange={(value) => handleDataChange('method', value)}
            options={[
              { value: 'GET', label: 'GET' },
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' },
              { value: 'PATCH', label: 'PATCH' },
              { value: 'DELETE', label: 'DELETE' }
            ]}
          />
        </div>

        <div>
          <Label htmlFor="webhookHeaders" className="text-sm font-medium">
            Headers (JSON)
          </Label>
          <Textarea
            id="webhookHeaders"
            value={nodeData.headers as string || '{}'}
            onChange={(e) => handleDataChange('headers', e.target.value)}
            placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
            className="mt-1 min-h-[100px] font-mono"
          />
        </div>

        <div>
          <Label htmlFor="webhookBody" className="text-sm font-medium">
            Body da Requisição (JSON)
          </Label>
          <Textarea
            id="webhookBody"
            value={nodeData.body as string || '{}'}
            onChange={(e) => handleDataChange('body', e.target.value)}
            placeholder='{"message": "Workflow executado", "data": "{{workflow_data}}"}'
            className="mt-1 min-h-[100px] font-mono"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="retryOnFailure"
            checked={nodeData.retryOnFailure as boolean || false}
            onCheckedChange={(checked) => handleDataChange('retryOnFailure', checked)}
          />
          <Label htmlFor="retryOnFailure" className="text-sm font-medium">
            Tentar novamente em caso de falha
          </Label>
        </div>
      </div>
    </div>
  );

  const renderNotificationSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="nodeLabel" className="text-sm font-medium">
            Nome da Notificação
          </Label>
          <Input
            id="nodeLabel"
            value={nodeData.label as string || ''}
            onChange={(e) => handleDataChange('label', e.target.value)}
            placeholder="Nome da notificação"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="notificationTitle" className="text-sm font-medium">
            Título da Notificação
          </Label>
          <Input
            id="notificationTitle"
            value={nodeData.notificationTitle as string || ''}
            onChange={(e) => handleDataChange('notificationTitle', e.target.value)}
            placeholder="Ex: Nova tarefa atribuída"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="notificationMessage" className="text-sm font-medium">
            Mensagem da Notificação
          </Label>
          <Textarea
            id="notificationMessage"
            value={nodeData.notificationMessage as string || ''}
            onChange={(e) => handleDataChange('notificationMessage', e.target.value)}
            placeholder="Digite a mensagem da notificação..."
            className="mt-1 min-h-[100px]"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            Destinatário da Notificação
          </Label>
          <CustomSelect
            value={nodeData.notificationRecipient as string || ''}
            onValueChange={(value) => handleDataChange('notificationRecipient', value)}
            options={[
              { value: 'workflow_initiator', label: 'Iniciador do Workflow' },
              { value: 'task_assignee', label: 'Responsável pela Tarefa' },
              { value: 'approver', label: 'Aprovador' },
              { value: 'department_manager', label: 'Gerente do Departamento' },
              { value: 'specific_user', label: 'Usuário Específico' },
              { value: 'all_users', label: 'Todos os Usuários' }
            ]}
            placeholder="Selecione o destinatário"
          />
        </div>

        {nodeData.notificationRecipient === 'specific_user' && (
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Usuário Específico
            </Label>
            <CustomSelect
              value={nodeData.specificUser as string || ''}
              onValueChange={(value) => handleDataChange('specificUser', value)}
              options={profiles.map(profile => ({
                value: profile.id,
                label: `${profile.name} - ${profile.department || 'Sem departamento'}`
              }))}
              placeholder="Selecione o usuário"
            />
          </div>
        )}

        <div>
          <Label className="text-sm font-medium mb-3 block">
            Tipo de Notificação
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailNotification"
                checked={nodeData.sendEmail as boolean || false}
                onCheckedChange={(checked) => handleDataChange('sendEmail', checked)}
              />
              <Label htmlFor="emailNotification" className="text-sm">
                Email
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inAppNotification"
                checked={nodeData.sendInApp as boolean || true}
                onCheckedChange={(checked) => handleDataChange('sendInApp', checked)}
              />
              <Label htmlFor="inAppNotification" className="text-sm">
                Notificação In-App
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApproversSection = () => {
    if (node?.type !== 'approvalNode') return null;

    const approvalFormat = nodeData.approvalFormat as string || 'single';
    
    if (approvalFormat === 'single') {
      const selectedApprover = nodeData.singleApprover ? 
        profiles.find(p => p.id === nodeData.singleApprover) : null;
      
      return (
        <div className="space-y-6">
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Aprovação por Usuário Único</p>
            
            {selectedApprover ? (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Aprovador selecionado:</p>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {selectedApprover.name}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {selectedApprover.department || 'Sem departamento'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Para alterar, vá para a seção Geral
                </p>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Nenhum aprovador selecionado ainda
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure um aprovador específico na seção Geral
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Seleção Avançada de Aprovadores</h3>
          </div>
          
          <AdvancedApproverSelector
            value={(nodeData.approverSelection as ApprovalSelection) || {
              specificUsers: [],
              roleSelections: [],
              departmentSelections: []
            }}
            onChange={(selection) => handleDataChange('approverSelection', selection)}
            approvalFormat={approvalFormat as 'single' | 'any' | 'all'}
          />
        </div>
      </div>
    );
  };

  const renderPreviewSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Preview da Configuração</h3>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tipo do Node:</span>
            <Badge variant="secondary">{node?.type}</Badge>
          </div>
          
          {nodeData.label && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Rótulo:</span>
              <span className="text-sm text-muted-foreground">{String(nodeData.label)}</span>
            </div>
          )}

          {/* Trigger Node Preview */}
          {node?.type === 'triggerNode' && (
            <>
              {nodeData.triggerType && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tipo:</span>
                  <Badge variant="outline">
                    {nodeData.triggerType === 'manual' ? 'Manual' :
                     nodeData.triggerType === 'status_change' ? 'Mudança de Status' :
                     nodeData.triggerType === 'date_time' ? 'Data/Hora' :
                     nodeData.triggerType === 'recurring' ? 'Recorrente' :
                     nodeData.triggerType === 'user_inactivity' ? 'Inatividade' :
                     nodeData.triggerType === 'system_event' ? 'Evento do Sistema' :
                     String(nodeData.triggerType)}
                  </Badge>
                </div>
              )}
              
              {nodeData.triggerType === 'status_change' && nodeData.statusTrigger && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <span className="text-sm text-muted-foreground">{String(nodeData.statusTrigger)}</span>
                </div>
              )}
              
              {nodeData.triggerType === 'recurring' && nodeData.recurringType && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Recorrência:</span>
                  <span className="text-sm text-muted-foreground">{String(nodeData.recurringType)}</span>
                </div>
              )}
            </>
          )}

          {/* Task Node Preview */}
          {node?.type === 'taskNode' && (
            <>
              {nodeData.taskTitle && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Título:</span>
                  <span className="text-sm text-muted-foreground">{String(nodeData.taskTitle)}</span>
                </div>
              )}
              
              {nodeData.assignedTo && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Atribuído para:</span>
                  <span className="text-sm text-muted-foreground">
                    {profiles.find(p => p.id === nodeData.assignedTo)?.name || 'Usuário não encontrado'}
                  </span>
                </div>
              )}
              
              {nodeData.priority && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Prioridade:</span>
                  <Badge variant={
                    nodeData.priority === 'urgent' ? 'destructive' :
                    nodeData.priority === 'high' ? 'default' :
                    nodeData.priority === 'medium' ? 'secondary' : 'outline'
                  }>
                    {nodeData.priority === 'low' ? 'Baixa' :
                     nodeData.priority === 'medium' ? 'Média' :
                     nodeData.priority === 'high' ? 'Alta' :
                     nodeData.priority === 'urgent' ? 'Urgente' : String(nodeData.priority)}
                  </Badge>
                </div>
              )}
            </>
          )}

          {/* Approval Node Preview */}
          {node?.type === 'approvalNode' && (
            <>
              {nodeData.approvalTitle && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Título:</span>
                  <span className="text-sm text-muted-foreground">{String(nodeData.approvalTitle)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Formato:</span>
                <Badge variant="outline">
                  {nodeData.approvalFormat === 'single' ? 'Único' : 
                   nodeData.approvalFormat === 'any' ? 'Qualquer um' : 'Todos'}
                </Badge>
              </div>
              
              {nodeData.approvalFormat === 'single' && nodeData.singleApprover && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Aprovador:</span>
                  <span className="text-sm text-muted-foreground">
                    {profiles.find(p => p.id === nodeData.singleApprover)?.name || 'Aprovador não encontrado'}
                  </span>
                </div>
              )}
              
              {nodeData.expirationDays && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Prazo:</span>
                  <span className="text-sm text-muted-foreground">{String(nodeData.expirationDays)} dias</span>
                </div>
              )}
            </>
          )}

          {/* Condition Node Preview */}
          {node?.type === 'conditionNode' && (
            <>
              {nodeData.conditionField && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Campo:</span>
                  <span className="text-sm text-muted-foreground">{String(nodeData.conditionField)}</span>
                </div>
              )}
              
              {nodeData.conditionOperator && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Operador:</span>
                  <span className="text-sm text-muted-foreground">{String(nodeData.conditionOperator)}</span>
                </div>
              )}
              
              {nodeData.conditionValue && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Valor:</span>
                  <span className="text-sm text-muted-foreground">{String(nodeData.conditionValue)}</span>
                </div>
              )}
            </>
          )}

          {/* Delay Node Preview */}
          {node?.type === 'delayNode' && (
            <>
              {nodeData.delayType && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tipo:</span>
                  <Badge variant="outline">
                    {nodeData.delayType === 'duration' ? 'Duração' : 'Até Data'}
                  </Badge>
                </div>
              )}
              
              {nodeData.delayType === 'duration' && nodeData.delayAmount && nodeData.delayUnit && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Duração:</span>
                  <span className="text-sm text-muted-foreground">
                    {String(nodeData.delayAmount)} {String(nodeData.delayUnit)}
                  </span>
                </div>
              )}
              
              {nodeData.delayType === 'until_date' && nodeData.delayUntilDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Data:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(String(nodeData.delayUntilDate)).toLocaleString()}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Loop Node Preview */}
          {node?.type === 'loopNode' && (
            <>
              {nodeData.loopType && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tipo:</span>
                  <Badge variant="outline">
                    {nodeData.loopType === 'count' ? 'Contador' : 'Condicional'}
                  </Badge>
                </div>
              )}
              
              {nodeData.loopType === 'count' && nodeData.maxIterations && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Max Iterações:</span>
                  <span className="text-sm text-muted-foreground">{String(nodeData.maxIterations)}</span>
                </div>
              )}
            </>
          )}

          {/* Form Node Preview */}
          {node?.type === 'formNode' && (
            <>
              {nodeData.formTitle && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Título:</span>
                  <span className="text-sm text-muted-foreground">{String(nodeData.formTitle)}</span>
                </div>
              )}
              
              {nodeData.fields && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Campos:</span>
                  <span className="text-sm text-muted-foreground">
                    {(nodeData.fields as any[]).length} campo(s)
                  </span>
                </div>
              )}
            </>
          )}

          {/* Webhook Node Preview */}
          {node?.type === 'webhookNode' && (
            <>
              {nodeData.url && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">URL:</span>
                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {String(nodeData.url)}
                  </span>
                </div>
              )}
              
              {nodeData.method && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Método:</span>
                  <Badge variant="outline">{String(nodeData.method)}</Badge>
                </div>
              )}
            </>
          )}

          {/* Notification Node Preview */}
          {node?.type === 'notificationNode' && (
            <>
              {nodeData.notificationTitle && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Título:</span>
                  <span className="text-sm text-muted-foreground">{String(nodeData.notificationTitle)}</span>
                </div>
              )}
              
              {nodeData.notificationRecipient && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Destinatário:</span>
                  <span className="text-sm text-muted-foreground">
                    {nodeData.notificationRecipient === 'workflow_initiator' ? 'Iniciador' :
                     nodeData.notificationRecipient === 'task_assignee' ? 'Responsável' :
                     nodeData.notificationRecipient === 'specific_user' ? 'Usuário Específico' :
                     String(nodeData.notificationRecipient)}
                  </span>
                </div>
              )}
            </>
          )}

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );

  const navigationItems = [
    { id: 'general', label: 'Geral', icon: Settings },
    ...(node?.type === 'approvalNode' ? [{ id: 'approvers', label: 'Aprovadores', icon: Users }] : []),
    { id: 'preview', label: 'Preview', icon: Eye },
  ];

  if (!node) return null;

  return (
    <FullscreenDialogContent 
      open={isOpen} 
      onOpenChange={onClose}
      className="grid grid-rows-[auto_1fr_auto]"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b bg-background/50 backdrop-blur flex-shrink-0">
        <div>
          <h2 className="text-xl font-semibold">
            {getNodeTitle()}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure as propriedades do node selecionado
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Navigation Sidebar */}
        <div className="w-64 border-r bg-muted/20 p-4 flex-shrink-0">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6">
            {activeSection === 'general' && renderGeneralSection()}
            {activeSection === 'approvers' && renderApproversSection()}
            {activeSection === 'preview' && renderPreviewSection()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t bg-background/50 backdrop-blur flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {validationErrors.length > 0 ? (
              <span className="text-destructive">
                {validationErrors.length} erro{validationErrors.length > 1 ? 's' : ''} encontrado{validationErrors.length > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-green-600">Configuração válida</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={onClose}
              disabled={validationErrors.length > 0}
            >
              Aplicar Configurações
            </Button>
          </div>
        </div>
      </div>
    </FullscreenDialogContent>
  );
};