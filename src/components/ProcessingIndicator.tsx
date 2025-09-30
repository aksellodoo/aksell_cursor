import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useProcessingStore } from '@/store/processingStore';

interface ProcessingIndicatorProps {
  onOpenModal: () => void;
}

export const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ onOpenModal }) => {
  const { 
    isProcessing, 
    isCompleted, 
    hasErrors, 
    steps, 
    isMinimized 
  } = useProcessingStore();

  // Don't show indicator if not processing and not completed recently
  if (!isProcessing && !isCompleted) {
    return null;
  }

  // Don't show if modal is open (not minimized)
  if (!isMinimized) {
    return null;
  }

  // Calculate overall progress with smart logic
  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  
  const progressPercentage = (() => {
    if (isCompleted && !hasErrors) return 100;
    if (totalSteps === 0) return 0;
    
    // If all steps are completed, ensure 100%
    if (completedSteps === totalSteps) return 100;
    
    // Smart calculation similar to modal
    const finalizationStep = steps.find(step => step.id === 'finalization');
    const nonFinalizationSteps = steps.filter(step => step.id !== 'finalization');
    const nonFinalizationCompleted = nonFinalizationSteps.filter(step => step.status === 'completed').length;
    
    if (nonFinalizationCompleted === nonFinalizationSteps.length && finalizationStep?.status === 'waiting') {
      return 95; // Show 95% when only finalization is pending
    }
    
    return Math.round((completedSteps / totalSteps) * 100);
  })();

  // Determine status and appearance
  const getStatusConfig = () => {
    if (hasErrors) {
      return {
        icon: AlertCircle,
        variant: 'destructive' as const,
        text: 'Erro no processamento',
        bgClass: 'bg-destructive/10 hover:bg-destructive/20',
        borderClass: 'border-destructive/20',
      };
    }
    
    if (isCompleted) {
      return {
        icon: CheckCircle,
        variant: 'default' as const,
        text: 'Processamento concluído',
        bgClass: 'bg-green-500/10 hover:bg-green-500/20',
        borderClass: 'border-green-500/20',
      };
    }
    
    return {
      icon: Loader2,
      variant: 'secondary' as const,
      text: `Processando... ${progressPercentage}%`,
      bgClass: 'bg-primary/10 hover:bg-primary/20',
      borderClass: 'border-primary/20',
    };
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onOpenModal}
      className={`
        h-8 px-3 gap-2 border transition-all duration-200
        ${config.bgClass} ${config.borderClass}
        hover:scale-105 active:scale-95
      `}
    >
      <IconComponent 
        className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} 
      />
      
      <span className="text-sm font-medium">
        {config.text}
      </span>
      
      {isProcessing && (
        <Badge variant="secondary" className="ml-1 text-xs">
          {completedSteps}/{totalSteps}
        </Badge>
      )}
      
      <FileText className="h-3 w-3 opacity-60" />
    </Button>
  );
};