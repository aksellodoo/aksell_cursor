import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface HEICValidationResult {
  isHEIC: boolean;
  isSupported: boolean;
  needsConversion: boolean;
  warnings: string[];
  suggestions: string[];
}

export const useHEICSupport = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Detecta se o arquivo é HEIC
  const detectHEIC = useCallback((file: File): boolean => {
    const name = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();
    
    return name.endsWith('.heic') || 
           name.endsWith('.heif') || 
           mimeType === 'image/heic' || 
           mimeType === 'image/heif';
  }, []);

  // Verifica suporte do browser para HEIC
  const checkBrowserSupport = useCallback((): boolean => {
    // Cria um canvas temporário para testar suporte
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return false;

    // Testa se o browser suporta HEIC nativamente
    const img = new Image();
    
    // A maioria dos browsers não suporta HEIC nativamente
    // Safari no iOS/macOS tem suporte parcial
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    const isMac = userAgent.includes('mac');
    
    // Safari no iOS 11+ e macOS High Sierra+ têm suporte básico
    return isSafari && (isIOS || isMac);
  }, []);

  // Valida arquivo HEIC
  const validateHEICFile = useCallback((file: File): HEICValidationResult => {
    const isHEIC = detectHEIC(file);
    const isSupported = checkBrowserSupport();
    const needsConversion = isHEIC && !isSupported;
    
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (isHEIC) {
      if (!isSupported) {
        warnings.push('Seu navegador pode não conseguir visualizar o preview da imagem HEIC');
        suggestions.push('A imagem será processada normalmente para OCR, mesmo sem preview');
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        warnings.push('Arquivo HEIC muito grande pode demorar para processar');
        suggestions.push('Considere converter para JPEG para upload mais rápido');
      }
    }

    return {
      isHEIC,
      isSupported,
      needsConversion,
      warnings,
      suggestions
    };
  }, [detectHEIC, checkBrowserSupport]);

  // Valida múltiplos arquivos
  const validateMultipleHEICFiles = useCallback((files: File[]): Map<string, HEICValidationResult> => {
    const results = new Map<string, HEICValidationResult>();
    
    files.forEach(file => {
      const validation = validateHEICFile(file);
      results.set(file.name, validation);
    });

    // Mostra avisos consolidados
    const heicFiles = Array.from(results.entries()).filter(([, result]) => result.isHEIC);
    
    if (heicFiles.length > 0) {
      const unsupportedCount = heicFiles.filter(([, result]) => !result.isSupported).length;
      
      if (unsupportedCount > 0) {
        toast.info(
          `${unsupportedCount} arquivo(s) HEIC detectado(s). Preview pode não funcionar, mas o OCR processará normalmente.`,
          { duration: 4000 }
        );
      }
    }

    return results;
  }, [validateHEICFile]);

  return {
    isProcessing,
    detectHEIC,
    checkBrowserSupport,
    validateHEICFile,
    validateMultipleHEICFiles
  };
};