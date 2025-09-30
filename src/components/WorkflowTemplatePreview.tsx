import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { WorkflowTemplate } from "@/hooks/useWorkflowTemplates";
import { Download, AlertCircle, CheckCircle, Info, Tag, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState 
} from '@xyflow/react';
import { convertTemplateToBuilderEnhanced, getNodeTypeLabel } from "@/utils/workflowTemplateUtils";
import { TaskNode } from "./workflow-nodes/TaskNode";
import { ConditionNode } from "./workflow-nodes/ConditionNode";
import { DelayNode } from "./workflow-nodes/DelayNode";
import { NotificationNode } from "./workflow-nodes/NotificationNode";
import { ApprovalNode } from "./workflow-nodes/ApprovalNode";
import { TriggerNode } from "./workflow-nodes/TriggerNode";
import { FormNode } from "./workflow-nodes/FormNode";
import { WebhookNode } from "./workflow-nodes/WebhookNode";
import { LoopNode } from "./workflow-nodes/LoopNode";

import '@xyflow/react/dist/style.css';

interface WorkflowTemplatePreviewProps {
  template: WorkflowTemplate;
  onUse: () => void;
}

const nodeTypes = {
  taskNode: TaskNode,
  conditionNode: ConditionNode,
  delayNode: DelayNode,
  notificationNode: NotificationNode,
  approvalNode: ApprovalNode,
  triggerNode: TriggerNode,
  formNode: FormNode,
  webhookNode: WebhookNode,
  loopNode: LoopNode,
};

export const WorkflowTemplatePreview = ({ template, onUse }: WorkflowTemplatePreviewProps) => {
  const getComplexityColor = (level: string) => {
    const colors = {
      'basic': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getComplexityLabel = (level: string) => {
    const labels = {
      'basic': 'Básico',
      'intermediate': 'Intermediário',
      'advanced': 'Avançado'
    };
    return labels[level] || level;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      'rh': 'Recursos Humanos',
      'financeiro': 'Financeiro',
      'geral': 'Geral',
      'ti': 'Tecnologia da Informação',
      'marketing': 'Marketing',
      'vendas': 'Vendas',
      'operacional': 'Operacional'
    };
    return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Convert template to builder format for visualization
  const convertedWorkflow = useMemo(() => {
    return convertTemplateToBuilderEnhanced(template.workflow_definition);
  }, [template.workflow_definition]);

  const [nodes, setNodes, onNodesChange] = useNodesState(convertedWorkflow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(convertedWorkflow.edges);

  // Count nodes in workflow definition
  const getWorkflowStats = () => {
    const templateNodes = template.workflow_definition?.nodes || [];
    const templateEdges = template.workflow_definition?.edges || [];
    
    const nodeTypeCounts = templateNodes.reduce((acc: any, node: any) => {
      const label = getNodeTypeLabel(node.type);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    return { totalNodes: templateNodes.length, totalEdges: templateEdges.length, nodeTypes: nodeTypeCounts };
  };

  const workflowStats = getWorkflowStats();

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{template.name}</h3>
                <p className="text-muted-foreground">{template.description}</p>
              </div>
              <Badge className={getComplexityColor(template.complexity_level)}>
                {getComplexityLabel(template.complexity_level)}
              </Badge>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Usado {template.usage_count || 0} vezes</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  Criado em {format(new Date(template.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            </div>

            {/* Tags and Category */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {getCategoryLabel(template.category)}
              </Badge>
              {template.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Workflow Preview */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Visualização do Workflow</h4>
            <div className="bg-muted/50 rounded-lg overflow-hidden">
              <div className="h-64">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={nodeTypes}
                  fitView
                  attributionPosition="top-right"
                  className="bg-background"
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  panOnDrag={true}
                  zoomOnScroll={true}
                >
                  <Background />
                  <Controls showInteractive={false} />
                </ReactFlow>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary">{workflowStats.totalNodes}</div>
                <div className="text-sm text-muted-foreground">Etapas</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary">{workflowStats.totalEdges}</div>
                <div className="text-sm text-muted-foreground">Conexões</div>
              </div>
            </div>

            {/* Node Types */}
            {Object.keys(workflowStats.nodeTypes).length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium">Tipos de Etapas:</h5>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(workflowStats.nodeTypes).map(([type, count]: [string, any]) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Instructions */}
          {template.instructions && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                <h4 className="text-lg font-medium">Instruções de Uso</h4>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-900 whitespace-pre-wrap">
                  {template.instructions}
                </p>
              </div>
            </div>
          )}

          {/* Prerequisites */}
          {template.prerequisites && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h4 className="text-lg font-medium">Pré-requisitos</h4>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-sm text-amber-900 whitespace-pre-wrap">
                  {template.prerequisites}
                </p>
              </div>
            </div>
          )}

          {/* Example Usage */}
          {template.example_usage && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h4 className="text-lg font-medium">Exemplo de Uso</h4>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-900 whitespace-pre-wrap">
                  {template.example_usage}
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Action Button */}
      <div className="pt-4 border-t">
        <Button onClick={onUse} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Usar Este Modelo
        </Button>
      </div>
    </div>
  );
};