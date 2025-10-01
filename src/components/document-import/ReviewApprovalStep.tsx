import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, Users, Building, Loader2 } from 'lucide-react';
import { useImportWizard } from './ImportWizard';
import { UserMultiSelector } from './UserMultiSelector';
import { DepartmentSelector } from './DepartmentSelector';
import { ApprovalModeSelector } from './ApprovalModeSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const ReviewApprovalStep: React.FC = () => {
  const { 
    wizardData, 
    navigateToStep, 
    setStepCompleted,
    updateWizardData
  } = useImportWizard();

  // Estados locais para os campos condicionais
  const [reviewType, setReviewType] = useState<'users' | 'department'>('users');
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [approvalMode, setApprovalMode] = useState<'single' | 'any' | 'all'>('single');
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sincronizar estados com wizardData
  useEffect(() => {
    if (wizardData.reviewers) {
      setReviewType(wizardData.reviewers.type);
      if (wizardData.reviewers.users) setSelectedReviewers(wizardData.reviewers.users);
      if (wizardData.reviewers.department) setSelectedDepartment(wizardData.reviewers.department);
    }
    
    if (wizardData.approvalConfig) {
      setApprovalMode(wizardData.approvalConfig.mode);
      setSelectedApprovers(wizardData.approvalConfig.approvers);
    }
  }, [wizardData]);

  // Ajustar seleção de aprovadores quando modo muda para 'single'
  useEffect(() => {
    if (approvalMode === 'single' && selectedApprovers.length > 1) {
      setSelectedApprovers([selectedApprovers[0]]);
    }
  }, [approvalMode]);

  // Determina o valor baseado no status e tipo de pendência
  const getReviewApprovalValue = () => {
    if (wizardData.documentStatus !== 'pendente') {
      return 'nao';
    }
    
    if (wizardData.pendingType === 'revisao') {
      return 'revisao';
    }
    
    if (wizardData.pendingType === 'aprovacao') {
      return 'aprovacao';
    }
    
    return 'nao';
  };

  const getReviewApprovalLabel = () => {
    const value = getReviewApprovalValue();
    switch (value) {
      case 'revisao':
        return 'Revisão';
      case 'aprovacao':
        return 'Aprovação';
      default:
        return 'Não';
    }
  };

  const getReviewApprovalDescription = () => {
    const value = getReviewApprovalValue();
    switch (value) {
      case 'revisao':
        return 'O documento será encaminhado para revisão antes da aprovação final';
      case 'aprovacao':
        return 'O documento será encaminhado diretamente para aprovação final';
      default:
        return 'O documento não passará por processo de revisão ou aprovação adicional';
    }
  };

  const handlePrevious = () => {
    navigateToStep(5);
  };

  // Validação dos campos obrigatórios
  const isValidConfiguration = () => {
    const processValue = getReviewApprovalValue();
    
    if (processValue === 'revisao') {
      if (reviewType === 'users') {
        return selectedReviewers.length > 0;
      } else {
        return selectedDepartment !== '';
      }
    }
    
    if (processValue === 'aprovacao') {
      if (approvalMode === 'single') {
        return selectedApprovers.length === 1;
      }
      return selectedApprovers.length > 0;
    }
    
    return true; // Para "nao", não há validação necessária
  };

  const handleFinish = () => {
    console.log('🔄 handleFinish called');
    console.log('📋 Current wizardData:', wizardData);
    console.log('📁 Files available:', wizardData.files?.length || 0);
    
    // Verificar se existem arquivos
    if (!wizardData.files || wizardData.files.length === 0) {
      console.error('❌ No files found in wizardData');
      toast({
        title: "Erro: Nenhum arquivo encontrado",
        description: "Por favor, volte para as etapas anteriores e selecione os arquivos.",
        variant: "destructive"
      });
      setIsProcessing(false);
      return;
    }

    if (!isValidConfiguration()) {
      console.error('❌ Invalid configuration');
      toast({
        title: "Configuração inválida",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    console.log('🔄 Setting isProcessing to true');

    // Obter IDs do contexto do wizard (prioridade) ou da URL (fallback)
    const urlParams = new URLSearchParams(window.location.search);
    const folderId = wizardData.folderId || urlParams.get('folder') || '';
    const departmentId = wizardData.departmentId || urlParams.get('department') || '';

    console.log('🗂️ IDs obtained - Context:', {
      contextDepartmentId: wizardData.departmentId,
      contextFolderId: wizardData.folderId
    });
    console.log('🗂️ IDs obtained - URL:', {
      urlDepartmentId: urlParams.get('department'),
      urlFolderId: urlParams.get('folder')
    });
    console.log('🗂️ Final IDs used:', { folderId, departmentId });

    // Validar se há departmentId (folderId pode ser vazio para pasta principal)
    if (!departmentId) {
      console.error('❌ Missing department ID');
      toast({
        title: "Erro de configuração",
        description: "ID do departamento não encontrado.",
        variant: "destructive"
      });
      setIsProcessing(false);
      return;
    }

    // Configuração final com revisão/aprovação
    const finalConfig = {
      ...wizardData,
      selectedReviewers: reviewType === 'users' ? selectedReviewers : [],
      selectedDepartment: reviewType === 'department' ? selectedDepartment : null,
      approvalMode,
      selectedApprovers
    };

    console.log('⚙️ Final config:', finalConfig);

    // Disparar evento customizado para abrir modal de processamento
    const event = new CustomEvent('startProcessing', {
      detail: {
        files: wizardData.files,
        config: finalConfig,
        folderId,
        departmentId,
        isQuickFinish: false
      }
    });
    
    console.log('🚀 Dispatching startProcessing event with detail:', event.detail);
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Revisão ou Aprovação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informação sobre o processo selecionado */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="font-medium text-primary mb-2">
              Processo Selecionado: {getReviewApprovalLabel()}
            </h4>
            <p className="text-sm text-muted-foreground">
              {getReviewApprovalDescription()}
            </p>
          </div>

          {/* Configuração para REVISÃO */}
          {getReviewApprovalValue() === 'revisao' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Quem deve revisar o documento?
                </Label>
                
                <RadioGroup 
                  value={reviewType} 
                  onValueChange={(value: 'users' | 'department') => setReviewType(value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="users" id="users" />
                    <Label htmlFor="users" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Usuários específicos
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="department" id="department" />
                    <Label htmlFor="department" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Departamento completo
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Seleção condicional baseada no tipo */}
              {reviewType === 'users' && (
                <div className="space-y-2">
                  <Label>Selecionar Revisores</Label>
                  <UserMultiSelector
                    value={selectedReviewers}
                    onChange={setSelectedReviewers}
                    placeholder="Escolher usuários para revisar..."
                  />
                  {selectedReviewers.length === 0 && (
                    <p className="text-sm text-destructive">
                      Selecione pelo menos um revisor
                    </p>
                  )}
                </div>
              )}

              {reviewType === 'department' && (
                <div className="space-y-2">
                  <Label>Selecionar Departamento</Label>
                  <DepartmentSelector
                    value={selectedDepartment}
                    onChange={setSelectedDepartment}
                    placeholder="Escolher departamento..."
                  />
                  {selectedDepartment === '' && (
                    <p className="text-sm text-destructive">
                      Selecione um departamento
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Configuração para APROVAÇÃO */}
          {getReviewApprovalValue() === 'aprovacao' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Modo de Aprovação</Label>
                <ApprovalModeSelector
                  value={approvalMode}
                  onChange={(value: 'single' | 'any' | 'all') => setApprovalMode(value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Selecionar Aprovadores</Label>
                <UserMultiSelector
                  value={selectedApprovers}
                  onChange={(newValue) => {
                    if (approvalMode === 'single' && newValue.length > 1) {
                      setSelectedApprovers([newValue[newValue.length - 1]]);
                    } else {
                      setSelectedApprovers(newValue);
                    }
                  }}
                  placeholder={
                    approvalMode === 'single' 
                      ? "Escolher usuário para aprovar..." 
                      : "Escolher usuários para aprovar..."
                  }
                />
                {((approvalMode === 'single' && selectedApprovers.length !== 1) || 
                  (approvalMode !== 'single' && selectedApprovers.length === 0)) && (
                  <p className="text-sm text-destructive">
                    {approvalMode === 'single' 
                      ? "Selecione exatamente um aprovador" 
                      : "Selecione pelo menos um aprovador"
                    }
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        
        <Button 
          onClick={handleFinish} 
          disabled={!isValidConfiguration() || isProcessing}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importando...
            </>
          ) : (
            'Finalizar'
          )}
        </Button>
      </div>
    </div>
  );
};