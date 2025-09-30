import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState 
} from '@xyflow/react';
import { WorkflowTemplate } from "@/hooks/useWorkflowTemplates";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useDepartments } from "@/hooks/useDepartments";
import { useToast } from "@/hooks/use-toast";
import { Save, X } from "lucide-react";
import { convertTemplateToBuilderEnhanced } from "@/utils/workflowTemplateUtils";
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

interface WorkflowTemplateCustomizerProps {
  template: WorkflowTemplate;
  onSave: () => void;
  onCancel: () => void;
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

export const WorkflowTemplateCustomizer = ({ 
  template, 
  onSave, 
  onCancel 
}: WorkflowTemplateCustomizerProps) => {
  const [workflowName, setWorkflowName] = useState(""); // Force user to enter name
  const [workflowDescription, setWorkflowDescription] = useState(template.description || "");
  const [workflowType, setWorkflowType] = useState("manual");
  const [priority, setPriority] = useState("medium");
  const [confidentialityLevel, setConfidentialityLevel] = useState<"public" | "private">("public");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState(false);

  const { createWorkflow } = useWorkflows();
  const { departments } = useDepartments();
  const { toast } = useToast();

  // Convert template to builder format for visualization
  const convertedWorkflow = useMemo(() => {
    console.log('🔄 Converting template to builder format:', template.workflow_definition);
    const result = convertTemplateToBuilderEnhanced(template.workflow_definition);
    console.log('✅ Conversion result:', result);
    return result;
  }, [template.workflow_definition]);

  const [nodes, setNodes, onNodesChange] = useNodesState(convertedWorkflow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(convertedWorkflow.edges);

  // Current workflow definition based on the converted and potentially modified nodes/edges
  const currentWorkflowDefinition = useMemo(() => {
    const definition = {
      nodes: nodes.map(node => ({
        ...node,
        // Preserve all node data including specific properties
        data: {
          ...node.data,
          // Ensure we have all necessary properties
          label: node.data?.label || '',
          title: node.data?.title || node.data?.label || '',
          description: node.data?.description || '',
        }
      })),
      edges: edges
    };
    console.log('📋 Current workflow definition:', definition);
    return definition;
  }, [nodes, edges]);

  const handleSave = async () => {
    if (!workflowName.trim()) {
      setNameError(true);
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome personalizado para o workflow.",
        variant: "destructive",
      });
      return;
    }
    setNameError(false);

    setSaving(true);
    try {
      console.log('💾 Saving workflow with definition:', currentWorkflowDefinition);
      console.log('📊 Template original definition:', template.workflow_definition);
      console.log('🔄 Current nodes state:', nodes);
      console.log('🔗 Current edges state:', edges);
      
      await createWorkflow({
        name: workflowName,
        description: workflowDescription,
        workflow_type: workflowType,
        trigger_type: "manual",
        priority,
        confidentiality_level: confidentialityLevel,
        department_ids: selectedDepartments,
        workflow_definition: currentWorkflowDefinition, // Use current definition instead of original template
        tags: template.tags || [],
      });

      console.log('✅ Workflow successfully created from template');

      toast({
        title: "Workflow criado",
        description: "O workflow foi criado com sucesso baseado no template.",
      });

      onSave();
    } catch (error) {
      console.error('❌ Error creating workflow from template:', error);
      toast({
        title: "Erro ao criar workflow",
        description: "Não foi possível criar o workflow. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // This function is for future use when we allow editing the workflow in the customizer
  const handleWorkflowChange = (newDefinition: any) => {
    console.log('🔄 Workflow definition changed:', newDefinition);
    // For now, this is not used since we don't allow editing in the customizer
    // In the future, this could update nodes and edges state
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with basic settings */}
      <div className="space-y-4 p-4 border-b bg-muted/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-name">Nome do Workflow *</Label>
              <Input
                id="workflow-name"
                value={workflowName}
                onChange={(e) => {
                  setWorkflowName(e.target.value);
                  setNameError(false);
                }}
                placeholder="Digite um nome único para seu workflow..."
                className={nameError ? "border-destructive" : ""}
              />
              {nameError && (
                <p className="text-sm text-destructive">
                  É obrigatório inserir um nome personalizado para o workflow
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Exemplo: "{template.name} - Departamento Marketing"
              </p>
            </div>
          <div className="space-y-2">
            <Label htmlFor="workflow-type">Tipo</Label>
            <Select value={workflowType} onValueChange={setWorkflowType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automatic">Automático</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="approval">Aprovação</SelectItem>
                <SelectItem value="notification">Notificação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confidentiality">Confidencialidade</Label>
            <Select value={confidentialityLevel} onValueChange={(value) => setConfidentialityLevel(value as "public" | "private")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Público</SelectItem>
                <SelectItem value="private">Privado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="departments">Departamentos</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar departamentos" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            placeholder="Descrição do workflow"
            rows={2}
          />
        </div>
      </div>

      {/* Workflow Preview */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="bg-muted/20 rounded-lg h-full">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Visualização do Template</h3>
            <p className="text-sm text-muted-foreground">
              Prévia do workflow que será criado baseado no template
            </p>
          </div>
          <div className="h-[calc(100%-80px)]">
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
              <MiniMap 
                nodeStrokeWidth={3}
                pannable
                zoomable
                className="!bg-background"
              />
            </ReactFlow>
          </div>
        </div>
      </div>

      {/* Custom Actions */}
      <div className="flex justify-end gap-2 p-4 border-t bg-muted/20">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Criar Workflow"}
        </Button>
      </div>
    </div>
  );
};