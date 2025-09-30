import { useState, useCallback } from 'react';

export interface FileValidationResult {
  file: File;
  isValid: boolean;
  severity: 'ok' | 'info' | 'warning' | 'critical';
  estimatedProcessingTime: number; // in seconds
  estimatedMemoryUsage: number; // in MB
  recommendedOptimizations: string[];
  shouldAutoOptimize: boolean;
  warnings: string[];
  errors: string[];
}

export const useIntelligentFileValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  const validateFile = useCallback(async (file: File): Promise<FileValidationResult> => {
    setIsValidating(true);
    
    try {
      const fileSizeMB = file.size / (1024 * 1024);
      const result: FileValidationResult = {
        file,
        isValid: true,
        severity: 'ok',
        estimatedProcessingTime: 0,
        estimatedMemoryUsage: 0,
        recommendedOptimizations: [],
        shouldAutoOptimize: false,
        warnings: [],
        errors: []
      };

      // Validate file type
      if (!file.type.includes('pdf')) {
        result.isValid = false;
        result.severity = 'critical';
        result.errors.push(`Tipo de arquivo não suportado: ${file.type}`);
        return result;
      }

      // Validate file size limits
      if (fileSizeMB > 20) {
        result.isValid = false;
        result.severity = 'critical';
        result.errors.push(`Arquivo muito grande: ${fileSizeMB.toFixed(1)}MB. Limite máximo: 20MB`);
        return result;
      }

      // Estimate processing requirements
      const baseProcessingTime = 30; // 30 seconds base
      const timePerMB = 15; // 15 seconds per MB
      result.estimatedProcessingTime = baseProcessingTime + (fileSizeMB * timePerMB);

      // Estimate memory usage (roughly 3-4x file size during processing)
      result.estimatedMemoryUsage = fileSizeMB * 3.5;

      // Determine severity and optimizations based on file size
      if (fileSizeMB > 15) {
        result.severity = 'critical';
        result.shouldAutoOptimize = true;
        result.warnings.push('Arquivo muito grande - aplicação automática de otimizações obrigatória');
        result.recommendedOptimizations.push(
          'Compressão agressiva (60% qualidade)',
          'DPI reduzido para 150-200',
          'Processamento página por página',
          'Limite de 50 páginas máximo',
          'Fallback Tesseract ativo'
        );
      } else if (fileSizeMB > 10) {
        result.severity = 'warning';
        result.shouldAutoOptimize = true;
        result.warnings.push('Arquivo grande - otimizações recomendadas para melhor performance');
        result.recommendedOptimizations.push(
          'Compressão moderada (70% qualidade)',
          'DPI ajustado para 200-250',
          'Processamento otimizado em lotes',
          'Fallback Tesseract ativo'
        );
      } else if (fileSizeMB > 5) {
        result.severity = 'info';
        result.recommendedOptimizations.push(
          'DPI adaptativo baseado no conteúdo',
          'Compressão leve se necessário',
          'Processamento padrão otimizado'
        );
      }

      // Additional validations for PDF structure (if possible)
      try {
        // Basic PDF validation - try to read as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
          result.isValid = false;
          result.severity = 'critical';
          result.errors.push('Arquivo PDF vazio ou corrompido');
          return result;
        }

        // Check PDF header
        const headerView = new Uint8Array(arrayBuffer, 0, 5);
        const headerString = String.fromCharCode(...headerView);
        if (!headerString.startsWith('%PDF')) {
          result.warnings.push('Formato PDF pode estar corrompido - cabeçalho não detectado');
        }

      } catch (error) {
        result.warnings.push('Não foi possível validar a estrutura do PDF');
      }

      // Performance warnings based on estimated processing time
      if (result.estimatedProcessingTime > 600) { // 10 minutes
        result.warnings.push(`Tempo estimado de processamento: ${Math.ceil(result.estimatedProcessingTime / 60)} minutos`);
      }

      // Memory warnings
      if (result.estimatedMemoryUsage > 200) { // 200MB
        result.warnings.push(`Alto uso de memória estimado: ${result.estimatedMemoryUsage.toFixed(0)}MB`);
      }

      return result;

    } catch (error) {
      return {
        file,
        isValid: false,
        severity: 'critical',
        estimatedProcessingTime: 0,
        estimatedMemoryUsage: 0,
        recommendedOptimizations: [],
        shouldAutoOptimize: false,
        warnings: [],
        errors: [`Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateMultipleFiles = useCallback(async (files: File[]): Promise<FileValidationResult[]> => {
    const results = await Promise.all(files.map(validateFile));
    return results;
  }, [validateFile]);

  const getOptimizationSuggestions = useCallback((results: FileValidationResult[]): string[] => {
    const suggestions: string[] = [];
    const totalSize = results.reduce((sum, result) => sum + (result.file.size / (1024 * 1024)), 0);
    const totalTime = results.reduce((sum, result) => sum + result.estimatedProcessingTime, 0);

    if (totalSize > 50) {
      suggestions.push('Considere processar arquivos em lotes menores para melhor performance');
    }

    if (totalTime > 1800) { // 30 minutes
      suggestions.push('Processamento total estimado acima de 30 minutos - considere otimizar arquivos');
    }

    const criticalFiles = results.filter(r => r.severity === 'critical').length;
    if (criticalFiles > 0) {
      suggestions.push(`${criticalFiles} arquivo(s) requerem otimização obrigatória`);
    }

    return suggestions;
  }, []);

  return {
    validateFile,
    validateMultipleFiles,
    getOptimizationSuggestions,
    isValidating
  };
};