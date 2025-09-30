import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Upload, X, File, Smartphone, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizeFilename } from '@/lib/storage';
import { useHEICSupport } from '@/hooks/useHEICSupport';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

interface FileUploadProps {
  onFileUpload: (fileUrl: string, fileName: string) => void;
  accept?: string;
  allowCamera?: boolean;
  multiple?: boolean;
  value?: string[];
  disabled?: boolean;
  showList?: boolean;
}

export const FileUpload = ({ 
  onFileUpload, 
  accept = "image/*,.pdf,.doc,.docx,.txt",
  allowCamera = true,
  multiple = false,
  value = [],
  disabled = false,
  showList = true 
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>(
    value.map(url => ({ url, name: url.split('/').pop() || 'Arquivo' }))
  );
  
  // Hooks para HEIC e mobile
  const { validateMultipleHEICFiles, isProcessing: heicProcessing } = useHEICSupport();
  const { 
    isMobile, 
    isOptimizing, 
    detectCameraUpload, 
    optimizeForMobile,
    getMobileConfig 
  } = useMobileOptimization();

  const uploadFile = async (file: File) => {
    const sanitizedName = sanitizeFilename(file.name);
    const fileExt = sanitizedName.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `forms/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('form-files')
      .upload(filePath, file);

    if (uploadError) {
      if (uploadError.message?.includes('Invalid key')) {
        throw new Error(`Nome do arquivo inválido. Evite caracteres especiais, acentos ou parênteses no nome do arquivo.`);
      }
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('form-files')
      .getPublicUrl(filePath);

    return { url: publicUrl, name: file.name };
  };

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (disabled) return;
    
    setUploading(true);
    try {
      // Validar arquivos HEIC
      const heicValidations = validateMultipleHEICFiles(files);
      
      for (const file of files) {
        let processedFile = file;
        
        // Detectar upload da câmera
        const fromCamera = detectCameraUpload(file);
        if (fromCamera && isMobile) {
          toast.info('📱 Foto da câmera detectada - otimizando para upload...', { duration: 2000 });
        }
        
        // Otimizar para mobile se necessário
        if (isMobile && file.type.startsWith('image/')) {
          processedFile = await optimizeForMobile(file);
          if (processedFile !== file) {
            toast.success('Imagem otimizada para mobile!', { duration: 2000 });
          }
        }
        
        // Validação HEIC específica
        const heicValidation = heicValidations.get(file.name);
        if (heicValidation?.isHEIC && heicValidation.warnings.length > 0) {
          console.log('HEIC detected:', heicValidation.warnings);
        }
        
        const result = await uploadFile(processedFile);
        const newFiles = multiple 
          ? [...uploadedFiles, result]
          : [result];
        
        setUploadedFiles(newFiles);
        onFileUpload(result.url, result.name);
      }
      toast.success('Arquivo(s) enviado(s) com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar arquivo';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [onFileUpload, multiple, uploadedFiles, disabled, validateMultipleHEICFiles, detectCameraUpload, isMobile, optimizeForMobile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: accept.split(',').reduce((acc, curr) => {
      acc[curr.trim()] = [];
      return acc;
    }, {} as Record<string, string[]>),
    multiple,
    disabled: disabled || uploading,
  });

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
  };

  return (
    <div className="space-y-4">
      <Card 
        {...getRootProps()} 
        className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {isDragActive ? 'Solte os arquivos aqui' : 'Clique ou arraste arquivos aqui'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Suporte para imagens (JPG, PNG, HEIC), PDF, DOC, TXT
            </p>
            {isMobile && (
              <div className="flex items-center justify-center gap-1 mt-2">
                <Smartphone className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary">Otimizado para mobile</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 justify-center flex-wrap">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              disabled={disabled || uploading || isOptimizing || heicProcessing}
              className={isMobile ? "flex-1 min-w-[120px]" : ""}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading || isOptimizing ? 'Processando...' : 'Selecionar'}
            </Button>
            
            {allowCamera && (
              <label className={isMobile ? "flex-1 min-w-[100px]" : ""}>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  disabled={disabled || uploading || isOptimizing || heicProcessing} 
                  asChild
                  className="w-full"
                >
                  <span>
                    <Camera className="w-4 h-4 mr-2" />
                    Câmera
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                  disabled={disabled || uploading || isOptimizing || heicProcessing}
                />
              </label>
            )}
            
            {/* Botão galeria para mobile */}
            {isMobile && (
              <label className="flex-1 min-w-[100px]">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  disabled={disabled || uploading || isOptimizing || heicProcessing} 
                  asChild
                  className="w-full"
                >
                  <span>
                    <File className="w-4 h-4 mr-2" />
                    Galeria
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  multiple={multiple}
                  onChange={handleCameraCapture}
                  className="hidden"
                  disabled={disabled || uploading || isOptimizing || heicProcessing}
                />
              </label>
            )}
          </div>
          
          {/* Feedback de processamento */}
          {(isOptimizing || heicProcessing) && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="animate-spin w-3 h-3 border border-primary border-t-transparent rounded-full"></div>
              {isOptimizing && "Otimizando para mobile..."}
              {heicProcessing && "Processando HEIC..."}
            </div>
          )}
        </div>
      </Card>

      {showList && uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Arquivos enviados:</p>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center gap-2">
                <File className="w-4 h-4" />
                <span className="text-sm truncate">{file.name}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};