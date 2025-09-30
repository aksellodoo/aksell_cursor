import { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { KanbanPOC } from '@/components/kanban/KanbanPOC';
import { TaskCalendar } from '@/components/TaskCalendar';
import { TaskGantt } from '@/components/TaskGantt';
import { TaskAnalytics } from '@/components/TaskAnalytics';
import { TasksTable } from '@/components/TasksTable';
import { useNavigate } from 'react-router-dom';
import { TemplatesManager } from '@/components/TemplatesManager';
import { FormsToFillList } from '@/components/FormsToFillList';
import TaskFormsPendingList from '@/components/TaskFormsPendingList';
import { AccessRequestsPendingList } from '@/components/AccessRequestsPendingList';
import { useTasks } from '@/hooks/useTasks';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LayoutGrid, Calendar, BarChart3, List, GanttChart, Share2, ClipboardCheck, Settings, Plus, ChevronDown } from 'lucide-react';
import { ShareButton } from '@/components/ShareButton';

export const Tasks = () => {
  const { tasks, loading, updateTaskStatus, fetchTasks } = useTasks();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  if (loading) {
    return (
      <PageLayout>
        <LoadingSpinner />
      </PageLayout>
    );
  }

  const handleTaskSelect = (task: any) => {
    setSelectedTask(task);
    // Aqui você pode abrir um modal ou navegar para detalhes da tarefa
  };

  const handleStatusChange = (taskId: string, status: string) => {
    updateTaskStatus(taskId, status);
  };

  const handleCreateTemplateSuccess = () => {
    setIsTemplateModalOpen(false);
  };

  const handleNewTask = () => {
    navigate('/tasks/new?origin=fixed');
  };

  const handleNewTemplate = () => {
    setIsTemplateModalOpen(true);
  };

  return (
    <PageLayout>
      <div className="container mx-auto p-6">
        {/* Header com botão Nova */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Tarefas</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={handleNewTask}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleNewTemplate}>
                <Settings className="h-4 w-4 mr-2" />
                Novo Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Abas principais */}
        <Tabs defaultValue="listagem" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="preencher" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Tarefas Pendentes
            </TabsTrigger>
            <TabsTrigger value="listagem" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Listagem de Tarefas
            </TabsTrigger>
          </TabsList>

          {/* Aba Tarefas a Preencher */}
          <TabsContent value="preencher" className="space-y-6">
            <div className="space-y-6">
              <FormsToFillList variant="compact" onlyPending limit={5} compactHeader={false} />
              <AccessRequestsPendingList />
              <TaskFormsPendingList />
            </div>
          </TabsContent>

          {/* Aba Listagem de Tarefas */}
          <TabsContent value="listagem">
            <Tabs defaultValue="kanban" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="kanban" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendário
                </TabsTrigger>
                <TabsTrigger value="gantt" className="flex items-center gap-2">
                  <GanttChart className="h-4 w-4" />
                  Cronograma
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="kanban">
                <KanbanPOC />
              </TabsContent>

              <TabsContent value="list">
                <TasksTable
                  tasks={tasks}
                  onTaskSelect={handleTaskSelect}
                  onStatusChange={handleStatusChange}
                />
              </TabsContent>

              <TabsContent value="calendar">
                <TaskCalendar 
                  tasks={tasks}
                  onTaskSelect={handleTaskSelect}
                />
              </TabsContent>

              <TabsContent value="gantt">
                <TaskGantt 
                  tasks={tasks}
                  onTaskSelect={handleTaskSelect}
                />
              </TabsContent>

              <TabsContent value="analytics">
                <TaskAnalytics tasks={tasks} />
              </TabsContent>
            </Tabs>
          </TabsContent>

        </Tabs>

        

        {/* Modal de Criação de Template */}
        <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Template</DialogTitle>
            </DialogHeader>
            <TemplatesManager 
              openCreateOnMount={true}
              onClose={() => setIsTemplateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};