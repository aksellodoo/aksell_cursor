
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { LoadingSpinner } from './LoadingSpinner';
import { useWorkflows, Workflow } from '@/hooks/useWorkflows';
import { useDepartments } from '@/hooks/useDepartments';
import { Search, Trash2, Play, Pause, Edit, Calendar, Shield, Tag, User, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkflowListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditWorkflow?: (workflow: Workflow) => void;
}

export const WorkflowListModal = ({ open, onOpenChange, onEditWorkflow }: WorkflowListModalProps) => {
  const { workflows, loading, deleteWorkflow, toggleWorkflowStatus, executeWorkflow } = useWorkflows();
  const { departments } = useDepartments();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  const filteredWorkflows = useMemo(() => {
    return workflows.filter(workflow => {
      // Filter out test workflows
      if (workflow.name.includes('[TEST]')) return false;
      
      const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (workflow.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                           (workflow.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ?? false);
      
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && workflow.is_active) ||
                           (filterStatus === 'inactive' && !workflow.is_active);

      const matchesType = filterType === 'all' || workflow.workflow_type === filterType;
      
      const matchesDepartment = filterDepartment === 'all' || 
                               (workflow.department_ids?.includes(filterDepartment) ?? false);

      return matchesSearch && matchesStatus && matchesType && matchesDepartment;
    });
  }, [workflows, searchTerm, filterStatus, filterType, filterDepartment]);

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await deleteWorkflow(workflowId);
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  const handleToggleStatus = async (workflowId: string) => {
    try {
      await toggleWorkflowStatus(workflowId);
    } catch (error) {
      console.error('Error toggling workflow status:', error);
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      await executeWorkflow(workflowId);
    } catch (error) {
      console.error('Error executing workflow:', error);
    }
  };

  const getWorkflowTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      manual: 'Manual',
      approval: 'Aprovação',
      task_creation: 'Criar Tarefas',
      notification: 'Notificação',
      scheduled: 'Agendado',
      conditional: 'Condicional',
      custom: 'Customizado',
      integration: 'Integração',
      report: 'Relatório',
      onboarding: 'Onboarding',
      internal_process: 'Processo Interno'
    };
    return types[type] || type;
  };

  const getPriorityLabel = (priority: string) => {
    const priorities: Record<string, string> = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      critical: 'Crítica'
    };
    return priorities[priority] || priority;
  };

  const getConfidentialityLabel = (level: string) => {
    const levels: Record<string, string> = {
      public: 'Público',
      department_leaders: 'Líderes',
      directors_admins: 'Diretores'
    };
    return levels[level] || level;
  };

  // Workflow type options with validation
  const workflowTypeOptions = [
    { value: 'manual', label: 'Manual' },
    { value: 'approval', label: 'Aprovação' },
    { value: 'task_creation', label: 'Criação de Tarefas' },
    { value: 'notification', label: 'Notificação' },
    { value: 'scheduled', label: 'Agendado' },
    { value: 'conditional', label: 'Condicional' },
    { value: 'custom', label: 'Customizado' },
    { value: 'integration', label: 'Integração' },
    { value: 'report', label: 'Relatório' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'internal_process', label: 'Processo Interno' }
  ].filter(option => option.value && option.value.trim() !== '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workflows Salvos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar workflows por nome, descrição ou tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  Todos
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('active')}
                >
                  Ativos
                </Button>
                <Button
                  variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('inactive')}
                >
                  Inativos
                </Button>
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {workflowTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments.filter(dept => dept.id && dept.id.trim() !== '').map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela de workflows */}
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Confidencialidade</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkflows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {workflows.length === 0 
                        ? 'Nenhum workflow criado ainda' 
                        : 'Nenhum workflow encontrado com os filtros aplicados'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWorkflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{workflow.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {workflow.description || 'Sem descrição'}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center mt-1">
                            <User className="w-3 h-3 mr-1" />
                            Criado por {workflow.created_by_name || 'Usuário desconhecido'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {getWorkflowTypeLabel(workflow.workflow_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                          {workflow.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            workflow.priority === 'critical' ? 'destructive' :
                            workflow.priority === 'high' ? 'default' :
                            workflow.priority === 'medium' ? 'secondary' : 'outline'
                          }
                        >
                          {getPriorityLabel(workflow.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span className="text-xs">
                            {getConfidentialityLabel(workflow.confidentiality_level)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {workflow.tags?.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="w-2 h-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {(workflow.tags?.length ?? 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(workflow.tags?.length ?? 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(workflow.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Botão Executar */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExecuteWorkflow(workflow.id)}
                            disabled={!workflow.is_active}
                          >
                            <Play className="h-4 w-4" />
                          </Button>

                          {/* Botão Ativar/Desativar */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(workflow.id)}
                          >
                            {workflow.is_active ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Botão Editar */}
                          {onEditWorkflow && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                onEditWorkflow(workflow);
                                onOpenChange(false);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Botão Excluir */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o workflow "{workflow.name}"? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteWorkflow(workflow.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
