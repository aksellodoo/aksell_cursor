import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { X, Plus } from 'lucide-react';
import { useTasks, type CreateTaskData } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const taskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).default('P3'),
  assignment_type: z.enum(['individual', 'anyone', 'all', 'department']),
  assigned_to: z.string().optional(),
  assigned_users: z.array(z.string()).optional(),
  assigned_department: z.string().optional(),
  due_date: z.string().optional(),
  estimated_hours: z.number().positive().optional(),
  task_type_id: z.string().optional(),
  approval_title: z.string().optional(),
  approval_description: z.string().optional(),
}).refine((data) => {
  if (data.assignment_type === 'individual') return !!data.assigned_to;
  if (data.assignment_type === 'anyone') return data.assigned_users && data.assigned_users.length > 0;
  if (data.assignment_type === 'all') return data.assigned_users && data.assigned_users.length > 0;
  if (data.assignment_type === 'department') return !!data.assigned_department;
  return false;
}, {
  message: "Pelo menos uma atribuição deve ser feita",
  path: ["assignment_type"]
}).refine((data) => {
  // Se um task_type_id foi selecionado e for tipo de aprovação, exigir campos de aprovação
  // Como não temos acesso ao taskType aqui, vamos fazer a validação no componente
  return true;
}, {
  message: "Campos de aprovação são obrigatórios para tarefas de aprovação",
  path: ["approval_title"]
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onSuccess?: () => void;
  defaultRecordType?: string;
  defaultRecordId?: string;
}

interface TaskType {
  id: string;
  name: string;
  filling_type: 'none' | 'approval';
  approval_config?: any;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Department {
  id: string;
  name: string;
  color: string;
}

export const TaskForm = ({ onSuccess, defaultRecordType, defaultRecordId }: TaskFormProps) => {
  const { createTask } = useTasks();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(null);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'P3',
      assignment_type: 'individual',
      assigned_users: [],
    },
  });

  // Buscar usuários, departamentos e tipos de tarefa
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('status', 'active')
          .order('name');

        if (usersError) throw usersError;
        setUsers(usersData || []);

        // Fetch departments
        const { data: departmentsData, error: departmentsError } = await supabase
          .from('departments')
          .select('id, name, color')
          .order('name');

        if (departmentsError) throw departmentsError;
        setDepartments(departmentsData || []);

        // Fetch task types
        const { data: taskTypesData, error: taskTypesError } = await supabase
          .from('task_types')
          .select('id, name, filling_type, approval_config')
          .eq('is_active', true)
          .order('name');

        if (taskTypesError) throw taskTypesError;
        setTaskTypes(taskTypesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (data: TaskFormData) => {
    // Validar campos de aprovação se necessário
    if (selectedTaskType?.filling_type === 'approval') {
      if (!data.approval_title || !data.approval_description) {
        toast.error('Título e descrição da aprovação são obrigatórios para tarefas de aprovação');
        return;
      }
    }

    setLoading(true);

    try {
      const taskData: CreateTaskData = {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        assigned_to: data.assignment_type === 'individual' ? data.assigned_to : undefined,
        assigned_users: data.assignment_type === 'anyone' ? data.assigned_users : undefined,
        assigned_department: data.assignment_type === 'department' ? data.assigned_department : undefined,
        due_date: data.due_date || null,
        estimated_hours: data.estimated_hours || null,
        tags: tags.length > 0 ? tags : null,
        record_type: defaultRecordType || null,
        record_id: defaultRecordId || null,
        task_type_id: data.task_type_id || null,
        approval_title: data.approval_title || null,
        approval_description: data.approval_description || null,
        fixed_type: 'simple_task', // Default to simple_task for legacy form
      };

      // Se tipo de atribuição for "all", passar os usuários e o assignment_type
      if (data.assignment_type === 'all') {
        taskData.assigned_users = data.assigned_users;
        (taskData as any).assignment_type = 'all'; // Indicar ao hook que deve duplicar
      }

      const success = await createTask(taskData);

      if (success) {
        form.reset();
        setTags([]);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleUserCheckboxChange = (userId: string, checked: boolean) => {
    const currentUsers = form.getValues('assigned_users') || [];
    if (checked) {
      form.setValue('assigned_users', [...currentUsers, userId]);
    } else {
      form.setValue('assigned_users', currentUsers.filter(id => id !== userId));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Tarefa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Código da Tarefa - Read Only */}
          <div className="space-y-2">
            <Label htmlFor="task_code" className="text-sm font-medium">
              Código da Tarefa
            </Label>
            <Input
              id="task_code"
              value="Será gerado automaticamente"
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O código será atribuído automaticamente após a criação da tarefa
            </p>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="Digite o título da tarefa"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Tipo de Tarefa */}
          <div className="space-y-2">
            <Label htmlFor="task_type_id">Tipo de Tarefa</Label>
            <Select
              value={form.watch('task_type_id') || ''}
              onValueChange={(value) => {
                form.setValue('task_type_id', value || undefined);
                const taskType = taskTypes.find(t => t.id === value);
                setSelectedTaskType(taskType || null);
                
                // Se for tipo de aprovação, definir prioridade padrão
                if (taskType?.filling_type === 'approval' && taskType.approval_config?.priority) {
                  form.setValue('priority', taskType.approval_config.priority);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tipo de tarefa (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {taskTypes.map(taskType => (
                  <SelectItem key={taskType.id} value={taskType.id}>
                    {taskType.name} {taskType.filling_type === 'approval' && '(Aprovação)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Descreva a tarefa em detalhes"
              rows={3}
            />
          </div>

          {/* Campos de Aprovação - apenas se tipo for 'approval' */}
          {selectedTaskType?.filling_type === 'approval' && (
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
              <h3 className="font-medium text-blue-900">Dados da Aprovação</h3>
              
              <div className="space-y-2">
                <Label htmlFor="approval_title">Título da Aprovação *</Label>
                <Input
                  id="approval_title"
                  {...form.register('approval_title')}
                  placeholder="Ex: Aprovação de Despesa de Viagem"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval_description">Descrição da Aprovação *</Label>
                <Textarea
                  id="approval_description"
                  {...form.register('approval_description')}
                  placeholder="Descreva o que precisa ser aprovado..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Grid com campos lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prioridade */}
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={form.watch('priority')}
                onValueChange={(value: any) => form.setValue('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-destructive">P1 - Crítica</span>
                      <span className="text-xs text-muted-foreground">interrupção/risco imediato</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="P2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-orange-500">P2 - Alta</span>
                      <span className="text-xs text-muted-foreground">impacto alto, curto prazo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="P3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">P3 - Média</span>
                      <span className="text-xs text-muted-foreground">padrão</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="P4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">P4 - Baixa</span>
                      <span className="text-xs text-muted-foreground">pode esperar</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Atribuição */}
            <div className="space-y-2">
              <Label>Tipo de Atribuição</Label>
              <Select
                value={form.watch('assignment_type')}
                onValueChange={(value: 'individual' | 'anyone' | 'all' | 'department') => {
                  form.setValue('assignment_type', value);
                  // Reset assignment fields when type changes
                  form.setValue('assigned_to', undefined);
                  form.setValue('assigned_users', []);
                  form.setValue('assigned_department', undefined);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">
                    <div className="flex flex-col">
                      <span className="font-medium">Individual</span>
                      <span className="text-xs text-muted-foreground">Um único usuário recebe a tarefa</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="anyone">
                    <div className="flex flex-col">
                      <span className="font-medium">Qualquer um</span>
                      <span className="text-xs text-muted-foreground">Todos recebem a mesma tarefa (ID único compartilhado)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="all">
                    <div className="flex flex-col">
                      <span className="font-medium">Todos</span>
                      <span className="text-xs text-muted-foreground">Cada um recebe uma cópia única da tarefa</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="department">
                    <div className="flex flex-col">
                      <span className="font-medium">Departamento</span>
                      <span className="text-xs text-muted-foreground">Atribuir para um departamento</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campos de atribuição baseados no tipo */}
          {form.watch('assignment_type') === 'individual' && (
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Usuário</Label>
              <Select
                value={form.watch('assigned_to') || ''}
                onValueChange={(value) => form.setValue('assigned_to', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.watch('assignment_type') === 'anyone' && (
            <div className="space-y-2">
              <Label>Selecionar Usuários</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Todos os usuários selecionados terão acesso à mesma tarefa
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                {users.map(user => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-anyone-${user.id}`}
                      checked={form.watch('assigned_users')?.includes(user.id) || false}
                      onCheckedChange={(checked) => handleUserCheckboxChange(user.id, checked as boolean)}
                    />
                    <Label htmlFor={`user-anyone-${user.id}`} className="text-sm font-normal">
                      {user.name} ({user.email})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {form.watch('assignment_type') === 'all' && (
            <div className="space-y-2">
              <Label>Selecionar Usuários</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Cada usuário selecionado receberá uma cópia independente da tarefa
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                {users.map(user => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-all-${user.id}`}
                      checked={form.watch('assigned_users')?.includes(user.id) || false}
                      onCheckedChange={(checked) => handleUserCheckboxChange(user.id, checked as boolean)}
                    />
                    <Label htmlFor={`user-all-${user.id}`} className="text-sm font-normal">
                      {user.name} ({user.email})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {form.watch('assignment_type') === 'department' && (
            <div className="space-y-2">
              <Label htmlFor="assigned_department">Departamento</Label>
              <Select
                value={form.watch('assigned_department') || ''}
                onValueChange={(value) => form.setValue('assigned_department', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(department => (
                    <SelectItem key={department.id} value={department.id}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: department.color }}
                        />
                        <span>{department.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.formState.errors.assignment_type && (
            <p className="text-sm text-red-600">{form.formState.errors.assignment_type.message}</p>
          )}

          {/* Data de vencimento e estimativa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Data de vencimento</Label>
              <Input
                id="due_date"
                type="datetime-local"
                {...form.register('due_date')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Estimativa (horas)</Label>
              <Input
                id="estimated_hours"
                type="number"
                step="0.5"
                min="0"
                {...form.register('estimated_hours', { valueAsNumber: true })}
                placeholder="Ex: 2.5"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="Digite uma tag e pressione Enter"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                disabled={!currentTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 w-4 h-4"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Informações do contexto */}
          {(defaultRecordType || defaultRecordId) && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Esta tarefa será vinculada ao {defaultRecordType}: {defaultRecordId}
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSuccess?.()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};