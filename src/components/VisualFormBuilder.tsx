import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  Trash2,
  Type,
  Mail,
  Hash,
  Calendar,
  FileText,
  CheckSquare,
  Circle,
  Upload,
  Settings,
  Copy,
  Palette,
  GripVertical,
  Edit
} from 'lucide-react';
import { useForms } from '@/hooks/useForms';
import { FormConfidentialitySettings } from '@/components/FormConfidentialitySettings';
import { useToast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FormHeader } from '@/components/FormHeader';

interface VisualFormBuilderProps {
  form?: any;
  onClose: () => void;
  onSaved?: (formId: string) => void;
  formType?: 'regular' | 'task_usage';
}

const fieldTypes = [
  { type: 'text', label: 'Texto', icon: Type, description: 'Campo de texto simples' },
  { type: 'email', label: 'E-mail', icon: Mail, description: 'Campo de e-mail' },
  { type: 'number', label: 'Número', icon: Hash, description: 'Campo numérico' },
  { type: 'date', label: 'Data', icon: Calendar, description: 'Seletor de data' },
  { type: 'textarea', label: 'Texto Longo', icon: FileText, description: 'Área de texto' },
  { type: 'select', label: 'Seleção', icon: Circle, description: 'Lista de opções' },
  { type: 'checkbox', label: 'Múltipla Escolha', icon: CheckSquare, description: 'Caixas de seleção' },
  { type: 'radio', label: 'Escolha Única', icon: Circle, description: 'Botões de opção' },
  { type: 'file', label: 'Arquivo/Foto', icon: Upload, description: 'Upload de arquivo ou foto' },
  { type: 'signature', label: 'Assinatura', icon: Settings, description: 'Campo de assinatura digital' },
  { type: 'richtext', label: 'Editor Rico', icon: Palette, description: 'Editor de texto rico' },
];

export const VisualFormBuilder = ({ form, onClose, onSaved, formType = 'regular' }: VisualFormBuilderProps) => {
  const { updateForm } = useForms();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: form?.title || 'Formulário sem título',
    description: form?.description || '',
    confidentialityLevel: form?.confidentiality_level || 'public',
    allowedUsers: form?.allowed_users || [],
    allowedDepartments: form?.allowed_departments || [],
    allowedRoles: form?.allowed_roles || [],
    allow_anonymous: form?.allow_anonymous || false,
    fields: Array.isArray(form?.fields_definition) ? form.fields_definition : [],
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const handleSave = async () => {
    if (!form?.id) return;

    const status = formType === 'task_usage' ? 'task_usage' : 'draft';
    const publication_status = formType === 'task_usage' ? 'task_usage' : 'draft';

    const success = await updateForm(form.id, {
      title: formData.title,
      description: formData.description,
      confidentiality_level: formData.confidentialityLevel,
      allowed_users: formData.allowedUsers,
      allowed_departments: formData.allowedDepartments,
      allowed_roles: formData.allowedRoles,
      allow_anonymous: formData.allow_anonymous,
      fields_definition: formData.fields,
      status,
      publication_status
    });

    if (success) {
      toast({
        title: 'Formulário salvo',
        description: 'Formulário salvo com sucesso.'
      });
      
      // Chama o callback se fornecido
      if (onSaved) {
        onSaved(form.id);
      }
    }
  };

  const addField = (type: string) => {
    const newField = {
      id: `field_${Date.now()}`,
      type,
      label: `Campo ${fieldTypes.find(ft => ft.type === type)?.label}`,
      placeholder: '',
      required: false,
      options: type === 'select' || type === 'radio' || type === 'checkbox' ? ['Opção 1'] : undefined,
    };

    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    
    setSelectedFieldId(newField.id);
  };

  const updateField = (fieldId: string, updates: any) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const duplicateField = (fieldId: string) => {
    const fieldToDuplicate = formData.fields.find(f => f.id === fieldId);
    if (!fieldToDuplicate) return;

    const newField = {
      ...fieldToDuplicate,
      id: `field_${Date.now()}`,
      label: `${fieldToDuplicate.label} (Cópia)`
    };

    const fieldIndex = formData.fields.findIndex(f => f.id === fieldId);
    const newFields = [...formData.fields];
    newFields.splice(fieldIndex + 1, 0, newField);

    setFormData(prev => ({ ...prev, fields: newFields }));
    setSelectedFieldId(newField.id);
  };

  const addOption = (fieldId: string) => {
    const field = formData.fields.find(f => f.id === fieldId);
    if (!field?.options) return;
    
    updateField(fieldId, {
      options: [...field.options, `Opção ${field.options.length + 1}`]
    });
  };

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = formData.fields.find(f => f.id === fieldId);
    if (!field?.options) return;

    const newOptions = [...field.options];
    newOptions[optionIndex] = value;
    updateField(fieldId, { options: newOptions });
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    const field = formData.fields.find(f => f.id === fieldId);
    if (!field?.options || field.options.length <= 1) return;

    const newOptions = field.options.filter((_, index) => index !== optionIndex);
    updateField(fieldId, { options: newOptions });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(formData.fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFormData(prev => ({ ...prev, fields: items }));
  };

  const renderFieldPreview = (field: any, index: number) => {
    const isSelected = selectedFieldId === field.id;
    
    return (
      <Draggable key={field.id} draggableId={field.id} index={index}>
        {(provided, snapshot) => (
          <Card 
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              isSelected ? 'ring-2 ring-primary shadow-lg' : ''
            } ${snapshot.isDragging ? 'shadow-xl rotate-2' : ''}`}
            onClick={() => setSelectedFieldId(field.id)}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                    </div>
                    <Label className="text-base font-medium">
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateField(field.id);
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Duplicar campo</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeField(field.id);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remover campo</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
            
            {field.type === 'text' && (
              <Input placeholder={field.placeholder || 'Digite sua resposta'} disabled />
            )}
            {field.type === 'email' && (
              <Input type="email" placeholder={field.placeholder || 'Digite seu e-mail'} disabled />
            )}
            {field.type === 'number' && (
              <Input type="number" placeholder={field.placeholder || 'Digite um número'} disabled />
            )}
            {field.type === 'date' && (
              <Input type="date" disabled />
            )}
            {field.type === 'textarea' && (
              <Textarea placeholder={field.placeholder || 'Digite sua resposta'} disabled />
            )}
            {field.type === 'select' && (
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option: string, index: number) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {field.type === 'radio' && (
              <div className="space-y-2">
                {field.options?.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full border border-border" />
                    <span className="text-sm">{option}</span>
                  </div>
                ))}
              </div>
            )}
            {field.type === 'checkbox' && (
              <div className="space-y-2">
                {field.options?.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-4 h-4 border border-border rounded" />
                    <span className="text-sm">{option}</span>
                  </div>
                ))}
              </div>
            )}
            {field.type === 'file' && (
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Clique para enviar arquivo ou foto</span>
              </div>
            )}
            {field.type === 'signature' && (
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <Settings className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Área de assinatura digital</span>
              </div>
            )}
            {field.type === 'richtext' && (
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                  <div className="w-6 h-3 bg-muted rounded-sm" />
                  <div className="w-6 h-3 bg-muted rounded-sm" />
                  <div className="w-6 h-3 bg-muted rounded-sm" />
                </div>
                <span className="text-sm text-muted-foreground">Editor de texto rico</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
        )}
      </Draggable>
    );
  };

  if (previewMode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setPreviewMode(false)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar para Editor
              </Button>
              <Badge variant="secondary">Modo Preview</Badge>
            </div>
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto p-6">
          {/* Form Header com Logotipos */}
          <FormHeader />
          
          <Card>
            <CardHeader className="text-center">
              <h1 className="text-2xl font-bold">{formData.title}</h1>
              {formData.description && (
                <p className="text-muted-foreground">{formData.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  
                  {field.type === 'text' && (
                    <Input id={field.id} placeholder={field.placeholder} />
                  )}
                  {field.type === 'email' && (
                    <Input id={field.id} type="email" placeholder={field.placeholder} />
                  )}
                  {field.type === 'number' && (
                    <Input id={field.id} type="number" placeholder={field.placeholder} />
                  )}
                  {field.type === 'date' && (
                    <Input id={field.id} type="date" />
                  )}
                  {field.type === 'textarea' && (
                    <Textarea id={field.id} placeholder={field.placeholder} />
                  )}
                  {field.type === 'select' && (
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option, index) => (
                          <SelectItem key={index} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {field.type === 'file' && (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Clique para enviar arquivo ou foto</span>
                    </div>
                  )}
                  {field.type === 'signature' && (
                    <div className="border border-border rounded-lg p-8 text-center bg-gray-50">
                      <span className="text-sm text-muted-foreground">Área de assinatura</span>
                    </div>
                  )}
                  {field.type === 'richtext' && (
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                        <div className="w-6 h-3 bg-muted rounded-sm" />
                        <div className="w-6 h-3 bg-muted rounded-sm" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Editor de texto rico com formatação
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <Button type="submit" className="w-full">
                Enviar Formulário
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const selectedField = formData.fields.find(f => f.id === selectedFieldId);

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onClose} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Editor Visual de Formulário</h1>
                <p className="text-sm text-muted-foreground">
                  {formData.fields.length} campos adicionados
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setPreviewMode(true)} className="gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-full flex">
        {/* Sidebar - Elementos */}
        <div className="w-80 border-r bg-card/50 p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="font-semibold">Adicionar Elemento</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {fieldTypes.map((fieldType) => {
                const Icon = fieldType.icon;
                return (
                  <TooltipProvider key={fieldType.type}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 h-12 hover:bg-accent"
                          onClick={() => addField(fieldType.type)}
                        >
                          <Icon className="w-5 h-5 text-primary" />
                          <div className="text-left">
                            <div className="font-medium">{fieldType.label}</div>
                          </div>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {fieldType.description}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Canvas Central */}
        <div className="flex-1 p-6 max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Header com Logotipos */}
            <FormHeader />
            
            {/* Header do Formulário */}
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {isEditingTitle ? (
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      onBlur={() => setIsEditingTitle(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                      className="text-2xl font-bold border-none p-0 h-auto shadow-none focus-visible:ring-0"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h1 
                        className="text-2xl font-bold cursor-pointer hover:bg-accent rounded p-2 -m-2 flex-1"
                        onClick={() => setIsEditingTitle(true)}
                        title="Clique para editar o nome do formulário"
                      >
                        {formData.title}
                      </h1>
                      <Edit 
                        className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" 
                        onClick={() => setIsEditingTitle(true)}
                      />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    💡 Clique no título acima para editá-lo
                  </p>
                  
                  {isEditingDescription ? (
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        onBlur={() => setIsEditingDescription(false)}
                        placeholder="Descrição do formulário"
                        className="border-none p-0 shadow-none focus-visible:ring-0 resize-none"
                        autoFocus
                      />
                    ) : (
                      <p 
                        className="text-muted-foreground cursor-pointer hover:bg-accent rounded p-2 -m-2 min-h-[24px]"
                        onClick={() => setIsEditingDescription(true)}
                      >
                        {formData.description || 'Clique para adicionar descrição'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

            {/* Campos do Formulário */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="form-fields">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-4 min-h-[200px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-accent/20 rounded-lg' : ''
                    }`}
                  >
                    {formData.fields.map((field, index) => renderFieldPreview(field, index))}
                    {provided.placeholder}
                    
                    {formData.fields.length === 0 && (
                      <Card className="border-dashed border-2">
                        <CardContent className="text-center py-12">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                          <h3 className="text-lg font-medium mb-2">Comece criando seu formulário</h3>
                          <p className="text-muted-foreground mb-4">
                            Use o painel lateral para adicionar campos
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        {/* Painel de Propriedades */}
        <div className="w-80 border-l bg-card/50 p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                {selectedField ? <Settings className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
                <span className="font-semibold">
                  {selectedField ? 'Propriedades do Campo' : 'Configurações do Formulário'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedField ? (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de Campo</Label>
                    <Badge variant="secondary" className="w-full justify-center">
                      {fieldTypes.find(ft => ft.type === selectedField.type)?.label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Rótulo</Label>
                    <Input
                      value={selectedField.label}
                      onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                      placeholder="Nome do campo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Placeholder</Label>
                    <Input
                      value={selectedField.placeholder || ''}
                      onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                      placeholder="Texto de exemplo"
                    />
                  </div>

                  {(selectedField.type === 'select' || selectedField.type === 'radio' || selectedField.type === 'checkbox') && (
                    <div className="space-y-3">
                      <Label>Opções</Label>
                      {selectedField.options?.map((option: string, index: number) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(selectedField.id, index, e.target.value)}
                            placeholder={`Opção ${index + 1}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(selectedField.id, index)}
                            disabled={selectedField.options?.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(selectedField.id)}
                        className="w-full gap-2"
                      >
                        <Plus className="w-3 h-3" />
                        Adicionar Opção
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label>Campo obrigatório</Label>
                    <Switch
                      checked={selectedField.required}
                      onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <FormConfidentialitySettings
                    confidentialityLevel={formData.confidentialityLevel as 'public' | 'private'}
                    allowedUsers={formData.allowedUsers}
                    allowedDepartments={formData.allowedDepartments}
                    allowedRoles={formData.allowedRoles}
                    onChange={(settings) => {
                      setFormData(prev => ({
                        ...prev,
                        confidentialityLevel: settings.confidentialityLevel,
                        allowedUsers: settings.allowedUsers || [],
                        allowedDepartments: settings.allowedDepartments || [],
                        allowedRoles: settings.allowedRoles || []
                      }));
                    }}
                  />

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Label>Permitir respostas anônimas</Label>
                    <Switch
                      checked={formData.allow_anonymous}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_anonymous: checked }))}
                      disabled={formData.confidentialityLevel === 'private'}
                    />
                  </div>
                  {formData.confidentialityLevel === 'private' && (
                    <p className="text-xs text-muted-foreground">
                      Respostas anônimas não são permitidas em formulários privados
                    </p>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Selecione um campo no canvas para editar suas propriedades
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};