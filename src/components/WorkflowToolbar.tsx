import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { 
  Zap, 
  CheckSquare, 
  GitBranch, 
  Clock, 
  Bell, 
  UserCheck,
  GripVertical,
  FileText,
  Globe,
  RotateCcw
} from 'lucide-react';

const nodeConfigs = [
  {
    type: 'triggerNode',
    label: 'Trigger',
    icon: Zap,
    description: 'Inicia o workflow',
    color: 'text-yellow-600',
  },
  {
    type: 'taskNode',
    label: 'Tarefa',
    icon: CheckSquare,
    description: 'Criar ou atribuir tarefa',
    color: 'text-blue-600',
  },
  {
    type: 'conditionNode',
    label: 'Condição',
    icon: GitBranch,
    description: 'Bifurcação condicional',
    color: 'text-purple-600',
  },
  {
    type: 'delayNode',
    label: 'Aguardar',
    icon: Clock,
    description: 'Esperar tempo/data',
    color: 'text-orange-600',
  },
  {
    type: 'notificationNode',
    label: 'Notificação',
    icon: Bell,
    description: 'Enviar notificação',
    color: 'text-green-600',
  },
  {
    type: 'approvalNode',
    label: 'Aprovação',
    icon: UserCheck,
    description: 'Processo de aprovação',
    color: 'text-red-600',
  },
  {
    type: 'formNode',
    label: 'Formulário',
    icon: FileText,
    description: 'Coletar dados do usuário',
    color: 'text-blue-600',
  },
  {
    type: 'webhookNode',
    label: 'Webhook',
    icon: Globe,
    description: 'Chamada para API externa',
    color: 'text-purple-600',
  },
  {
    type: 'loopNode',
    label: 'Loop',
    icon: RotateCcw,
    description: 'Repetir ações',
    color: 'text-orange-600',
  },
];

export const WorkflowToolbar = () => {
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedNode(nodeType);
  };

  const onDragEnd = () => {
    setDraggedNode(null);
  };

  return (
    <div className="w-64 bg-background border-r border-border p-4 overflow-y-auto">
      <h3 className="font-semibold text-sm text-foreground mb-4 uppercase tracking-wide">
        Elementos do Workflow
      </h3>
      
      <div className="space-y-2">
        {nodeConfigs.map((config) => {
          const IconComponent = config.icon;
          return (
            <Card
              key={config.type}
              className={`p-3 cursor-move hover:shadow-md transition-all duration-200 border-2 ${
                draggedNode === config.type 
                  ? 'border-primary shadow-lg scale-105' 
                  : 'border-border hover:border-muted-foreground'
              }`}
              draggable
              onDragStart={(event) => onDragStart(event, config.type)}
              onDragEnd={onDragEnd}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <IconComponent className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {config.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {config.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <h4 className="font-medium text-xs text-muted-foreground mb-2 uppercase tracking-wide">
          Como usar
        </h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Arraste elementos para o canvas</p>
          <p>• Conecte os nodes para criar fluxo</p>
          <p>• Clique nos nodes para configurar</p>
          <p>• Use o trigger para iniciar</p>
        </div>
      </div>
    </div>
  );
};