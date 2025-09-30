import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, ArrowLeft, Zap, Loader2, AlertCircle } from 'lucide-react';
import { useImportWizard } from './ImportWizard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DuplicateResolutionModal } from './DuplicateResolutionModal';
import { generateUniqueFileName } from '@/lib/duplicateUtils';
import { FileValidationWarning } from './FileValidationWarning';
import { useIntelligentFileValidation, FileValidationResult } from '@/hooks/useIntelligentFileValidation';
import { ImagePreview } from './ImagePreview';
import { useImageContentDetection, ImageValidationResult as ImageAnalysisResult } from '@/hooks/useImageContentDetection';
import { useHEICSupport } from '@/hooks/useHEICSupport';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { usePdfTextExtraction } from '@/hooks/usePdfTextExtraction';
import { usePdfQualityAnalysis } from '@/hooks/usePdfQualityAnalysis';

// Extensions that are NOT allowed in "others" type (already covered by other types)
const PROHIBITED_OTHERS_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.webp', '.heic', '.svg', '.gif', // Images
  '.pdf', // PDFs
  '.doc', '.docx', '.txt', '.xlsx', '.xls', '.pptx', '.ppt', '.csv', '.json', '.xml', '.rtf', '.md', '.log', '.tsv', '.ods' // Office
];

const getAcceptedTypes = (fileType: string) => {
  switch (fileType) {
    case 'images':
      return {
        'image/*': ['.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.webp', '.heic', '.svg', '.gif']
      };
    case 'pdf':
      return {
        'application/pdf': ['.pdf']
      };
    case 'office':
      return {
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
        'application/vnd.ms-powerpoint': ['.ppt'],
        'text/plain': ['.txt'],
        'text/csv': ['.csv'],
        'application/json': ['.json'],
        'application/xml': ['.xml'],
        'text/xml': ['.xml'],
        'application/rtf': ['.rtf'],
        'text/markdown': ['.md'],
        'text/x-log': ['.log'],
        'text/tab-separated-values': ['.tsv'],
        'application/vnd.oasis.opendocument.spreadsheet': ['.ods']
      };
    case 'others':
      return {}; // Accept any file type for others
    default:
      return {};
  }
};

const getAllowedExtensions = (fileType: string) => {
  const types = getAcceptedTypes(fileType);
  return Object.values(types).flat();
};

const validateFileExtensions = (files: File[], selectedType: string) => {
  if (selectedType === 'others') {
    return validateOthersFileType(files);
  }
  
  const allowedExtensions = getAllowedExtensions(selectedType);
  const validFiles: File[] = [];
  const invalidFiles: File[] = [];

  files.forEach(file => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (allowedExtensions.includes(extension)) {
      validFiles.push(file);
    } else {
      invalidFiles.push(file);
    }
  });

  return { validFiles, invalidFiles };
};

const validateOthersFileType = (files: File[]) => {
  const validFiles: File[] = [];
  const invalidFiles: File[] = [];

  files.forEach(file => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isProhibited = PROHIBITED_OTHERS_EXTENSIONS.includes(extension);
    
    if (!isProhibited) {
      validFiles.push(file);
    } else {
      invalidFiles.push(file);
    }
  });

  return { validFiles, invalidFiles };
};

const getSuggestedTypeForFile = (fileName: string): string => {
  const extension = '.' + fileName.split('.').pop()?.toLowerCase();
  
  if (['.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.webp', '.heic', '.svg', '.gif'].includes(extension)) {
    return 'Imagens';
  }
  if (['.pdf'].includes(extension)) {
    return 'PDFs';
  }
  if (['.doc', '.docx', '.txt', '.xlsx', '.xls', '.pptx', '.ppt', '.csv', '.json', '.xml', '.rtf', '.md', '.log', '.tsv', '.ods'].includes(extension)) {
    return 'Texto/Office';
  }
  
  return 'Outros';
};

export const FileUploadStep: React.FC = () => {
  const { wizardData, updateWizardData, setCurrentStep, setStepCompleted } = useImportWizard();
  const navigate = useNavigate();
  const [isQuickProcessing, setIsQuickProcessing] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [detectedDuplicates, setDetectedDuplicates] = useState<any[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [filesWithDuplicates, setFilesWithDuplicates] = useState<Set<string>>(new Set());
  const [fileValidations, setFileValidations] = useState<FileValidationResult[]>([]);
  const [imageAnalyses, setImageAnalyses] = useState<Map<string, ImageAnalysisResult>>(new Map());
  const { validateMultipleFiles, isValidating } = useIntelligentFileValidation();
  const { analyzeMultipleImages } = useImageContentDetection();
  
  // Hooks para HEIC e mobile
  const { validateMultipleHEICFiles } = useHEICSupport();
  const { 
    isMobile, 
    detectCameraUpload, 
    optimizeForMobile,
    isOptimizing 
  } = useMobileOptimization();

  // Check for duplicate files globally and categorize them
  const checkForDuplicates = async (files: File[]) => {
    setIsCheckingDuplicates(true);
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const folderId = urlParams.get('folderId') || urlParams.get('folder') || '';
      
      if (!folderId) {
        return { duplicates: [], validFiles: files };
      }

      const duplicates: any[] = [];
      const validFiles: File[] = [];

      for (const file of files) {
        // First check for critical duplicates (same folder)
        const { data: sameFolderDocs, error: sameFolderError } = await supabase
          .from('documents')
          .select(`
            id, name, file_size, created_at,
            folder:folders!documents_folder_id_fkey(name),
            department:departments!documents_department_id_fkey(name)
          `)
          .eq('folder_id', folderId)
          .eq('name', file.name)
          .eq('file_size', file.size)
          .neq('status', 'Obsoleto');

        if (sameFolderError) {
          console.warn('Error checking for same folder duplicates:', sameFolderError);
        } else if (sameFolderDocs && sameFolderDocs.length > 0) {
          // Critical duplicate found - same folder
          duplicates.push({
            file,
            existingDocument: {
              ...sameFolderDocs[0],
              folder_name: sameFolderDocs[0].folder?.name,
              department_name: sameFolderDocs[0].department?.name
            },
            duplicateType: 'critical'
          });
          continue; // Skip to next file
        }

        // Check for informative duplicates (different folders)
        const { data: otherFolderDocs, error: otherFolderError } = await supabase
          .from('documents')
          .select(`
            id, name, file_size, created_at,
            folder:folders!documents_folder_id_fkey(name),
            department:departments!documents_department_id_fkey(name)
          `)
          .neq('folder_id', folderId)
          .eq('name', file.name)
          .eq('file_size', file.size)
          .neq('status', 'Obsoleto')
          .limit(1); // Only show first duplicate found

        if (otherFolderError) {
          console.warn('Error checking for other folder duplicates:', otherFolderError);
          validFiles.push(file);
        } else if (otherFolderDocs && otherFolderDocs.length > 0) {
          // Informative duplicate found - different folder
          duplicates.push({
            file,
            existingDocument: {
              ...otherFolderDocs[0],
              folder_name: otherFolderDocs[0].folder?.name,
              department_name: otherFolderDocs[0].department?.name
            },
            duplicateType: 'informative'
          });
        } else {
          // No duplicates found
          validFiles.push(file);
        }
      }

      return { duplicates, validFiles };
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return { duplicates: [], validFiles: files };
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Use the utility function for generating unique names

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!wizardData.fileType) {
        toast.error('Selecione um tipo de arquivo primeiro');
        return;
      }

      const { validFiles, invalidFiles } = validateFileExtensions(acceptedFiles, wizardData.fileType);

      if (invalidFiles.length > 0) {
        if (wizardData.fileType === 'others') {
          const suggestions = invalidFiles.map(file => {
            const suggestedType = getSuggestedTypeForFile(file.name);
            return `${file.name} (use tipo: ${suggestedType})`;
          }).join(', ');
          toast.error(`Arquivos rejeitados - já aceitos em outros tipos: ${suggestions}`);
        } else {
          const allowedExtensions = getAllowedExtensions(wizardData.fileType);
          toast.error(`Arquivos inválidos encontrados. Extensões permitidas: ${allowedExtensions.join(', ')}`);
        }
      }

      if (validFiles.length > 0) {
        // Validar arquivos HEIC
        const heicValidations = validateMultipleHEICFiles(validFiles);
        
        // Otimizar arquivos para mobile se necessário
        const processedFiles: File[] = [];
        for (const file of validFiles) {
          let processedFile = file;
          
          // Detectar upload da câmera
          const fromCamera = detectCameraUpload(file);
          if (fromCamera && isMobile) {
            toast.info('📱 Foto da câmera detectada', { duration: 2000 });
          }
          
          // Otimizar para mobile se necessário
          if (isMobile && file.type.startsWith('image/')) {
            processedFile = await optimizeForMobile(file);
          }
          
          processedFiles.push(processedFile);
        }
        
        // Check for duplicates
        const { duplicates, validFiles: nonDuplicateFiles } = await checkForDuplicates(processedFiles);
        
        if (duplicates.length > 0) {
          setDetectedDuplicates(duplicates);
          setDuplicateModalOpen(true);
          
          // Update files with duplicates for visual indication
          const duplicateNames = new Set(duplicates.map(d => d.file.name));
          setFilesWithDuplicates(duplicateNames);
          
          return;
        }

        // If single file mode, replace existing files
        // Analyze images if they are image files
        if (wizardData.fileType === 'images') {
          analyzeMultipleImages(nonDuplicateFiles).then((analyses) => {
            const newAnalyses = new Map(imageAnalyses);
            analyses.forEach((analysis, index) => {
              newAnalyses.set(nonDuplicateFiles[index].name, analysis);
            });
            setImageAnalyses(newAnalyses);
          });
        }


        if (wizardData.fileQuantity === 'single') {
          updateWizardData({ files: [nonDuplicateFiles[0]] });
        } else {
          updateWizardData({ files: [...wizardData.files, ...nonDuplicateFiles] });
        }
      }
    },
    [wizardData.fileType, wizardData.files, wizardData.fileQuantity, updateWizardData]
  );

  const acceptedTypes = wizardData.fileType ? getAcceptedTypes(wizardData.fileType) : {};

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    multiple: wizardData.fileQuantity === 'multiple'
  });

  const handleRemoveFile = (index: number) => {
    const newFiles = wizardData.files.filter((_, i) => i !== index);
    updateWizardData({ files: newFiles });
  };

  const handleNext = () => {
    setStepCompleted(2, true);
    // Skip to versioning for images and office files
    if (wizardData.fileType === 'images' || wizardData.fileType === 'office') {
      setCurrentStep(4);
    } else {
      setCurrentStep(3);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(1);
  };

  // Handle duplicate resolution
  const handleDuplicateResolution = (resolutions: { file: File; action: 'cancel' | 'rename' | 'replace' | 'import_anyway' }[]) => {
    const filesToAdd: File[] = [];
    const filesToReplace: string[] = [];
    const filesToImportAnyway: string[] = [];
    const existingFileNames = wizardData.files.map(f => f.name);
    
    resolutions.forEach(({ file, action }) => {
      if (action === 'cancel') {
        // Do nothing - file is removed from selection
        return;
      } else if (action === 'rename') {
        // Create renamed file
        const newName = generateUniqueFileName(file.name, [...existingFileNames, ...filesToAdd.map(f => f.name)]);
        const renamedFile = new File([file], newName, { type: file.type });
        filesToAdd.push(renamedFile);
      } else if (action === 'replace') {
        // Mark for replacement - will be handled in backend
        filesToAdd.push(file);
        filesToReplace.push(file.name);
      } else if (action === 'import_anyway') {
        // Import file anyway (for informative duplicates)
        filesToAdd.push(file);
        filesToImportAnyway.push(file.name);
      }
    });

    // Add resolved files to the wizard
    if (filesToAdd.length > 0) {
      const currentFiles = wizardData.fileQuantity === 'single' ? [] : wizardData.files;
      updateWizardData({ 
        files: [...currentFiles, ...filesToAdd],
        filesToReplace: [...(wizardData.filesToReplace || []), ...filesToReplace],
        filesToImportAnyway: [...(wizardData.filesToImportAnyway || []), ...filesToImportAnyway]
      });
    }

    // Clear duplicates state
    setDetectedDuplicates([]);
    setFilesWithDuplicates(new Set());
  };

  const handleQuickFinish = () => {
    // Configurações padrão para importação rápida
    const quickConfig = {
      documentStatus: 'aprovado',
      documentType: 'pdf',
      versionType: 'digital',
      pendingType: null,
      selectedReviewers: [],
      selectedDepartment: null,
      approvalMode: null,
      selectedApprovers: []
    };

    // Obter parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const folderId = urlParams.get('folder') || '';
    const departmentId = urlParams.get('department') || '';

    // Disparar evento customizado para abrir modal de processamento
    const event = new CustomEvent('startProcessing', {
      detail: {
        files: wizardData.files,
        config: quickConfig,
        folderId,
        departmentId,
        isQuickFinish: true
      }
    });
    window.dispatchEvent(event);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!wizardData.fileType) {
    return (
      <div className="text-center text-muted-foreground">
        Selecione um tipo de arquivo na etapa anterior
      </div>
    );
  }

  const allowedExtensions = getAllowedExtensions(wizardData.fileType);
  const canProceed = wizardData.files.length > 0;
  

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardContent className="p-4 md:p-6">
          <div 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed rounded-lg p-6 md:p-8 text-center cursor-pointer transition-all min-h-[120px] md:min-h-[160px]",
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5",
              wizardData.files.length > 0 && "border-success bg-success/5"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3 md:gap-4">
              <Upload className={cn(
                "h-8 w-8 md:h-12 md:w-12",
                isDragActive ? "text-primary" : "text-muted-foreground",
                wizardData.files.length > 0 && "text-success"
              )} />
              
              <div className="space-y-1 md:space-y-2">
                <p className="text-base md:text-lg font-medium">
                  {isDragActive 
                    ? "Solte os arquivos aqui" 
                    : wizardData.files.length > 0 
                      ? "Adicionar mais arquivos" 
                      : isMobile ? "Toque para selecionar arquivos" : "Clique ou arraste arquivos aqui"
                  }
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {wizardData.fileType === 'others' 
                    ? 'Aceita qualquer extensão (exceto PDFs, imagens e arquivos Office)'
                    : `Tipos aceitos: ${allowedExtensions.join(', ')}`
                  }
                </p>
                {wizardData.fileQuantity === 'single' && (
                  <p className="text-xs text-muted-foreground">
                    Apenas um arquivo será aceito
                  </p>
                )}
                {isMobile && (
                  <p className="text-xs text-primary flex items-center justify-center gap-1 mt-1">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Interface otimizada para mobile
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Lista de arquivos selecionados */}
          {wizardData.files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium">Arquivos selecionados:</h4>
              
              {/* Grid layout for images, list for other files */}
              {wizardData.fileType === 'images' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wizardData.files.map((file, index) => (
                    <div key={index} className="relative">
                      <ImagePreview 
                        file={file}
                        onAnalysisComplete={(analysis) => {
                          const newAnalyses = new Map(imageAnalyses);
                          newAnalyses.set(file.name, analysis);
                          setImageAnalyses(newAnalyses);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10 bg-white/80 backdrop-blur-sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {filesWithDuplicates.has(file.name) && (
                        <div className="absolute top-2 left-2 bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-medium">
                          Duplicata
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {wizardData.files.map((file, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        filesWithDuplicates.has(file.name) 
                          ? "bg-amber-50 border border-amber-200" 
                          : "bg-secondary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {filesWithDuplicates.has(file.name) && (
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        )}
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm flex items-center gap-2">
                            {file.name}
                            {filesWithDuplicates.has(file.name) && (
                              <span className="text-xs text-amber-600 font-normal">
                                (Duplicata detectada)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Checking duplicates indicator */}
          {isCheckingDuplicates && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando arquivos duplicados...
            </div>
          )}


          {/* Auto OCR detection results */}
          {wizardData.autoModeOcrFiles && wizardData.autoModeOcrFiles.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    🔍 OCR Automático Detectado
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Os seguintes PDFs foram identificados como necessitando OCR e serão processados automaticamente:
                  </p>
                  <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                    {wizardData.autoModeOcrFiles.map((fileName) => (
                      <li key={fileName} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        {fileName}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      {wizardData.files.length > 0 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          <div className="flex gap-3">
            <Button 
              variant="secondary"
              onClick={handleQuickFinish}
              disabled={isQuickProcessing}
              size="lg"
              className="min-w-48"
              title="Finalizar importação usando configurações recomendadas"
            >
              {isQuickProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Finalizar com Configurações Padrão
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={false}
              size="lg"
              className="min-w-32"
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Duplicate Resolution Modal */}
      <DuplicateResolutionModal
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        duplicates={detectedDuplicates}
        onResolve={handleDuplicateResolution}
      />

    </div>
  );
};

export default FileUploadStep;