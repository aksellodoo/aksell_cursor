import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';

interface TriggerNodeProps {
  data: {
    label: string;
    triggerType?: string;
    scheduleTime?: string;
    inactivityAmount?: string;
    inactivityUnit?: string;
    systemEvent?: string;
    statusFrom?: string;
    statusTo?: string;
    [key: string]: any;
  };
  selected?: boolean;
}

export const TriggerNode = memo(({ data, selected }: TriggerNodeProps) => {
  const getTriggerDescription = () => {
    switch (data.triggerType) {
      case 'manual':
        return 'Executar manualmente';
      case 'status_change':
        if (data.statusFrom && data.statusTo) {
          return `Status: ${data.statusFrom} → ${data.statusTo}`;
        } else if (data.statusFrom) {
          return `Status de: ${data.statusFrom}`;
        } else if (data.statusTo) {
          return `Status para: ${data.statusTo}`;
        }
        return 'Mudança de status';
      case 'date_time':
        return data.scheduleTime ? `Em ${new Date(data.scheduleTime).toLocaleString()}` : 'Data específica';
      case 'recurring_interval':
        return getRecurringIntervalDescription();
      case 'recurring_schedule':
        return getRecurringScheduleDescription();
      case 'recurring_monthly':
        return getRecurringMonthlyDescription();
      case 'record_created':
        return 'Novo registro criado';
      case 'task_completed':
        return 'Tarefa finalizada';
      case 'deadline_missed':
        return 'Prazo perdido';
      case 'user_inactive':
        return data.inactivityAmount ? `Inatividade ${data.inactivityAmount} ${data.inactivityUnit || 'dias'}` : 'Usuário inativo';
      case 'department_inactive':
        return data.deptInactivityAmount ? `Depto inativo ${data.deptInactivityAmount} ${data.deptInactivityUnit || 'dias'}` : 'Departamento inativo';
      case 'no_response':
        return data.responseTimeout ? `Sem resposta em ${data.responseTimeout} ${data.responseTimeoutUnit || 'horas'}` : 'Falta de resposta';
      case 'field_change':
        if (data.entityType && data.fieldToMonitor) {
          return `${data.entityType}: ${data.fieldToMonitor} alterado`;
        }
        return 'Mudança em campo específico';
      case 'tasks_accumulation':
        if (data.taskLimit) {
          const target = data.accumulationTarget === 'user' ? 'usuário' : 'departamento';
          return `${target}: > ${data.taskLimit} tarefas`;
        }
        return 'Acúmulo de tarefas pendentes';
      case 'system_event':
        return data.systemEvent ? getSystemEventLabel(data.systemEvent) : 'Evento do sistema';
      case 'protheus_record_change':
        if (data.table_id && data.statuses) {
          const statusCount = Array.isArray(data.statuses) ? data.statuses.length : 0;
          return `Protheus: ${statusCount} estado(s) selecionado(s)`;
        }
        return 'Mudança em tabela Protheus';
      default:
        return 'Configurar trigger';
    }
  };

  const getRecurringIntervalDescription = () => {
    if (!data.intervalAmount || !data.intervalUnit) {
      return 'Configurar recorrência por intervalo';
    }
    const description = `A cada ${data.intervalAmount} ${getUnitLabel(data.intervalUnit)}`;
    return description + getRecurrenceEndDescription();
  };

  const getRecurringScheduleDescription = () => {
    if (!data.scheduleDays || !data.scheduleTime) {
      return 'Configurar recorrência agendada';
    }
    const days = Array.isArray(data.scheduleDays) ? data.scheduleDays.map(getDayLabel).join(', ') : getDayLabel(data.scheduleDays);
    const description = `${days} às ${data.scheduleTime}`;
    return description + getRecurrenceEndDescription();
  };

  const getRecurringMonthlyDescription = () => {
    if (!data.monthlyDay || !data.monthlyTime) {
      return 'Configurar recorrência mensal';
    }
    const description = `Dia ${data.monthlyDay} às ${data.monthlyTime}`;
    return description + getRecurrenceEndDescription();
  };

  const getRecurrenceEndDescription = () => {
    if (data.recurrenceEnd === 'until_date' && data.recurrenceEndDate) {
      return ` até ${new Date(data.recurrenceEndDate).toLocaleDateString()}`;
    }
    if (data.recurrenceEnd === 'count' && data.recurrenceCount) {
      return ` (${data.recurrenceCount}x)`;
    }
    return data.recurrenceEnd === 'infinite' ? ' (infinito)' : '';
  };

  const getUnitLabel = (unit: string) => {
    const labels = {
      'minutes': 'minutos',
      'hours': 'horas', 
      'days': 'dias',
      'weeks': 'semanas'
    };
    return labels[unit] || unit;
  };

  const getDayLabel = (day: string) => {
    const labels = {
      'monday': 'Seg',
      'tuesday': 'Ter',
      'wednesday': 'Qua',
      'thursday': 'Qui',
      'friday': 'Sex',
      'saturday': 'Sáb',
      'sunday': 'Dom'
    };
    return labels[day] || day;
  };

  const getSystemEventLabel = (event: string) => {
    const labels = {
      'user_created': 'Usuário criado',
      'user_department_changed': 'Mudança de departamento',
      'user_role_changed': 'Mudança de role',
      'user_login': 'Login de usuário',
      'user_logout': 'Logout de usuário',
      'task_created': 'Tarefa criada',
      'task_edited': 'Tarefa editada',
      'file_uploaded': 'Arquivo enviado',
      'document_expired': 'Documento vencido'
    };
    return labels[event] || event;
  };

  return (
    <div className={`
      min-w-[200px] bg-background border-2 rounded-lg shadow-lg p-4
      ${selected ? 'border-primary' : 'border-border'}
      hover:border-muted-foreground transition-colors duration-200
    `}>
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-5 h-5 text-yellow-600" />
        <span className="font-semibold text-sm text-foreground">
          {data.label || 'Trigger'}
        </span>
      </div>

      <div className="text-xs text-muted-foreground">
        {getTriggerDescription()}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-yellow-600" />
    </div>
  );
});