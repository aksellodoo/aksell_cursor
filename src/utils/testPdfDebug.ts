// Utility functions for debugging PDF.js and testing ingest-raw-text

import { supabase } from '@/integrations/supabase/client';

export const testIngestRawText = async () => {
  try {
    console.log('🧪 [Test] Testing ingest-raw-text function...');
    
    const testData = {
      document_id: 'test-document-id',
      extracted_text: 'Este é um texto de teste para verificar se a função ingest-raw-text está funcionando corretamente. Este texto deve ser dividido em chunks e processado para criar embeddings.'
    };
    
    const { data, error } = await supabase.functions.invoke('ingest-raw-text', {
      body: testData
    });
    
    if (error) {
      console.error('❌ [Test] ingest-raw-text test failed:', error);
      return { success: false, error };
    }
    
    console.log('✅ [Test] ingest-raw-text test successful:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ [Test] ingest-raw-text test exception:', error);
    return { success: false, error };
  }
};

export const checkPdfJsWorker = () => {
  try {
    console.log('🧪 [Test] Checking PDF.js worker configuration...');
    
    // @ts-ignore
    const workerSrc = window.pdfjsLib?.GlobalWorkerOptions?.workerSrc;
    console.log('🧪 [Test] PDF.js worker source:', workerSrc);
    
    if (workerSrc) {
      console.log('✅ [Test] PDF.js worker is configured');
      return true;
    } else {
      console.error('❌ [Test] PDF.js worker is not configured');
      return false;
    }
  } catch (error) {
    console.error('❌ [Test] Error checking PDF.js worker:', error);
    return false;
  }
};

// Add to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).testPdfDebug = {
    testIngestRawText,
    checkPdfJsWorker
  };
}