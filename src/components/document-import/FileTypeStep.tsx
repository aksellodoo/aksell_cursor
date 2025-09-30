import React from 'react';
import { InteractiveCard } from '@/components/InteractiveCard';
import { Image, FileText, File, HelpCircle, ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useImportWizard } from './ImportWizard';
import { cn } from '@/lib/utils';

const FILE_TYPES = [
  {
    id: 'images' as const,
    title: 'Imagens',
    description: 'JPG, PNG, TIFF, BMP, WebP, HEIC',
    icon: Image,
    extensions: ['.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.webp', '.heic', '.svg', '.gif']
  },
  {
    id: 'pdf' as const,
    title: 'PDFs',
    description: 'Documentos PDF',
    icon: FileText,
    extensions: ['.pdf']
  },
  {
    id: 'office' as const,
    title: 'Texto/Office',
    description: 'DOC, DOCX, TXT, CSV, JSON, XML, RTF, MD, LOG, TSV, ODS',
    icon: File,
    extensions: ['.doc', '.docx', '.txt', '.xlsx', '.xls', '.pptx', '.ppt', '.csv', '.json', '.xml', '.rtf', '.md', '.log', '.tsv', '.ods']
  },
  {
    id: 'others' as const,
    title: 'Outros',
    description: 'Outras extensões',
    icon: HelpCircle,
    extensions: []
  }
];

const RAG_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.txt', '.xlsx', '.xls', '.pptx', '.ppt', '.csv', '.json', '.xml', '.rtf', '.md', '.log', '.tsv', '.ods',
  '.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.webp', '.heic', '.svg', '.gif'
];

export const FileTypeStep: React.FC = () => {
  const { wizardData, updateWizardData, setCurrentStep, setStepCompleted, resetFromStep, navigateToStep } = useImportWizard();

  const handleTypeSelect = (type: 'images' | 'pdf' | 'office' | 'others') => {
    // Only reset if changing selection
    if (wizardData.fileType && wizardData.fileType !== type) {
      resetFromStep(1);
    }
    updateWizardData({ 
      fileType: type,
      showProcessing: type === 'pdf' // Only PDFs need processing configuration
    });
    setStepCompleted(1, true);
    
    // For images and office files, skip processing step automatically
    if (type === 'images') {
      // Apply automatic processing settings for images
      updateWizardData({
        processingOptions: {
          mode: 'ocr_all',
          languageHints: ['pt'],
          autoDetectLanguage: true
        }
      });
    } else if (type === 'office') {
      // Apply automatic processing settings for Office files
      updateWizardData({
        processingOptions: {
          mode: 'text_only',
          languageHints: ['pt'],
          autoDetectLanguage: true
        }
      });
    }
    
    setTimeout(() => setCurrentStep(2), 300);
  };

  const handlePrevious = () => {
    navigateToStep(0);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Qual tipo de arquivo você vai importar?</h2>
        <p className="text-muted-foreground">
          Selecione o tipo principal dos arquivos que serão importados
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {FILE_TYPES.map((fileType) => (
          <TooltipProvider key={fileType.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <InteractiveCard
                    title={fileType.title}
                    description={fileType.description}
                    variant="interactive"
                    onClick={() => handleTypeSelect(fileType.id)}
                    className={cn(
                      wizardData.fileType === fileType.id 
                        ? 'ring-2 ring-primary bg-primary/5 border-primary/20' 
                        : 'hover:border-primary/50'
                    )}
                  >
                    <div className="flex justify-center py-6">
                      <fileType.icon className="h-12 w-12 text-primary" />
                    </div>
                  </InteractiveCard>
                </div>
              </TooltipTrigger>
              {fileType.id === 'others' && (
                <TooltipContent side="bottom" className="max-w-sm">
                  <div className="space-y-2">
                    <p className="font-medium">Tipo "Outros":</p>
                    <p className="text-sm">Para arquivos ZIP, EXE, e outras extensões não cobertas pelos tipos acima</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      ⚠️ Não aceita PDFs, imagens ou arquivos Office (use os tipos específicos)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ℹ️ Arquivos deste tipo não terão processamento RAG/IA
                    </p>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      <div className="flex justify-between pt-4 max-w-4xl mx-auto">
        <Button variant="outline" onClick={handlePrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <div></div>
      </div>
    </div>
  );
};