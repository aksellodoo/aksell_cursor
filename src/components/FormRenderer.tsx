
import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FormHeader } from '@/components/FormHeader';
import { FormConsentOverlay } from '@/components/FormConsentOverlay';
import { AIField } from '@/components/AIField';
import { ArrowLeft, Save, Trash2, Clock, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Form } from '@/hooks/useForms';
import { useFormDraft } from '@/hooks/useFormDraft';
import { calculateTimeRemaining } from '@/utils/timeRemaining';

interface FormRendererProps {
  form: Form;
  onSubmit: (data: any) => Promise<void>;
  submitting: boolean;
  isAnonymous?: boolean;
  showBackButton?: boolean;
  backTo?: string;
}

export const FormRenderer = ({ 
  form, 
  onSubmit, 
  submitting, 
  isAnonymous = false,
  showBackButton = true,
  backTo = '/formularios'
}: FormRendererProps) => {
  const navigate = useNavigate();
  const [showConsentOverlay, setShowConsentOverlay] = useState(false);
  const { 
    draft, 
    loading: draftLoading, 
    saving: draftSaving, 
    saveDraft, 
    deleteDraft, 
    calculateProgress 
  } = useFormDraft(form.id);

  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    isExpired: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
    getValues
  } = useForm<Record<string, any>>({
    defaultValues: {}
  });

  const watchedValues = watch();
  
  // Check if consent is required
  const requiresConsent = useMemo(() => {
    // External and mixed forms always require consent
    if (form.publication_status === 'published_external' || form.publication_status === 'published_mixed') {
      return true;
    }
    
    // Internal and task usage forms require consent if configured
    if (form.publication_status === 'published_internal' || form.publication_status === 'task_usage') {
      return form.publication_settings?.require_privacy_consent || false;
    }
    
    return false;
  }, [form.publication_status, form.publication_settings?.require_privacy_consent]);

  // Calcular progresso atual
  const currentProgress = calculateProgress(watchedValues, form.fields_definition || []);

  // Atualizar contador de tempo
  useEffect(() => {
    const updateTimer = () => {
      const deadline = form.settings?.deadline || form.publication_settings?.response_deadline;
      if (deadline) {
        const remaining = calculateTimeRemaining(deadline);
        setTimeRemaining(remaining);
      } else {
        setTimeRemaining(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, [form]);

  // Check consent on mount and load draft
  useEffect(() => {
    if (requiresConsent && !isAnonymous) {
      const consentKey = `form_consent_${form.id}`;
      const hasConsent = localStorage.getItem(consentKey);
      if (!hasConsent) {
        setShowConsentOverlay(true);
        return; // Don't load draft if consent needed
      }
    }
    
    // Load draft if available
    if (!isAnonymous && draft?.response_data) {
      console.log('Loading draft data:', draft.response_data);
      reset(draft.response_data);
    }
  }, [requiresConsent, form.id, isAnonymous, draft?.response_data, reset]);

  // Carregar dados do rascunho quando disponível
  useEffect(() => {
    if (draft && draft.response_data) {
      reset(draft.response_data);
    }
  }, [draft, reset]);

  const handleSaveDraft = async () => {
    const formData = getValues();
    const progress = calculateProgress(formData, form.fields_definition || []);
    await saveDraft(formData, progress);
  };

  const handleDeleteDraft = async () => {
    if (await deleteDraft()) {
      reset();
      toast.success('Rascunho descartado!');
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      await onSubmit(data);
      // Limpar rascunho após envio bem-sucedido
      if (draft) {
        await deleteDraft();
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    }
  };

  const renderField = (field: any) => {
    const fieldError = errors[field.id];
    
    // Determine field width based on configuration
    const getFieldWidth = (field: any) => {
      const width = field.width || field.grid_width || 'full';
      switch (width) {
        case '1/4':
        case 'quarter':
          return 'col-span-12 md:col-span-3';
        case '1/3':
        case 'third':
          return 'col-span-12 md:col-span-4';
        case '1/2':
        case 'half':
          return 'col-span-12 md:col-span-6';
        case '2/3':
        case 'two-thirds':
          return 'col-span-12 md:col-span-8';
        case '3/4':
        case 'three-quarters':
          return 'col-span-12 md:col-span-9';
        case 'full':
        default:
          return 'col-span-12';
      }
    };

    const fieldWidth = getFieldWidth(field);

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              {...register(field.id, { 
                required: field.required ? `${field.label} é obrigatório` : false,
                pattern: field.type === 'email' ? {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                } : undefined
              })}
            />
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message?.toString()}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              {...register(field.id, { 
                required: field.required ? `${field.label} é obrigatório` : false 
              })}
            />
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message?.toString()}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              rules={{ required: field.required ? `${field.label} é obrigatório` : false }}
              render={({ field: controlField }) => (
                <Select value={controlField.value || ""} onValueChange={controlField.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || "Selecione uma opção"} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message?.toString()}</p>
            )}
          </div>
        );

      case 'checkbox':
        if (field.options && field.options.length > 1) {
          // Multiple choice checkbox
          return (
            <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
              <Label>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Controller
                name={field.id}
                control={control}
                rules={{ required: field.required ? `${field.label} é obrigatório` : false }}
                render={({ field: controlField }) => (
                  <div className="space-y-2">
                    {field.options.map((option: string) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${field.id}-${option}`}
                          checked={(controlField.value || []).includes(option)}
                          onCheckedChange={(checked) => {
                            const currentValue = controlField.value || [];
                            if (checked) {
                              controlField.onChange([...currentValue, option]);
                            } else {
                              controlField.onChange(currentValue.filter((v: string) => v !== option));
                            }
                          }}
                        />
                        <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                      </div>
                    ))}
                  </div>
                )}
              />
              {fieldError && (
                <p className="text-sm text-red-500">{fieldError.message?.toString()}</p>
              )}
            </div>
          );
        } else {
          // Single checkbox
          return (
            <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
              <div className="flex items-center space-x-2">
                <Controller
                  name={field.id}
                  control={control}
                  rules={{ required: field.required ? `${field.label} é obrigatório` : false }}
                  render={({ field: controlField }) => (
                    <Checkbox
                      id={field.id}
                      checked={controlField.value || false}
                      onCheckedChange={controlField.onChange}
                    />
                  )}
                />
                <Label htmlFor={field.id}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              </div>
              {fieldError && (
                <p className="text-sm text-red-500">{fieldError.message?.toString()}</p>
              )}
            </div>
          );
        }

      case 'radio':
        return (
          <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              rules={{ required: field.required ? `${field.label} é obrigatório` : false }}
              render={({ field: controlField }) => (
                <RadioGroup value={controlField.value || ""} onValueChange={controlField.onChange}>
                  {field.options?.map((option: string) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                      <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message?.toString()}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              placeholder={field.placeholder}
              {...register(field.id, { 
                required: field.required ? `${field.label} é obrigatório` : false,
                valueAsNumber: true
              })}
            />
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message?.toString()}</p>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              placeholder={field.placeholder}
              {...register(field.id, { 
                required: field.required ? `${field.label} é obrigatório` : false 
              })}
            />
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message?.toString()}</p>
            )}
          </div>
        );

      case 'download':
        return (
          <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
            <Label>
              {field.label}
            </Label>
            {field.downloads && field.downloads.length > 0 ? (
              <div className="space-y-3 p-4 rounded-lg border border-blue-200 bg-blue-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <Download className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    {field.downloads.length} arquivo{field.downloads.length > 1 ? 's' : ''} disponível{field.downloads.length > 1 ? 'eis' : ''}
                  </span>
                </div>
                <div className="space-y-2">
                  {field.downloads.map((download: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                      <div className="flex items-center gap-3">
                        <Download className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-blue-700 truncate max-w-[200px]">
                            {download.name}
                          </div>
                          {download.note && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {download.note}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = download.url;
                          link.download = download.name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-muted bg-muted/30 text-center">
                <Download className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Nenhum arquivo disponível</span>
              </div>
            )}
          </div>
        );

      case 'ai-suggest':
        return (
          <Controller
            key={field.id}
            name={field.id}
            control={control}
            rules={{ required: field.required ? `${field.label} é obrigatório` : false }}
            render={({ field: controlField, fieldState }) => (
              <div className={field.aiConfig?.showToUser === false ? '' : fieldWidth}>
                <AIField
                  field={field}
                  value={controlField.value || ''}
                  onChange={controlField.onChange}
                  formData={watchedValues}
                  error={fieldState.error?.message}
                />
              </div>
            )}
          />
        );

      default:
        return null;
    }
  };

  if (draftLoading) {
    return <LoadingSpinner />;
  }

  const handleConsentAccept = () => {
    const consentKey = `form_consent_${form.id}`;
    localStorage.setItem(consentKey, 'accepted');
    setShowConsentOverlay(false);
  };

  const handleConsentReject = () => {
    handleGoBack();
  };

  const handleGoBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      // Safe back with fallbacks
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/formularios'); // Default fallback
      }
    }
  };

  return (
    <>
      {showConsentOverlay && (
        <FormConsentOverlay
          formTitle={form.title}
          onAccept={handleConsentAccept}
          onReject={handleConsentReject}
        />
      )}
      
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Form Header with Logo */}
          <FormHeader />
          
          {/* Header */}
          <div className="mb-8">
            {showBackButton && (
              <Button
                variant="ghost"
                onClick={handleGoBack}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
            
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {form.title}
              </h1>
              {form.description && (
                <p className="text-muted-foreground mb-4">{form.description}</p>
              )}
              
              {/* Barra de progresso */}
              <div className="max-w-md mx-auto mb-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>Progresso</span>
                  <span>{currentProgress}%</span>
                </div>
                <Progress value={currentProgress} className="h-2" />
              </div>

              {/* Indicador de rascunho salvo */}
              {draft && (
                <Badge variant="secondary" className="mb-4">
                  <Save className="w-3 h-3 mr-1" />
                  Rascunho salvo em {new Date(draft.updated_at).toLocaleString('pt-BR')}
                </Badge>
              )}
            </div>
          </div>

          {/* Formulário */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(handleFormSubmit)}>
                <div className="grid grid-cols-12 gap-6 mb-6">
                  {form.fields_definition?.map(renderField)}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                  {/* Botões de ação */}
                  <div className="flex gap-3 flex-1">
                    {!isAnonymous && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSaveDraft}
                          disabled={draftSaving}
                          className="flex-1 sm:flex-none"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {draftSaving ? 'Salvando...' : 'Salvar rascunho'}
                        </Button>
                        
                        {draft && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleDeleteDraft}
                            className="flex-1 sm:flex-none"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Descartar
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={submitting || (timeRemaining?.isExpired && !isAnonymous)}
                    className="flex-1 sm:flex-none sm:min-w-[120px]"
                  >
                    {submitting ? 'Enviando...' : 'Enviar formulário'}
                  </Button>
                </div>

                {/* Mensagem de prazo expirado */}
                {timeRemaining?.isExpired && !isAnonymous && (
                  <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <p className="text-destructive font-medium">
                      ⚠️ O prazo para resposta deste formulário já expirou
                    </p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Footer fixo com contador */}
          {timeRemaining && !timeRemaining.isExpired && (
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg p-4 z-50">
              <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Tempo restante:</span>
                <span className="font-semibold text-primary">
                  {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                  {timeRemaining.hours > 0 && `${timeRemaining.hours}h `}
                  {timeRemaining.minutes}m
                </span>
              </div>
            </div>
          )}

          {/* Espaçamento extra quando há footer fixo */}
          {timeRemaining && !timeRemaining.isExpired && (
            <div className="h-16" />
          )}
        </div>
      </div>
    </>
  );
};

export default FormRenderer;
