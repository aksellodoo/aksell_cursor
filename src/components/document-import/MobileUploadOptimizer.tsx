import React from 'react';
import { Smartphone, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface MobileUploadOptimizerProps {
  fileName: string;
  originalSize: number;
  optimizedSize?: number;
  isOptimizing: boolean;
  isFromCamera: boolean;
  isComplete: boolean;
}

export const MobileUploadOptimizer: React.FC<MobileUploadOptimizerProps> = ({
  fileName,
  originalSize,
  optimizedSize,
  isOptimizing,
  isFromCamera,
  isComplete
}) => {
  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)}MB` : `${(bytes / 1024).toFixed(0)}KB`;
  };

  const compressionRatio = optimizedSize && originalSize > optimizedSize 
    ? Math.round(((originalSize - optimizedSize) / originalSize) * 100)
    : 0;

  return (
    <div className="space-y-2">
      {/* Status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs">
          <Smartphone className="w-3 h-3 mr-1" />
          Mobile
        </Badge>
        
        {isFromCamera && (
          <Badge variant="secondary" className="text-xs">
            📷 Câmera
          </Badge>
        )}
        
        {isOptimizing && (
          <Badge variant="outline" className="text-xs text-blue-600">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Otimizando
          </Badge>
        )}
        
        {isComplete && compressionRatio > 0 && (
          <Badge variant="default" className="text-xs bg-green-100 text-green-700">
            <Zap className="w-3 h-3 mr-1" />
            -{compressionRatio}%
          </Badge>
        )}
      </div>

      {/* Processing status */}
      {isOptimizing && (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-700">
            <div className="space-y-1">
              <p className="text-xs font-medium">Otimizando para mobile...</p>
              <p className="text-xs">Reduzindo tamanho e ajustando qualidade</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Completion status */}
      {isComplete && compressionRatio > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <div className="space-y-1">
              <p className="text-xs font-medium">Otimização concluída!</p>
              <p className="text-xs">
                {formatSize(originalSize)} → {formatSize(optimizedSize!)} 
                (-{compressionRatio}%)
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Benefits info */}
      {isFromCamera && !isOptimizing && (
        <div className="text-xs text-muted-foreground">
          💡 Fotos da câmera são automaticamente otimizadas para upload mais rápido
        </div>
      )}
    </div>
  );
};