import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Zap,
  Camera
} from 'lucide-react';
import { useImageContentDetection, ImageValidationResult } from '@/hooks/useImageContentDetection';
import { useHEICSupport } from '@/hooks/useHEICSupport';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { HEICProcessingFeedback } from './HEICProcessingFeedback';
import { MobileUploadOptimizer } from './MobileUploadOptimizer';
import { cn } from '@/lib/utils';

interface ImagePreviewProps {
  file: File;
  onAnalysisComplete?: (result: ImageValidationResult) => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ file, onAnalysisComplete }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [analysis, setAnalysis] = useState<ImageValidationResult | null>(null);
  const [heicValidation, setHeicValidation] = useState<any>(null);
  const [isFromCamera, setIsFromCamera] = useState(false);
  const [optimizedSize, setOptimizedSize] = useState<number | undefined>(undefined);
  
  const { analyzeImageContent, isAnalyzing } = useImageContentDetection();
  const { validateHEICFile } = useHEICSupport();
  const { detectCameraUpload, isMobile, isOptimizing } = useMobileOptimization();

  useEffect(() => {
    // Create preview URL
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    // Validate HEIC
    const heicResult = validateHEICFile(file);
    setHeicValidation(heicResult);

    // Detect camera upload
    const fromCamera = detectCameraUpload(file);
    setIsFromCamera(fromCamera);

    // Analyze content
    analyzeImageContent(file).then((result) => {
      setAnalysis(result);
      onAnalysisComplete?.(result);
    });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, analyzeImageContent, onAnalysisComplete, validateHEICFile, detectCameraUpload]);

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'photo': return <Camera className="h-4 w-4" />;
      case 'diagram': return <ImageIcon className="h-4 w-4" />;
      case 'mixed': return <Eye className="h-4 w-4" />;
      default: return <ImageIcon className="h-4 w-4" />;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={imageUrl}
              alt={`Preview de ${file.name}`}
              className="w-full h-48 object-contain bg-gray-50 rounded-lg border"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                <div className="bg-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  <span className="text-sm font-medium">Analisando...</span>
                </div>
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-sm truncate max-w-[200px]" title={file.name}>
                {file.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)} • {file.type}
              </p>
            </div>
            
            {analysis?.analysis && (
              <div className="flex gap-2">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getQualityColor(analysis.analysis.imageQuality))}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {analysis.analysis.imageQuality === 'excellent' && 'Excelente'}
                  {analysis.analysis.imageQuality === 'good' && 'Boa'}
                  {analysis.analysis.imageQuality === 'fair' && 'Regular'}
                  {analysis.analysis.imageQuality === 'poor' && 'Baixa'}
                </Badge>
              </div>
            )}
          </div>

          {/* HEIC and Mobile Feedback */}
          {heicValidation && (
            <HEICProcessingFeedback
              fileName={file.name}
              validation={heicValidation}
              isFromCamera={isFromCamera}
              isMobile={isMobile}
            />
          )}

          {/* Mobile Upload Optimizer Feedback */}
          {isMobile && (isOptimizing || optimizedSize) && (
            <MobileUploadOptimizer
              fileName={file.name}
              originalSize={file.size}
              optimizedSize={optimizedSize}
              isOptimizing={isOptimizing}
              isFromCamera={isFromCamera}
              isComplete={!!optimizedSize}
            />
          )}

          {/* Analysis Results */}
          {analysis?.isValid && analysis.analysis && (
            <div className="space-y-3">
              {/* Content Type */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getDocumentTypeIcon(analysis.analysis.documentType)}
                  <span className="text-sm font-medium">
                    {analysis.analysis.documentType === 'document' && 'Documento'}
                    {analysis.analysis.documentType === 'photo' && 'Foto'}
                    {analysis.analysis.documentType === 'diagram' && 'Diagrama'}
                    {analysis.analysis.documentType === 'mixed' && 'Misto'}
                    {analysis.analysis.documentType === 'unknown' && 'Indefinido'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Texto: {Math.round(analysis.analysis.textConfidence * 100)}%
                  </Badge>
                  
                  {analysis.analysis.estimatedTextDensity !== 'none' && (
                    <Badge 
                      variant={analysis.analysis.recommendedProcessing === 'ocr' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      OCR
                    </Badge>
                  )}
                </div>
              </div>

              {/* Text Density */}
              {analysis.analysis.hasText && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Densidade de texto: </span>
                  <span className={cn(
                    analysis.analysis.estimatedTextDensity === 'high' && 'text-green-600',
                    analysis.analysis.estimatedTextDensity === 'medium' && 'text-blue-600',
                    analysis.analysis.estimatedTextDensity === 'low' && 'text-yellow-600'
                  )}>
                    {analysis.analysis.estimatedTextDensity === 'high' && 'Alta (ideal para OCR)'}
                    {analysis.analysis.estimatedTextDensity === 'medium' && 'Média (adequada)'}
                    {analysis.analysis.estimatedTextDensity === 'low' && 'Baixa'}
                  </span>
                </div>
              )}

              {/* Warnings */}
              {analysis.analysis.warnings && analysis.analysis.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {analysis.analysis.warnings.map((warning, index) => (
                        <div key={index} className="text-sm">• {warning}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Processing Recommendation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <Info className="h-4 w-4" />
                  <span className="text-sm font-medium">Processamento Recomendado</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  {analysis.analysis.recommendedProcessing === 'ocr' && 
                    'OCR completo com GPT-5 Vision para extração de texto e conteúdo semântico'
                  }
                  {analysis.analysis.recommendedProcessing === 'visual_description' && 
                    'Descrição visual usando GPT-5 Vision (pouco texto detectado)'
                  }
                  {analysis.analysis.recommendedProcessing === 'skip' && 
                    'Processamento não recomendado (qualidade insuficiente)'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {analysis && !analysis.isValid && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div>{analysis.error}</div>
                  {analysis.suggestions && (
                    <div className="mt-2">
                      <span className="font-medium">Sugestões:</span>
                      {analysis.suggestions.map((suggestion, index) => (
                        <div key={index} className="text-sm">• {suggestion}</div>
                      ))}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};