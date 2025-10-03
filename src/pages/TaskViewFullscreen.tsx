import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTask } from '@/hooks/useTask';
import { useProfiles } from '@/hooks/useProfiles';
import { useDepartments } from '@/hooks/useDepartments';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TASK_TYPES } from '@/lib/taskTypesFixed';
import { useToast } from '@/hooks/use-toast';
import { TaskAttachmentViewer } from '@/components/TaskAttachmentViewer';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Calendar,
  Clock,
  User,
  Building,
  Flag,
  ExternalLink,
  Tag,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']),
  assignment_type: z.enum(['individual', 'anyone', 'all', 'department']),
  assigned_to: z.string().optional(),
  assigned_department: z.string().optional(),
  expected_completion_at: z.string().optional(),
  deadline_at: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  tags: z.array(z.string()).default([]),
  weblink: z.string().url('URL inválida').optional().or(z.literal('')),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

export const TaskViewFullscreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const { task, loading, updateTask } = useTask(id);
  const { profiles } = useProfiles();
  const { departments } = useDepartments();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    mode: 'onChange',
  });

  const { control, watch, setValue, handleSubmit, reset } = form;

  // Load task data into form
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        assignment_type: task.assigned_department ? 'department' :
                        task.assigned_to ? 'individual' : 'anyone',
        assigned_to: task.assigned_to || '',
        assigned_department: task.assigned_department || '',
        expected_completion_at: task.expected_completion_at || '',
        deadline_at: task.deadline_at || '',
        estimated_hours: task.estimated_hours || undefined,
        tags: task.tags || [],
        weblink: task.weblink || '',
      });
    }
  }, [task, reset]);

  // Fetch attachments
  useEffect(() => {
    if (!id || !task) return;

    const fetchAttachments = async () => {
      setLoadingAttachments(true);
      try {
        const { data, error } = await supabase
          .from('task_attachments')
          .select(`
            id,
            task_id,
            file_name,
            file_path,
            file_size,
            file_type,
            uploaded_by,
            uploaded_at,
            uploader:uploaded_by(name, email)
          `)
          .eq('task_id', id)
          .order('uploaded_at', { ascending: false });

        if (error) {
          console.error('Error fetching attachments:', error);
        } else {
          let finalAttachments = data || [];

          // FALLBACK: Se não houver anexos em task_attachments mas houver file_id no payload,
          // buscar o arquivo em documents (Gestão de Documentos)
          const payload = task.payload as any;
          if (finalAttachments.length === 0 && payload?.data_source === 'file' && payload?.file_id) {
            console.log('📎 No attachments found, trying fallback from payload.file_id:', payload.file_id);

            const { data: fileData, error: fileError } = await supabase
              .from('documents')
              .select('id, name, file_url, storage_key, file_size, mime_type, created_by')
              .eq('id', payload.file_id)
              .single();

            if (!fileError && fileData) {
              console.log('✅ Found file in documents:', fileData);
              // Converter formato de documents para task_attachments
              finalAttachments = [{
                id: fileData.id,
                task_id: id,
                file_name: fileData.name,
                file_path: fileData.storage_key || fileData.file_url, // usar storage_key se disponível
                file_size: fileData.file_size,
                file_type: fileData.mime_type,
                uploaded_by: fileData.created_by,
                uploaded_at: new Date().toISOString(),
                uploader: null, // Não temos dados do uploader no fallback
              }];
            } else {
              console.warn('⚠️ File not found in documents:', payload.file_id);
            }
          }

          setAttachments(finalAttachments);
        }
      } catch (error) {
        console.error('Error fetching attachments:', error);
      } finally {
        setLoadingAttachments(false);
      }
    };

    fetchAttachments();
  }, [id, task]);

  const handleSave = async (data: TaskFormData) => {
    const success = await updateTask(data);
    if (success) {
      setIsEditMode(false);
    }
  };

  const handleCancel = () => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        assignment_type: task.assigned_department ? 'department' :
                        task.assigned_to ? 'individual' : 'anyone',
        assigned_to: task.assigned_to || '',
        assigned_department: task.assigned_department || '',
        expected_completion_at: task.expected_completion_at || '',
        deadline_at: task.deadline_at || '',
        estimated_hours: task.estimated_hours || undefined,
        tags: task.tags || [],
        weblink: task.weblink || '',
      });
    }
    setIsEditMode(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-lg font-semibold">Tarefa não encontrada</h2>
              <Button onClick={() => navigate('/tasks')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Tarefas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const taskType = task.fixed_type ? TASK_TYPES[task.fixed_type as keyof typeof TASK_TYPES] : null;

  const priorityConfig = {
    P1: { label: 'Crítica', variant: 'destructive' as const },
    P2: { label: 'Alta', variant: 'default' as const },
    P3: { label: 'Média', variant: 'secondary' as const },
    P4: { label: 'Baixa', variant: 'outline' as const },
  };

  const statusConfig = {
    todo: { label: 'A Fazer', variant: 'outline' as const },
    in_progress: { label: 'Em Andamento', variant: 'default' as const },
    review: { label: 'Em Revisão', variant: 'secondary' as const },
    done: { label: 'Concluída', variant: 'default' as const },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{task.title}</h1>
                <Badge variant={statusConfig[task.status as keyof typeof statusConfig]?.variant}>
                  {statusConfig[task.status as keyof typeof statusConfig]?.label}
                </Badge>
                <Badge variant={priorityConfig[task.priority as keyof typeof priorityConfig]?.variant}>
                  <Flag className="w-3 h-3 mr-1" />
                  {priorityConfig[task.priority as keyof typeof priorityConfig]?.label}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            {!isEditMode ? (
              <Button size="lg" className="gap-2" onClick={() => setIsEditMode(true)}>
                <Edit className="h-5 w-5" />
                Editar Tarefa
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSubmit(handleSave)}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 space-y-6 max-w-6xl">
        {/* Task Type Badge */}
        {taskType && (
          <div className="flex items-center gap-2">
            <taskType.icon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{taskType.label}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="title"
                      disabled={!isEditMode}
                      className={!isEditMode ? 'bg-muted cursor-not-allowed' : ''}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="description"
                      rows={4}
                      disabled={!isEditMode}
                      className={!isEditMode ? 'bg-muted cursor-not-allowed' : ''}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!isEditMode}
                      >
                        <SelectTrigger className={!isEditMode ? 'bg-muted cursor-not-allowed' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="P1">P1 - Crítica</SelectItem>
                          <SelectItem value="P2">P2 - Alta</SelectItem>
                          <SelectItem value="P3">P3 - Média</SelectItem>
                          <SelectItem value="P4">P4 - Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_hours">Horas Estimadas</Label>
                  <Controller
                    name="estimated_hours"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="estimated_hours"
                        type="number"
                        min="0"
                        step="0.5"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        disabled={!isEditMode}
                        className={!isEditMode ? 'bg-muted cursor-not-allowed' : ''}
                      />
                    )}
                  />
                </div>
              </div>

              {/* WebLink */}
              {task.weblink && (
                <div className="space-y-2">
                  <Label>Link Externo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={task.weblink}
                      disabled
                      className="bg-muted cursor-not-allowed flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(task.weblink!, '_blank')}
                      type="button"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Atribuição */}
          <Card>
            <CardHeader>
              <CardTitle>👥 Atribuição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assignment_type">Tipo de Atribuição</Label>
                <Controller
                  name="assignment_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!isEditMode}
                    >
                      <SelectTrigger className={!isEditMode ? 'bg-muted cursor-not-allowed' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="department">Departamento</SelectItem>
                        <SelectItem value="anyone">Qualquer Um</SelectItem>
                        <SelectItem value="all">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {watch('assignment_type') === 'individual' && (
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Responsável</Label>
                  <Controller
                    name="assigned_to"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!isEditMode}
                      >
                        <SelectTrigger className={!isEditMode ? 'bg-muted cursor-not-allowed' : ''}>
                          <SelectValue placeholder="Selecione um responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.name} ({profile.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}

              {watch('assignment_type') === 'department' && (
                <div className="space-y-2">
                  <Label htmlFor="assigned_department">Departamento</Label>
                  <Controller
                    name="assigned_department"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!isEditMode}
                      >
                        <SelectTrigger className={!isEditMode ? 'bg-muted cursor-not-allowed' : ''}>
                          <SelectValue placeholder="Selecione um departamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}

              {/* Criador da tarefa */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Criado por</p>
                  <p className="font-medium">{task.creator?.name}</p>
                  <p className="text-xs text-muted-foreground">{task.creator?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prazos */}
          <Card>
            <CardHeader>
              <CardTitle>📅 Prazos e Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expected_completion_at">Conclusão Esperada</Label>
                  <Controller
                    name="expected_completion_at"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="expected_completion_at"
                        type="datetime-local"
                        disabled={!isEditMode}
                        className={!isEditMode ? 'bg-muted cursor-not-allowed' : ''}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline_at">Prazo Final</Label>
                  <Controller
                    name="deadline_at"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="deadline_at"
                        type="datetime-local"
                        disabled={!isEditMode}
                        className={!isEditMode ? 'bg-muted cursor-not-allowed' : ''}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Metadados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Criada em</p>
                    <p className="text-sm font-medium">
                      {format(new Date(task.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Atualizada em</p>
                    <p className="text-sm font-medium">
                      {format(new Date(task.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>🏷️ Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Configuração Específica do Tipo */}
          {task.payload && Object.keys(task.payload).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>🔧 Configuração Específica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(task.payload, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Anexos */}
          {attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Anexos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TaskAttachmentViewer attachments={attachments} />
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
};
