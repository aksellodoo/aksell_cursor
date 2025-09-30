import React, { useState } from 'react';
import { InteractiveCard } from '@/components/InteractiveCard';
import { CheckCircle, Clock, XCircle, Archive, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImportWizard } from './ImportWizard';
import { RejectionReasonModal } from './RejectionReasonModal';
import { ObsoleteReasonModal } from './ObsoleteReasonModal';
import { DocumentSelectionModal } from '@/components/DocumentSelectionModal';
import { PendingTypeModal } from './PendingTypeModal';

interface ApprovalOption {
  value: 'aprovado' | 'pendente' | 'rejeitado' | 'obsoleto';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  selectedColor: string;
  selectedBgColor: string;
}

const approvalOptions: ApprovalOption[] = [
  {
    value: 'aprovado',
    label: 'Aprovado',
    description: 'Documento aprovado e pronto para uso',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100 border-green-200',
    selectedColor: 'text-green-700',
    selectedBgColor: 'bg-green-100 border-green-300'
  },
  {
    value: 'pendente',
    label: 'Pendente',
    description: 'Documento aguarda revisão ou aprovação',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
    selectedColor: 'text-yellow-700',
    selectedBgColor: 'bg-yellow-100 border-yellow-300'
  },
  {
    value: 'rejeitado',
    label: 'Rejeitado',
    description: 'Documento não aprovado para uso',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100 border-red-200',
    selectedColor: 'text-red-700',
    selectedBgColor: 'bg-red-100 border-red-300'
  },
  {
    value: 'obsoleto',
    label: 'Obsoleto',
    description: 'Documento desatualizado ou substituído',
    icon: Archive,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
    selectedColor: 'text-gray-700',
    selectedBgColor: 'bg-gray-100 border-gray-300'
  }
];

export const ApprovalStep: React.FC = () => {
  const { wizardData, updateWizardData, navigateToStep, setCurrentStep, setStepCompleted } = useImportWizard();
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showObsoleteModal, setShowObsoleteModal] = useState(false);
  const [showDocumentSelection, setShowDocumentSelection] = useState(false);
  const [showPendingTypeModal, setShowPendingTypeModal] = useState(false);

  const clearPreviousStatusData = (newStatus: 'aprovado' | 'pendente' | 'rejeitado' | 'obsoleto') => {
    const updates: any = { documentStatus: newStatus };
    
    // Limpa dados de rejeição se não for rejeitado
    if (newStatus !== 'rejeitado' && wizardData.rejectionReason) {
      updates.rejectionReason = undefined;
    }
    
    // Limpa dados de substituição se não for obsoleto
    if (newStatus !== 'obsoleto' && wizardData.replacementDocument) {
      updates.replacementDocument = undefined;
    }
    
    return updates;
  };

  const handleStatusSelect = (status: 'aprovado' | 'pendente' | 'rejeitado' | 'obsoleto') => {
    // Primeiro limpa dados do status anterior
    const updates = clearPreviousStatusData(status);
    
    if (status === 'rejeitado') {
      updateWizardData(updates);
      setShowRejectionModal(true);
    } else if (status === 'obsoleto') {
      updateWizardData(updates);
      setShowObsoleteModal(true);
    } else if (status === 'pendente') {
      updateWizardData(updates);
      setShowPendingTypeModal(true);
    } else {
      // Status aprovado - define reviewApprovalType como 'nao'
      updateWizardData({ ...updates, reviewApprovalType: 'nao' });
      setStepCompleted(5, true);
    }
  };

  const handleRejectionConfirm = (reason: string) => {
    updateWizardData({ 
      documentStatus: 'rejeitado',
      rejectionReason: reason 
    });
    setStepCompleted(5, true);
  };

  const handleObsoleteWithReplacement = () => {
    setShowDocumentSelection(true);
  };

  const handleObsoleteWithoutReplacement = () => {
    updateWizardData({ documentStatus: 'obsoleto' });
    setStepCompleted(5, true);
  };

  const handleReplacementSelect = (documentId: string, documentName: string) => {
    updateWizardData({
      replacementDocument: {
        id: documentId,
        name: documentName
      }
    });
    setShowDocumentSelection(false);
    setStepCompleted(5, true);
  };

  const handlePendingTypeSelect = (type: 'revisao' | 'aprovacao') => {
    updateWizardData({
      pendingType: type,
      reviewApprovalType: type
    });
    setShowPendingTypeModal(false);
    setStepCompleted(5, true);
  };

  const handlePrevious = () => {
    navigateToStep(4);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Status Inicial</h2>
        <p className="text-muted-foreground">
          Defina o status inicial do documento que está sendo importado
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {approvalOptions.map((option, index) => {
          const Icon = option.icon;
          const isSelected = wizardData.documentStatus === option.value;
          return (
            <InteractiveCard
              key={option.value}
              title={option.label}
              description={option.description}
              variant="interactive"
              onClick={() => handleStatusSelect(option.value)}
              className={`
                ${isSelected ? option.selectedBgColor : option.bgColor}
                ${isSelected ? 'ring-4 ring-orange-400 ring-offset-2 shadow-xl border-orange-300' : ''}
                transition-all duration-200 hover:scale-[1.02]
              `}
              animationDelay={index * 100}
            >
              <div className="flex justify-center py-6">
                <Icon className={`h-16 w-16 ${isSelected ? option.selectedColor : option.color}`} />
              </div>
            </InteractiveCard>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-8">
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Anterior</span>
        </Button>

        <Button
          onClick={() => setCurrentStep(6)}
          disabled={!wizardData.documentStatus}
          className="flex items-center space-x-2"
        >
          <span>Próximo</span>
        </Button>
      </div>

      {/* Status Info */}
      {wizardData.documentStatus && (
        <div className="text-center pt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Status selecionado: <span className="font-semibold text-foreground">
              {approvalOptions.find(option => option.value === wizardData.documentStatus)?.label}
            </span>
          </p>
          
          {wizardData.documentStatus === 'rejeitado' && wizardData.rejectionReason && (
            <p className="text-sm text-muted-foreground">
              Motivo da rejeição: <span className="font-medium text-red-600">
                {wizardData.rejectionReason}
              </span>
            </p>
          )}
          
          {wizardData.documentStatus === 'obsoleto' && wizardData.replacementDocument && (
            <p className="text-sm text-muted-foreground">
              Arquivo substituto: <span className="font-medium text-blue-600">
                {wizardData.replacementDocument.name}
              </span>
            </p>
          )}
          
          {wizardData.documentStatus === 'pendente' && wizardData.pendingType && (
            <p className="text-sm text-muted-foreground">
              Tipo de pendência: <span className="font-medium text-yellow-600">
                {wizardData.pendingType === 'revisao' ? 'Revisão' : 'Aprovação'}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Modals */}
        <RejectionReasonModal
          isOpen={showRejectionModal}
          onClose={() => setShowRejectionModal(false)}
          onConfirm={handleRejectionConfirm}
          initialReason={wizardData.rejectionReason}
        />

      <ObsoleteReasonModal
        isOpen={showObsoleteModal}
        onClose={() => setShowObsoleteModal(false)}
        onHasReplacement={handleObsoleteWithReplacement}
        onNoReplacement={handleObsoleteWithoutReplacement}
      />

      <DocumentSelectionModal
        open={showDocumentSelection}
        onOpenChange={setShowDocumentSelection}
        onDocumentSelect={handleReplacementSelect}
      />

      <PendingTypeModal
        isOpen={showPendingTypeModal}
        onClose={() => setShowPendingTypeModal(false)}
        onSelectType={handlePendingTypeSelect}
      />
    </div>
  );
};