import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IconSelector } from './IconSelector';
import { AdvancedApproverSelector } from './AdvancedApproverSelector';
import { TaskFormCreator } from './TaskFormCreator';
import { TaskTypeApprovalConfig } from './TaskTypeApprovalConfig';
import { useTaskTypes, CreateTaskTypeData, TaskType } from '@/hooks/useTaskTypes';
import { useForms } from '@/hooks/useForms';
import { LoadingSpinner } from './LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Plus, Settings, UserCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TaskTypeFormProps {
  onSuccess: () => void;
  editingTaskType?: TaskType;
}

export const TaskTypeForm: React.FC<TaskTypeFormProps> = ({ 
  onSuccess, 
  editingTaskType 
}) => {
  const { createTaskType, updateTaskType } = useTaskTypes();
  const { forms, loading: formsLoading, refetch } = useForms();

  // Filtrar apenas formulários com status 'task_usage'
  const taskForms = forms.filter(form => form.status === 'task_usage' || form.publication_status === 'task_usage');
  
  const [formData, setFormData] = useState<CreateTaskTypeData>({
    name: editingTaskType?.name || '',
    description: editingTaskType?.description || '',
    icon_name: editingTaskType?.icon_name || 'CheckSquare',
    icon_color: editingTaskType?.icon_color || '#3B82F6',
    form_id: editingTaskType?.form_id || undefined,
    goes_to_pending_list: editingTaskType?.goes_to_pending_list || false,
    filling_type: editingTaskType?.filling_type || 'none',
    approval_config: editingTaskType?.approval_config || {},
    confidentiality_level: editingTaskType?.confidentiality_level || 'public',
    allowed_users: editingTaskType?.allowed_users || [],
    allowed_departments: editingTaskType?.allowed_departments || [],
    allowed_roles: editingTaskType?.allowed_roles || [],
  });
  
  const [associateForm, setAssociateForm] = useState(!!editingTaskType?.form_id);
  const [formCreationMode, setFormCreationMode] = useState<'select' | 'create'>('select');
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [showApprovalConfig, setShowApprovalConfig] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o tipo de tarefa.",
        variant: "destructive",
      });
      return;
    }

    // Validar confidencialidade privada
    if (formData.confidentiality_level === 'private') {
      const hasSelection = 
        (formData.allowed_users && formData.allowed_users.length > 0) ||
        (formData.allowed_departments && formData.allowed_departments.length > 0) ||
        (formData.allowed_roles && formData.allowed_roles.length > 0);
        
      if (!hasSelection) {
        toast({
          title: "Configuração de acesso obrigatória",
          description: "Para tipos privados, você deve selecionar pelo menos um usuário, departamento ou função.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    const dataToSubmit = {
      ...formData,
      form_id: associateForm ? formData.form_id : undefined,
      allowed_users: formData.confidentiality_level === 'private' ? formData.allowed_users : undefined,
      allowed_departments: formData.confidentiality_level === 'private' ? formData.allowed_departments : undefined,
      allowed_roles: formData.confidentiality_level === 'private' ? formData.allowed_roles : undefined,
    };

    let success = false;
    if (editingTaskType) {
      success = await updateTaskType(editingTaskType.id, dataToSubmit);
    } else {
      success = await createTaskType(dataToSubmit);
    }

    setIsSubmitting(false);

    if (success) {
      onSuccess();
    }
  };

  const handleInputChange = (field: keyof CreateTaskTypeData, value: string | string[] | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormCreated = async (formId: string) => {
    setFormData(prev => ({ ...prev, form_id: formId }));
    
    // Recarregar lista de formulários para incluir o novo
    await refetch();
    
    setShowFormBuilder(false);
    setFormCreationMode('select');
    toast({
      title: "Formulário criado",
      description: "Formulário criado com sucesso e associado ao tipo de tarefa.",
    });
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>
          {editingTaskType ? 'Editar Tipo de Tarefa' : 'Cadastrar Novo Tipo de Tarefa'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações básicas */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do tipo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Ligação Telefônica, Reunião, E-mail..."
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva quando este tipo de tarefa deve ser usado..."
              rows={3}
            />
          </div>
        </div>

        {/* Seletor de ícone e cor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aparência</CardTitle>
            <CardDescription>
              Escolha um ícone e cor para identificar este tipo de tarefa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IconSelector
              selectedIcon={formData.icon_name}
              selectedColor={formData.icon_color}
              onIconSelect={(iconName) => handleInputChange('icon_name', iconName)}
              onColorSelect={(color) => handleInputChange('icon_color', color)}
            />
          </CardContent>
        </Card>

        {/* Nível de Confidencialidade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nível de Confidencialidade</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Define quem pode visualizar e utilizar este tipo de tarefa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={formData.confidentiality_level === 'public' ? 'public' : 'private'}
              onValueChange={(value: 'public' | 'private') => 
                handleInputChange('confidentiality_level', value)
              }
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="flex-1">
                  <div className="space-y-1">
                    <div className="font-medium">Público</div>
                    <div className="text-sm text-muted-foreground">
                      Qualquer usuário autenticado pode visualizar e utilizar este tipo
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="flex-1">
                  <div className="space-y-1">
                    <div className="font-medium">Privado</div>
                    <div className="text-sm text-muted-foreground">
                      Apenas usuários, departamentos ou funções específicas podem visualizar e utilizar
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {formData.confidentiality_level === 'private' && (
              <div className="mt-4 space-y-4">
                <Separator />
                <AdvancedApproverSelector
                  value={{
                    specificUsers: formData.allowed_users || [],
                    roleSelections: formData.allowed_roles || [],
                    departmentSelections: formData.allowed_departments || [],
                  }}
                  onChange={(value) => {
                    handleInputChange('allowed_users', value.specificUsers);
                    handleInputChange('allowed_roles', value.roleSelections);
                    handleInputChange('allowed_departments', value.departmentSelections);
                  }}
                  approvalFormat="any"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Associação com formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Formulário Associado</CardTitle>
            <CardDescription>
              Opcionalmente, associe um formulário que será preenchido quando tarefas deste tipo forem executadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                id="associate-form"
                checked={associateForm}
                onCheckedChange={setAssociateForm}
              />
              <Label htmlFor="associate-form">
                Associar formulário a este tipo de tarefa
              </Label>
            </div>

            {associateForm && (
              <div className="space-y-4">
                <RadioGroup
                  value={formCreationMode}
                  onValueChange={(value: 'select' | 'create') => setFormCreationMode(value)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="select" id="select-form" />
                    <Label htmlFor="select-form">Selecionar formulário existente</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="create" id="create-form" />
                    <Label htmlFor="create-form">Criar novo formulário</Label>
                  </div>
                </RadioGroup>

                {formCreationMode === 'select' && (
                  <div>
                    <Label>Formulário</Label>
                    {formsLoading ? (
                      <div className="flex items-center gap-2 py-2">
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-muted-foreground">Carregando formulários...</span>
                      </div>
                    ) : (
                      <Select
                        value={formData.form_id || ''}
                        onValueChange={(value) => handleInputChange('form_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um formulário existente" />
                        </SelectTrigger>
                        <SelectContent>
                          {taskForms.map((form) => (
                            <SelectItem key={form.id} value={form.id}>
                              {form.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {!formsLoading && taskForms.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Nenhum formulário com status "Uso em Tarefas" encontrado. 
                        Crie um formulário e configure seu status como "Uso em Tarefas" para associá-lo.
                      </p>
                    )}
                  </div>
                )}

                {formCreationMode === 'create' && (
                  <div>
                    <Button
                      type="button"
                      onClick={() => setShowFormBuilder(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Novo Formulário
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      O formulário será automaticamente configurado para uso em tarefas com o mesmo nível de confidencialidade.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tipos de Preenchimento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipos de Preenchimento</CardTitle>
            <CardDescription>
              Define que tipo de preenchimento/opções de respostas o usuário deve ter além do formulário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={formData.filling_type}
              onValueChange={(value: 'none' | 'approval') => handleInputChange('filling_type', value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="filling-none" />
                <Label htmlFor="filling-none" className="flex-1">
                  <div className="space-y-1">
                    <div className="font-medium">Nenhum</div>
                    <div className="text-sm text-muted-foreground">
                      Apenas preenchimento do formulário (se associado)
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approval" id="filling-approval" />
                <Label htmlFor="filling-approval" className="flex-1">
                  <div className="space-y-1">
                    <div className="font-medium flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Aprovação
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Requer processo de aprovação para conclusão da tarefa
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {formData.filling_type === 'approval' && (
              <div className="mt-4 space-y-4">
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Configuração de Aprovação</h4>
                    <p className="text-sm text-muted-foreground">
                      {formData.approval_config?.approvalTitle 
                        ? `Configurado: ${formData.approval_config.approvalTitle}`
                        : 'Configure como as aprovações funcionarão para este tipo'
                      }
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowApprovalConfig(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar Aprovação
                  </Button>
                </div>

                {formData.approval_config?.approvalTitle && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <UserCheck className="h-4 w-4 text-primary" />
                      <span className="font-medium">Resumo da Configuração:</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        <span className="font-medium">Título:</span> {formData.approval_config.approvalTitle}
                      </div>
                      <div>
                        <span className="font-medium">Formato:</span> {
                          formData.approval_config.approvalFormat === 'single' ? 'Aprovador único' :
                          formData.approval_config.approvalFormat === 'any' ? 'Qualquer aprovador' :
                          formData.approval_config.approvalFormat === 'all' ? 'Todos aprovadores' :
                          'Não configurado'
                        }
                      </div>
                      <div>
                        <span className="font-medium">Prazo:</span> {formData.approval_config.expirationDays || 3} dias
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tipo de Listagem */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipo de Listagem</CardTitle>
            <CardDescription>
              Define onde as tarefas deste tipo aparecerão no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                id="goes-to-pending"
                checked={formData.goes_to_pending_list || false}
                onCheckedChange={(checked) => handleInputChange('goes_to_pending_list', checked)}
              />
              <Label htmlFor="goes-to-pending" className="flex-1">
                Tarefa irá para listagem de Tarefas Pendentes?
              </Label>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-primary" />
                <span className="font-medium">Como funciona:</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  <span className="font-medium">✓ Marcado:</span> Tarefas aparecerão na listagem "Tarefas Pendentes"
                </div>
                <div>
                  <span className="font-medium">✗ Desmarcado:</span> Tarefas aparecerão nas visualizações normais (Kanban, Lista, Calendário, Cronograma, etc)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                {editingTaskType ? 'Salvando...' : 'Criando...'}
              </>
            ) : (
              editingTaskType ? 'Salvar Alterações' : 'Criar Tipo de Tarefa'
            )}
          </Button>
        </div>
      </form>

      {/* Modal para criação de formulário */}
      <Dialog open={showFormBuilder} onOpenChange={setShowFormBuilder}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <div className="h-[90vh] p-6">
            <TaskFormCreator
              onFormCreated={handleFormCreated}
              onClose={() => setShowFormBuilder(false)}
              defaultFormData={{
                title: `Formulário - ${formData.name}`,
                description: `Formulário associado ao tipo de tarefa: ${formData.name}`,
                confidentiality_level: formData.confidentiality_level,
                allowed_users: formData.confidentiality_level === 'private' ? formData.allowed_users : [],
                allowed_departments: formData.confidentiality_level === 'private' ? formData.allowed_departments : [],
                allowed_roles: formData.confidentiality_level === 'private' ? formData.allowed_roles : [],
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para configuração de aprovação */}
      <TaskTypeApprovalConfig
        isOpen={showApprovalConfig}
        onClose={() => setShowApprovalConfig(false)}
        approvalConfig={formData.approval_config}
        onConfigChange={(config) => handleInputChange('approval_config', config)}
      />
    </div>
  );
};