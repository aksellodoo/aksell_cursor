import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FullscreenDialogContent } from '@/components/ui/fullscreen-dialog';
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
import { Save, Clock, FileText, X, File, ArrowLeft, Plus } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']),
  assignment_type: z.enum(['individual', 'anyone', 'all', 'department']),
  assigned_to: z.string().optional(),
  assigned_users: z.array(z.string()).optional(),
  assigned_department: z.string().optional(),
  expected_completion_at: z.string().optional(),
  deadline_at: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  tags: z.array(z.string()).default([]),
  payload: z.record(z.any()).default({}),
}).refine((data) => {
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

export const TaskEditorFullscreen: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // URL parameters
  const origin = (searchParams.get('origin') as 'fixed' | 'template') || 'fixed';
  const urlFixedType = searchParams.get('fixed_type') as FixedTaskType;
  const urlTemplateId = searchParams.get('template_id');

  // State
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState<1 | 2>(urlFixedType ? 2 : 1);
  const [selectedFixedType, setSelectedFixedType] = useState<FixedTaskType | null>(urlFixedType || null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(urlTemplateId || null);
  const [payloadValid, setPayloadValid] = useState(true);
  const [showTemplateDrawer, setShowTemplateDrawer] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<Array<{id: string, name: string}>>([]);
  const [showAttachmentsSelection, setShowAttachmentsSelection] = useState(false);

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
      tags: [],
      payload: {},
    },
  });

  const { control, watch, setValue, handleSubmit, reset } = form;
  const watchedValues = watch();

  // Selected template
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const taskType = selectedFixedType ? TASK_TYPES[selectedFixedType] : null;

  // Load draft data
  useEffect(() => {
    if (draft?.form_state) {
      reset(draft.form_state);
      if (draft.form_state.recurrence) {
        setLocalRecurrenceSettings(draft.form_state.recurrence);
      }
    }
  }, [draft, reset]);

  // Update draft on form changes
  useEffect(() => {
    if (!draftLoading) {
      updateFormState(watchedValues);
    }
  }, [watchedValues, updateFormState, draftLoading]);

  // Auto-fill file_id when attachment is selected for approval type
  useEffect(() => {
    if (selectedFixedType === 'approval' && selectedAttachments.length > 0) {
      // Auto-set data_source to 'file' if not set
      if (!watchedValues.payload?.data_source) {
        console.log('🔗 Auto-setting data_source to "file"');
        setValue('payload.data_source', 'file');
      }
      
      // Use the first selected attachment as file_id
      const firstFileId = selectedAttachments[0].id;
      if (watchedValues.payload?.data_source === 'file' && watchedValues.payload.file_id !== firstFileId) {
        console.log('🔗 Auto-filling file_id:', firstFileId);
        setValue('payload.file_id', firstFileId);
      }
    }
  }, [selectedFixedType, selectedAttachments, watchedValues.payload?.data_source, setValue]);

  // Validate payload - incluindo file_id auto-preenchido para approval
  useEffect(() => {
    if (selectedFixedType) {
      // Para approval com data_source 'file', incluir file_id se houver anexo selecionado
      let payloadToValidate = { ...(watchedValues.payload || {}) };
      
      // Debug: mostrar estado atual
      console.log('🔍 Validation debug:', {
        selectedFixedType,
        payloadExists: !!watchedValues.payload,
        dataSource: payloadToValidate.data_source,
        fileId: payloadToValidate.file_id,
        attachmentsCount: selectedAttachments.length,
        firstAttachmentId: selectedAttachments[0]?.id
      });
      
      if (selectedFixedType === 'approval' && 
          payloadToValidate.data_source === 'file' && 
          selectedAttachments.length > 0) {
        // Sempre usar o primeiro anexo como file_id
        payloadToValidate.file_id = selectedAttachments[0].id;
        console.log('🔗 Auto-setting file_id:', payloadToValidate.file_id);
      }
      
      const validation = validateTaskPayload(selectedFixedType, payloadToValidate);
      console.log('🔍 Payload validation result:', {
        fixedType: selectedFixedType,
        originalPayload: watchedValues.payload,
        validatedPayload: payloadToValidate,
        validation: validation,
        success: validation.success,
        errors: validation.errors
      });
      setPayloadValid(validation.success);
    } else {
      setPayloadValid(false);
    }
  }, [selectedFixedType, watchedValues.payload, selectedAttachments]);

  // Revalidar quando a aba volta a ficar ativa (fix para problema de tab refresh)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedFixedType && watchedValues.payload) {
        console.log('🔄 Tab became active, revalidating payload...');
        // Força revalidação quando a aba volta a ficar ativa
        let payloadToValidate = { ...watchedValues.payload };
        
        if (selectedFixedType === 'approval' && 
            payloadToValidate.data_source === 'file' && 
            selectedAttachments.length > 0 && 
            !payloadToValidate.file_id) {
          payloadToValidate.file_id = selectedAttachments[0].id;
        }
        
        const validation = validateTaskPayload(selectedFixedType, payloadToValidate);
        setPayloadValid(validation.success);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedFixedType, watchedValues.payload, selectedAttachments]);

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

  // Handlers
  const handleClose = () => {
    if (isDirty) {
      const confirm = window.confirm('Você tem alterações não salvas. Deseja realmente sair?');
      if (!confirm) return;
    }
    setIsOpen(false);
    setTimeout(() => navigate('/tasks'), 300);
  };

  const handleFixedTypeChange = useCallback((newType: FixedTaskType) => {
    setSelectedFixedType(newType);
    setValue('payload', {});
    setCurrentStep(2);

    const newParams = new URLSearchParams(searchParams);
    newParams.set('origin', 'fixed');
    newParams.set('fixed_type', newType);
    newParams.delete('template_id');
    navigate(`?${newParams.toString()}`, { replace: true });
  }, [setValue, searchParams, navigate]);

  const handleSelectTemplate = async (template: any) => {
    setShowTemplateDrawer(false);
    setSelectedTemplateId(template.id);
    setSelectedFixedType(template.fixed_type);
    setCurrentStep(2);

    const templateData = await getTemplate(template.id);
    if (templateData) {
      setValue('title', templateData.name);
      setValue('description', templateData.description || '');
      setValue('payload', templateData.default_payload || {});
      if (templateData.default_assignee_id) {
        setValue('assignment_type', 'individual');
        setValue('assigned_to', templateData.default_assignee_id);
      }
    }

    const newParams = new URLSearchParams(searchParams);
    newParams.set('origin', 'template');
    newParams.set('template_id', template.id);
    newParams.set('fixed_type', template.fixed_type);
    navigate(`?${newParams.toString()}`, { replace: true });
  };

  const getRecurrenceSettings = (): RecurrenceSettings => {
    return localRecurrenceSettings;
  };

  const updateRecurrenceSettings = (settings: RecurrenceSettings) => {
    setLocalRecurrenceSettings(settings);
    updateFormState({ 
      ...watchedValues, 
      recurrence: settings 
    });
  };

  const handleCreateTask = async (data: TaskFormData) => {
    console.log('📝 TaskEditorFullscreen: Form submitted with data:', data);
    console.log('🔍 TaskEditorFullscreen: Form errors:', form.formState.errors);
    console.log('🎯 TaskEditorFullscreen: Selected fixed type:', selectedFixedType);
    console.log('✅ TaskEditorFullscreen: Payload valid:', payloadValid);

    if (!selectedFixedType || !payloadValid) {
      console.error('❌ TaskEditorFullscreen: Validation failed', { selectedFixedType, payloadValid });
      toast({
        variant: "destructive",
        title: "Dados inválidos",
        description: "Verifique todos os campos obrigatórios."
      });
      return;
    }

    // Validação específica para Aprovação de arquivo
    if (selectedFixedType === 'approval' && data.payload?.data_source === 'file') {
      if (selectedAttachments.length === 0) {
        toast({
          variant: "destructive",
          title: "Arquivo obrigatório",
          description: "Adicione pelo menos um arquivo na seção 'Anexos' para aprovação."
        });
        return;
      }
    }

    const recurrenceSettings = getRecurrenceSettings();

    try {
      if (recurrenceSettings?.enabled) {
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
          } : undefined,
          assignment_type: data.assignment_type,
          assigned_to: data.assigned_to,
          assigned_users: data.assigned_users,
          assigned_department: data.assigned_department,
          priority: data.priority,
          estimated_hours: data.estimated_hours,
          tags: data.tags,
          dtstart: dtstart.toISOString(),
          rrule: `FREQ=${recurrenceSettings.frequency.toUpperCase()};INTERVAL=${recurrenceSettings.interval}`,
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
        const taskData = {
          ...data,
          fixed_type: selectedFixedType,
          template_id: selectedTemplateId || undefined,
          template_snapshot: selectedTemplate ? {
            name: selectedTemplate.name,
            fixed_type: selectedTemplate.fixed_type,
          } : undefined,
        };

        await createTask(taskData as any);
        toast({
          title: "Tarefa criada",
          description: "A tarefa foi criada com sucesso."
        });
      }

      await submitFromDraft();
      setIsOpen(false);
      setTimeout(() => navigate('/tasks'), 300);
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
    setIsOpen(false);
    setTimeout(() => navigate('/tasks'), 300);
  };

  // Render payload fields based on task type
  const renderPayloadFields = () => {
    if (!selectedFixedType || !taskType) return null;

    if (selectedFixedType === 'approval') {
      return (
        <div className="space-y-4">
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

          {watch('payload.data_source') === 'file' && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground">
                📎 Adicione o(s) arquivo(s) para aprovação na seção <strong>"Anexos"</strong> abaixo.
                {selectedAttachments.length === 0 && (
                  <span className="block mt-1 text-amber-600 dark:text-amber-500">
                    ⚠️ Pelo menos um arquivo é obrigatório para aprovação.
                  </span>
                )}
              </p>
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
                    placeholder="Digite ou cole o texto que será aprovado"
                    rows={6}
                  />
                )}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="approval_criteria">Critérios de Aprovação</Label>
            <Controller
              name="payload.approval_criteria"
              control={control}
              render={({ field }) => (
                <Textarea 
                  {...field} 
                  placeholder="Descreva os critérios e requisitos para aprovação (opcional)"
                  rows={3}
                />
              )}
            />
          </div>
        </div>
      );
    }

    // Other task types - generic payload rendering
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configure os campos específicos para: {taskType.label}
        </p>
      </div>
    );
  };

  return (
    <FullscreenDialogContent
      open={isOpen}
      onOpenChange={setIsOpen}
      persistent
      disableAutoFocus
      className="bg-background"
    >
      {/* Header */}
      <div className="border-b bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (currentStep === 2) {
                  setCurrentStep(1);
                } else {
                  handleClose();
                }
              }}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 2 ? 'Voltar para Seleção' : 'Fechar'}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Nova Tarefa</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={currentStep === 1 ? "text-primary font-medium" : ""}>
                  Etapa 1: Tipo de Tarefa
                </span>
                <span>→</span>
                <span className={currentStep === 2 ? "text-primary font-medium" : ""}>
                  Etapa 2: Detalhes
                </span>
                {taskType && currentStep === 2 && (
                  <>
                    <span>•</span>
                    <Badge variant="outline">{taskType.label}</Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {saving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 animate-spin" />
                Salvando...
              </div>
            )}
            {!saving && lastSaved && currentStep === 2 && (
              <div className="text-sm text-muted-foreground">
                Salvo {new Date(lastSaved).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {currentStep === 1 ? (
          /* STEP 1: Task Type Selection */
          <div className="min-h-full flex items-center justify-center px-6 py-12 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <div className="w-full max-w-6xl space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Escolha o Tipo de Tarefa</h2>
                <p className="text-lg text-muted-foreground">
                  Selecione um tipo de tarefa para começar ou utilize um template existente
                </p>
              </div>
              
              <TaskTypePicker
                onSelectType={handleFixedTypeChange}
                onSelectTemplates={() => setShowTemplateDrawer(true)}
              />
            </div>
          </div>
        ) : (
          /* STEP 2: Task Form */
          <div className="px-6 py-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <form onSubmit={handleSubmit(handleCreateTask)} id="task-form" className="max-w-5xl mx-auto space-y-8">
              
              {/* Task Code - Prominent Display */}
              <div className="bg-muted/30 border-2 border-primary/20 rounded-lg p-4">
                <Label htmlFor="task_code" className="text-base font-semibold">
                  Código da Tarefa
                </Label>
                <Input
                  id="task_code"
                  value="Será gerado automaticamente"
                  disabled
                  className="mt-2 bg-background/50 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  O código único será atribuído automaticamente após a criação da tarefa
                </p>
              </div>

              <Separator />

              {selectedTemplate && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-2">
                    <FileText className="h-3 w-3" />
                    Template: {selectedTemplate.name}
                  </Badge>
                </div>
              )}

              {/* Basic Fields */}
              {selectedFixedType && (
            <>
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Informações Básicas</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Título *</Label>
                    <Controller
                      name="title"
                      control={control}
                      render={({ field, fieldState }) => (
                        <>
                          <Input 
                            {...field} 
                            placeholder="Digite o título da tarefa"
                          />
                          {fieldState.error && (
                            <p className="text-sm text-destructive">{fieldState.error.message}</p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <Textarea 
                          {...field} 
                          placeholder="Descreva os detalhes da tarefa"
                          rows={4}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade *</Label>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
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
                          type="number"
                          min="0"
                          step="0.5"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Assignment */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Atribuição</h2>

                <div className="space-y-2">
                  <Label>Tipo de Atribuição *</Label>
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
                          <SelectItem value="anyone">Qualquer um</SelectItem>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="department">Departamento</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {watch('assignment_type') === 'individual' && (
                  <div className="space-y-2">
                    <Label>Atribuir para *</Label>
                    <Controller
                      name="assigned_to"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um usuário" />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map(profile => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.name}
                              </SelectItem>
                            ))}</SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}

                {watch('assignment_type') === 'anyone' && (
                  <div className="space-y-2">
                    <Label>Selecionar Usuários *</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Todos os usuários selecionados terão acesso à mesma tarefa (ID compartilhado)
                    </p>
                    <Controller
                      name="assigned_users"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3 bg-background">
                          {profiles.map(profile => (
                            <div key={profile.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`user-anyone-${profile.id}`}
                                checked={field.value?.includes(profile.id) || false}
                                onChange={(e) => {
                                  const currentUsers = field.value || [];
                                  if (e.target.checked) {
                                    field.onChange([...currentUsers, profile.id]);
                                  } else {
                                    field.onChange(currentUsers.filter((id: string) => id !== profile.id));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor={`user-anyone-${profile.id}`} className="text-sm font-normal cursor-pointer">
                                {profile.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </div>
                )}

                {watch('assignment_type') === 'all' && (
                  <div className="space-y-2">
                    <Label>Selecionar Usuários *</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Cada usuário selecionado receberá uma cópia independente da tarefa (IDs únicos)
                    </p>
                    <Controller
                      name="assigned_users"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3 bg-background">
                          {profiles.map(profile => (
                            <div key={profile.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`user-all-${profile.id}`}
                                checked={field.value?.includes(profile.id) || false}
                                onChange={(e) => {
                                  const currentUsers = field.value || [];
                                  if (e.target.checked) {
                                    field.onChange([...currentUsers, profile.id]);
                                  } else {
                                    field.onChange(currentUsers.filter((id: string) => id !== profile.id));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor={`user-all-${profile.id}`} className="text-sm font-normal cursor-pointer">
                                {profile.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </div>
                )}

                {watch('assignment_type') === 'department' && (
                  <div className="space-y-2">
                    <Label>Departamento *</Label>
                    <Controller
                      name="assigned_department"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map(dept => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}</SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Attachments Section */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Anexos (Opcional)</h2>
                <div className="space-y-4">
                  {selectedAttachments.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedAttachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                              <span className="text-sm truncate">{attachment.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAttachments(prev => prev.filter(a => a.id !== attachment.id));
                              }}
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAttachmentsSelection(true)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar mais arquivos
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAttachmentsSelection(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar arquivos anexos
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Anexe documentos, imagens ou outros arquivos relevantes para esta tarefa
                  </p>
                </div>
              </div>

              <Separator />

              {/* Specific Payload Fields */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Configurações Específicas</h2>
                {renderPayloadFields()}
              </div>

              <Separator />

              {/* Recurrence */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Recorrência</h2>
                <RecurrenceSection
                  value={localRecurrenceSettings}
                  onChange={updateRecurrenceSettings}
                />
              </div>
            </>
          )}
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      {currentStep === 2 && (
        <div className="border-t bg-card/50 px-6 py-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscard}
            >
              Descartar
            </Button>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  saveImmediate();
                  toast({ title: "Rascunho salvo" });
                }}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar Rascunho
              </Button>
              <Button
                type="submit"
                form="task-form"
                disabled={!selectedFixedType || !payloadValid || !form.formState.isValid}
              >
                Criar Tarefa
              </Button>
            </div>

            {/* Debug: Mostrar erros de validação */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-2">Erros de validação:</p>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {Object.entries(form.formState.errors).map(([key, error]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {error?.message?.toString() || 'Erro desconhecido'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Debug: Mostrar estado de validação */}
            {(!selectedFixedType || !payloadValid) && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-2">Validações pendentes:</p>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  {!selectedFixedType && <li>Tipo de tarefa não selecionado</li>}
                  {!payloadValid && selectedFixedType && (() => {
                    const validation = validateTaskPayload(selectedFixedType, watchedValues.payload || {});
                    return (
                      <>
                        <li>Campos obrigatórios do tipo de tarefa não preenchidos</li>
                        {validation.errors && validation.errors.length > 0 && (
                          <li className="ml-4">
                            <strong>Erros:</strong>
                            <ul className="list-disc list-inside ml-4 mt-1">
                              {validation.errors.map((error, idx) => {
                                if (typeof error === 'string') {
                                  return <li key={idx}>{error}</li>;
                                }
                                // Parse Zod error object
                                const path = error.path ? error.path.join('.') : 'campo';
                                const message = error.message || 'Campo inválido';
                                return <li key={idx}><strong>{path}:</strong> {message}</li>;
                              })}
                            </ul>
                          </li>
                        )}
                      </>
                    );
                  })()}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <TemplatePickerDrawer
        isOpen={showTemplateDrawer}
        onClose={() => setShowTemplateDrawer(false)}
        onSelectTemplate={handleSelectTemplate}
        onCreateNew={() => {
          setShowTemplateDrawer(false);
          toast({ title: "Criação de templates disponível na página de Templates" });
        }}
      />

      {/* Modal for multiple file selection (attachments) */}
      <DocumentSelectionModal
        open={showAttachmentsSelection}
        onOpenChange={setShowAttachmentsSelection}
        allowMultiple={true}
        onMultipleDocumentsSelect={(documents) => {
          setSelectedAttachments(prev => {
            // Add new documents avoiding duplicates
            const newDocs = documents.filter(doc => !prev.some(p => p.id === doc.id));
            return [...prev, ...newDocs];
          });
          setShowAttachmentsSelection(false);
        }}
        onDocumentSelect={() => {}} // Required but not used in multiple mode
      />
    </FullscreenDialogContent>
  );
};

