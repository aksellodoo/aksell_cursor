import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { Plus, RefreshCw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Play, Square, Edit, Trash2, Activity, Zap, FileText, CheckCheck } from "lucide-react";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useWorkflowExecution } from "@/hooks/useWorkflowExecution";
import { useDepartments } from "@/hooks/useDepartments";

import { ChatterButton } from "@/components/ChatterButton";
import { WorkflowMonitor } from "@/components/WorkflowMonitor";
import { WorkflowTester } from "@/components/WorkflowTester";
import { WorkflowTemplates } from "@/components/WorkflowTemplates";
import { WorkflowBuilder } from "@/components/WorkflowBuilder";

import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Automacoes = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("workflows");
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  // Check localStorage for persistent workflow builder state
  useEffect(() => {
    const savedBuilderState = localStorage.getItem('workflow-builder-open');
    if (savedBuilderState === 'true') {
      const savedEditingWorkflow = localStorage.getItem('workflow-builder-editing');
      if (savedEditingWorkflow && savedEditingWorkflow !== 'null') {
        try {
          setEditingWorkflow(JSON.parse(savedEditingWorkflow));
        } catch (e) {
          console.error('Error parsing saved editing workflow:', e);
        }
      }
      setShowWorkflowBuilder(true);
    }
  }, []);

  const { 
    workflows, 
    loading, 
    deleteWorkflow, 
    toggleWorkflowStatus, 
    executeWorkflow,
    fetchWorkflows 
  } = useWorkflows();
  
  const { departments } = useDepartments();
  const { toast } = useToast();

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Filter workflows based on search and filters
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && workflow.is_active) ||
                         (filterStatus === "inactive" && !workflow.is_active);
    const matchesType = filterType === "all" || workflow.workflow_type === filterType;
    const matchesDepartment = filterDepartment === "all" || 
                             workflow.department_ids?.includes(filterDepartment);

    return matchesSearch && matchesStatus && matchesType && matchesDepartment;
  });

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await deleteWorkflow(workflowId);
      toast({
        title: "Workflow excluído",
        description: "O workflow foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir workflow",
        description: "Não foi possível excluir o workflow.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (workflowId: string) => {
    try {
      await toggleWorkflowStatus(workflowId);
      toast({
        title: "Status atualizado",
        description: "O status do workflow foi atualizado.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do workflow.",
        variant: "destructive",
      });
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      await executeWorkflow(workflowId, {});
      toast({
        title: "Workflow executado",
        description: "O workflow foi executado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao executar workflow",
        description: "Não foi possível executar o workflow.",
        variant: "destructive",
      });
    }
  };

  const getWorkflowTypeLabel = (type: string) => {
    const types = {
      manual: 'Manual',
      automatic: 'Automático',
      scheduled: 'Agendado',
      approval: 'Aprovação',
      notification: 'Notificação'
    };
    return types[type] || type;
  };

  const getPriorityLabel = (priority: string) => {
    const priorities = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return priorities[priority] || priority;
  };

  const getConfidentialityLabel = (level: string) => {
    const levels = {
      public: 'Público',
      internal: 'Interno',
      confidential: 'Confidencial',
      restricted: 'Restrito'
    };
    return levels[level] || level;
  };

  const handleCreateWorkflow = () => {
    // Clear any existing workflow builder state to start fresh
    localStorage.removeItem('workflow-builder-state');
    setEditingWorkflow(null);
    localStorage.setItem('workflow-builder-open', 'true');
    localStorage.setItem('workflow-builder-editing', 'null');
    setShowWorkflowBuilder(true);
  };

  const handleWorkflowCreatedFromTemplate = async () => {
    console.log('handleWorkflowCreatedFromTemplate called - refreshing workflow list and switching tab');
    
    // Force refresh the workflows list to ensure UI is updated
    await fetchWorkflows();
    
    // Switch to workflows tab to show the newly created workflow
    setActiveTab("workflows");
    
    console.log('Workflow list refreshed and switched to workflows tab');
  };

  const handleEditWorkflow = (workflow) => {
    setEditingWorkflow(workflow);
    localStorage.setItem('workflow-builder-open', 'true');
    localStorage.setItem('workflow-builder-editing', JSON.stringify(workflow));
    setShowWorkflowBuilder(true);
  };

  const handleCloseWorkflowBuilder = () => {
    localStorage.removeItem('workflow-builder-open');
    localStorage.removeItem('workflow-builder-editing');
    localStorage.removeItem('workflow-builder-state');
    setShowWorkflowBuilder(false);
    setEditingWorkflow(null);
  };

  const handleWorkflowSaved = async () => {
    await fetchWorkflows();
    localStorage.removeItem('workflow-builder-open');
    localStorage.removeItem('workflow-builder-editing');
    localStorage.removeItem('workflow-builder-state');
    setShowWorkflowBuilder(false);
    setEditingWorkflow(null);
  };

  if (showWorkflowBuilder) {
    return (
      <WorkflowBuilder 
        editingWorkflow={editingWorkflow}
        onSave={handleWorkflowSaved}
        onCancel={handleCloseWorkflowBuilder}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-start">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={fetchWorkflows}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleCreateWorkflow}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Workflow
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="tester" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Testes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <WorkflowTemplates onWorkflowCreated={handleWorkflowCreatedFromTemplate} />
        </TabsContent>


        <TabsContent value="workflows" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Buscar workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automatic">Automático</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="approval">Aprovação</SelectItem>
                <SelectItem value="notification">Notificação</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Workflows Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Confidencialidade</TableHead>
                  <TableHead>Criado por</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Chatter</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredWorkflows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      {searchTerm || filterStatus !== "all" || filterType !== "all" || filterDepartment !== "all" 
                        ? "Nenhum workflow encontrado com os filtros aplicados."
                        : "Nenhum workflow encontrado. Crie seu primeiro workflow clicando em 'Criar Workflow'."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWorkflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{workflow.name}</div>
                          {workflow.description && (
                            <div className="text-sm text-muted-foreground">
                              {workflow.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getWorkflowTypeLabel(workflow.workflow_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={workflow.is_active ? "default" : "secondary"}>
                          {workflow.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            workflow.priority === 'urgent' ? 'destructive' :
                            workflow.priority === 'high' ? 'default' :
                            'secondary'
                          }
                        >
                          {getPriorityLabel(workflow.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getConfidentialityLabel(workflow.confidentiality_level)}
                        </Badge>
                      </TableCell>
                      <TableCell>{workflow.created_by_name}</TableCell>
                      <TableCell>
                        {format(new Date(workflow.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <ChatterButton
                          recordType="workflow"
                          recordId={workflow.id}
                          variant="compact"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExecuteWorkflow(workflow.id)}>
                              <Play className="h-4 w-4 mr-2" />
                              Executar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(workflow.id)}>
                              <Square className="h-4 w-4 mr-2" />
                              {workflow.is_active ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditWorkflow(workflow)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteWorkflow(workflow.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="monitor">
          <WorkflowMonitor />
        </TabsContent>

        <TabsContent value="tester">
          <WorkflowTester />
        </TabsContent>
      </Tabs>

    </div>
  );
};