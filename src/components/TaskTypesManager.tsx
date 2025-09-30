import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, MoreVertical, Edit, Trash2, FileText, Search, Copy, Eye, Settings } from 'lucide-react';
import { TaskTypeForm } from './TaskTypeForm';
import { useTaskTypes, TaskType } from '@/hooks/useTaskTypes';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '@/lib/utils';

// Importar ícones dinamicamente
const iconMap: Record<string, any> = {
  Phone: () => import('lucide-react').then(mod => mod.Phone),
  Users: () => import('lucide-react').then(mod => mod.Users),
  Mail: () => import('lucide-react').then(mod => mod.Mail),
  FileText: () => import('lucide-react').then(mod => mod.FileText),
  File: () => import('lucide-react').then(mod => mod.File),
  Calendar: () => import('lucide-react').then(mod => mod.Calendar),
  CheckSquare: () => import('lucide-react').then(mod => mod.CheckSquare),
  Clock: () => import('lucide-react').then(mod => mod.Clock),
  AlertCircle: () => import('lucide-react').then(mod => mod.AlertCircle),
  Star: () => import('lucide-react').then(mod => mod.Star),
  Flag: () => import('lucide-react').then(mod => mod.Flag),
  Target: () => import('lucide-react').then(mod => mod.Target),
  Briefcase: () => import('lucide-react').then(mod => mod.Briefcase),
  Folder: () => import('lucide-react').then(mod => mod.Folder),
  Camera: () => import('lucide-react').then(mod => mod.Camera),
  Headphones: () => import('lucide-react').then(mod => mod.Headphones),
  MessageSquare: () => import('lucide-react').then(mod => mod.MessageSquare),
  Bell: () => import('lucide-react').then(mod => mod.Bell),
  Shield: () => import('lucide-react').then(mod => mod.Shield),
  Settings: () => import('lucide-react').then(mod => mod.Settings),
};

// Função para renderizar ícone dinamicamente
const DynamicIcon: React.FC<{ iconName: string; color: string; className?: string }> = ({ 
  iconName, 
  color, 
  className = "w-6 h-6" 
}) => {
  const [IconComponent, setIconComponent] = useState<any>(null);

  React.useEffect(() => {
    const loadIcon = async () => {
      try {
        if (iconMap[iconName]) {
          const icon = await iconMap[iconName]();
          setIconComponent(() => icon);
        } else {
          // Fallback para CheckSquare
          const icon = await import('lucide-react').then(mod => mod.CheckSquare);
          setIconComponent(() => icon);
        }
      } catch (error) {
        console.error('Erro ao carregar ícone:', error);
        // Fallback para CheckSquare
        import('lucide-react').then(mod => {
          setIconComponent(() => mod.CheckSquare);
        });
      }
    };

    loadIcon();
  }, [iconName]);

  if (!IconComponent) {
    return <div className={cn(className, "animate-pulse bg-muted rounded")} />;
  }

  return <IconComponent className={className} style={{ color }} />;
};

export const TaskTypesManager: React.FC = () => {
  const { taskTypes, loading, deleteTaskType, refetch } = useTaskTypes();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState<TaskType | null>(null);
  const [deletingTaskType, setDeletingTaskType] = useState<TaskType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleEdit = (taskType: TaskType) => {
    setEditingTaskType(taskType);
  };

  const handleDelete = async () => {
    if (deletingTaskType) {
      await deleteTaskType(deletingTaskType.id);
      setDeletingTaskType(null);
    }
  };

  const handleFormSuccess = async () => {
    // Recarregar lista de tipos de tarefa após criação/edição
    await refetch();
    
    setIsCreateModalOpen(false);
    setEditingTaskType(null);
  };

  const filteredTaskTypes = taskTypes.filter(taskType =>
    taskType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (taskType.description && taskType.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getConfidentialityBadge = (level: string) => {
    return level === 'public' ? (
      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
        Público
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
        Privado
      </Badge>
    );
  };

  const getModalityBadge = (filling_type: string) => {
    const modalityConfig = {
      'simple': { label: 'Simples', className: 'bg-primary/10 text-primary border-primary/20' },
      'approval': { label: 'Aprovação', className: 'bg-accent/10 text-accent border-accent/20' },
      'form': { label: 'Com Formulário', className: 'bg-secondary/10 text-secondary border-secondary/20' }
    };

    const config = modalityConfig[filling_type as keyof typeof modalityConfig] || {
      label: filling_type,
      className: 'bg-muted text-muted-foreground'
    };

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner text="Carregando tipos de tarefa..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tipos de Tarefas</h2>
          <p className="text-muted-foreground">
            Gerencie os tipos de tarefas disponíveis no sistema
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar Novo Tipo de Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <TaskTypeForm onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de busca */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tipos de tarefa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Tipos</p>
                <p className="text-2xl font-bold text-foreground">{taskTypes.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tipos Públicos</p>
                <p className="text-2xl font-bold text-success">
                  {taskTypes.filter(t => t.confidentiality_level === 'public').length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tipos Privados</p>
                <p className="text-2xl font-bold text-warning">
                  {taskTypes.filter(t => t.confidentiality_level === 'private').length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Com Formulário</p>
                <p className="text-2xl font-bold text-accent">
                  {taskTypes.filter(t => t.forms).length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de tipos de tarefa */}
      {taskTypes.length === 0 ? (
        <Card className="shadow-card border-0 bg-gradient-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum tipo de tarefa encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie o primeiro tipo de tarefa para começar a organizar melhor suas atividades.
            </p>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>Criar Primeiro Tipo</Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card border-0 bg-gradient-card">
          <CardHeader>
            <CardTitle>Lista de Tipos de Tarefa</CardTitle>
            <CardDescription>
              {filteredTaskTypes.length} tipo(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredTaskTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum tipo de tarefa encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Confidencialidade</TableHead>
                    <TableHead>Formulário Vinculado</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[50px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTaskTypes.map((taskType) => (
                    <TableRow key={taskType.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${taskType.icon_color}20` }}
                          >
                            <DynamicIcon 
                              iconName={taskType.icon_name} 
                              color={taskType.icon_color}
                              className="w-4 h-4"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{taskType.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {taskType.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getModalityBadge(taskType.filling_type)}
                      </TableCell>
                      <TableCell>
                        {getConfidentialityBadge(taskType.confidentiality_level)}
                      </TableCell>
                      <TableCell>
                        {taskType.forms ? (
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{taskType.forms.title}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(taskType.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(taskType)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(taskType)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar tipo
                            </DropdownMenuItem>
                            {taskType.filling_type === 'approval' && (
                              <DropdownMenuItem>
                                <Settings className="h-4 w-4 mr-2" />
                                Configurar aprovação
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <FileText className="h-4 w-4 mr-2" />
                              Vincular formulário
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar tipo
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingTaskType(taskType)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir tipo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de edição */}
      <Dialog open={!!editingTaskType} onOpenChange={() => setEditingTaskType(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {editingTaskType && (
            <TaskTypeForm 
              onSuccess={handleFormSuccess} 
              editingTaskType={editingTaskType}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deletingTaskType} onOpenChange={() => setDeletingTaskType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o tipo de tarefa "{deletingTaskType?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};