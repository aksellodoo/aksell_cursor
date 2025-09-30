import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdvancedApproverSelector } from './AdvancedApproverSelector';
import { VisualFormBuilder } from './VisualFormBuilder';
import { useForms } from '@/hooks/useForms';
import { LoadingSpinner } from './LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TaskFormCreatorProps {
  onFormCreated: (formId: string) => void;
  onClose: () => void;
  defaultFormData: {
    title: string;
    description: string;
    confidentiality_level: 'public' | 'private' | 'department_leaders' | 'directors_admins';
    allowed_users: string[];
    allowed_departments: string[];
    allowed_roles: string[];
  };
}

export const TaskFormCreator: React.FC<TaskFormCreatorProps> = ({
  onFormCreated,
  onClose,
  defaultFormData
}) => {
  const { createForm } = useForms();
  const [currentStep, setCurrentStep] = useState<'settings' | 'builder'>('settings');
  const [isCreating, setIsCreating] = useState(false);
  const [createdForm, setCreatedForm] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: defaultFormData.title,
    description: defaultFormData.description,
    confidentiality_level: defaultFormData.confidentiality_level,
    allowed_users: defaultFormData.allowed_users,
    allowed_departments: defaultFormData.allowed_departments,
    allowed_roles: defaultFormData.allowed_roles,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProceedToBuilder = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, insira um título para o formulário.",
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
          description: "Para formulários privados, você deve selecionar pelo menos um usuário, departamento ou função.",
          variant: "destructive",
        });
        return;
      }
    }

    // Criar formulário rascunho no banco
    setIsCreating(true);
    try {
      const draftForm = await createForm({
        title: formData.title,
        description: formData.description,
        status: 'draft',
        publication_status: 'draft',
        confidentiality_level: formData.confidentiality_level,
        allowed_users: formData.confidentiality_level === 'private' ? formData.allowed_users : undefined,
        allowed_departments: formData.confidentiality_level === 'private' ? formData.allowed_departments : undefined,
        allowed_roles: formData.confidentiality_level === 'private' ? formData.allowed_roles : undefined,
        fields_definition: [],
      });

      if (draftForm) {
        setCreatedForm(draftForm);
        setCurrentStep('builder');
      }
    } catch (error) {
      toast({
        title: "Erro ao criar formulário",
        description: "Ocorreu um erro ao criar o formulário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleFormSaved = (formId: string) => {
    onFormCreated(formId);
    toast({
      title: "Formulário criado",
      description: "Formulário criado com sucesso e configurado para uso em tarefas.",
    });
  };

  if (currentStep === 'builder') {
    return (
      <div className="h-full flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('settings')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <DialogTitle>Criar Formulário - {formData.title}</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <VisualFormBuilder
            onClose={onClose}
            form={createdForm}
            onSaved={handleFormSaved}
            formType="task_usage"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Configurações do Formulário</DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título do formulário *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ex: Relatório de Ligação Telefônica"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva o propósito deste formulário..."
              rows={3}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nível de Confidencialidade</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Define quem pode visualizar e preencher este formulário
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
                      Qualquer usuário autenticado pode visualizar e preencher
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
                      Apenas usuários, departamentos ou funções específicas podem acessar
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {formData.confidentiality_level === 'private' && (
              <div className="mt-4 space-y-4">
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

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleProceedToBuilder} disabled={isCreating}>
            {isCreating ? (
              <>
                <LoadingSpinner size="sm" />
                Criando...
              </>
            ) : (
              'Continuar para Editor'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};