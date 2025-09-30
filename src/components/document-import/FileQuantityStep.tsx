import React from 'react';
import { InteractiveCard } from '@/components/InteractiveCard';
import { FileText, Files } from 'lucide-react';
import { useImportWizard } from './ImportWizard';
import { cn } from '@/lib/utils';

export const FileQuantityStep: React.FC = () => {
  const { wizardData, updateWizardData, setCurrentStep, setStepCompleted, resetFromStep } = useImportWizard();

  const handleQuantitySelect = (quantity: 'single' | 'multiple') => {
    // Only reset if changing selection
    if (wizardData.fileQuantity && wizardData.fileQuantity !== quantity) {
      resetFromStep(0);
    }
    updateWizardData({ fileQuantity: quantity });
    setStepCompleted(0, true);
    setTimeout(() => setCurrentStep(1), 300);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Quantos arquivos você irá importar?</h2>
        <p className="text-muted-foreground">
          Selecione se você importará um arquivo individual ou múltiplos arquivos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <InteractiveCard
          title="Um arquivo"
          description="Importar um documento individual"
          variant="interactive"
          onClick={() => handleQuantitySelect('single')}
          className={cn(
            wizardData.fileQuantity === 'single' 
              ? 'ring-2 ring-primary bg-primary/5 border-primary/20' 
              : 'hover:border-primary/50'
          )}
        >
          <div className="flex justify-center py-8">
            <FileText className="h-16 w-16 text-primary" />
          </div>
        </InteractiveCard>

        <InteractiveCard
          title="Múltiplos arquivos"
          description="Importar vários documentos de uma vez"
          variant="interactive"
          onClick={() => handleQuantitySelect('multiple')}
          className={cn(
            wizardData.fileQuantity === 'multiple' 
              ? 'ring-2 ring-primary bg-primary/5 border-primary/20' 
              : 'hover:border-primary/50'
          )}
        >
          <div className="flex justify-center py-8">
            <Files className="h-16 w-16 text-primary" />
          </div>
        </InteractiveCard>
      </div>
    </div>
  );
};