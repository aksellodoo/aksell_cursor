import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PowerpointSlide {
  slideNumber: number;
  textExtracted: string;
  ocrContent?: string;
  combinedContent: string;
  semanticAnalysis?: string;
  confidenceScore: number;
  imageBase64?: string;
}

export interface PowerpointOcrResult {
  slides: PowerpointSlide[];
  totalSlides: number;
  success: boolean;
  error?: string;
  processingStats: {
    textExtractionTime: number;
    ocrProcessingTime: number;
    totalProcessingTime: number;
    slidesWithOcr: number;
    avgConfidenceScore: number;
  };
}

export const usePowerpointOcrProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processWithOcr = useCallback(async (
    file: File, 
    extractedText: string,
    options: {
      enableOcr?: boolean;
      ocrMode?: 'auto' | 'force' | 'skip';
      targetDpi?: number;
    } = {}
  ): Promise<PowerpointOcrResult> => {
    setIsProcessing(true);
    const startTime = Date.now();

    try {
      // Step 1: Convert PowerPoint to images (optimized DPI)
      const slideImages = await convertPowerpointToImages(file, options.targetDpi || 150);
      
      if (!slideImages.success || slideImages.images.length === 0) {
        // Fallback to text-only processing
        return createTextOnlyResult(extractedText, Date.now() - startTime);
      }

      // Step 2: Parse extracted text by slides (basic heuristic)
      const textSlides = parseTextBySlides(extractedText, slideImages.images.length);

      // Step 3: Determine which slides need OCR
      const slidesToProcess = await determineSlidesForOcr(
        slideImages.images, 
        textSlides, 
        options.ocrMode || 'auto'
      );

      // Step 4: Process slides with OCR if needed
      const ocrResults: Array<{ slideNumber: number; ocrContent: string; semanticAnalysis?: string; confidence: number }> = [];
      
      if (slidesToProcess.length > 0 && options.enableOcr !== false) {
        console.log(`🎯 Processing ${slidesToProcess.length} slides with OCR`);
        
        for (const slideInfo of slidesToProcess) {
          try {
            const ocrResult = await processSlideWithOcr(slideInfo.imageBase64, slideInfo.slideNumber);
            ocrResults.push(ocrResult);
          } catch (error) {
            console.error(`Failed to process slide ${slideInfo.slideNumber} with OCR:`, error);
          }
        }
      }

      // Step 5: Combine results
      const slides: PowerpointSlide[] = slideImages.images.map((imageBase64, index) => {
        const slideNumber = index + 1;
        const textContent = textSlides[index] || '';
        const ocrResult = ocrResults.find(r => r.slideNumber === slideNumber);
        
        const combinedContent = [
          textContent,
          ocrResult?.ocrContent || ''
        ].filter(Boolean).join('\n\n');

        return {
          slideNumber,
          textExtracted: textContent,
          ocrContent: ocrResult?.ocrContent,
          combinedContent: combinedContent || `Slide ${slideNumber}`,
          semanticAnalysis: ocrResult?.semanticAnalysis,
          confidenceScore: ocrResult?.confidence || 0.8,
          imageBase64
        };
      });

      const avgConfidence = slides.reduce((sum, slide) => sum + slide.confidenceScore, 0) / slides.length;
      const processingTime = Date.now() - startTime;

      return {
        slides,
        totalSlides: slides.length,
        success: true,
        processingStats: {
          textExtractionTime: slideImages.processingTime,
          ocrProcessingTime: processingTime - slideImages.processingTime,
          totalProcessingTime: processingTime,
          slidesWithOcr: ocrResults.length,
          avgConfidenceScore: avgConfidence
        }
      };

    } catch (error) {
      console.error('PowerPoint OCR processing error:', error);
      return {
        slides: [],
        totalSlides: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during processing',
        processingStats: {
          textExtractionTime: 0,
          ocrProcessingTime: 0,
          totalProcessingTime: Date.now() - startTime,
          slidesWithOcr: 0,
          avgConfidenceScore: 0
        }
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    processWithOcr,
    isProcessing
  };
};

// Convert PowerPoint to images using edge function
const convertPowerpointToImages = async (file: File, targetDpi: number): Promise<{
  images: string[];
  success: boolean;
  error?: string;
  processingTime: number;
}> => {
  const startTime = Date.now();
  
  try {
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const { data, error } = await supabase.functions.invoke('pptx-to-images', {
      body: {
        fileBase64: base64,
        fileName: file.name,
        targetDpi
      }
    });

    if (error) throw error;

    return {
      images: data.images || [],
      success: true,
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    console.error('PowerPoint to images conversion failed:', error);
    return {
      images: [],
      success: false,
      error: error instanceof Error ? error.message : 'Conversion failed',
      processingTime: Date.now() - startTime
    };
  }
};

// Parse extracted text into slides (heuristic approach)
const parseTextBySlides = (extractedText: string, slideCount: number): string[] => {
  if (!extractedText.trim()) {
    return Array(slideCount).fill('');
  }

  // Try to split by common slide indicators
  const possibleSeparators = [
    /(?:^|\n)(?:slide\s*\d+|página\s*\d+)/gi,
    /(?:^|\n)(?:=+\s*slide|=+\s*página)/gi,
    /(?:^|\n)(?:\d+\.|\d+\))\s*/gm
  ];

  for (const separator of possibleSeparators) {
    const parts = extractedText.split(separator);
    if (parts.length >= slideCount * 0.7) { // At least 70% match
      return parts.slice(0, slideCount).map(part => part.trim());
    }
  }

  // Fallback: split by approximate length
  const avgLength = Math.ceil(extractedText.length / slideCount);
  const slides: string[] = [];
  
  for (let i = 0; i < slideCount; i++) {
    const start = i * avgLength;
    const end = (i + 1) * avgLength;
    slides.push(extractedText.substring(start, end).trim());
  }

  return slides;
};

// Determine which slides need OCR processing
const determineSlidesForOcr = async (
  images: string[], 
  textSlides: string[], 
  mode: 'auto' | 'force' | 'skip'
): Promise<Array<{ slideNumber: number; imageBase64: string; needsOcr: boolean }>> => {
  if (mode === 'skip') return [];
  if (mode === 'force') {
    return images.map((image, index) => ({
      slideNumber: index + 1,
      imageBase64: image,
      needsOcr: true
    }));
  }

  // Auto mode: determine based on text content density
  return images.map((image, index) => {
    const textContent = textSlides[index] || '';
    const slideNumber = index + 1;
    
    // Optimized heuristic: more selective OCR to improve performance
    const needsOcr = textContent.length < 30 || 
                     textContent.split(/\s+/).length < 5;

    return {
      slideNumber,
      imageBase64: image,
      needsOcr
    };
  }).filter(slide => slide.needsOcr);
};

// Process individual slide with OCR
const processSlideWithOcr = async (
  imageBase64: string, 
  slideNumber: number
): Promise<{ slideNumber: number; ocrContent: string; semanticAnalysis?: string; confidence: number }> => {
  try {
    const { data, error } = await supabase.functions.invoke('ocr-unified', {
      body: {
        images: [imageBase64],
        documentName: `PowerPoint Slide ${slideNumber}`,
        mode: 'ocr_all',
        language: 'pt'
      }
    });

    if (error) throw error;

    const result = data.chunks?.[0];
    if (!result) {
      throw new Error('No OCR result received');
    }

    return {
      slideNumber,
      ocrContent: result.content || '',
      semanticAnalysis: result.semantic_analysis,
      confidence: result.confidence_score || 0.7
    };
  } catch (error) {
    console.error(`OCR processing failed for slide ${slideNumber}:`, error);
    return {
      slideNumber,
      ocrContent: '',
      confidence: 0
    };
  }
};

// Create text-only fallback result
const createTextOnlyResult = (extractedText: string, processingTime: number): PowerpointOcrResult => {
  // Estimate slide count from text (fallback heuristic)
  const estimatedSlides = Math.max(1, Math.ceil(extractedText.length / 500));
  const textSlides = parseTextBySlides(extractedText, estimatedSlides);

  const slides: PowerpointSlide[] = textSlides.map((text, index) => ({
    slideNumber: index + 1,
    textExtracted: text,
    combinedContent: text || `Slide ${index + 1}`,
    confidenceScore: 0.8
  }));

  return {
    slides,
    totalSlides: slides.length,
    success: true,
    processingStats: {
      textExtractionTime: processingTime,
      ocrProcessingTime: 0,
      totalProcessingTime: processingTime,
      slidesWithOcr: 0,
      avgConfidenceScore: 0.8
    }
  };
};