import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useTaskDraft } from '@/hooks/useTaskDraft';
import { useTaskTemplates } from '@/hooks/useTaskTemplates';
import { useTaskSeries } from '@/hooks/useTaskSeries';
import { useTasks } from '@/hooks/useTasks';
import { useDepartments } from '@/hooks/useDepartments';
import { useProfiles } from '@/hooks/useProfiles';
import { TASK_TYPES, validateTaskPayload, type FixedTaskType } from '@/lib/taskTypesFixed';
import { useToast } from '@/hooks/use-toast';
import { TaskTypePicker } from '@/components/TaskTypePicker';
import { TemplatePickerDrawer } from '@/components/TemplatePickerDrawer';
import { DocumentSelectionModal } from '@/components/DocumentSelectionModal';
import { RecurrenceSection, type RecurrenceSettings } from '@/components/RecurrenceSection';
import { Save, Clock, FileText, Plus, Trash2, X, File } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']),
  assignment_type: z.enum(['individual', 'multiple', 'department']),
  assigned_to: z.string().optional(),
  assigned_users: z.array(z.string()).optional(),
  assigned_department: z.string().optional(),
  expected_completion_at: z.string().optional(),
  deadline_at: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  list_in_pending: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  payload: z.record(z.any()).default({}),
}).refine((data) => {
  // Validate date order if both dates are provided
  if (data.expected_completion_at && data.deadline_at) {
    const expectedDate = new Date(data.expected_completion_at);
    const deadlineDate = new Date(data.deadline_at);
    return expectedDate <= deadlineDate;
  }
  return true;
}, {
  message: "Data limite deve ser igual ou posterior à data de conclusão esperada",
  path: ["deadline_at"]
});

type TaskFormData = z.infer<typeof taskFormSchema>;

export const TaskEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Parâmetros da URL
  const origin = (searchParams.get('origin') as 'fixed' | 'template') || 'fixed';
  const urlFixedType = searchParams.get('fixed_type') as FixedTaskType;
  const urlTemplateId = searchParams.get('template_id');

  // Estado do editor
  const [selectedFixedType, setSelectedFixedType] = useState<FixedTaskType | null>(urlFixedType || null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(urlTemplateId || null);
  const [payloadValid, setPayloadValid] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showTemplateDrawer, setShowTemplateDrawer] = useState(false);
  const [recentTypes, setRecentTypes] = useState<FixedTaskType[]>([]);
  const [showFileSelection, setShowFileSelection] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  
  // Local state for recurrence to prevent flickering
  const [localRecurrenceSettings, setLocalRecurrenceSettings] = useState<RecurrenceSettings>({
    enabled: false,
    frequency: 'daily',
    interval: 1,
    monthlyType: 'day',
    monthlyDay: 1,
    monthlyWeekday: 0,
    monthlyWeekPosition: 1,
    hour: 9,
    minute: 0,
    timezone: 'America/Sao_Paulo',
    exdates: [],
    endType: 'never',
    endDate: '',
    endCount: 10,
    generationMode: 'on_schedule',
    lookaheadCount: 1,
    catchUpLimit: 1,
    adjustPolicy: 'none',
    daysBeforeDue: 0,
  });

  // Hooks
  const { profiles } = useProfiles();
  const { departments } = useDepartments();
  const { templates, getTemplate } = useTaskTemplates();
  const { createTask } = useTasks();
  const { createSeries } = useTaskSeries();

  // Draft management
  const {
    draft,
    loading: draftLoading,
    saving,
    lastSaved,
    isDirty,
    updateFormState,
    saveImmediate,
    discardDraft,
    submitFromDraft,
  } = useTaskDraft({
    origin,
    fixed_type: selectedFixedType || undefined,
    template_id: selectedTemplateId || undefined,
  });

  // Form management
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'P3',
      assignment_type: 'individual',
      assigned_users: [],
      list_in_pending: false,
      tags: [],
      payload: {},
    },
  });

  const { control, watch, setValue, getValues, handleSubmit, reset } = form;
  const watchedValues = watch();

  // Handle page/tab close for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Template selecionado
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Carregar tipos recentes do localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recent-task-types');
    if (recent) {
      try {
        setRecentTypes(JSON.parse(recent));
      } catch (e) {
        console.warn('Erro ao carregar tipos recentes:', e);
      }
    }
  }, []);

  // Carregar dados do rascunho no formulário
  useEffect(() => {
    if (draft?.form_state) {
      reset(draft.form_state);
      // Initialize local recurrence settings from draft
      if (draft.form_state.recurrence) {
        setLocalRecurrenceSettings(draft.form_state.recurrence);
      }
    }
  }, [draft, reset]);

  // Atualizar rascunho quando o formulário mudar
  useEffect(() => {
    if (!draftLoading) {
      updateFormState(watchedValues);
    }
  }, [watchedValues, updateFormState, draftLoading]);

  // Validar payload quando fixed_type mudar
  useEffect(() => {
    if (selectedFixedType && watchedValues.payload) {
      const validation = validateTaskPayload(selectedFixedType, watchedValues.payload);
      setPayloadValid(validation.success);
    }
  }, [selectedFixedType, watchedValues.payload]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveImmediate();
        toast({
          title: "Rascunho salvo",
          description: "Suas alterações foram salvas."
        });
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [saveImmediate, toast]);

  // Helpers
  const saveRecentType = (type: FixedTaskType) => {
    const current = recentTypes.filter(t => t !== type);
    const updated = [type, ...current].slice(0, 3);
    setRecentTypes(updated);
    localStorage.setItem('recent-task-types', JSON.stringify(updated));
  };

  const getRecurrenceSettings = (): RecurrenceSettings => {
    return localRecurrenceSettings;
  };

  const updateRecurrenceSettings = (settings: RecurrenceSettings) => {
    // Update local state immediately to prevent flickering
    setLocalRecurrenceSettings(settings);
    
    // Persist to draft in background
    updateFormState({ 
      ...watchedValues, 
      recurrence: settings 
    });
  };

  // Handlers
  const handleFixedTypeChange = useCallback((newType: FixedTaskType) => {
    if (selectedFixedType !== newType && Object.keys(watchedValues.payload || {}).length > 0) {
      setShowResetConfirm(true);
      return;
    }
    
    setSelectedFixedType(newType);
    setValue('payload', {});
    saveRecentType(newType);

    // Atualizar URL
    const newParams = new URLSearchParams(searchParams);
    newParams.set('origin', 'fixed');
    newParams.set('fixed_type', newType);
    newParams.delete('template_id');
    navigate(`?${newParams.toString()}`, { replace: true });
  }, [selectedFixedType, watchedValues.payload, setValue, searchParams, navigate]);

  const handleSelectTemplate = async (template: any) => {
    setShowTemplateDrawer(false);
    setSelectedTemplateId(template.id);
    setSelectedFixedType(template.fixed_type);
    saveRecentType(template.fixed_type);

    // Aplicar defaults do template
    const templateData = await getTemplate(template.id);
    if (templateData) {
      setValue('title', templateData.name);
      setValue('description', templateData.description || '');
      setValue('payload', templateData.default_payload || {});
      setValue('list_in_pending', templateData.list_in_pending || false);
      if (templateData.default_assignee_id) {
        setValue('assignment_type', 'individual');
        setValue('assigned_to', templateData.default_assignee_id);
      }
    }

    // Atualizar URL
    const newParams = new URLSearchParams(searchParams);
    newParams.set('origin', 'template');
    newParams.set('template_id', template.id);
    newParams.set('fixed_type', template.fixed_type);
    navigate(`?${newParams.toString()}`, { replace: true });
  };

  const confirmResetPayload = () => {
    setSelectedFixedType(selectedFixedType);
    setValue('payload', {});
    setShowResetConfirm(false);
  };

  const handleCreateTask = async (data: TaskFormData) => {
    if (!selectedFixedType || !payloadValid) {
      toast({
        variant: "destructive",
        title: "Dados inválidos",
        description: "Verifique todos os campos obrigatórios."
      });
      return;
    }

    const recurrenceSettings = getRecurrenceSettings();

    try {
      // Se recorrência está habilitada, criar série
      if (recurrenceSettings?.enabled) {
        // Calcular dtstart
        const now = new Date();
        const dtstart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
          recurrenceSettings.hour, recurrenceSettings.minute);

        const seriesData = {
          title: data.title,
          description: data.description,
          fixed_type: selectedFixedType,
          base_payload: data.payload,
          base_template_id: selectedTemplateId || undefined,
          base_template_snapshot: selectedTemplate ? {
            name: selectedTemplate.name,
            fixed_type: selectedTemplate.fixed_type,
            list_in_pending: selectedTemplate.list_in_pending,
          } : undefined,
          assignment_type: data.assignment_type,
          assigned_to: data.assigned_to,
          assigned_users: data.assigned_users,
          assigned_department: data.assigned_department,
          priority: data.priority,
          estimated_hours: data.estimated_hours,
          list_in_pending: data.list_in_pending,
          tags: data.tags,
          
          // Campos obrigatórios
          dtstart: dtstart.toISOString(),
          rrule: `FREQ=${recurrenceSettings.frequency.toUpperCase()};INTERVAL=${recurrenceSettings.interval}`,
          
          // Configurações de recorrência
          timezone: recurrenceSettings.timezone,
          frequency: recurrenceSettings.frequency,
          interval: recurrenceSettings.interval,
          monthly_type: recurrenceSettings.monthlyType,
          monthly_day: recurrenceSettings.monthlyDay,
          monthly_weekday: recurrenceSettings.monthlyWeekday,
          monthly_week_position: recurrenceSettings.monthlyWeekPosition,
          hour: recurrenceSettings.hour,
          minute: recurrenceSettings.minute,
          exdates: recurrenceSettings.exdates,
          end_type: recurrenceSettings.endType,
          end_date: recurrenceSettings.endDate,
          end_count: recurrenceSettings.endCount,
          generation_mode: recurrenceSettings.generationMode,
          lookahead_count: recurrenceSettings.lookaheadCount,
          catch_up_limit: recurrenceSettings.catchUpLimit,
          adjust_policy: recurrenceSettings.adjustPolicy,
          days_before_due: recurrenceSettings.daysBeforeDue,
        };

        await createSeries(seriesData);
        
        toast({
          title: "Série de tarefas criada",
          description: "A série de tarefas recorrentes foi criada com sucesso."
        });
      } else {
        // Criar tarefa única
        const taskData = {
          ...data,
          fixed_type: selectedFixedType,
          template_id: selectedTemplateId || undefined,
          template_snapshot: selectedTemplate ? {
            name: selectedTemplate.name,
            fixed_type: selectedTemplate.fixed_type,
            list_in_pending: selectedTemplate.list_in_pending,
          } : undefined,
        };

        await createTask(taskData as any);
        
        toast({
          title: "Tarefa criada",
          description: "A tarefa foi criada com sucesso."
        });
      }

      await submitFromDraft();
      navigate('/tasks');
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar tarefa",
        description: "Não foi possível criar a tarefa."
      });
    }
  };

  const handleDiscard = async () => {
    await discardDraft();
    navigate('/tasks');
  };

  // Render dynamic payload fields based on fixed_type
  const renderPayloadFields = () => {
    if (!selectedFixedType) return null;

    const taskType = TASK_TYPES[selectedFixedType];
    if (!taskType) return null;

    // Specific rendering for approval type
    if (selectedFixedType === 'approval') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Configurações de {taskType.label}</h3>
          
          {/* Data Source Selection */}
          <div className="space-y-2">
            <Label htmlFor="data_source">Origem do Dado da Aprovação *</Label>
            <Controller
              name="payload.data_source"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem dos dados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file">De arquivo</SelectItem>
                    <SelectItem value="form">De um formulário preenchido</SelectItem>
                    <SelectItem value="text">De um texto</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Conditional fields based on data source */}
          {watch('payload.data_source') === 'file' && (
            <div className="space-y-2">
              <Label htmlFor="file_id">Arquivo *</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  {selectedFileName ? (
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                      <File className="h-4 w-4" />
                      <span className="text-sm truncate">{selectedFileName}</span>
                    </div>
                  ) : (
                    <div className="p-2 border rounded-md text-muted-foreground text-sm">
                      Nenhum arquivo selecionado
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFileSelection(true)}
                >
                  {selectedFileName ? 'Alterar' : 'Escolher'} arquivo
                </Button>
              </div>
            </div>
          )}

          {watch('payload.data_source') === 'form' && (
            <div className="space-y-2">
              <Label htmlFor="form_response_id">Formulário Preenchido *</Label>
              <Controller
                name="payload.form_response_id"
                control={control}
                render={({ field }) => (
                  <Input 
                    {...field} 
                    placeholder="Selecione o formulário preenchido"
                    // TODO: Implementar seletor de formulários preenchidos
                  />
                )}
              />
            </div>
          )}

          {watch('payload.data_source') === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="text_content">Texto para Aprovação *</Label>
              <Controller
                name="payload.text_content"
                control={control}
                render={({ field }) => (
                  <Textarea 
                    {...field} 
                    placeholder="Digite o texto que será submetido para aprovação..."
                    rows={4}
                  />
                )}
              />
            </div>
          )}

          {/* Approvers Field */}
          <div className="space-y-2">
            <Label htmlFor="approvers">Aprovadores *</Label>
            <Controller
              name="payload.approvers"
              control={control}
              render={({ field }) => (
                <Input 
                  {...field} 
                  placeholder="Selecione os aprovadores"
                  // TODO: Implementar seletor de usuários múltiplos
                />
              )}
            />
          </div>

          {/* Approval Mode */}
          <div className="space-y-2">
            <Label htmlFor="approval_mode">Modo de Aprovação *</Label>
            <Controller
              name="payload.approval_mode"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o modo de aprovação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Aprovação única</SelectItem>
                    <SelectItem value="any">Qualquer aprovador</SelectItem>
                    <SelectItem value="all">Todos os aprovadores</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      );
    }

    // Default rendering for other task types
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Configurações de {taskType.label}</h3>
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Campos específicos para {taskType.label} serão implementados aqui.
          </p>
        </div>
      </div>
    );
  };

  if (draftLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando rascunho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            {/* Ações centralizadas */}
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Salvo às {lastSaved.toLocaleTimeString()}
                </span>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={saveImmediate}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* TODO: Implementar salvar como template */}}
                disabled={!payloadValid}
              >
                <FileText className="h-4 w-4 mr-1" />
                Salvar como Template
              </Button>

              <Button
                size="sm"
                onClick={handleSubmit(handleCreateTask)}
                disabled={!payloadValid || saving}
              >
                <Plus className="h-4 w-4 mr-1" />
                Criar Tarefa
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Descartar
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isDirty) {
                    const confirmDiscard = window.confirm(
                      'Você tem alterações não salvas. Deseja sair mesmo assim?'
                    );
                    if (confirmDiscard) {
                      handleDiscard();
                    }
                  } else {
                    navigate('/tasks');
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-4xl mx-auto">
          <div className="p-6 space-y-6">
            {/* Seleção de tipo/template */}
            {!id && !selectedFixedType && (
              <TaskTypePicker
                onSelectType={handleFixedTypeChange}
                onSelectTemplates={() => setShowTemplateDrawer(true)}
                recentTypes={recentTypes}
              />
            )}

            {/* Campos básicos - só mostrar se tipo selecionado */}
            {selectedFixedType && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Digite o título da tarefa" />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea {...field} placeholder="Descreva a tarefa..." rows={3} />
                )}
              />
            </div>

            {/* Toggle Listar em Pendentes */}
            <div className="flex items-center space-x-2">
              <Controller
                name="list_in_pending"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label>Listar em Pendentes</Label>
            </div>

            {/* Campos dinâmicos do payload */}
            {renderPayloadFields()}

            {/* Seção de Recorrência */}
            <RecurrenceSection
              value={getRecurrenceSettings() || { 
                enabled: false,
                frequency: 'weekly',
                interval: 1,
                monthlyType: 'day',
                hour: 9,
                minute: 0,
                timezone: 'America/Sao_Paulo',
                exdates: [],
                endType: 'never',
                generationMode: 'on_schedule',
                lookaheadCount: 1,
                catchUpLimit: 1,
                adjustPolicy: 'none',
                daysBeforeDue: 0,
              }}
              onChange={updateRecurrenceSettings}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignment_type">Tipo de Atribuição</Label>
                <Controller
                  name="assignment_type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="multiple">Múltiplo</SelectItem>
                        <SelectItem value="department">Departamento</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {watchedValues.assignment_type === 'individual' && (
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Atribuir a</Label>
                  <Controller
                    name="assigned_to"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um usuário" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}

              {watchedValues.assignment_type === 'department' && (
                <div className="space-y-2">
                  <Label htmlFor="assigned_department">Departamento</Label>
                  <Controller
                    name="assigned_department"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um departamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem key={department.id} value={department.id}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Date and estimation fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expected_completion_at">Data de Conclusão Esperada</Label>
                <Controller
                  name="expected_completion_at"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="datetime-local"
                      {...field}
                      placeholder="dd/mm/aaaa, hh:mm"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline_at" className="flex items-center gap-1">
                  Data limite de conclusão
                  <span className="text-xs text-muted-foreground" title="Usada para SLA/alertas. Pode ser igual ou posterior à Conclusão Esperada.">
                    ⓘ
                  </span>
                </Label>
                <Controller
                  name="deadline_at"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="datetime-local"
                      {...field}
                      placeholder="dd/mm/aaaa, hh:mm"
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_hours">Estimativa de Horas</Label>
                <Controller
                  name="estimated_hours"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      {...field}
                      placeholder="Tempo estimado em horas"
                      min="0"
                      step="0.5"
                    />
                  )}
                />
              </div>

              {/* Tags section */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Adicionar tag..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const target = e.target as HTMLInputElement;
                              const newTag = target.value.trim();
                              if (newTag && !field.value?.includes(newTag)) {
                                field.onChange([...(field.value || []), newTag]);
                                target.value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const input = document.querySelector('input[placeholder="Adicionar tag..."]') as HTMLInputElement;
                            const newTag = input?.value.trim();
                            if (newTag && !field.value?.includes(newTag)) {
                              field.onChange([...(field.value || []), newTag]);
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => {
                                  field.onChange(field.value.filter((t: string) => t !== tag));
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>
            
            </>
            )}
          </div>
        </Card>

        {/* Template Picker Drawer */}
        <TemplatePickerDrawer
          isOpen={showTemplateDrawer}
          onClose={() => setShowTemplateDrawer(false)}
          onSelectTemplate={handleSelectTemplate}
          onCreateNew={() => {
            setShowTemplateDrawer(false);
            // TODO: Abrir modal de criar template
          }}
        />
      </div>

      {/* Confirm dialogs */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <h3 className="text-lg font-medium mb-4">Confirmar alteração</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Alterar o tipo de tarefa irá limpar as configurações específicas. Deseja continuar?
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmResetPayload}>
                Confirmar
              </Button>
            </div>
          </Card>
        </div>
      )}

      <DocumentSelectionModal
        open={showFileSelection}
        onOpenChange={setShowFileSelection}
        onDocumentSelect={(documentId, documentName) => {
          setSelectedFileId(documentId);
          setSelectedFileName(documentName);
          setValue('payload.file_id', documentId);
        }}
        selectedDocumentId={selectedFileId}
      />

    </div>
  );
};
