import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface PageAnalysis {
  pageNumber: number;
  text: string;
  characterCount: number;
  textDensity: number;
  uniqueCharacterRatio: number;
  dictionaryWordRatio: number;
  isLikelyScanned: boolean;
}

export interface ExtractedText {
  text: string;
  pageCount: number;
  success: boolean;
  error?: string;
  // Enhanced metrics
  totalCharacters: number;
  averageTextDensity: number;
  lowQualityPages: number[];
  pageAnalysis: PageAnalysis[];
  overallQuality: 'high' | 'medium' | 'low';
  recommendOcr: boolean;
}

export const usePdfTextExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);

  // Simple word dictionary for basic validation
  const commonWords = new Set([
    'o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on'
  ]);

  const calculatePageMetrics = (text: string, pageNumber: number, pageArea: number): PageAnalysis => {
    const textDensity = pageArea > 0 ? (text.length / pageArea) * 100000 : 0;
    const uniqueChars = new Set(text.toLowerCase().replace(/\s/g, ''));
    const uniqueCharacterRatio = text.length > 0 ? uniqueChars.size / text.length : 0;
    
    const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(word => word.length > 1);
    const dictionaryWords = words.filter(word => commonWords.has(word));
    const dictionaryWordRatio = words.length > 0 ? dictionaryWords.length / words.length : 0;
    
    const isLikelyScanned = textDensity < 0.8 || uniqueCharacterRatio < 0.02 || dictionaryWordRatio < 0.15 || text.length < 100;

    return {
      pageNumber,
      text,
      characterCount: text.length,
      textDensity,
      uniqueCharacterRatio,
      dictionaryWordRatio,
      isLikelyScanned
    };
  };

  const extractTextFromPdf = useCallback(async (file: File): Promise<ExtractedText> => {
    setIsExtracting(true);
    
    try {
      console.log('🔍 [PDF.js Client] Starting text extraction for:', file.name, 'Size:', file.size);
      
      // Validate file type
      if (!file.type.includes('pdf')) {
        throw new Error(`Invalid file type: ${file.type}. Expected PDF.`);
      }
      
      // Convert to ArrayBuffer with size check
      if (file.size > 50 * 1024 * 1024) { // 50MB limit for client-side processing
        throw new Error('File too large for client-side processing. Use server processing instead.');
      }
      
      console.log('🔍 [PDF.js Client] Converting to ArrayBuffer...');
      const arrayBuffer = await file.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('File appears to be empty or corrupted');
      }
      
      console.log('🔍 [PDF.js Client] Loading PDF document...');
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0 // Reduce console noise
      }).promise;
      
      console.log(`🔍 [PDF.js Client] PDF loaded: ${pdf.numPages} pages`);
      
      if (pdf.numPages === 0) {
        throw new Error('PDF contains no pages');
      }
      
      let fullText = '';
      let extractedPages = 0;
      const pageAnalysis: PageAnalysis[] = [];
      const lowQualityPages: number[] = [];
      
      // Extract text from all pages with enhanced analysis
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1.0 });
          const pageArea = viewport.width * viewport.height;
          
          const pageText = textContent.items
            .filter((item: any) => item.str && item.str.trim())
            .map((item: any) => item.str.trim())
            .join(' ');
          
          // Analyze page quality
          const analysis = calculatePageMetrics(pageText, pageNum, pageArea);
          pageAnalysis.push(analysis);
          
          if (analysis.isLikelyScanned) {
            lowQualityPages.push(pageNum);
          }
          
          if (pageText.length > 10) { // Only count pages with meaningful text
            fullText += `\n\n=== Página ${pageNum} ===\n${pageText}`;
            extractedPages++;
          }
          
          // Progress logging for large documents
          if (pdf.numPages > 20 && pageNum % 10 === 0) {
            console.log(`🔍 [PDF.js Client] Progress: ${pageNum}/${pdf.numPages} pages analyzed`);
          }
        } catch (pageError) {
          console.warn(`⚠️ [PDF.js Client] Failed to extract page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }
      
      const textLength = fullText.trim().length;
      const hasGoodText = textLength > 100 && extractedPages > 0;
      
      // Calculate enhanced metrics
      const totalCharacters = textLength;
      const averageTextDensity = pageAnalysis.length > 0 ? 
        pageAnalysis.reduce((sum, p) => sum + p.textDensity, 0) / pageAnalysis.length : 0;
      
      const lowQualityRatio = lowQualityPages.length / pdf.numPages;
      
      // Determine overall quality
      let overallQuality: 'high' | 'medium' | 'low';
      if (lowQualityRatio <= 0.2 && averageTextDensity > 1.0 && hasGoodText) {
        overallQuality = 'high';
      } else if (lowQualityRatio <= 0.5 && averageTextDensity > 0.5) {
        overallQuality = 'medium';
      } else {
        overallQuality = 'low';
      }
      
      const recommendOcr = overallQuality === 'low' || lowQualityRatio > 0.6;
      
      console.log(`🔍 [PDF.js Client] Enhanced analysis complete:`);
      console.log(`  - ${textLength} chars from ${extractedPages}/${pdf.numPages} pages`);
      console.log(`  - Quality: ${overallQuality} (${lowQualityPages.length} low-quality pages)`);
      console.log(`  - Average text density: ${averageTextDensity.toFixed(2)}`);
      console.log(`  - OCR recommended: ${recommendOcr}`);
      
      return {
        text: fullText.trim(),
        pageCount: pdf.numPages,
        success: hasGoodText,
        error: hasGoodText ? undefined : `Insufficient text extracted (${textLength} chars from ${extractedPages} pages). PDF may be image-based.`,
        totalCharacters,
        averageTextDensity,
        lowQualityPages,
        pageAnalysis,
        overallQuality,
        recommendOcr
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown PDF.js error';
      console.error('❌ [PDF.js Client] Extraction failed:', errorMessage);
      
      return {
        text: '',
        pageCount: 0,
        success: false,
        error: errorMessage,
        totalCharacters: 0,
        averageTextDensity: 0,
        lowQualityPages: [],
        pageAnalysis: [],
        overallQuality: 'low',
        recommendOcr: true
      };
    } finally {
      setIsExtracting(false);
    }
  }, [commonWords]);

  return {
    extractTextFromPdf,
    isExtracting
  };
};