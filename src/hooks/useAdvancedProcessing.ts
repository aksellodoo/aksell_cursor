import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProcessingMetrics {
  sessionId: string;
  startTime: number;
  textExtractionTime?: number;
  ocrProcessingTime?: number;
  embeddingTime?: number;
  cacheHits: number;
  cacheMisses: number;
  apiCalls: Record<string, number>;
  estimatedCost: number;
  adaptiveDpiUsed?: number;
  earlyStoppingTriggered: boolean;
}

interface CacheRequest {
  action: 'get' | 'set';
  key: string;
  data?: any;
  type: 'ocr' | 'embedding' | 'quality_analysis';
  provider?: string;
  contentHash?: string;
  pageNumber?: number;
  fileSize?: number;
}

interface OptimizationConfig {
  enableEarlyStopping: boolean;
  earlyStoppingThreshold: number; // percentage of native text pages
  enableAdaptiveDpi: boolean;
  minDpi: number;
  maxDpi: number;
  enableImageCompression: boolean;
  compressionQuality: number; // 0-100
  maxParallelProcessing: number;
}

export const useAdvancedProcessing = () => {
  const [metrics, setMetrics] = useState<ProcessingMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const optimizationConfig = useRef<OptimizationConfig>({
    enableEarlyStopping: true,
    earlyStoppingThreshold: 80,
    enableAdaptiveDpi: true,
    minDpi: 150,
    maxDpi: 300,
    enableImageCompression: true,
    compressionQuality: 85,
    maxParallelProcessing: 3
  });

  // Initialize processing session with metrics
  const initializeProcessingSession = useCallback((fileCount: number) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metrics: ProcessingMetrics = {
      sessionId,
      startTime: Date.now(),
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: {},
      estimatedCost: 0,
      earlyStoppingTriggered: false
    };
    
    setMetrics(metrics);
    console.log(`🚀 Advanced Processing Session Started: ${sessionId}`);
    return sessionId;
  }, []);

  // Cache management
  const cacheOperation = useCallback(async (request: CacheRequest): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('cache-manager', {
        body: request
      });

      if (error) {
        console.error('❌ Cache operation failed:', error);
        setMetrics(prev => prev ? { ...prev, cacheMisses: prev.cacheMisses + 1 } : prev);
        return null;
      }

      if (request.action === 'get') {
        if (data.hit) {
          setMetrics(prev => prev ? { ...prev, cacheHits: prev.cacheHits + 1 } : prev);
          console.log(`✅ Cache hit for key: ${request.key}`);
          return data.data;
        } else {
          setMetrics(prev => prev ? { ...prev, cacheMisses: prev.cacheMisses + 1 } : prev);
          console.log(`❌ Cache miss for key: ${request.key}`);
          return null;
        }
      }

      return data;
    } catch (error) {
      console.error('❌ Cache operation error:', error);
      setMetrics(prev => prev ? { ...prev, cacheMisses: prev.cacheMisses + 1 } : prev);
      return null;
    }
  }, []);

  // Generate cache key for content
  const generateCacheKey = useCallback((content: string, type: string, provider?: string, pageNumber?: number): string => {
    const contentHash = btoa(content).slice(0, 32); // Simple hash
    return `${type}_${provider || 'default'}_${contentHash}_p${pageNumber || 0}`;
  }, []);

  // Intelligent DPI selection based on page size
  const calculateOptimalDpi = useCallback((pageWidth: number, pageHeight: number): number => {
    if (!optimizationConfig.current.enableAdaptiveDpi) {
      return optimizationConfig.current.maxDpi;
    }

    const pageArea = pageWidth * pageHeight;
    
    // Small pages (< 500k pixels) use higher DPI for better OCR
    if (pageArea < 500000) {
      return optimizationConfig.current.maxDpi;
    }
    
    // Medium pages use medium DPI
    if (pageArea < 1000000) {
      return Math.round((optimizationConfig.current.minDpi + optimizationConfig.current.maxDpi) / 2);
    }
    
    // Large pages use lower DPI to save processing time
    return optimizationConfig.current.minDpi;
  }, []);

  // Early stopping decision
  const shouldTriggerEarlyStopping = useCallback((processedPages: number, nativeTextPages: number): boolean => {
    if (!optimizationConfig.current.enableEarlyStopping || processedPages < 5) {
      return false;
    }

    const nativeTextPercentage = (nativeTextPages / processedPages) * 100;
    const shouldStop = nativeTextPercentage >= optimizationConfig.current.earlyStoppingThreshold;
    
    if (shouldStop) {
      console.log(`⏹️ Early stopping triggered: ${nativeTextPercentage.toFixed(1)}% native text`);
      setMetrics(prev => prev ? { ...prev, earlyStoppingTriggered: true } : prev);
    }
    
    return shouldStop;
  }, []);

  // Image compression for better API performance
  const compressImage = useCallback(async (imageData: string): Promise<string> => {
    if (!optimizationConfig.current.enableImageCompression) {
      return imageData;
    }

    try {
      // Create canvas and compress image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          // Reduce size if too large
          const maxSize = 1024;
          let { width, height } = img;
          
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedData = canvas.toDataURL('image/jpeg', optimizationConfig.current.compressionQuality / 100);
          resolve(compressedData);
        };
        img.src = imageData;
      });
    } catch (error) {
      console.error('❌ Image compression failed:', error);
      return imageData;
    }
  }, []);

  // API health monitoring
  const checkApiHealth = useCallback(async (): Promise<any> => {
    try {
      setIsMonitoring(true);
      const { data, error } = await supabase.functions.invoke('health-monitor');

      if (error) {
        console.error('❌ Health check failed:', error);
        return null;
      }

      setHealthStatus(data);
      console.log(`🏥 API Health Status: ${data.overall_status}`);
      return data;
    } catch (error) {
      console.error('❌ Health monitoring error:', error);
      return null;
    } finally {
      setIsMonitoring(false);
    }
  }, []);

  // Smart retry with exponential backoff
  const retryWithBackoff = useCallback(async (
    operation: () => Promise<any>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<any> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, []);

  // Save performance metrics to database
  const savePerformanceMetrics = useCallback(async (
    documentId: string,
    fileName: string,
    fileSize: number,
    totalPages: number,
    qualityScore?: number,
    ocrConfidence?: number
  ) => {
    if (!metrics) return;

    try {
      const totalTime = Date.now() - metrics.startTime;
      
      const { error } = await supabase
        .from('processing_performance_metrics')
        .insert({
          document_id: documentId,
          processing_session_id: metrics.sessionId,
          file_name: fileName,
          file_size: fileSize,
          total_pages: totalPages,
          total_processing_time_ms: totalTime,
          text_extraction_time_ms: metrics.textExtractionTime,
          ocr_processing_time_ms: metrics.ocrProcessingTime,
          embedding_time_ms: metrics.embeddingTime,
          overall_quality_score: qualityScore,
          ocr_confidence_avg: ocrConfidence,
          cache_hits: metrics.cacheHits,
          cache_misses: metrics.cacheMisses,
          early_stopping_triggered: metrics.earlyStoppingTriggered,
          adaptive_dpi_used: metrics.adaptiveDpiUsed,
          api_calls_made: metrics.apiCalls,
          estimated_cost_usd: metrics.estimatedCost
        });

      if (error) {
        console.error('❌ Failed to save performance metrics:', error);
      } else {
        console.log(`📊 Performance metrics saved for session: ${metrics.sessionId}`);
      }
    } catch (error) {
      console.error('❌ Error saving performance metrics:', error);
    }
  }, [metrics]);

  // Update processing time for specific phase
  const updatePhaseTime = useCallback((phase: 'textExtraction' | 'ocrProcessing' | 'embedding', duration: number) => {
    setMetrics(prev => {
      if (!prev) return prev;
      
      switch (phase) {
        case 'textExtraction':
          return { ...prev, textExtractionTime: duration };
        case 'ocrProcessing':
          return { ...prev, ocrProcessingTime: duration };
        case 'embedding':
          return { ...prev, embeddingTime: duration };
        default:
          return prev;
      }
    });
  }, []);

  // Track API usage and costs
  const trackApiUsage = useCallback((provider: string, cost: number = 0) => {
    setMetrics(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        apiCalls: {
          ...prev.apiCalls,
          [provider]: (prev.apiCalls[provider] || 0) + 1
        },
        estimatedCost: prev.estimatedCost + cost
      };
    });
  }, []);

  return {
    // State
    metrics,
    healthStatus,
    isMonitoring,
    optimizationConfig: optimizationConfig.current,

    // Methods
    initializeProcessingSession,
    cacheOperation,
    generateCacheKey,
    calculateOptimalDpi,
    shouldTriggerEarlyStopping,
    compressImage,
    checkApiHealth,
    retryWithBackoff,
    savePerformanceMetrics,
    updatePhaseTime,
    trackApiUsage,

    // Utils
    updateOptimizationConfig: (newConfig: Partial<OptimizationConfig>) => {
      optimizationConfig.current = { ...optimizationConfig.current, ...newConfig };
    }
  };
};