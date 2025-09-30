import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, Users, Building } from 'lucide-react';
import { useTaskTemplates, type CreateTaskTemplateData } from '@/hooks/useTaskTemplates';
import { useDepartments } from '@/hooks/useDepartments';
import { useProfiles } from '@/hooks/useProfiles';
import { TASK_TYPES, type FixedTaskType, SCHEMAS, validateTaskPayload } from '@/lib/taskTypesFixed';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const templateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  fixed_type: z.string(),
  department_id: z.string().optional(),
  default_assignee_id: z.string().optional(),
  default_sla_hours: z.number().min(1).optional(),
  default_checklist: z.array(z.string()).optional(),
  required_attachments: z.array(z.string()).optional(),
  confidentiality_level: z.enum(['public', 'private', 'department_leaders', 'directors_admins']),
  allowed_users: z.array(z.string()).optional(),
  allowed_departments: z.array(z.string()).optional(),
  allowed_roles: z.array(z.string()).optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplatesManagerProps {
  openCreateOnMount?: boolean;
  onClose?: () => void;
}

export const TemplatesManager: React.FC<TemplatesManagerProps> = ({ 
  openCreateOnMount = false, 
  onClose 
}) => {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useTaskTemplates();
  const { departments } = useDepartments();
  const { profiles } = useProfiles();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(openCreateOnMount);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<FixedTaskType>('simple_task');
  const [payloadData, setPayloadData] = useState<any>({});
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [attachmentItems, setAttachmentItems] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      confidentiality_level: 'public',
      allowed_users: [],
      allowed_departments: [],
      allowed_roles: [],
    }
  });

  const confidentialityLevel = watch('confidentiality_level');

  const handleCreateTemplate = async (data: TemplateFormData) => {
    // Validar payload específico do tipo
    const payloadValidation = validateTaskPayload(selectedType, payloadData);
    if (!payloadValidation.success) {
      toast({
        title: "Erro de validação",
        description: `Campos obrigatórios não preenchidos: ${payloadValidation.errors.map(e => e.path.join('.')).join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    const templateData: CreateTaskTemplateData = {
      name: data.name,
      description: data.description,
      fixed_type: selectedType,
      default_checklist: checklistItems.length > 0 ? checklistItems : undefined,
      required_attachments: attachmentItems.length > 0 ? attachmentItems : undefined,
      default_payload: payloadData,
      department_id: data.department_id || undefined,
      default_assignee_id: data.default_assignee_id || undefined,
      default_sla_hours: data.default_sla_hours,
      confidentiality_level: data.confidentiality_level,
      allowed_users: data.allowed_users,
      allowed_departments: data.allowed_departments,
      allowed_roles: data.allowed_roles,
    };

    const success = await createTemplate(templateData);
    if (success) {
      setIsCreateModalOpen(false);
      reset();
      setPayloadData({});
      setChecklistItems([]);
      setAttachmentItems([]);
      setSelectedType('simple_task');
    }
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setSelectedType(template.fixed_type);
    setPayloadData(template.default_payload || {});
    setChecklistItems(template.default_checklist || []);
    setAttachmentItems(template.required_attachments || []);
    
    reset({
      name: template.name,
      description: template.description || '',
      department_id: template.department_id || '',
      default_assignee_id: template.default_assignee_id || '',
      default_sla_hours: template.default_sla_hours || undefined,
      confidentiality_level: template.confidentiality_level,
      allowed_users: template.allowed_users || [],
      allowed_departments: template.allowed_departments || [],
      allowed_roles: template.allowed_roles || [],
    });
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      await deleteTemplate(id);
    }
  };

  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, '']);
  };

  const updateChecklistItem = (index: number, value: string) => {
    const newItems = [...checklistItems];
    newItems[index] = value;
    setChecklistItems(newItems);
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const addAttachmentItem = () => {
    setAttachmentItems([...attachmentItems, '']);
  };

  const updateAttachmentItem = (index: number, value: string) => {
    const newItems = [...attachmentItems];
    newItems[index] = value;
    setAttachmentItems(newItems);
  };

  const removeAttachmentItem = (index: number) => {
    setAttachmentItems(attachmentItems.filter((_, i) => i !== index));
  };

  const renderPayloadFields = () => {
    const typeConfig = TASK_TYPES[selectedType];
    const schema = SCHEMAS[selectedType];
    
    if (!schema || selectedType === 'simple_task') return null;

    return (
      <div className="space-y-4">
        <h4 className="font-medium">Configurações específicas do tipo</h4>
        
        {/* Renderizar campos obrigatórios do schema */}
        {selectedType === 'approval' && (
          <div className="space-y-2">
            <Label>Aprovadores (obrigatório)</Label>
            <Select 
              onValueChange={(value) => 
                setPayloadData(prev => ({...prev, approvers: [value]}))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aprovador" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Label>Modo de aprovação</Label>
            <Select 
              onValueChange={(value) => 
                setPayloadData(prev => ({...prev, approval_mode: value}))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Um aprovador</SelectItem>
                <SelectItem value="any">Qualquer aprovador</SelectItem>
                <SelectItem value="all">Todos os aprovadores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedType === 'email' && (
          <div className="space-y-2">
            <Label>Destinatários (obrigatório)</Label>
            <Input
              placeholder="email1@exemplo.com, email2@exemplo.com"
              onChange={(e) => 
                setPayloadData(prev => ({
                  ...prev, 
                  to: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))
              }
            />
            <Label>Assunto (obrigatório)</Label>
            <Input
              placeholder="Assunto do e-mail"
              onChange={(e) => 
                setPayloadData(prev => ({...prev, subject: e.target.value}))
              }
            />
          </div>
        )}

        {/* Adicionar outros tipos conforme necessário */}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Templates de Tarefas</h2>
          <p className="text-muted-foreground">
            Gerencie templates reutilizáveis baseados nos tipos fixos
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Template</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(handleCreateTemplate)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Template</Label>
                  <Input {...register('name')} placeholder="Nome do template" />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                
                <div>
                  <Label>Tipo Fixo</Label>
                  <Select value={selectedType} onValueChange={(value) => setSelectedType(value as FixedTaskType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TASK_TYPES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea {...register('description')} placeholder="Descrição do template" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Departamento</Label>
                  <Select onValueChange={(value) => setValue('department_id', value)}>
                    <SelectTrigger>
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
                </div>

                <div>
                  <Label>Responsável Padrão</Label>
                  <Select onValueChange={(value) => setValue('default_assignee_id', value)}>
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
                </div>
              </div>

              <div>
                <Label>SLA Padrão (horas)</Label>
                <Input 
                  type="number" 
                  {...register('default_sla_hours', { valueAsNumber: true })} 
                  placeholder="24" 
                />
              </div>

              {renderPayloadFields()}

              <Separator />

              <div>
                <Label>Checklist Padrão</Label>
                <div className="space-y-2">
                  {checklistItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateChecklistItem(index, e.target.value)}
                        placeholder="Item do checklist"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeChecklistItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addChecklistItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>
              </div>

              <div>
                <Label>Anexos Obrigatórios</Label>
                <div className="space-y-2">
                  {attachmentItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateAttachmentItem(index, e.target.value)}
                        placeholder="Descrição do anexo obrigatório"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeAttachmentItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addAttachmentItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Anexo
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Nível de Confidencialidade</Label>
                <Select 
                  value={confidentialityLevel} 
                  onValueChange={(value) => setValue('confidentiality_level', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Público</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                    <SelectItem value="department_leaders">Líderes de Departamento</SelectItem>
                    <SelectItem value="directors_admins">Diretores e Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Criar Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando templates...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const typeConfig = TASK_TYPES[template.fixed_type];
            const IconComponent = typeConfig.icon;
            
            return (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5" style={{ color: typeConfig.color }} />
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="secondary">{typeConfig.label}</Badge>
                    {template.departments && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building className="h-3 w-3" />
                        {template.departments.name}
                      </div>
                    )}
                    {template.default_sla_hours && (
                      <div className="text-sm text-muted-foreground">
                        SLA: {template.default_sla_hours}h
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};