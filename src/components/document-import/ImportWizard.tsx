import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface ImportWizardContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  navigateToStep: (step: number) => void;
  returnToOriginalStep: () => void;
  originalStep: number | null;
  isReviewing: boolean;
  steps: ImportStep[];
  setStepCompleted: (stepIndex: number, completed: boolean) => void;
  wizardData: {
    fileQuantity: 'single' | 'multiple' | null;
    fileType: 'images' | 'pdf' | 'office' | 'others' | null;
    files: File[];
    filesToReplace?: string[];
    filesToImportAnyway?: string[];
    showProcessing: boolean;
    documentStatus: 'aprovado' | 'pendente' | 'rejeitado' | 'obsoleto';
    rejectionReason?: string;
    replacementDocument?: {
      id: string;
      name: string;
    };
    pendingType?: 'revisao' | 'aprovacao' | null;
    reviewApprovalType?: 'nao' | 'revisao' | 'aprovacao' | null;
    reviewers?: {
      type: 'users' | 'department';
      users?: string[];
      department?: string;
    };
    approvalConfig?: {
      mode: 'single' | 'any' | 'all';
      approvers: string[];
    };
    description?: string;
    tags?: string[];
    processingOptions?: {
      mode: 'auto' | 'ocr_all' | 'text_only';
      languageHints: string[];
      customLanguage?: string;
      autoDetectLanguage: boolean;
    };
    // Versioning fields
    effectiveDate?: Date;
    expiryDate?: Date;
    versionNumber?: number;
    versionNotes?: string;
    notifyBeforeExpiryDays?: number;
    reviewDepartmentId?: string;
    // Document metadata
    approvalMode?: string;
    approvers?: string[];
    // PDF analysis and OCR auto-detection
    autoModeOcrFiles?: string[];
    extractedTexts?: { [fileName: string]: string };
    pdfAnalyses?: { [fileName: string]: any };
    // Department and folder IDs (for modal context)
    departmentId?: string;
    folderId?: string;
  };
  updateWizardData: (data: Partial<ImportWizardContextType['wizardData']>) => void;
  resetFromStep: (stepIndex: number) => void;
}

const ImportWizardContext = createContext<ImportWizardContextType | undefined>(undefined);

export const useImportWizard = () => {
  const context = useContext(ImportWizardContext);
  if (!context) {
    throw new Error('useImportWizard must be used within ImportWizardProvider');
  }
  return context;
};

interface ImportWizardProviderProps {
  children: ReactNode;
  initialDepartmentId?: string;
  initialFolderId?: string;
}

export const ImportWizardProvider: React.FC<ImportWizardProviderProps> = ({
  children,
  initialDepartmentId = '',
  initialFolderId = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [originalStep, setOriginalStep] = useState<number | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [steps, setSteps] = useState<ImportStep[]>([
    { id: 'quantity', title: 'Quantidade', description: 'Defina quantos arquivos', completed: false },
    { id: 'type', title: 'Tipo', description: 'Escolha o tipo de arquivo', completed: false },
    { id: 'upload', title: 'Upload', description: 'Selecione os arquivos', completed: false },
    { id: 'versioning', title: 'Versionamento', description: 'Defina versão e vigência', completed: false },
    { id: 'approval', title: 'Status Inicial', description: 'Status do documento', completed: false },
    { id: 'review-approval', title: 'Revisão ou Aprovação', description: 'Defina o processo', completed: false }
  ]);

  const [wizardData, setWizardData] = useState({
    fileQuantity: null as 'single' | 'multiple' | null,
    fileType: null as 'images' | 'pdf' | 'office' | 'others' | null,
    files: [] as File[],
    showProcessing: false,
    documentStatus: 'aprovado' as 'aprovado' | 'pendente' | 'rejeitado' | 'obsoleto',
    departmentId: initialDepartmentId,
    folderId: initialFolderId
  });

  const setStepCompleted = (stepIndex: number, completed: boolean) => {
    setSteps(prev => 
      prev.map((step, index) => 
        index === stepIndex ? { ...step, completed } : step
      )
    );
  };

  const updateWizardData = (data: Partial<typeof wizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }));
    // Se dados foram alterados durante revisão, sair do modo revisão
    if (isReviewing) {
      setIsReviewing(false);
      setOriginalStep(null);
    }
  };

  const navigateToStep = (targetStep: number) => {
    // Se navegando para trás e não estiver em modo revisão, ativar modo revisão
    if (targetStep < currentStep && !isReviewing) {
      setOriginalStep(currentStep);
      setIsReviewing(true);
    }
    setCurrentStep(targetStep);
  };

  const returnToOriginalStep = () => {
    if (originalStep !== null) {
      setCurrentStep(originalStep);
      setOriginalStep(null);
      setIsReviewing(false);
    }
  };

  const resetFromStep = (stepIndex: number) => {
    // Sair do modo revisão se dados foram alterados
    setIsReviewing(false);
    setOriginalStep(null);
    
    // Reset data based on which step changed
    switch (stepIndex) {
      case 0: // Quantity changed - reset everything
        setWizardData(prev => ({
          ...prev,
          fileType: null,
          files: [],
          showProcessing: false,
          documentStatus: 'aprovado'
        }));
        // Mark all future steps as incomplete
        setSteps(prev => 
          prev.map((step, index) => 
            index > stepIndex ? { ...step, completed: false } : step
          )
        );
        break;
        
      case 1: // File type changed - reset files and processing
        setWizardData(prev => ({
          ...prev,
          files: [],
          showProcessing: false,
          documentStatus: 'aprovado'
        }));
        // Mark all future steps as incomplete
        setSteps(prev => 
          prev.map((step, index) => 
            index > stepIndex ? { ...step, completed: false } : step
          )
        );
        break;
        
      case 2: // Files changed - reset processing settings
        setWizardData(prev => ({
          ...prev,
          documentStatus: 'aprovado'
        }));
        // Mark all future steps as incomplete
        setSteps(prev => 
          prev.map((step, index) => 
            index > stepIndex ? { ...step, completed: false } : step
          )
        );
        break;
    }
  };

  return (
    <ImportWizardContext.Provider value={{
      currentStep,
      setCurrentStep,
      navigateToStep,
      returnToOriginalStep,
      originalStep,
      isReviewing,
      steps,
      setStepCompleted,
      wizardData,
      updateWizardData,
      resetFromStep
    }}>
      {children}
    </ImportWizardContext.Provider>
  );
};

interface StepIndicatorProps {
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ className }) => {
  const { currentStep, steps, navigateToStep, returnToOriginalStep, originalStep, isReviewing, wizardData } = useImportWizard();
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleStepClick = (stepIndex: number) => {
    // Só permite navegar para etapas anteriores ou atual
    if (stepIndex <= currentStep) {
      navigateToStep(stepIndex);
    }
  };

  const isClickable = (index: number) => {
    return index <= currentStep;
  };

  return (
    <Card className={cn("mb-8", className)}>
      <CardContent className="pt-4 md:pt-6">
        <div className="space-y-3 md:space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progresso</span>
            <span>{currentStep + 1} de {steps.length}</span>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          {/* Mobile: simplified step indicator */}
          <div className="md:hidden">
            <div className="flex items-center justify-center space-x-2">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
                  "bg-primary text-primary-foreground"
                )}
              >
                {currentStep + 1}
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">{steps[currentStep].title}</div>
                <div className="text-xs text-muted-foreground">{steps[currentStep].description}</div>
              </div>
            </div>
          </div>
          
          {/* Desktop: full step indicator */}
          <div className="hidden md:flex justify-between items-center">
            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className={cn(
                  "flex flex-col items-center space-y-1 text-center transition-all duration-200",
                  index <= currentStep ? "text-primary" : "text-muted-foreground",
                  isClickable(index) ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed"
                )}
                onClick={() => handleStepClick(index)}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200",
                    index < currentStep 
                      ? "bg-primary text-primary-foreground" 
                      : index === currentStep
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground",
                    isClickable(index) && "hover:scale-105"
                  )}
                >
                  {index + 1}
                </div>
                 <div className="text-xs max-w-20">
                   <div className="font-medium">{step.title}</div>
                 </div>
              </div>
            ))}
          </div>
          
          {/* Botão de retorno inteligente */}
          {isReviewing && originalStep !== null && (
            <div className="flex justify-center mt-4 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={returnToOriginalStep}
                className="gap-2 text-xs min-h-[44px]"
              >
                <ArrowRight className="h-3 w-3" />
                Retornar para etapa {originalStep + 1}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};