import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { WorkflowToolbar } from './WorkflowToolbar';
import { WorkflowPropertiesModal } from './WorkflowPropertiesModal';
import { WorkflowListModal } from './WorkflowListModal';
import { WorkflowFormFields } from './WorkflowFormFields';
import { TaskNode } from './workflow-nodes/TaskNode';
import { ConditionNode } from './workflow-nodes/ConditionNode';
import { DelayNode } from './workflow-nodes/DelayNode';
import { NotificationNode } from './workflow-nodes/NotificationNode';
import { ApprovalNode } from './workflow-nodes/ApprovalNode';
import { TriggerNode } from './workflow-nodes/TriggerNode';
import { FormNode } from './workflow-nodes/FormNode';
import { WebhookNode } from './workflow-nodes/WebhookNode';
import { LoopNode } from './workflow-nodes/LoopNode';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ArrowLeft, X } from 'lucide-react';
import { Save, Play, List } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { useWorkflows, Workflow } from '@/hooks/useWorkflows';
import { useDepartments } from '@/hooks/useDepartments';

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

const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'triggerNode',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Trigger Inicial',
      triggerType: 'manual',
      conditions: {}
    },
  },
];

const initialEdges: Edge[] = [];

interface WorkflowBuilderProps {
  editingWorkflow?: Workflow | null;
  onSave?: () => void;
  onCancel?: () => void;
}

// New component for the canvas that can use useReactFlow
const WorkflowCanvas = ({ 
  nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick, 
  onDragOver, handleKeyDown, nodeTypes, setNodes, setIsPropertiesModalOpen, setSelectedNode 
}: any) => {
  const { screenToFlowPosition } = useReactFlow();

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { 
          label: type === 'triggerNode' ? 'Novo Trigger' :
                 type === 'taskNode' ? 'Nova Tarefa' :
                 type === 'conditionNode' ? 'Nova Condição' :
                 type === 'delayNode' ? 'Novo Aguardar' :
                 type === 'notificationNode' ? 'Nova Notificação' :
                 type === 'approvalNode' ? 'Nova Aprovação' : 'Novo Node'
        },
      };

      setNodes((nds: Node[]) => nds.concat(newNode));
    },
    [setNodes, screenToFlowPosition]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onKeyDown={handleKeyDown}
      nodeTypes={nodeTypes}
      fitView
      attributionPosition="bottom-right"
      className="bg-background"
      tabIndex={0}
    >
      <Controls />
      <MiniMap />
      <Background gap={12} size={1} />
      <Panel position="top-left">
        <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
          <p className="text-sm text-muted-foreground">
            Arraste elementos da barra lateral para criar seu workflow
          </p>
        </div>
      </Panel>
    </ReactFlow>
  );
};

export const WorkflowBuilder = ({ editingWorkflow, onSave, onCancel }: WorkflowBuilderProps = {}) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState('Novo Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowType, setWorkflowType] = useState('manual');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [confidentialityLevel, setConfidentialityLevel] = useState<'public' | 'private'>('public');
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [allowedDepartments, setAllowedDepartments] = useState<string[]>([]);
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [priority, setPriority] = useState('medium');
  const [showWorkflowList, setShowWorkflowList] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isPropertiesModalOpen, setIsPropertiesModalOpen] = useState(false);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { createWorkflow, updateWorkflow } = useWorkflows();
  const { departments } = useDepartments();

  // Auto-save workflow state to localStorage
  useEffect(() => {
    if (!isHydrated) return;

    const workflowState = {
      nodes,
      edges,
      workflowName,
      workflowDescription,
      workflowType,
      selectedDepartments,
      tags,
      newTag,
      confidentialityLevel,
      allowedUsers,
      allowedDepartments,
      allowedRoles,
      priority,
      currentWorkflowId,
    };
    
    localStorage.setItem('workflow-builder-state', JSON.stringify(workflowState));
  }, [
    isHydrated, nodes, edges, workflowName, workflowDescription, workflowType,
    selectedDepartments, tags, newTag, confidentialityLevel, allowedUsers,
    allowedDepartments, allowedRoles, priority, currentWorkflowId
  ]);

  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('workflow-builder-state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        
        // Only restore if not editing a specific workflow
        if (!editingWorkflow) {
          setNodes(state.nodes || initialNodes);
          setEdges(state.edges || initialEdges);
          setWorkflowName(state.workflowName || 'Novo Workflow');
          setWorkflowDescription(state.workflowDescription || '');
          setWorkflowType(state.workflowType || 'manual');
          setSelectedDepartments(state.selectedDepartments || []);
          setTags(state.tags || []);
          setNewTag(state.newTag || '');
          setConfidentialityLevel(state.confidentialityLevel || 'public');
          setAllowedUsers(state.allowedUsers || []);
          setAllowedDepartments(state.allowedDepartments || []);
          setAllowedRoles(state.allowedRoles || []);
          setPriority(state.priority || 'medium');
          setCurrentWorkflowId(state.currentWorkflowId || null);
        }
      } catch (e) {
        console.error('Error loading saved workflow state:', e);
      }
    }
    
    setIsHydrated(true);
  }, [setNodes, setEdges]);

  // Load workflow data when editing
  useEffect(() => {
    if (editingWorkflow) {
      setWorkflowName(editingWorkflow.name);
      setWorkflowDescription(editingWorkflow.description || '');
      setWorkflowType(editingWorkflow.workflow_type);
      setSelectedDepartments(editingWorkflow.department_ids || []);
      setTags(editingWorkflow.tags || []);
      setConfidentialityLevel(editingWorkflow.confidentiality_level);
      setAllowedUsers(editingWorkflow.allowed_users || []);
      setAllowedDepartments(editingWorkflow.allowed_departments || []);
      setAllowedRoles(editingWorkflow.allowed_roles || []);
      setPriority(editingWorkflow.priority);
      setCurrentWorkflowId(editingWorkflow.id);
      
      if (editingWorkflow.workflow_definition?.nodes) {
        setNodes(editingWorkflow.workflow_definition.nodes);
      }
      if (editingWorkflow.workflow_definition?.edges) {
        setEdges(editingWorkflow.workflow_definition.edges);
      }
    }
  }, [editingWorkflow, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setIsPropertiesModalOpen(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setIsPropertiesModalOpen(false);
  }, []);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  }, [setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // This will be moved to the WorkflowCanvas component

  const validateWorkflow = () => {
    const errors: string[] = [];
    
    // Verificar se tem pelo menos um nó trigger
    const triggerNodes = nodes.filter(node => node.type === 'triggerNode');
    if (triggerNodes.length === 0) {
      errors.push('É necessário ter pelo menos um nó de trigger');
    }
    
    // Validar cada nó
    nodes.forEach(node => {
      if (node.type === 'taskNode') {
        if (!node.data?.taskTitle || typeof node.data.taskTitle !== 'string' || !node.data.taskTitle.trim()) {
          errors.push(`Nó "${node.data?.label || node.id}": Título da tarefa é obrigatório`);
        }
        if (!node.data?.assignedTo) {
          errors.push(`Nó "${node.data?.label || node.id}": É necessário atribuir a tarefa para um usuário`);
        }
      }
      
      if (node.type === 'notificationNode') {
        if (!node.data?.notificationTitle || typeof node.data.notificationTitle !== 'string' || !node.data.notificationTitle.trim()) {
          errors.push(`Nó "${node.data?.label || node.id}": Título da notificação é obrigatório`);
        }
        if (!node.data?.notificationMessage || typeof node.data.notificationMessage !== 'string' || !node.data.notificationMessage.trim()) {
          errors.push(`Nó "${node.data?.label || node.id}": Mensagem da notificação é obrigatória`);
        }
      }
    });
    
    return errors;
  };

  const saveWorkflow = useCallback(async () => {
    if (!workflowName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, forneça um nome para o workflow.",
        variant: "destructive",
      });
      return;
    }

    // Validar workflow antes de salvar
    const validationErrors = validateWorkflow();
    if (validationErrors.length > 0) {
      toast({
        title: "Workflow inválido",
        description: (
          <div>
            <p>Corrija os seguintes problemas:</p>
            <ul className="list-disc list-inside mt-2">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    try {
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        workflow_definition: { nodes, edges },
        trigger_type: 'manual',
        trigger_conditions: {},
        workflow_type: workflowType,
        department_ids: selectedDepartments,
        tags: tags,
        confidentiality_level: confidentialityLevel,
        allowed_users: allowedUsers,
        allowed_departments: allowedDepartments,
        allowed_roles: allowedRoles,
        priority: priority,
      };

      if (currentWorkflowId) {
        await updateWorkflow(currentWorkflowId, workflowData);
      } else {
        const newWorkflow = await createWorkflow(workflowData);
        if (newWorkflow?.id) {
          setCurrentWorkflowId(newWorkflow.id);
        } else {
          console.log('⚠️ No workflow ID returned from createWorkflow, but workflow may have been created');
        }
      }
      
      setIsSaveDialogOpen(false);
      toast({
        title: "Workflow salvo",
        description: "O workflow foi salvo com sucesso.",
      });
      
      // Call onSave callback if provided
      if (onSave) {
        await onSave();
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Ocorreu um erro ao salvar o workflow. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [workflowName, workflowDescription, workflowType, selectedDepartments, tags, confidentialityLevel, allowedUsers, allowedDepartments, allowedRoles, priority, nodes, edges, currentWorkflowId, createWorkflow, updateWorkflow, toast, validateWorkflow]);

  const executeWorkflow = useCallback(() => {
    // TODO: Implementar execução do workflow
    console.log('Executing workflow with nodes:', nodes, 'and edges:', edges);
    toast({
      title: "Workflow Executado",
      description: "O workflow foi iniciado com sucesso.",
    });
  }, [nodes, edges, toast]);

  const loadWorkflow = useCallback((workflow: Workflow) => {
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    setWorkflowType(workflow.workflow_type);
    setSelectedDepartments(workflow.department_ids || []);
    setTags(workflow.tags || []);
    setConfidentialityLevel(workflow.confidentiality_level);
    setAllowedUsers(workflow.allowed_users || []);
    setAllowedDepartments(workflow.allowed_departments || []);
    setAllowedRoles(workflow.allowed_roles || []);
    setPriority(workflow.priority);
    setCurrentWorkflowId(workflow.id);
    
    if (workflow.workflow_definition?.nodes) {
      setNodes(workflow.workflow_definition.nodes);
    }
    if (workflow.workflow_definition?.edges) {
      setEdges(workflow.workflow_definition.edges);
    }
    
    setShowWorkflowList(false);
  }, [setNodes, setEdges]);

  const createNewWorkflow = useCallback(() => {
    setWorkflowName('Novo Workflow');
    setWorkflowDescription('');
    setWorkflowType('manual');
    setSelectedDepartments([]);
    setTags([]);
    setNewTag('');
    setConfidentialityLevel('public');
    setAllowedUsers([]);
    setAllowedDepartments([]);
    setAllowedRoles([]);
    setPriority('medium');
    setCurrentWorkflowId(null);
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNode(null);
    
    // Clear saved state when creating new workflow
    localStorage.removeItem('workflow-builder-state');
  }, [setNodes, setEdges]);

  const handleDepartmentToggle = useCallback((departmentId: string) => {
    setSelectedDepartments(prev => 
      prev.includes(departmentId) 
        ? prev.filter(id => id !== departmentId)
        : [...prev, departmentId]
    );
  }, []);

  const handleTagAdd = useCallback(() => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  }, [newTag, tags]);

  const handleTagRemove = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  // Handle delete key press to remove selected elements
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const selectedNodes = nodes.filter(node => node.selected);
      const selectedEdges = edges.filter(edge => edge.selected);
      
      if (selectedNodes.length > 0 || selectedEdges.length > 0) {
        // Clear the selected node state if it's being deleted
        if (selectedNode && selectedNodes.find(node => node.id === selectedNode.id)) {
          setSelectedNode(null);
        }
        
        // Remove selected nodes
        if (selectedNodes.length > 0) {
          const selectedNodeIds = selectedNodes.map(node => node.id);
          setNodes(currentNodes => currentNodes.filter(node => !selectedNodeIds.includes(node.id)));
          
          // Also remove edges connected to deleted nodes
          setEdges(currentEdges => currentEdges.filter(edge => 
            !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
          ));
        }
        
        // Remove selected edges
        if (selectedEdges.length > 0) {
          const selectedEdgeIds = selectedEdges.map(edge => edge.id);
          setEdges(currentEdges => currentEdges.filter(edge => !selectedEdgeIds.includes(edge.id)));
        }
        
        event.preventDefault();
      }
    }
  }, [nodes, edges, selectedNode, setNodes, setEdges, setSelectedNode]);

  // Prevent rendering until hydrated to avoid flickering
  if (!isHydrated) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando workflow builder...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none outline-none focus:bg-muted rounded px-2 py-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowWorkflowList(true)} variant="outline" size="sm">
            <List className="w-4 h-4 mr-2" />
            Workflows
          </Button>
          <Button onClick={createNewWorkflow} variant="outline" size="sm">
            Novo
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsSaveDialogOpen(true)}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button onClick={executeWorkflow} size="sm">
            <Play className="w-4 h-4 mr-2" />
            Executar
          </Button>
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
        </div>
      </div>

      {/* Full Screen Save Dialog */}
      {isSaveDialogOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-2xl font-semibold">
                {currentWorkflowId ? 'Editar Workflow' : 'Salvar Workflow'}
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={saveWorkflow}>
                  <Save className="w-4 h-4 mr-2" />
                  {currentWorkflowId ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <WorkflowFormFields
                  name={workflowName}
                  description={workflowDescription}
                  workflowType={workflowType}
                  selectedDepartments={selectedDepartments}
                  tags={tags}
                  confidentialityLevel={confidentialityLevel}
                  allowedUsers={allowedUsers}
                  allowedDepartments={allowedDepartments}
                  allowedRoles={allowedRoles}
                  priority={priority}
                  departments={departments}
                  newTag={newTag}
                  onNameChange={setWorkflowName}
                  onDescriptionChange={setWorkflowDescription}
                  onWorkflowTypeChange={setWorkflowType}
                  onDepartmentToggle={handleDepartmentToggle}
                  onTagAdd={handleTagAdd}
                  onTagRemove={handleTagRemove}
                  onNewTagChange={setNewTag}
                  onConfidentialityChange={setConfidentialityLevel}
                  onAllowedUsersChange={setAllowedUsers}
                  onAllowedDepartmentsChange={setAllowedDepartments}
                  onAllowedRolesChange={setAllowedRoles}
                  onPriorityChange={setPriority}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <div className="w-80 border-r border-border flex-shrink-0">
          <WorkflowToolbar />
        </div>
        
        <div className="flex-1 min-w-0">
          <ReactFlowProvider>
            <WorkflowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onDragOver={onDragOver}
              handleKeyDown={handleKeyDown}
              nodeTypes={nodeTypes}
              setNodes={setNodes}
              setIsPropertiesModalOpen={setIsPropertiesModalOpen}
              setSelectedNode={setSelectedNode}
            />
          </ReactFlowProvider>
        </div>
      </div>

      <WorkflowListModal
        open={showWorkflowList}
        onOpenChange={setShowWorkflowList}
        onEditWorkflow={loadWorkflow}
      />

      <WorkflowPropertiesModal
        node={selectedNode}
        isOpen={isPropertiesModalOpen}
        onClose={() => {
          setIsPropertiesModalOpen(false);
          setSelectedNode(null);
        }}
        onUpdateNode={updateNodeData}
      />
    </div>
  );
};