import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

export interface PageQualityMetrics {
  pageNumber: number;
  textDensity: number;
  uniqueCharacterRatio: number;
  dictionaryWordRatio: number;
  xObjectCount: number;
  imageCount: number;
  isNativeText: boolean;
  confidence: number;
}

export interface PdfQualityAnalysis {
  overallScore: number;
  hasOutline: boolean;
  hasBookmarks: boolean;
  recommendedMode: 'text_extraction' | 'ocr_all' | 'hybrid';
  pageMetrics: PageQualityMetrics[];
  sampledPages: number[];
  ocrRecommendedPages: number[];
  confidence: number;
  processingStrategy: string;
}

export const usePdfQualityAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Configure PDF.js worker if not already configured
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }

  // Simple word dictionary for basic validation
  const commonWords = new Set([
    'o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on'
  ]);

  const calculateTextDensity = (text: string, pageArea: number): number => {
    // Normalize by estimated page area (characters per "standard" page)
    const standardPageArea = 500000; // Approximate pixels for A4 at 150 DPI
    const normalizedArea = pageArea || standardPageArea;
    return (text.length / normalizedArea) * 1000; // Scale for readability
  };

  const calculateUniqueCharacterRatio = (text: string): number => {
    if (text.length === 0) return 0;
    const uniqueChars = new Set(text.toLowerCase().replace(/\s/g, ''));
    return uniqueChars.size / text.length;
  };

  const calculateDictionaryWordRatio = (text: string): number => {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
    
    if (words.length === 0) return 0;
    
    const dictionaryWords = words.filter(word => commonWords.has(word));
    return dictionaryWords.length / words.length;
  };

  const getSmartSamplePages = (totalPages: number): number[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const samplePages = [1]; // Always include first page
    
    // Add middle pages
    const middle = Math.floor(totalPages / 2);
    samplePages.push(middle);
    
    if (totalPages > 10) {
      const quarter = Math.floor(totalPages / 4);
      const threeQuarter = Math.floor(3 * totalPages / 4);
      samplePages.push(quarter, threeQuarter);
    }
    
    // Always include last page
    if (totalPages > 1) {
      samplePages.push(totalPages);
    }
    
    return [...new Set(samplePages)].sort((a, b) => a - b);
  };

  const analyzePageQuality = async (
    page: any, 
    pageNumber: number
  ): Promise<PageQualityMetrics> => {
    try {
      // Get text content
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item: any) => item.str && item.str.trim())
        .map((item: any) => item.str.trim())
        .join(' ');

      // Get page viewport for area calculation
      const viewport = page.getViewport({ scale: 1.0 });
      const pageArea = viewport.width * viewport.height;

      // Calculate metrics
      const textDensity = calculateTextDensity(pageText, pageArea);
      const uniqueCharacterRatio = calculateUniqueCharacterRatio(pageText);
      const dictionaryWordRatio = calculateDictionaryWordRatio(pageText);

      // Get annotations and objects
      const annotations = await page.getAnnotations();
      const xObjectCount = annotations.length;

      // Estimate image count (simplified - would need more complex analysis)
      const imageCount = Math.floor(xObjectCount * 0.3); // Rough estimate

      // Determine if this looks like native text
      const isNativeText = textDensity > 0.5 && 
                          uniqueCharacterRatio > 0.02 && 
                          dictionaryWordRatio > 0.15 &&
                          pageText.length > 50;

      // Calculate confidence score
      let confidence = 0;
      if (isNativeText) {
        confidence = Math.min(0.9, 
          (textDensity * 0.3) + 
          (uniqueCharacterRatio * 50 * 0.3) + 
          (dictionaryWordRatio * 0.4)
        );
      } else {
        confidence = Math.max(0.1, 1 - (
          (textDensity * 0.3) + 
          (uniqueCharacterRatio * 50 * 0.3) + 
          (dictionaryWordRatio * 0.4)
        ));
      }

      return {
        pageNumber,
        textDensity,
        uniqueCharacterRatio,
        dictionaryWordRatio,
        xObjectCount,
        imageCount,
        isNativeText,
        confidence
      };
    } catch (error) {
      console.warn(`⚠️ Failed to analyze page ${pageNumber}:`, error);
      return {
        pageNumber,
        textDensity: 0,
        uniqueCharacterRatio: 0,
        dictionaryWordRatio: 0,
        xObjectCount: 0,
        imageCount: 0,
        isNativeText: false,
        confidence: 0.1
      };
    }
  };

  const analyzePdfQuality = useCallback(async (file: File): Promise<PdfQualityAnalysis> => {
    setIsAnalyzing(true);
    
    try {
      console.log('🔍 [PDF Quality] Starting quality analysis for:', file.name);
      
      // Validate file type
      if (!file.type.includes('pdf')) {
        throw new Error(`Invalid file type: ${file.type}. Expected PDF.`);
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0
      }).promise;
      
      console.log(`🔍 [PDF Quality] Analyzing ${pdf.numPages} pages...`);
      
      // Check for outline/bookmarks
      let hasOutline = false;
      let hasBookmarks = false;
      try {
        const outline = await pdf.getOutline();
        hasOutline = outline && outline.length > 0;
        hasBookmarks = hasOutline; // Simplified check
      } catch (e) {
        // PDF might not have outline
      }

      // Get smart sample pages
      const sampledPages = getSmartSamplePages(pdf.numPages);
      console.log(`🔍 [PDF Quality] Sampling pages: ${sampledPages.join(', ')}`);

      // Analyze sampled pages
      const pageMetrics: PageQualityMetrics[] = [];
      for (const pageNum of sampledPages) {
        try {
          const page = await pdf.getPage(pageNum);
          const metrics = await analyzePageQuality(page, pageNum);
          pageMetrics.push(metrics);
        } catch (error) {
          console.warn(`⚠️ Failed to analyze page ${pageNum}:`, error);
        }
      }

      // Calculate overall statistics with simplified logic
      const nativeTextPages = pageMetrics.filter(m => m.isNativeText).length;
      const totalSampled = pageMetrics.length || 1; // Prevent division by zero
      const nativeTextRatio = nativeTextPages / totalSampled;
      
      const avgConfidence = pageMetrics.length > 0 ? 
        pageMetrics.reduce((sum, m) => sum + m.confidence, 0) / totalSampled : 0;
      
      const avgTextDensity = pageMetrics.length > 0 ? 
        pageMetrics.reduce((sum, m) => sum + m.textDensity, 0) / totalSampled : 0;
      
      const avgDictionaryRatio = pageMetrics.length > 0 ? 
        pageMetrics.reduce((sum, m) => sum + m.dictionaryWordRatio, 0) / totalSampled : 0;

      // Simplified decision logic
      let recommendedMode: 'text_extraction' | 'ocr_all' | 'hybrid' = 'text_extraction';
      let processingStrategy = 'Default text extraction';

      if (nativeTextRatio >= 0.7 && avgTextDensity > 0.5) {
        recommendedMode = 'text_extraction';
        processingStrategy = 'High-quality native text detected';
      } else if (nativeTextRatio <= 0.3 || avgTextDensity < 0.2) {
        recommendedMode = 'ocr_all';
        processingStrategy = 'Low text quality detected, use OCR';
      } else {
        recommendedMode = 'hybrid';
        processingStrategy = 'Mixed quality detected, use hybrid approach';
      }

      const ocrRecommendedPages = pageMetrics
        .filter(m => !m.isNativeText)
        .map(m => m.pageNumber);

      const overallScore = Math.min(1, Math.max(0, 
        (nativeTextRatio * 0.5) + (avgTextDensity * 0.3) + (avgConfidence * 0.2)
      ));

      const result: PdfQualityAnalysis = {
        overallScore,
        hasOutline,
        hasBookmarks,
        recommendedMode,
        pageMetrics,
        sampledPages,
        ocrRecommendedPages,
        confidence: avgConfidence,
        processingStrategy
      };

      console.log(`🔍 [PDF Quality] Analysis complete:`, result);
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';
      console.error('❌ [PDF Quality] Analysis failed:', errorMessage);
      
      // Return fallback analysis
      return {
        overallScore: 0.1,
        hasOutline: false,
        hasBookmarks: false,
        recommendedMode: 'ocr_all',
        pageMetrics: [],
        sampledPages: [],
        ocrRecommendedPages: [],
        confidence: 0.1,
        processingStrategy: 'Analysis failed. Defaulting to OCR.'
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyzePdfQuality,
    isAnalyzing
  };
};