import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OcrAvailability {
  available: boolean;
  checking: boolean;
  error?: string;
  missingSecrets?: string[];
  diagnostics?: {
    hasAllSecrets: boolean;
    hasValidationErrors: boolean;
    apiConnectivityTested: boolean;
    apiConnectivitySuccess: boolean;
    processingTimeMs?: number;
  };
  validation?: Record<string, any>;
  functionStatus?: 'healthy' | 'error' | 'unavailable';
  lastChecked?: string;
}

export const useOcrAvailability = () => {
  const [availability, setAvailability] = useState<OcrAvailability>({
    available: false,
    checking: false,
    functionStatus: 'unavailable'
  });

  useEffect(() => {
    checkOcrAvailability();
  }, []);

  const checkOcrAvailability = async (retryCount = 0) => {
    const maxRetries = 2;
    const startTime = Date.now();
    
    try {
      console.log(`🔍 [OCR Hook] Checking availability (attempt ${retryCount + 1}/${maxRetries + 1})`);
      setAvailability(prev => ({ 
        ...prev, 
        checking: true, 
        error: undefined,
        lastChecked: new Date().toISOString()
      }));

      // Progressive delay for retries
      if (retryCount > 0) {
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 3000);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Call the edge function with timeout
      const timeoutMs = 8000; // 8 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      console.log('📡 Invoking check-ocr-availability function...');
      const { data, error } = await supabase.functions.invoke('check-ocr-availability', {
        body: {},
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);
      const processingTime = Date.now() - startTime;

      if (error) {
        console.error(`❌ [OCR Hook] Function error (${processingTime}ms):`, error);
        
        // Check if this is a function not found error (deployment issue)
        if (error.message?.includes('FunctionsRelayError') || 
            error.message?.includes('Edge Function not found') ||
            error.message?.includes('404') ||
            error.message?.includes('function_id: <nil>')) {
          console.warn('⚠️ [OCR Hook] Function deployment issue detected:', error.message);
          
          // Try one more time after a short delay for deployment issues
          if (retryCount === 0) {
            console.log('🔄 [OCR Hook] Retrying once more for deployment issue...');
            setTimeout(() => checkOcrAvailability(1), 2000);
            return;
          }
          
          setAvailability({
            available: false,
            checking: false,
            error: 'OCR function não está disponível. Aguarde o deployment ou recarregue a página.',
            functionStatus: 'unavailable',
            missingSecrets: [],
            diagnostics: {
              hasAllSecrets: false,
              hasValidationErrors: false,
              apiConnectivityTested: false,
              apiConnectivitySuccess: false,
              processingTimeMs: processingTime
            },
            lastChecked: new Date().toISOString()
          });
          return;
        }
        
        // Retry on transient errors
        if ((error.message?.includes('fetch') || 
             error.message?.includes('network') ||
             error.message?.includes('timeout') ||
             error.message?.includes('502') ||
             error.message?.includes('503')) && 
            retryCount < maxRetries) {
          console.log(`🔄 [OCR Hook] Retrying due to transient error...`);
          await checkOcrAvailability(retryCount + 1);
          return;
        }
        
        setAvailability({
          available: false,
          checking: false,
          error: `Erro na verificação: ${error.message}`,
          functionStatus: 'error',
          missingSecrets: [],
          diagnostics: {
            hasAllSecrets: false,
            hasValidationErrors: true,
            apiConnectivityTested: false,
            apiConnectivitySuccess: false,
            processingTimeMs: processingTime
          },
          lastChecked: new Date().toISOString()
        });
        return;
      }

      if (!data) {
        console.warn('⚠️ [OCR Hook] No data received from function');
        setAvailability({
          available: false,
          checking: false,
          error: 'Nenhum dado recebido da função OCR',
          functionStatus: 'error',
          lastChecked: new Date().toISOString()
        });
        return;
      }

      console.log(`✅ [OCR Hook] Success (${processingTime}ms):`, {
        available: data.available,
        missingSecrets: data.missingSecrets?.length || 0,
        functionStatus: data.functionStatus
      });
      
      setAvailability({
        available: data.available || false,
        checking: false,
        error: undefined,
        missingSecrets: data.missingSecrets || [],
        diagnostics: data.diagnostics ? {
          ...data.diagnostics,
          processingTimeMs: processingTime
        } : {
          hasAllSecrets: false,
          hasValidationErrors: false,
          apiConnectivityTested: false,
          apiConnectivitySuccess: false,
          processingTimeMs: processingTime
        },
        validation: data.validation || {},
        functionStatus: data.functionStatus || 'healthy',
        lastChecked: new Date().toISOString()
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ [OCR Hook] Unexpected error (${processingTime}ms):`, error);
      
      // Retry on unexpected errors
      if (retryCount < maxRetries) {
        console.log(`🔄 [OCR Hook] Retrying due to unexpected error...`);
        await checkOcrAvailability(retryCount + 1);
        return;
      }
      
      setAvailability({
        available: false,
        checking: false,
        error: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        functionStatus: 'error',
        missingSecrets: [],
        diagnostics: {
          hasAllSecrets: false,
          hasValidationErrors: true,
          apiConnectivityTested: false,
          apiConnectivitySuccess: false,
          processingTimeMs: processingTime
        },
        lastChecked: new Date().toISOString()
      });
    }
  };

  const recheckAvailability = () => {
    console.log('🔄 [OCR Hook] Manual recheck requested');
    checkOcrAvailability(0);
  };

  return {
    ...availability,
    recheckAvailability,
  };
};