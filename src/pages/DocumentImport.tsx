import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ImportWizardProvider, useImportWizard } from '@/components/document-import/ImportWizard';
import { StepIndicator } from '@/components/document-import/ImportWizard';
import { FileQuantityStep } from '@/components/document-import/FileQuantityStep';
import { FileTypeStep } from '@/components/document-import/FileTypeStep';
import { FileUploadStep } from '@/components/document-import/FileUploadStep';
import { ProcessingOptionsStep } from '@/components/document-import/ProcessingOptionsStep';
import { VersioningStep } from '@/components/document-import/VersioningStep';
import { ApprovalStep } from '@/components/document-import/ApprovalStep';
import { ReviewApprovalStep } from '@/components/document-import/ReviewApprovalStep';
import { ProcessingProgressModal } from '@/components/document-import/ProcessingProgressModal';
import { useProcessingOrchestrator } from '@/hooks/useProcessingOrchestrator';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';


// Component that renders the current wizard step
const WizardContent: React.FC = () => {
  const { currentStep, wizardData } = useImportWizard();

  switch (currentStep) {
    case 0:
      return <FileQuantityStep />;
    case 1:
      return <FileTypeStep />;
    case 2:
      return <FileUploadStep />;
    case 3:
      return <VersioningStep />;
    case 4:
      return <ApprovalStep />;
    case 5:
      return <ReviewApprovalStep />;
    default:
      return <FileQuantityStep />;
  }
};

const DocumentImport: React.FC = () => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const navigate = useNavigate();
  
  const {
    isProcessing,
    isCompleted,
    hasErrors,
    steps,
    logs,
    canForceStop,
    processFiles,
    forceStop,
    reset
  } = useProcessingOrchestrator();
  
  const [isPreparingProcessing, setIsPreparingProcessing] = useState(false);

  // Listen for processing events
  useEffect(() => {
    const handleStartProcessing = async (event: CustomEvent) => {
      console.log('📨 Received startProcessing event:', event.detail);
      
      // Reset any previous state and prepare for processing
      reset();
      setIsPreparingProcessing(true);
      console.log('🎬 Set isPreparingProcessing to true');
      
      const { files, config, folderId, departmentId } = event.detail;
      
      // Validações essenciais
      if (!files || files.length === 0) {
        console.error('❌ No files provided to processing');
        setIsPreparingProcessing(false);
        toast({
          title: "Erro de processamento",
          description: "Nenhum arquivo foi fornecido para processamento.",
          variant: "destructive"
        });
        return;
      }

      if (!departmentId) {
        console.error('❌ Missing department ID');
        setIsPreparingProcessing(false);
        toast({
          title: "Erro de configuração",
          description: "ID do departamento não encontrado.",
          variant: "destructive"
        });
        return;
      }

      // folderId pode ser vazio para importação na pasta principal do departamento
      
      console.log('🚀 Starting processing with:', {
        filesCount: files.length,
        config,
        folderId,
        departmentId
      });
      
      try {
        const result = await processFiles(files, config, folderId, departmentId);
        setIsPreparingProcessing(false);
        
        if (result?.success) {
          console.log('✅ Processing completed successfully:', result);
        } else {
          console.error('❌ Processing failed:', result);
          toast({
            title: "Falha no processamento",
            description: "O processamento não foi concluído com sucesso.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('💥 Processing error:', error);
        setIsPreparingProcessing(false);
        toast({
          title: "Erro durante processamento",
          description: "Ocorreu um erro inesperado durante o processamento.",
          variant: "destructive"
        });
      }
    };

    window.addEventListener('startProcessing', handleStartProcessing as EventListener);
    
    return () => {
      window.removeEventListener('startProcessing', handleStartProcessing as EventListener);
    };
  }, [processFiles]);

  

  const handleBackClick = () => {
    if (isProcessing) {
      navigate('/gestao/documentos');
      return;
    }
    setShowCancelDialog(true);
  };

  const handleCancelImport = () => {
    setShowCancelDialog(false);
    reset();
    navigate('/gestao/documentos');
  };

  const handleCloseProcessing = () => {
    reset();
    navigate('/gestao/documentos');
  };

  return (
    <ImportWizardProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackClick}
              disabled={isProcessing}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Importar Arquivos
              </h1>
              <p className="text-muted-foreground mt-1">
                {isProcessing 
                  ? "Processamento em andamento - não feche esta janela"
                  : "Siga as etapas para importar seus documentos de forma organizada"
                }
              </p>
            </div>
          </div>

          {/* Step Indicator & Wizard Content - Only show when not in any processing state */}
          {!isProcessing && !isCompleted && !isPreparingProcessing && (
            <>
              <StepIndicator />
              <WizardContent />
            </>
          )}

          {/* Loading state when preparing processing - Always show content, never blank */}
          {isPreparingProcessing && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Preparando processamento...</p>
              </div>
            </div>
          )}

          {/* Fallback: Never leave screen completely blank */}
          {isProcessing && !isPreparingProcessing && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Processamento em andamento...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Processing Modal - Show immediately when preparing */}
      <ProcessingProgressModal
        isOpen={isProcessing || isCompleted || isPreparingProcessing}
        onForceStop={forceStop}
        onClose={handleCloseProcessing}
        onMinimize={() => {
          console.log('🔽 Navigating to document management');
          navigate('/gestao/documentos');
        }}
        steps={steps}
        logs={logs}
        canForceStop={canForceStop}
        isCompleted={isCompleted}
        hasErrors={hasErrors}
        isPreparingProcessing={isPreparingProcessing}
      />

      {/* Cancel Import Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar importação?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a importação de documentos? Todos os dados preenchidos serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar importação</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelImport} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ImportWizardProvider>
  );
};

export default DocumentImport;