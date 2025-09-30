import { useState, useMemo } from 'react';
import { Task } from '@/hooks/useTasks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, ArrowUpDown, Calendar, Clock, User, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';

interface TasksTableProps {
  tasks: Task[];
  onTaskSelect?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: string) => void;
  onCreateNew?: () => void;
}

type SortField = 'title' | 'status' | 'priority' | 'due_date' | 'fixed_type';
type SortOrder = 'asc' | 'desc';

const priorityConfig = {
  urgent: { label: 'Urgente', variant: 'destructive' as const },
  high: { label: 'Alta', variant: 'default' as const },
  medium: { label: 'Média', variant: 'secondary' as const },
  low: { label: 'Baixa', variant: 'outline' as const },
};

const statusConfig = {
  todo: { label: 'A Fazer', variant: 'outline' as const, progress: 0 },
  in_progress: { label: 'Em Andamento', variant: 'default' as const, progress: 50 },
  review: { label: 'Em Revisão', variant: 'secondary' as const, progress: 75 },
  done: { label: 'Concluída', variant: 'default' as const, progress: 100 },
};

export const TasksTable = ({ tasks, onTaskSelect, onStatusChange, onCreateNew }: TasksTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'done') return false;
    return new Date(task.due_date) < new Date();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'due_date') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, searchTerm, sortField, sortOrder]);

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <p className="text-muted-foreground">Nenhuma tarefa encontrada.</p>
          {onCreateNew && (
            <Button onClick={onCreateNew} variant="outline" className="flex items-center gap-2 mx-auto">
              <Plus className="h-4 w-4" />
              Criar primeira tarefa
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('title')}
                  className="h-8 px-2"
                >
                  Título
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('fixed_type')}
                  className="h-8 px-2"
                >
                  Tipo
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('status')}
                  className="h-8 px-2"
                >
                  Status
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('priority')}
                  className="h-8 px-2"
                >
                  Prioridade
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Responsável</TableHead>
              <TableHead className="hidden xl:table-cell">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('due_date')}
                  className="h-8 px-2"
                >
                  Vencimento
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="hidden xl:table-cell">Progresso</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTasks.map((task) => (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onTaskSelect?.(task)}
              >
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm">{task.title}</span>
                    {task.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {task.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {task.fixed_type ? (
                    <Badge variant="outline" className="text-xs">
                      {task.fixed_type}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant={statusConfig[task.status as keyof typeof statusConfig]?.variant}>
                      {statusConfig[task.status as keyof typeof statusConfig]?.label || task.status}
                    </Badge>
                    {isOverdue(task) && (
                      <Badge variant="destructive" className="text-xs">
                        Atrasada
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={priorityConfig[task.priority as keyof typeof priorityConfig]?.variant}>
                    {priorityConfig[task.priority as keyof typeof priorityConfig]?.label || task.priority}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {task.assigned_user ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">
                          {getInitials(task.assigned_user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assigned_user.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Não atribuído</span>
                  )}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {task.due_date ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <div className="flex items-center gap-2">
                    <Progress
                      value={statusConfig[task.status as keyof typeof statusConfig]?.progress || 0}
                      className="w-16 h-2"
                    />
                    <span className="text-xs text-muted-foreground min-w-[3ch]">
                      {statusConfig[task.status as keyof typeof statusConfig]?.progress || 0}%
                    </span>
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onTaskSelect?.(task)}>
                        Ver Detalhes
                      </DropdownMenuItem>
                      {onStatusChange && (
                        <>
                          <DropdownMenuItem
                            onClick={() => onStatusChange(task.id, 'in_progress')}
                            disabled={task.status === 'in_progress'}
                          >
                            Marcar como Em Andamento
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onStatusChange(task.id, 'done')}
                            disabled={task.status === 'done'}
                          >
                            Marcar como Concluída
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Informações de contagem */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredAndSortedTasks.length} de {tasks.length} tarefa(s)
      </div>
    </div>
  );
};
