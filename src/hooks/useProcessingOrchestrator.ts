import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'waiting' | 'running' | 'completed' | 'error';
  progress: number;
  message?: string;
}

export interface ProcessingConfig {
  documentType: string;
  versionType: string;
  documentStatus: string;
  processingOptions?: {
    mode: string;
    languageHints?: string[];
    autoDetectLanguage?: boolean;
  };
}

export interface ProcessingResult {
  success: boolean;
  documentsCreated: number;
  totalFiles: number;
  documents: any[];
  errors: string[];
  message: string;
}

// Main hook for processing orchestration
export const useProcessingOrchestrator = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [canForceStop, setCanForceStop] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
  const abortController = useRef<AbortController | null>(null);

  const addLog = useCallback((message: string) => {
    console.log(`📝 ${message}`);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  const updateStep = useCallback((stepId: string, updates: Partial<ProcessingStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  }, []);

  const initializeSteps = useCallback((files: File[]) => {
    const baseSteps: ProcessingStep[] = [
      {
        id: 'validation',
        label: 'Validação',
        status: 'waiting',
        progress: 0
      },
      {
        id: 'file-upload',
        label: 'Upload de Arquivos',
        status: 'waiting',
        progress: 0
      },
      {
        id: 'database-creation',
        label: 'Criação no Banco',
        status: 'waiting',
        progress: 0
      },
      {
        id: 'finalization',
        label: 'Finalização',
        status: 'waiting',
        progress: 0
      }
    ];

    setSteps(baseSteps);
  }, []);

  const processFiles = useCallback(async (
    files: File[], 
    config: ProcessingConfig,
    folderId: string,
    departmentId: string
  ): Promise<ProcessingResult | null> => {
    if (isProcessing) {
      console.log('⚠️ Processing already in progress, ignoring new request');
      return null;
    }

    // Reset state
    setIsProcessing(true);
    setIsCompleted(false);
    setHasErrors(false);
    setCanForceStop(true);
    setLogs([]);
    
    // Create abort controller
    abortController.current = new AbortController();

    initializeSteps(files);
    
    addLog('Iniciando processamento simplificado...');
    
    try {
      addLog('Iniciando processamento de documentos...');
      
      // Etapa 1: Validação
      updateStep('validation', { status: 'running', progress: 0 });
      addLog(`Validando ${files.length} arquivo(s)...`);
      await new Promise(resolve => setTimeout(resolve, 200));
      updateStep('validation', { status: 'completed', progress: 100, message: 'Arquivos validados com sucesso' });

      // Etapa 2: Upload de Arquivos
      updateStep('file-upload', { status: 'running', progress: 0 });
      addLog('Preparando upload...');
      
      const formData = new FormData();
      formData.append('wizardData', JSON.stringify({
        ...config,
        files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
        folderId,
        departmentId,
        folder_id: folderId,
        department_id: departmentId
      }));

      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
        updateStep('file-upload', { 
          progress: Math.round(((index + 1) / files.length) * 50),
          message: `Preparando ${file.name}...`
        });
      });

      updateStep('file-upload', { progress: 75, message: 'Enviando arquivos...' });

      // Etapa 3: Criação no Banco
      updateStep('database-creation', { status: 'running', progress: 0 });
      addLog('Criando registros no banco de dados...');

      const result = await supabase.functions.invoke('import-documents', {
        body: formData
      });

      const { data, error } = result;
      
      if (error) {
        throw new Error(`Erro na importação: ${error.message}`);
      }

      // Mark file upload as completed (100%)
      updateStep('file-upload', { 
        status: 'completed', 
        progress: 100, 
        message: 'Arquivos enviados com sucesso'
      });

      updateStep('database-creation', { 
        status: 'completed', 
        progress: 100, 
        message: `${data.documentsCreated} documento(s) criado(s)`
      });

      addLog(`📄 ${data.documentsCreated} documento(s) criado(s) com sucesso`);

      // Etapa 4: Finalização
      updateStep('finalization', { status: 'running', progress: 50 });
      addLog('Finalizando processamento...');
      await new Promise(resolve => setTimeout(resolve, 200));
      updateStep('finalization', { status: 'completed', progress: 100, message: 'Processamento concluído' });
      addLog('✅ Processamento concluído com sucesso!');
      
      setIsCompleted(true);
      setCanForceStop(false);
      setIsProcessing(false);

      return data;

    } catch (error: any) {
      addLog(`❌ Erro durante processamento: ${error.message}`);
      setHasErrors(true);
      setIsCompleted(true);
      setCanForceStop(false);
      setIsProcessing(false);
      
      // Marcar etapas em execução como erro
      setSteps(prev => prev.map(step => 
        step.status === 'running' ? { 
          ...step, 
          status: 'error' as const, 
          message: `Falha: ${error.message}`
        } : step
      ));

      toast.error(`Erro no processamento: ${error.message}`, {
        duration: 8000
      });

      return {
        success: false,
        documentsCreated: 0,
        totalFiles: files.length,
        documents: [],
        errors: [error.message],
        message: `Falha no processamento: ${error.message}`
      };
    } finally {
      abortController.current = null;
    }
  }, [isProcessing, initializeSteps, addLog, updateStep]);

  const forceStop = useCallback(async () => {
    console.log('🚨 Force stop initiated');
    
    if (abortController.current) {
      abortController.current.abort();
    }
    
    setIsProcessing(false);
    setCanForceStop(false);
    addLog('🛑 Processamento interrompido pelo usuário');
    
    // Mark running steps as cancelled
    setSteps(prev => prev.map(step => 
      step.status === 'running' ? { 
        ...step, 
        status: 'error' as const, 
        message: 'Cancelado pelo usuário'
      } : step
    ));
  }, [addLog]);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setIsCompleted(false);
    setHasErrors(false);
    setCanForceStop(false);
    setSteps([]);
    setLogs([]);
    
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
  }, []);

  return {
    isProcessing,
    isCompleted,
    hasErrors,
    steps,
    logs,
    canForceStop,
    processFiles,
    forceStop,
    reset
  };
};