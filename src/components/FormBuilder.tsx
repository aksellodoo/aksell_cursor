import { useCallback, useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Progress } from './ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ThemeToggle } from './ui/theme-toggle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { 
  Plus, 
  Trash2, 
  Copy, 
  GripVertical, 
  Type, 
  Mail, 
  Hash, 
  Calendar, 
  Clock, 
  Phone, 
  Globe, 
  FileText, 
  CheckSquare, 
  Circle, 
  List,
  ArrowLeft,
  Save,
  Eye,
  Edit,
  X,
  Upload,
  Settings,
  Palette,
  FormInput,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Download
} from 'lucide-react';
import { useForms } from '@/hooks/useForms';
import { useToast } from './ui/use-toast';
import { FormConfigurationModal } from './FormConfigurationModal';
import { FormHeader } from './FormHeader';
import { FileUpload } from '@/components/ui/file-upload';
import { Sparkles } from 'lucide-react';
import { NumberTypeSelector } from './form-builder/NumberTypeSelector';
import { ValidationPanel } from './form-builder/ValidationPanel';
import { getDefaultFormatting } from '@/utils/fieldFormatting';
import type { FormFieldExtended, NumberSubtype } from '@/types/formField';

const fieldTypes = [
  { type: 'text', label: 'Texto', icon: Type, description: 'Campo de texto simples', placeholder: 'Digite aqui...' },
  { type: 'email', label: 'Email', icon: Mail, description: 'Campo de email com validação', placeholder: 'nome@empresa.com' },
  { type: 'number', label: 'Número', icon: Hash, description: 'Campo numérico', placeholder: '123' },
  { type: 'date', label: 'Data', icon: Calendar, description: 'Seletor de data', placeholder: 'dd/mm/aaaa' },
  { type: 'datetime-local', label: 'Data e Hora', icon: Clock, description: 'Seletor de data e hora', placeholder: 'dd/mm/aaaa hh:mm' },
  { type: 'time', label: 'Hora', icon: Clock, description: 'Seletor de hora (HH:mm)', placeholder: 'hh:mm' },
  { type: 'tel', label: 'Telefone', icon: Phone, description: 'Campo de telefone', placeholder: '(11) 99999-9999' },
  { type: 'url', label: 'URL', icon: Globe, description: 'Campo de URL', placeholder: 'https://exemplo.com' },
  { type: 'textarea', label: 'Texto Longo', icon: FileText, description: 'Área de texto longa', placeholder: 'Digite sua resposta detalhada...' },
  { type: 'select', label: 'Lista Suspensa', icon: List, description: 'Lista de opções suspensa' },
  { type: 'radio', label: 'Seleção Única', icon: Circle, description: 'Opções de seleção única' },
  { type: 'checkbox', label: 'Múltipla Escolha', icon: CheckSquare, description: 'Opções de múltipla escolha' },
  { type: 'file', label: 'Arquivo/Foto', icon: Upload, description: 'Upload de arquivo ou foto' },
  { type: 'download', label: 'Download de Arquivo/Foto', icon: Download, description: 'Arquivos publicados pelo autor para download' },
  { type: 'signature', label: 'Assinatura', icon: Settings, description: 'Campo de assinatura digital' },
  { type: 'richtext', label: 'Editor Rico', icon: Palette, description: 'Editor de texto rico' },
  { type: 'ai-suggest', label: 'Campo IA', icon: Sparkles, description: 'Campo com sugestão automática por IA', placeholder: 'Sugestão será gerada automaticamente...' },
  { type: 'section', label: 'Separador', icon: Layers, description: 'Separador visual entre seções' },
];

type FormStatus = 'draft' | 'published_internal' | 'published_external' | 'published_mixed' | 'archived' | 'task_usage';

interface Tab {
  id: string;
  title: string;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  tabId?: string;
  [key: string]: any;
}

interface FormBuilderProps {
  form?: any;
  onSave?: () => void;
  onCancel?: () => void;
  embedded?: boolean;
  lockedStatus?: FormStatus;
}

export const FormBuilder = ({ form, onSave, onCancel, embedded = false, lockedStatus }: FormBuilderProps = {}) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [formData, setFormData] = useState({
    title: form?.title || 'Novo Formulário',
    description: form?.description || '',
    fields: form?.fields_definition || [],
    departmentId: form?.department_id || null,
    isPublic: form?.is_public || false,
    requiresLogin: form?.requires_login || false,
    allowAnonymous: form?.allow_anonymous || false,
    isActive: form?.is_active !== false,
    displayOrder: form?.display_order || 0,
    tabs: form?.settings?.tabs || [{ id: 'tab-default', title: 'Geral' }],
  });
  const [activeTabId, setActiveTabId] = useState<string>('tab-default');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  
  // Campo computado para sempre obter dados atualizados
  const selectedField = selectedFieldId 
    ? formData.fields.find(field => field.id === selectedFieldId) 
    : null;
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [lastFormId, setLastFormId] = useState<string | null>(null);
  
  // Wizard state for preview mode
  const [currentStep, setCurrentStep] = useState(0);

  const { createForm, updateForm } = useForms();
  const { toast } = useToast();

  // Sync internal state with form prop when it changes (ensures database data takes precedence over localStorage)
  useEffect(() => {
    if (form && form.id !== currentFormId) {
      const tabs = form.settings?.tabs || [{ id: 'tab-default', title: 'Geral' }];
      const fieldsWithTabId = form.fields_definition?.map((field: FormField) => ({
        ...field,
        tabId: field.tabId || tabs[0]?.id || 'tab-default',
        // Initialize downloads array for download type fields if not present
        downloads: field.type === 'download' ? (field.downloads || []) : field.downloads
      })) || [];
      
      setFormData({
        title: form.title || 'Novo Formulário',
        description: form.description || '',
        fields: fieldsWithTabId,
        departmentId: form.department_id || null,
        isPublic: form.is_public || false,
        requiresLogin: form.requires_login || false,
        allowAnonymous: form.allow_anonymous || false,
        isActive: form.is_active !== false,
        displayOrder: form.display_order || 0,
        tabs: tabs,
      });
      setActiveTabId(tabs[0]?.id || 'tab-default');
      setCurrentFormId(form.id);
    }
  }, [form, currentFormId]);

  // Utility functions for wizard and validation
  const groupFieldsIntoSteps = () => {
    const steps: { title: string; fields: any[] }[] = [];
    let currentStepFields: any[] = [];
    let currentStepTitle = 'Início';

    formData.fields.forEach((field) => {
      if (field.type === 'section') {
        // Save current step if it has fields
        if (currentStepFields.length > 0) {
          steps.push({ title: currentStepTitle, fields: currentStepFields });
        }
        // Start new step
        currentStepTitle = field.label;
        currentStepFields = [];
      } else {
        currentStepFields.push(field);
      }
    });

    // Add the last step if it has fields
    if (currentStepFields.length > 0) {
      steps.push({ title: currentStepTitle, fields: currentStepFields });
    }

    return steps.length > 0 ? steps : [{ title: 'Formulário', fields: formData.fields.filter(f => f.type !== 'section') }];
  };

  const validateField = (field: any): string[] => {
    const errors: string[] = [];
    
    if (!field.label || field.label.trim() === '') {
      errors.push('Campo sem nome');
    }
    
    if (['select', 'radio', 'checkbox'].includes(field.type)) {
      if (!field.options || field.options.length === 0) {
        errors.push('Sem opções');
      } else if (field.options.some((opt: string) => !opt || opt.trim() === '')) {
        errors.push('Opção vazia');
      }
    }
    
    if (field.type === 'download') {
      if (!field.downloads || field.downloads.length === 0) {
        errors.push('Sem arquivos');
      }
    }
    
    return errors;
  };

  const getFieldErrors = (fieldId: string) => {
    const field = formData.fields.find(f => f.id === fieldId);
    return field ? validateField(field) : [];
  };

  const hasErrors = (fieldId: string) => {
    return getFieldErrors(fieldId).length > 0;
  };

  const steps = groupFieldsIntoSteps();

  // Save to localStorage with debouncing
  const saveToLocalStorage = useCallback((data: any) => {
    if (!isHydrated) return; // Don't save until after initial hydration
    const storageKey = form?.id ? `formBuilder_edit_${form.id}` : 'formBuilder_new';
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [form?.id, isHydrated]);

  // Clear localStorage draft
  const clearLocalStorage = useCallback(() => {
    try {
      const storageKey = form?.id ? `formBuilder_edit_${form.id}` : 'formBuilder_new';
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }, [form?.id]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const storageKey = form?.id ? `formBuilder_edit_${form.id}` : 'formBuilder_new';
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }, [form?.id]);

  // Load draft on mount
  useEffect(() => {
    const storageKey = form?.id ? `formBuilder_edit_${form.id}` : 'formBuilder_new';
    const savedData = localStorage.getItem(storageKey);
    
    // For new forms, always start fresh and clear localStorage
    if (!form?.id) {
      // Clear any existing new form draft
      try {
        localStorage.removeItem('formBuilder_new');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
      
      // Reset to default new form state
      setFormData({
        title: 'Novo Formulário',
        description: '',
        fields: [],
        departmentId: null,
        isPublic: false,
        requiresLogin: false,
        allowAnonymous: false,
        isActive: true,
        displayOrder: 0,
        tabs: [{ id: 'tab-default', title: 'Geral' }],
      });
      setActiveTabId('tab-default');
    }
    // Only load from localStorage for editing existing forms
    else if (savedData && form && form.id) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
    
    // Mark as hydrated after initial load
    setIsHydrated(true);
  }, [form]);

  // Auto-save formData changes to localStorage
  useEffect(() => {
    if (!isHydrated) return; // Don't save until hydrated
    
    // Debounce the save to avoid excessive localStorage writes
    const timeoutId = setTimeout(() => {
      if (formData.title !== 'Novo Formulário' || formData.fields.length > 0 || formData.description) {
        saveToLocalStorage(formData);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData, saveToLocalStorage, isHydrated]);

  // Add visibility change listener to save when tab loses focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Save current changes when tab is hidden
        if (formData.title !== 'Novo Formulário' || formData.fields.length > 0 || formData.description) {
          saveToLocalStorage(formData);
        }
      }
    };

    const handleBeforeUnload = () => {
      // Save current changes when page is about to unload
      if (formData.title !== 'Novo Formulário' || formData.fields.length > 0 || formData.description) {
        saveToLocalStorage(formData);
      }
    };

    const handlePageHide = () => {
      // Save current changes when page is hidden (better for mobile)
      if (formData.title !== 'Novo Formulário' || formData.fields.length > 0 || formData.description) {
        saveToLocalStorage(formData);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [formData, saveToLocalStorage]);

  const addField = (type: string) => {
    const fieldType = fieldTypes.find(ft => ft.type === type);
    const newField: FormFieldExtended = {
      id: `field-${Date.now()}`,
      type,
      label: type === 'section' ? 'Nova Seção' : `Novo Campo ${fieldType?.label || type}`,
      placeholder: fieldType?.placeholder || '',
      required: type !== 'section' ? false : undefined,
      width: 'full' as 'full' | 'half' | 'quarter',
      options: type === 'select' || type === 'radio' || type === 'checkbox' ? ['Opção 1'] : undefined,
      tabId: activeTabId,
      // Field properties
      observacao: '',
      aiAssistEnabled: false,
      aiAssistPrompt: '',

      // NEW: Validation and formatting properties
      validation: {},
      formatting: type === 'number' ? getDefaultFormatting('decimal') : {},
      subtype: type === 'number' ? ('decimal' as NumberSubtype) : undefined,

      // AI field specific properties
      aiConfig: type === 'ai-suggest' ? {
        sourceFields: [],
        task: 'summarize' as 'summarize' | 'classify' | 'extract' | 'correct' | 'generate',
        instructions: 'Gere uma sugestão baseada nos campos de origem',
        outputType: 'text' as 'text' | 'json',
        trigger: 'onClick' as 'onClick' | 'onBlur',
        showToUser: true,
        display: 'singleline' as 'singleline' | 'multiline' | 'richtext',
      } : undefined,
      // Download field specific properties
      downloads: type === 'download' ? [] : undefined,
    };
    
    // Get current tab fields and add new field at the end
    const currentTabFields = formData.fields.filter(f => f.tabId === activeTabId);
    const otherTabFields = formData.fields.filter(f => f.tabId !== activeTabId);
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        fields: [...otherTabFields, ...currentTabFields, newField]
      };
      saveToLocalStorage(newFormData);
      return newFormData;
    });
    setSelectedFieldId(newField.id);
  };

  const updateField = (fieldId: string, updates: any) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        fields: prev.fields.map(field => 
          field.id === fieldId ? { ...field, ...updates } : field
        )
      };
      saveToLocalStorage(newFormData);
      return newFormData;
    });
  };

  const removeField = (fieldId: string) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        fields: prev.fields.filter(field => field.id !== fieldId)
      };
      saveToLocalStorage(newFormData);
      return newFormData;
    });
    if (selectedField?.id === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const duplicateField = (fieldId: string) => {
    const fieldToDuplicate = formData.fields.find(field => field.id === fieldId);
    if (fieldToDuplicate) {
      const duplicatedField = {
        ...fieldToDuplicate,
        id: `field-${Date.now()}`,
        label: `${fieldToDuplicate.label} (Cópia)`,
        tabId: fieldToDuplicate.tabId || activeTabId, // Ensure tabId is preserved
      };
      
      setFormData(prev => {
        const newFormData = {
          ...prev,
          fields: [...prev.fields, duplicatedField]
        };
        saveToLocalStorage(newFormData);
        return newFormData;
      });
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // Get only fields from the current tab for reordering
    const currentTabFields = formData.fields.filter(f => f.tabId === activeTabId);
    const otherTabFields = formData.fields.filter(f => f.tabId !== activeTabId);
    
    const [reorderedField] = currentTabFields.splice(result.source.index, 1);
    currentTabFields.splice(result.destination.index, 0, reorderedField);

    setFormData(prev => {
      const newFormData = {
        ...prev,
        fields: [...otherTabFields, ...currentTabFields]
      };
      saveToLocalStorage(newFormData);
      return newFormData;
    });
  };

  // Tab management functions
  const addTab = () => {
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      title: `Nova Aba ${formData.tabs.length + 1}`
    };
    
    setFormData(prev => ({
      ...prev,
      tabs: [...prev.tabs, newTab]
    }));
    setActiveTabId(newTab.id);
  };

  const renameTab = (tabId: string, newTitle: string) => {
    setFormData(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => 
        tab.id === tabId ? { ...tab, title: newTitle } : tab
      )
    }));
  };

  // Inline editing functions
  const startEditingTab = (tabId: string, currentTitle: string) => {
    setEditingTabId(tabId);
    setEditingTitle(currentTitle);
  };

  const finishEditingTab = () => {
    if (editingTabId && editingTitle.trim()) {
      renameTab(editingTabId, editingTitle.trim());
    }
    setEditingTabId(null);
    setEditingTitle('');
  };

  const cancelEditingTab = () => {
    setEditingTabId(null);
    setEditingTitle('');
  };

  const moveTab = (tabId: string, direction: 'left' | 'right') => {
    const currentIndex = formData.tabs.findIndex(tab => tab.id === tabId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= formData.tabs.length) return;
    
    const newTabs = [...formData.tabs];
    [newTabs[currentIndex], newTabs[newIndex]] = [newTabs[newIndex], newTabs[currentIndex]];
    
    setFormData(prev => ({
      ...prev,
      tabs: newTabs
    }));
  };

  const deleteTab = (tabId: string) => {
    if (formData.tabs.length <= 1) return; // Always keep at least one tab
    
    // Move fields from deleted tab to the first remaining tab
    const remainingTabs = formData.tabs.filter(tab => tab.id !== tabId);
    const targetTabId = remainingTabs[0]?.id;
    
    if (!targetTabId) return;
    
    setFormData(prev => ({
      ...prev,
      tabs: remainingTabs,
      fields: prev.fields.map(field => 
        field.tabId === tabId ? { ...field, tabId: targetTabId } : field
      )
    }));
    
    if (activeTabId === tabId) {
      setActiveTabId(targetTabId);
    }
  };

  const moveFieldToTab = (fieldId: string, targetTabId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, tabId: targetTabId } : field
      )
    }));
  };

  const addOption = (fieldId: string) => {
    const field = formData.fields.find(f => f.id === fieldId);
    if (field && field.options) {
      const newOptions = [...field.options, `Opção ${field.options.length + 1}`];
      updateField(fieldId, { options: newOptions });
    }
  };

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = formData.fields.find(f => f.id === fieldId);
    if (field && field.options) {
      const newOptions = [...field.options];
      newOptions[optionIndex] = value;
      updateField(fieldId, { options: newOptions });
    }
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    const field = formData.fields.find(f => f.id === fieldId);
    if (field && field.options && field.options.length > 1) {
      const newOptions = field.options.filter((_: any, index: number) => index !== optionIndex);
      updateField(fieldId, { options: newOptions });
    }
  };

  const handleSaveClick = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, forneça um título para o formulário.",
        variant: "destructive",
      });
      return;
    }

    if (formData.fields.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, adicione pelo menos um campo ao formulário.",
        variant: "destructive",
      });
      return;
    }

    // Open configuration modal
    setIsConfigDialogOpen(true);
  };

  const saveForm = async (configData: any) => {
    try {
      console.log('FormBuilder.saveForm - Dados recebidos do modal:', configData);

      const formDataToSave = {
        title: formData.title,
        description: formData.description,
        fields_definition: formData.fields,
        settings: {
          ...(form?.settings || {}),
          tabs: formData.tabs
        },
        // Garantir que os dados de configuração sejam preservados
        status: configData.status || configData.publication_status || 'draft',
        publication_status: configData.publication_status || configData.status || 'draft',
        confidentiality_level: configData.confidentiality_level,
        allows_anonymous_responses: configData.allows_anonymous_responses,
        internal_recipients: configData.internal_recipients,
        allowed_users: configData.allowed_users,
        allowed_departments: configData.allowed_departments,
        allowed_roles: configData.allowed_roles,
        publication_settings: configData.publication_settings,
        is_published: configData.is_published,
        published_at: configData.published_at
      };

      console.log('FormBuilder.saveForm - Dados preparados para salvar:', formDataToSave);

      if (currentFormId) {
        await updateForm(currentFormId, formDataToSave);
      } else {
        const newForm = await createForm(formDataToSave);
        setCurrentFormId(newForm.id);
      }

      setIsConfigDialogOpen(false);
      toast({
        title: "Formulário salvo",
        description: "O formulário foi salvo com sucesso.",
      });

      // Clear draft after successful save
      clearLocalStorage();

      if (onSave) {
        await onSave();
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar o formulário. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const renderFieldPreview = (field: any, index: number) => {
    const isSelected = selectedField?.id === field.id;
    const fieldType = fieldTypes.find(ft => ft.type === field.type);
    const FieldIcon = fieldType?.icon || FormInput;
    const fieldErrors = getFieldErrors(field.id);
    const fieldHasErrors = fieldErrors.length > 0;
    
    // Section separator rendering
    if (field.type === 'section') {
    return (
      <Draggable key={field.id} draggableId={field.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={provided.draggableProps.style}
            className={`
              md:col-span-4 p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
              ${isSelected ? 'border-primary bg-primary/5 shadow-primary' : 'border-border bg-secondary/20 hover:border-primary/50 hover:shadow-card'}
              ${snapshot.isDragging ? 'shadow-lg' : ''}
              ${fieldHasErrors ? 'border-destructive bg-destructive/5' : ''}
            `}
            onClick={() => setSelectedFieldId(field.id)}
          >
              <div className="flex items-center gap-3">
                <div {...provided.dragHandleProps} className="cursor-grab">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>
                <Layers className="w-5 h-5 text-primary" />
                <span className="font-semibold text-lg text-primary">
                  {field.label}
                </span>
                {fieldHasErrors && (
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        {fieldErrors.map((error, idx) => (
                          <div key={idx}>• {error}</div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
                {isSelected && (
                  <div className="ml-auto flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateField(field.id);
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeField(field.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
        )}
      </Draggable>
    );
  }
  
  return (
    <Draggable key={field.id} draggableId={field.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={provided.draggableProps.style}
          className={`
            ${field.width === 'quarter' ? 'md:col-span-1' : field.width === 'half' ? 'md:col-span-2' : 'md:col-span-4'}
          `}
        >
            <Card
              className={`
                cursor-pointer transition-all duration-300 hover:shadow-card
                ${isSelected ? 'ring-2 ring-primary shadow-primary' : 'hover:ring-1 hover:ring-primary/30'}
                ${snapshot.isDragging ? 'shadow-2xl' : ''}
                ${fieldHasErrors ? 'ring-2 ring-destructive/50 border-destructive/30' : ''}
              `}
              onClick={() => setSelectedFieldId(field.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div {...provided.dragHandleProps} className="cursor-grab hover:scale-110 transition-transform">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <FieldIcon className={`w-5 h-5 ${fieldHasErrors ? 'text-destructive' : 'text-primary'}`} />
                  <span className={`font-semibold ${fieldHasErrors ? 'text-destructive' : 'text-foreground'}`}>
                    {field.label || 'Campo sem nome'}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </span>
                  {field.type === 'ai-suggest' && field.aiConfig?.showToUser === false && (
                    <Badge variant="secondary" className="text-xs">
                      Oculto no preenchimento
                    </Badge>
                  )}
                  {fieldHasErrors && (
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          {fieldErrors.map((error, idx) => (
                            <div key={idx}>• {error}</div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {isSelected && (
                    <div className="ml-auto flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-2xl hover:scale-105 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateField(field.id);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-2xl hover:scale-105 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeField(field.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {field.type === 'textarea' && (
                    <Textarea 
                      placeholder={field.placeholder || 'Digite sua resposta detalhada...'}
                      disabled
                      className="bg-muted/30 border-muted"
                    />
                  )}
                  {field.type === 'select' && (
                    <Select disabled>
                      <SelectTrigger className="bg-muted/30 border-muted">
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                    </Select>
                  )}
                  {field.type === 'radio' && field.options && (
                    <div className="space-y-2">
                      {field.options.map((option: string, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <input type="radio" disabled className="text-primary" />
                          <label className="text-sm text-muted-foreground">{option}</label>
                        </div>
                      ))}
                    </div>
                  )}
                  {field.type === 'checkbox' && field.options && (
                    <div className="space-y-2">
                      {field.options.map((option: string, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <Checkbox disabled />
                          <label className="text-sm text-muted-foreground">{option}</label>
                        </div>
                      ))}
                    </div>
                  )}
                  {field.type === 'file' && (
                    <div className="p-6 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5 text-center transition-colors hover:border-primary/40">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <span className="text-sm text-muted-foreground">Arraste arquivos ou clique para enviar</span>
                    </div>
                  )}
                  {field.type === 'download' && (
                    <div className="p-6 border-2 border-solid border-blue-200 rounded-2xl bg-blue-50 text-center">
                      <Download className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <span className="text-sm text-blue-700 font-medium">Arquivos disponíveis para download</span>
                      <Badge variant="secondary" className="mt-2">
                        {field.downloads?.length || 0} arquivo{field.downloads?.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                  {field.type === 'signature' && (
                    <div className="p-6 border-2 border-dashed border-muted rounded-2xl bg-muted/30 text-center">
                      <Settings className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Área de assinatura digital</span>
                    </div>
                  )}
                  {field.type === 'richtext' && (
                    <div className="p-6 border-2 border-dashed border-muted rounded-2xl bg-muted/30 text-center">
                      <Palette className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Editor de texto rico</span>
                    </div>
                  )}
                  {!['textarea', 'select', 'radio', 'checkbox', 'file', 'signature', 'richtext', 'section'].includes(field.type) && (
                    <div className="relative">
                      <FieldIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={field.type}
                        placeholder={field.placeholder || 'Digite sua resposta...'}
                        disabled
                        className="pl-10 bg-muted/30 border-muted"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Draggable>
    );
  };

  if (isPreviewMode) {
    const currentStepData = steps[currentStep] || steps[0];
    const progress = steps.length > 1 ? ((currentStep + 1) / steps.length) * 100 : 100;

    return (
      <TooltipProvider>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="h-full flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-subtle shadow-card">
            <div className="flex items-center gap-4">
              <FormInput className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Visualização do Formulário</h2>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsPreviewMode(false);
                  setCurrentStep(0);
                }}
                className="rounded-2xl hover:scale-105 transition-transform"
              >
                <Edit className="w-4 h-4 mr-2" />
                Voltar ao Editor
              </Button>
            </div>
          </div>
          
          {/* Preview Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-gradient-subtle">
            <div className="max-w-4xl mx-auto">
              {/* Form Header com Logotipos */}
              <FormHeader variant="compact" />
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <Card className="shadow-card">
                  <CardHeader className="bg-secondary/40 border-l-4 border-l-primary">
                    <CardTitle className="text-3xl font-bold text-foreground flex items-center gap-3">
                      <FormInput className="w-8 h-8 text-primary" />
                      {formData.title}
                    </CardTitle>
                    {formData.description && (
                      <p className="text-muted-foreground text-lg mt-3">{formData.description}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="p-8">
                    {/* Wizard Progress and Step Title */}
                    {steps.length > 1 && (
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="mb-8"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                            <Layers className="w-5 h-5 text-primary" />
                            {currentStepData.title}
                          </h3>
                          <Badge variant="secondary" className="px-3 py-1 rounded-2xl">
                            Etapa {currentStep + 1} de {steps.length}
                          </Badge>
                        </div>
                        <Progress value={progress} className="h-2 rounded-full" />
                      </motion.div>
                    )}

                    {/* Current Step Fields */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-4 gap-6"
                      >
                        {currentStepData.fields.map((field: any) => (
                          <div 
                            key={field.id} 
                            className={`space-y-3 ${field.width === 'quarter' ? 'md:col-span-1' : field.width === 'half' ? 'md:col-span-2' : 'md:col-span-4'}`}
                          >
                            <Label className="text-sm font-semibold text-foreground">
                              {field.label}
                              {field.required && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            
                            {field.type === 'textarea' && (
                              <Textarea 
                                placeholder={field.placeholder} 
                                className="rounded-xl"
                              />
                            )}
                            {field.type === 'select' && (
                              <Select>
                                <SelectTrigger className="rounded-xl">
                                  <SelectValue placeholder="Selecione uma opção" />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option: string, idx: number) => (
                                    <SelectItem key={idx} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {field.type === 'radio' && field.options && (
                              <div className="space-y-3">
                                {field.options.map((option: string, idx: number) => (
                                  <div key={idx} className="flex items-center space-x-3">
                                    <input
                                      type="radio"
                                      name={field.id}
                                      id={`${field.id}-${idx}`}
                                      className="text-primary focus:ring-primary"
                                    />
                                    <label htmlFor={`${field.id}-${idx}`} className="text-sm font-medium">
                                      {option}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                            {field.type === 'checkbox' && field.options && (
                              <div className="space-y-3">
                                {field.options.map((option: string, idx: number) => (
                                  <div key={idx} className="flex items-center space-x-3">
                                    <Checkbox id={`${field.id}-${idx}`} />
                                    <label htmlFor={`${field.id}-${idx}`} className="text-sm font-medium">
                                      {option}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                            {field.type === 'file' && (
                              <div className="p-8 border-2 border-dashed border-primary/30 rounded-2xl text-center bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                                <Upload className="w-8 h-8 mx-auto mb-3 text-primary" />
                                <p className="text-sm font-medium text-foreground mb-1">Clique ou arraste arquivos aqui</p>
                                <p className="text-xs text-muted-foreground">Máximo 10MB</p>
                              </div>
                            )}
                            {field.type === 'download' && (
                              <div className="p-8 border-2 border-solid border-blue-200 rounded-2xl text-center bg-blue-50">
                                <Download className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                                <p className="text-sm font-medium text-blue-700 mb-1">Arquivos disponíveis para download</p>
                                <Badge variant="secondary">
                                  {field.downloads?.length || 0} arquivo{field.downloads?.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                            )}
                            {field.type === 'signature' && (
                              <div className="p-12 border-2 border-dashed border-muted rounded-2xl text-center bg-muted/30">
                                <Settings className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Área de assinatura digital</span>
                              </div>
                            )}
                            {field.type === 'richtext' && (
                              <div className="p-8 border-2 border-dashed border-muted rounded-2xl text-center bg-muted/30">
                                <Palette className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Editor de texto rico</span>
                              </div>
                            )}
                            {!['textarea', 'select', 'radio', 'checkbox', 'file', 'signature', 'richtext', 'section'].includes(field.type) && (
                              <div className="relative">
                                {(() => {
                                  const fieldType = fieldTypes.find(ft => ft.type === field.type);
                                  const FieldIcon = fieldType?.icon || FormInput;
                                  return <FieldIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />;
                                })()}
                                <Input
                                  type={field.type}
                                  placeholder={field.placeholder}
                                  className="pl-10 rounded-xl"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                    
                    {/* Navigation Buttons */}
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                      className="flex justify-between items-center mt-12 pt-8 border-t border-border"
                    >
                      <div>
                        {currentStep > 0 && (
                          <Button 
                            variant="outline" 
                            size="lg"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="rounded-2xl hover:scale-105 transition-transform"
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Anterior
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          size="lg"
                          className="rounded-2xl hover:scale-105 transition-transform"
                        >
                          Cancelar
                        </Button>
                        
                        {currentStep < steps.length - 1 ? (
                          <Button 
                            size="lg"
                            onClick={() => setCurrentStep(currentStep + 1)}
                            className="rounded-2xl hover:scale-105 transition-transform shadow-primary hover:shadow-glow"
                          >
                            Próximo
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        ) : (
                          <Button 
                            size="lg"
                            className="rounded-2xl hover:scale-105 transition-transform shadow-primary hover:shadow-glow"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Enviar Formulário
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </TooltipProvider>
    );
  }

  // Don't render until hydrated to prevent localStorage conflicts
  if (!isHydrated) {
    return (
      <div className="h-full w-full bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-full bg-background flex flex-col min-h-0">
        {embedded && (
          <div className="flex items-center justify-between p-6 border-b border-border bg-card">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {form ? 'Editar Formulário' : 'Novo Formulário'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {form ? 'Modifique os campos e configurações do formulário' : 'Arraste os campos para construir seu formulário'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(true)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Visualizar
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                size="sm"
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => setIsConfigDialogOpen(true)}
                size="sm"
                disabled={formData.fields.length === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Salvar Formulário
              </Button>
            </div>
          </div>
        )}
        
        {!embedded && (
          <div className="p-4 border-b border-border bg-card/50">
            <div className="flex items-center justify-between max-w-none">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewMode(true)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Visualizar
                </Button>
              </div>
              <Button 
                onClick={() => setIsConfigDialogOpen(true)}
                size="sm"
                disabled={formData.fields.length === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Salvar Formulário
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Sidebar - Field Types */}
          <div className="w-80 border-r border-border bg-gradient-card p-6 overflow-y-auto min-h-0">
            <h3 className="text-xl font-bold mb-6 text-foreground">Elementos</h3>
            <div className="space-y-3">
              {fieldTypes.map((fieldType) => (
                <motion.div
                  key={fieldType.type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-auto p-4 rounded-2xl hover:scale-105 hover:shadow-card transition-all duration-300 border-primary/20 hover:border-primary/50"
                    onClick={() => addField(fieldType.type)}
                  >
                    <fieldType.icon className="w-5 h-5 mr-3 flex-shrink-0 text-primary" />
                    <div className="text-left">
                      <div className="font-semibold text-foreground">{fieldType.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {fieldType.description}
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Center - Form Canvas */}
          <div className="flex-1 p-8 overflow-y-auto bg-gradient-subtle min-h-0">
            <div className="max-w-4xl mx-auto min-h-full">
              {/* Form Header com Logotipos */}
              <FormHeader variant="compact" />
              
              {/* Form Title Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="mb-8 bg-secondary/40 border-l-4 border-l-primary shadow-card">
                  <CardHeader className="pb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FormInput className="w-8 h-8 text-primary" />
                      <div className="flex items-center gap-2 group flex-1">
                        <input
                          type="text"
                          value={formData.title}
                           onChange={(e) => {
                             const newFormData = { ...formData, title: e.target.value };
                             setFormData(newFormData);
                             saveToLocalStorage(newFormData);
                           }}
                          className="text-3xl font-bold bg-transparent border-none outline-none focus:bg-muted/20 rounded-lg px-3 py-2 transition-colors flex-1 hover:bg-muted/10"
                          placeholder="Clique para editar o título"
                          autoFocus={formData.title === 'Novo Formulário'}
                          onFocus={(e) => {
                            if (formData.title === 'Novo Formulário') {
                              e.target.select();
                            }
                          }}
                        />
                        <Edit className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      💡 Clique no título acima para editá-lo ou use o campo nome nas configurações
                    </p>
                    <Textarea
                      value={formData.description}
                       onChange={(e) => {
                         const newFormData = { ...formData, description: e.target.value };
                         setFormData(newFormData);
                         saveToLocalStorage(newFormData);
                       }}
                      placeholder="Adicione uma descrição para seu formulário..."
                      className="border-none bg-transparent resize-none focus:bg-muted/20 text-muted-foreground rounded-lg px-3 py-2"
                      rows={2}
                    />
                  </CardHeader>
                </Card>
              </motion.div>

              {/* Form Fields */}
              <Tabs value={activeTabId} onValueChange={setActiveTabId} className="w-full">
                {/* Tab Bar */}
                <div className="flex items-center gap-2 mb-6">
                  <TabsList className="grid w-auto grid-cols-1 gap-1 p-1" style={{ gridTemplateColumns: `repeat(${formData.tabs.length}, minmax(0, 1fr))` }}>
                    {formData.tabs.map((tab) => (
                      <TabsTrigger 
                        key={tab.id} 
                        value={tab.id} 
                        className="relative group"
                        onDoubleClick={() => startEditingTab(tab.id, tab.title)}
                      >
                        <span className="flex items-center gap-2">
                          {editingTabId === tab.id ? (
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={finishEditingTab}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  finishEditingTab();
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  cancelEditingTab();
                                }
                              }}
                              className="h-6 w-24 text-xs px-1"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <>
                              <span>{tab.title}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingTab(tab.id, tab.title);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                title="Renomear aba"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          {formData.tabs.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Tem certeza que deseja excluir a aba "${tab.title}"?`)) {
                                  deleteTab(tab.id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Excluir aba"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                        {activeTabId === tab.id && (
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTab(tab.id, 'left');
                              }}
                              disabled={formData.tabs.findIndex(t => t.id === tab.id) === 0}
                              className="h-5 w-5 p-0"
                              title="Mover para esquerda"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTab(tab.id, 'right');
                              }}
                              disabled={formData.tabs.findIndex(t => t.id === tab.id) === formData.tabs.length - 1}
                              className="h-5 w-5 p-0"
                              title="Mover para direita"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addTab}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Aba
                  </Button>
                </div>

                {/* Tab Contents */}
                {formData.tabs.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="mt-0">
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="form-fields" direction="vertical">
                        {(provided) => {
                          const currentTabFields = formData.fields.filter(f => f.tabId === tab.id);
                          
                          return (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="grid grid-cols-1 md:grid-cols-4 gap-6"
                            >
                              {currentTabFields.length === 0 ? (
                                <Card className="md:col-span-4 p-16 text-center border-2 border-dashed border-primary/20 bg-primary/5 rounded-2xl">
                                  <FormInput className="w-16 h-16 mx-auto mb-4 text-primary/50" />
                                  <h3 className="text-xl font-semibold text-foreground mb-2">
                                    Adicione campos à aba "{tab.title}"
                                  </h3>
                                  <p className="text-muted-foreground">
                                    Escolha um elemento na barra lateral para adicionar ao seu formulário
                                  </p>
                                </Card>
                              ) : (
                                currentTabFields.map((field, index) => renderFieldPreview(field, index))
                              )}
                              {provided.placeholder}
                            </div>
                          );
                        }}
                      </Droppable>
                    </DragDropContext>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>

          {/* Right Sidebar - Field Properties */}
          <div className="w-96 border-l border-border bg-gradient-card p-6 overflow-y-auto min-h-0">
            <AnimatePresence mode="wait">
              {selectedField ? (
                <motion.div 
                  key={selectedField.id}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                      {(() => {
                        const fieldType = fieldTypes.find(ft => ft.type === selectedField.type);
                        const FieldIcon = fieldType?.icon || FormInput;
                        return <FieldIcon className="w-5 h-5 text-primary" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Propriedades</h3>
                      <p className="text-sm text-muted-foreground">
                        {fieldTypes.find(ft => ft.type === selectedField.type)?.label || 'Campo'}
                      </p>
                    </div>
                    {hasErrors(selectedField.id) && (
                      <div className="ml-auto">
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
                              <AlertTriangle className="w-3 h-3 text-destructive" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              {getFieldErrors(selectedField.id).map((error, idx) => (
                                <div key={idx}>• {error}</div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>

                  {/* Tabs for Basic and Validation */}
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="basic" className="text-xs">
                        📝 Básico
                      </TabsTrigger>
                      <TabsTrigger value="validation" className="text-xs">
                        ✅ Validação
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-foreground">Ordem de Exibição</Label>
                       <Input
                         type="number"
                         min="1"
                         max={formData.fields.length}
                         value={formData.fields.findIndex(f => f.id === selectedField.id) + 1}
                         onChange={(e) => {
                           const newOrder = parseInt(e.target.value) - 1;
                           if (newOrder >= 0 && newOrder < formData.fields.length) {
                             const currentIndex = formData.fields.findIndex(f => f.id === selectedField.id);
                             if (currentIndex !== newOrder) {
                               const newFields = [...formData.fields];
                               const [movedField] = newFields.splice(currentIndex, 1);
                               newFields.splice(newOrder, 0, movedField);
                               setFormData(prev => {
                                 const newFormData = { ...prev, fields: newFields };
                                 saveToLocalStorage(newFormData);
                                 return newFormData;
                               });
                             }
                           }
                         }}
                         className="mt-2 rounded-xl"
                       />
                       <p className="text-xs text-muted-foreground mt-1">
                         Posição do campo no formulário (1 a {formData.fields.length})
                       </p>
                     </div>

                     <div>
                       <Label className="text-sm font-semibold text-foreground">Nome do Campo</Label>
                       <Input
                         value={selectedField.label}
                         onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                         placeholder="Digite o nome do campo"
                         className={`mt-2 rounded-xl ${hasErrors(selectedField.id) && !selectedField.label ? 'border-destructive focus:border-destructive' : ''}`}
                       />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-foreground">Aba</Label>
                        <Select
                          value={selectedField.tabId || activeTabId}
                          onValueChange={(value) => moveFieldToTab(selectedField.id, value)}
                        >
                          <SelectTrigger className="mt-2 rounded-xl">
                            <SelectValue placeholder="Selecione a aba" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.tabs.map((tab) => (
                              <SelectItem key={tab.id} value={tab.id}>
                                {tab.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedField.type !== 'section' && (
                      <>
                        <div>
                          <Label className="text-sm font-semibold text-foreground">Placeholder</Label>
                          <Input
                            value={selectedField.placeholder || ''}
                            onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                            placeholder="Texto de exemplo"
                            className="mt-2 rounded-xl"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-semibold text-foreground">Observação (Dica)</Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Texto que aparece como tooltip no preenchimento do formulário
                          </p>
                          <Textarea
                            value={selectedField.observacao || ''}
                            onChange={(e) => updateField(selectedField.id, { observacao: e.target.value })}
                            placeholder="Ex: Digite apenas números sem pontos ou traços"
                            className="mt-2 rounded-xl"
                            rows={2}
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-semibold text-foreground mb-3 block">Largura</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              variant={selectedField.width === 'quarter' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateField(selectedField.id, { width: 'quarter' })}
                              className="rounded-xl"
                            >
                              1/4
                            </Button>
                            <Button
                              variant={selectedField.width === 'half' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateField(selectedField.id, { width: 'half' })}
                              className="rounded-xl"
                            >
                              1/2
                            </Button>
                            <Button
                              variant={selectedField.width === 'full' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateField(selectedField.id, { width: 'full' })}
                              className="rounded-xl"
                            >
                              Inteira
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 rounded-2xl bg-muted/30">
                          <Checkbox
                            checked={selectedField.required}
                            onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
                          />
                          <Label className="text-sm font-medium text-foreground">Campo obrigatório</Label>
                        </div>

                        {/* Number Type Selector */}
                        {selectedField.type === 'number' && (
                          <NumberTypeSelector
                            value={selectedField.subtype as NumberSubtype}
                            onChange={(subtype) => {
                              updateField(selectedField.id, {
                                subtype,
                                formatting: getDefaultFormatting(subtype),
                              });
                            }}
                          />
                        )}

                        {/* AI Assistance Configuration for Regular Fields */}
                        {selectedField.type !== 'ai-suggest' && selectedField.type !== 'download' && (
                          <div className="space-y-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-200">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={selectedField.aiAssistEnabled || false}
                                onCheckedChange={(checked) => updateField(selectedField.id, { aiAssistEnabled: checked })}
                              />
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-600" />
                                <Label className="text-sm font-medium text-foreground">Habilitar sugestão por IA</Label>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground ml-6">
                              A IA analisará todos os campos preenchidos e suas observações para sugerir o valor deste campo. O sistema automaticamente informa à IA sobre o tipo de campo e formato esperado.
                            </p>
                            
                            {selectedField.aiAssistEnabled && (
                              <div className="ml-6">
                                <Label className="text-sm font-medium text-foreground">Prompt para IA</Label>
                                <Textarea
                                  value={selectedField.aiAssistPrompt || ''}
                                  onChange={(e) => updateField(selectedField.id, { aiAssistPrompt: e.target.value })}
                                  placeholder="Ex: Com base nos dados preenchidos, sugira um título apropriado para este documento"
                                  className="mt-2 rounded-xl"
                                  rows={3}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Options for select, radio, checkbox fields */}
                    {selectedField.options && (
                      <div>
                        <Label className="text-sm font-semibold text-foreground">Opções</Label>
                        <div className="space-y-3 mt-3">
                          {selectedField.options.map((option: string, index: number) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={option}
                                onChange={(e) => updateOption(selectedField.id, index, e.target.value)}
                                className={`flex-1 rounded-xl ${!option || option.trim() === '' ? 'border-destructive focus:border-destructive' : ''}`}
                                placeholder={`Opção ${index + 1}`}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeOption(selectedField.id, index)}
                                disabled={selectedField.options.length <= 1}
                                className="rounded-xl hover:scale-105 transition-transform"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addOption(selectedField.id)}
                            className="w-full rounded-2xl hover:scale-105 transition-transform border-primary/20 hover:border-primary/50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Opção
                          </Button>
                        </div>
                      </div>
                     )}

                     {/* AI field configuration */}
                     {selectedField.type === 'ai-suggest' && selectedField.aiConfig && (
                       <div className="space-y-4 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                         <div className="flex items-center gap-2 mb-3">
                           <Sparkles className="w-5 h-5 text-primary" />
                           <Label className="text-sm font-semibold text-primary">Configuração da IA</Label>
                         </div>
                         
                         <div>
                           <Label className="text-sm font-medium text-foreground">Campos de Origem</Label>
                           <p className="text-xs text-muted-foreground mb-2">Selecione quais campos serão usados como entrada para a IA</p>
                           <div className="space-y-2 max-h-32 overflow-y-auto">
                             {formData.fields
                               .filter(f => f.id !== selectedField.id && f.type !== 'section' && f.type !== 'ai-suggest')
                               .map(field => (
                                 <div key={field.id} className="flex items-center space-x-2">
                                   <Checkbox
                                     checked={selectedField.aiConfig.sourceFields?.includes(field.id) || false}
                                     onCheckedChange={(checked) => {
                                       const currentSources = selectedField.aiConfig.sourceFields || [];
                                       const newSources = checked 
                                         ? [...currentSources, field.id]
                                         : currentSources.filter(id => id !== field.id);
                                       updateField(selectedField.id, { 
                                         aiConfig: { ...selectedField.aiConfig, sourceFields: newSources }
                                       });
                                     }}
                                   />
                                   <Label className="text-xs">{field.label}</Label>
                                 </div>
                               ))}
                           </div>
                         </div>

                         <div>
                           <Label className="text-sm font-medium text-foreground">Tarefa da IA</Label>
                           <Select
                             value={selectedField.aiConfig.task}
                             onValueChange={(value: 'summarize' | 'classify' | 'extract' | 'correct' | 'generate') => 
                               updateField(selectedField.id, { 
                                 aiConfig: { ...selectedField.aiConfig, task: value }
                               })
                             }
                           >
                             <SelectTrigger className="mt-2 rounded-xl">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="summarize">Resumir</SelectItem>
                               <SelectItem value="classify">Classificar</SelectItem>
                               <SelectItem value="extract">Extrair</SelectItem>
                               <SelectItem value="correct">Corrigir</SelectItem>
                               <SelectItem value="generate">Gerar</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>

                         <div>
                           <Label className="text-sm font-medium text-foreground">Instruções para a IA</Label>
                           <Textarea
                             value={selectedField.aiConfig.instructions}
                             onChange={(e) => updateField(selectedField.id, { 
                               aiConfig: { ...selectedField.aiConfig, instructions: e.target.value }
                             })}
                             placeholder="Ex: Resuma o texto em até 50 palavras..."
                             className="mt-2 rounded-xl"
                             rows={3}
                           />
                         </div>

                         <div>
                           <Label className="text-sm font-medium text-foreground">Tipo de Saída</Label>
                           <Select
                             value={selectedField.aiConfig.outputType}
                             onValueChange={(value: 'text' | 'json') => 
                               updateField(selectedField.id, { 
                                 aiConfig: { ...selectedField.aiConfig, outputType: value }
                               })
                             }
                           >
                             <SelectTrigger className="mt-2 rounded-xl">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="text">Texto</SelectItem>
                               <SelectItem value="json">JSON</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>

                         <div>
                           <Label className="text-sm font-medium text-foreground">Gatilho</Label>
                           <Select
                             value={selectedField.aiConfig.trigger}
                             onValueChange={(value: 'onClick' | 'onBlur') => 
                               updateField(selectedField.id, { 
                                 aiConfig: { ...selectedField.aiConfig, trigger: value }
                               })
                             }
                           >
                             <SelectTrigger className="mt-2 rounded-xl">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="onClick">Ao clicar no botão</SelectItem>
                               <SelectItem value="onBlur">Ao sair dos campos de origem</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>

                          <div>
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium text-foreground">Mostrar para o usuário</Label>
                              <Checkbox
                                checked={selectedField.aiConfig.showToUser !== false}
                                onCheckedChange={(checked) => 
                                  updateField(selectedField.id, { 
                                    aiConfig: { ...selectedField.aiConfig, showToUser: checked }
                                  })
                                }
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {selectedField.aiConfig.showToUser === false 
                                ? "Campo será oculto e preenchido automaticamente pela IA" 
                                : "Campo será visível para o usuário com botão de sugestão"
                              }
                            </p>
                          </div>

                          {selectedField.aiConfig.showToUser !== false && (
                            <div>
                              <Label className="text-sm font-medium text-foreground">Visualização do campo</Label>
                              <Select
                                value={selectedField.aiConfig.display || 'singleline'}
                                onValueChange={(value: 'singleline' | 'multiline' | 'richtext') => 
                                  updateField(selectedField.id, { 
                                    aiConfig: { ...selectedField.aiConfig, display: value }
                                  })
                                }
                              >
                                <SelectTrigger className="mt-2 rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="singleline">Campo de texto (1 linha)</SelectItem>
                                  <SelectItem value="multiline">Texto longo (várias linhas)</SelectItem>
                                  <SelectItem value="richtext">Editor rico</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground mt-1">
                                {selectedField.aiConfig.display === 'richtext' 
                                  ? "Campo com formatação rica (negrito, itálico, listas, etc.)"
                                  : selectedField.aiConfig.display === 'multiline'
                                  ? "Campo de texto expandido para conteúdo longo"
                                  : "Campo de texto simples em uma linha"
                                }
                              </p>
                            </div>
                          )}

                           {selectedField.aiConfig.showToUser !== false && (
                            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3">
                              <p className="text-xs text-amber-800">
                                <strong>LGPD:</strong> Este campo usa IA (OpenAI). Os dados aqui mostrados podem estar errados e podem ser alterados manualmente pelo usuário. Fique a vontade em alterar caso julgue apropriado.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Download field configuration */}
                      {selectedField.type === 'download' && (
                        <div className="space-y-4 p-4 rounded-2xl bg-blue-50 border border-blue-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Download className="w-5 h-5 text-blue-600" />
                            <Label className="text-sm font-semibold text-blue-700">Arquivos para Download</Label>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-foreground">Upload de Arquivos</Label>
                            <p className="text-xs text-muted-foreground mb-2">
                              Estes arquivos ficarão visíveis para quem preencher, com opção de download e leitura da observação.
                            </p>
                            <FileUpload
                              onFileUpload={(url, name) => {
                                const newDownloads = [
                                  ...(selectedField.downloads || []),
                                  { url, name, note: '' }
                                ];
                                updateField(selectedField.id, { downloads: newDownloads });
                              }}
                              multiple={true}
                              allowCamera={true}
                              showList={false}
                            />
                          </div>
                          
                          {selectedField.downloads && selectedField.downloads.length > 0 && (
                            <div className="space-y-3">
                              <Label className="text-sm font-medium text-foreground">Arquivos Adicionados</Label>
                              {selectedField.downloads.map((download: any, index: number) => (
                                <div key={index} className="p-3 border border-blue-200 rounded-xl bg-white">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Download className="w-4 h-4 text-blue-600" />
                                      <span className="text-sm font-medium truncate max-w-[200px]">{download.name}</span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newDownloads = selectedField.downloads.filter((_: any, i: number) => i !== index);
                                        updateField(selectedField.id, { downloads: newDownloads });
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <Textarea
                                    placeholder="Observação sobre este arquivo (opcional)"
                                    value={download.note || ''}
                                    onChange={(e) => {
                                      const newDownloads = [...selectedField.downloads];
                                      newDownloads[index] = { ...newDownloads[index], note: e.target.value };
                                      updateField(selectedField.id, { downloads: newDownloads });
                                    }}
                                    className="text-xs"
                                    rows={2}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    {/* Validation Tab */}
                    <TabsContent value="validation" className="space-y-4">
                      <ValidationPanel
                        field={selectedField as FormFieldExtended}
                        onUpdate={(updates) => updateField(selectedField.id, updates)}
                      />
                    </TabsContent>
                  </Tabs>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Settings className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Selecione um campo</h3>
                  <p className="text-muted-foreground mb-8">
                    Clique em qualquer campo para editar suas propriedades
                  </p>
                  <div className="bg-muted/30 rounded-2xl p-6 space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Clique para selecionar campos</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Arraste para reordenar</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Configure largura e propriedades</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating Action Button */}
        <Popover>
          <PopoverTrigger asChild>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
              className="fixed bottom-8 right-8"
            >
              <Button
                size="lg"
                className="rounded-full w-16 h-16 shadow-2xl shadow-primary/25 hover:shadow-3xl hover:shadow-primary/40 hover:scale-110 transition-all"
              >
                <Plus className="w-6 h-6" />
              </Button>
            </motion.div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 rounded-2xl" side="top" align="end">
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <h4 className="font-semibold text-foreground mb-3">Adicionar Campo</h4>
              <div className="grid gap-2">
                {fieldTypes.slice(0, 6).map((fieldType, index) => (
                  <motion.div
                    key={fieldType.type}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-auto p-3 rounded-xl hover:bg-primary/5"
                      onClick={() => addField(fieldType.type)}
                    >
                      <fieldType.icon className="w-4 h-4 mr-3 text-primary" />
                      <div className="text-left">
                        <div className="font-medium text-foreground">{fieldType.label}</div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </PopoverContent>
        </Popover>

        {/* Configuration Modal */}
        <FormConfigurationModal
          isOpen={isConfigDialogOpen}
          onClose={() => setIsConfigDialogOpen(false)}
          onSave={saveForm}
          formId={currentFormId}
          form={form}
          lockedStatus={lockedStatus}
        />
      </div>
    </TooltipProvider>
  );
};
