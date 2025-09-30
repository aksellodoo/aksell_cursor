import { useState, useCallback } from 'react';

export interface ImageContentAnalysis {
  hasText: boolean;
  textConfidence: number;
  documentType: 'document' | 'photo' | 'diagram' | 'mixed' | 'unknown';
  recommendedProcessing: 'ocr' | 'visual_description' | 'skip';
  estimatedTextDensity: 'high' | 'medium' | 'low' | 'none';
  imageQuality: 'excellent' | 'good' | 'fair' | 'poor';
  warnings?: string[];
}

export interface ImageValidationResult {
  isValid: boolean;
  analysis?: ImageContentAnalysis;
  error?: string;
  suggestions?: string[];
}

export const useImageContentDetection = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImageContent = useCallback(async (file: File): Promise<ImageValidationResult> => {
    setIsAnalyzing(true);

    try {
      // Basic file validation
      if (!file.type.startsWith('image/')) {
        return {
          isValid: false,
          error: 'Arquivo não é uma imagem válida'
        };
      }

      // Size validation (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        return {
          isValid: false,
          error: 'Imagem muito grande (máximo 20MB)',
          suggestions: ['Comprima a imagem antes de enviar', 'Use um formato mais eficiente como WebP']
        };
      }

      // Convert to canvas for analysis
      const imageAnalysis = await analyzeImageVisually(file);
      
      return {
        isValid: true,
        analysis: imageAnalysis
      };

    } catch (error) {
      console.error('Error analyzing image:', error);
      return {
        isValid: false,
        error: 'Erro ao analisar imagem'
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const analyzeMultipleImages = useCallback(async (files: File[]): Promise<ImageValidationResult[]> => {
    const results = await Promise.all(
      files.map(file => analyzeImageContent(file))
    );
    return results;
  }, [analyzeImageContent]);

  return {
    analyzeImageContent,
    analyzeMultipleImages,
    isAnalyzing
  };
};

// Visual analysis using canvas and image properties
const analyzeImageVisually = async (file: File): Promise<ImageContentAnalysis> => {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (!ctx) {
        resolve(getDefaultAnalysis());
        return;
      }

      ctx.drawImage(img, 0, 0);
      
      try {
        // Get image data for analysis
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Analyze image properties
        const analysis = performImageAnalysis(data, img.width, img.height, file);
        resolve(analysis);
      } catch (error) {
        console.warn('Error in image analysis:', error);
        resolve(getDefaultAnalysis());
      }
    };

    img.onerror = () => {
      resolve(getDefaultAnalysis());
    };

    img.src = URL.createObjectURL(file);
  });
};

const performImageAnalysis = (
  data: Uint8ClampedArray, 
  width: number, 
  height: number, 
  file: File
): ImageContentAnalysis => {
  const totalPixels = width * height;
  
  // Calculate image quality metrics
  let brightnessSum = 0;
  let contrastVariance = 0;
  const sampleSize = Math.min(totalPixels, 10000); // Sample for performance
  const step = Math.floor(totalPixels / sampleSize);
  
  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    brightnessSum += brightness;
  }
  
  const avgBrightness = brightnessSum / sampleSize;
  
  // Estimate content type based on file properties and basic analysis
  const aspectRatio = width / height;
  const resolution = width * height;
  const fileSize = file.size;
  
  // Simple heuristics for content detection
  let documentType: ImageContentAnalysis['documentType'] = 'unknown';
  let hasText = false;
  let textConfidence = 0;
  let estimatedTextDensity: ImageContentAnalysis['estimatedTextDensity'] = 'none';
  
  // Document detection heuristics
  if (aspectRatio > 0.7 && aspectRatio < 1.5) {
    // Portrait or square-ish, likely document
    documentType = 'document';
    hasText = true;
    textConfidence = 0.8;
    estimatedTextDensity = 'high';
  } else if (aspectRatio > 1.5) {
    // Wide format, could be screenshot or landscape document
    documentType = 'mixed';
    hasText = true;
    textConfidence = 0.6;
    estimatedTextDensity = 'medium';
  } else {
    // Very tall, could be mobile screenshot or form
    documentType = 'document';
    hasText = true;
    textConfidence = 0.7;
    estimatedTextDensity = 'medium';
  }
  
  // Quality assessment
  let imageQuality: ImageContentAnalysis['imageQuality'] = 'good';
  if (resolution < 300000) { // Less than 300k pixels
    imageQuality = 'poor';
  } else if (resolution > 2000000) { // More than 2M pixels
    imageQuality = 'excellent';
  } else if (avgBrightness < 50 || avgBrightness > 200) {
    imageQuality = 'fair'; // Too dark or too bright
  }
  
  // Generate warnings
  const warnings: string[] = [];
  if (imageQuality === 'poor') {
    warnings.push('Baixa resolução pode afetar a qualidade do OCR');
  }
  if (avgBrightness < 80) {
    warnings.push('Imagem muito escura - considere aumentar o brilho');
  }
  if (avgBrightness > 200) {
    warnings.push('Imagem muito clara - pode haver perda de contraste');
  }
  if (fileSize > 10 * 1024 * 1024) {
    warnings.push('Arquivo grande - processamento pode ser mais lento');
  }
  
  return {
    hasText,
    textConfidence,
    documentType,
    recommendedProcessing: hasText ? 'ocr' : 'visual_description',
    estimatedTextDensity,
    imageQuality,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

const getDefaultAnalysis = (): ImageContentAnalysis => ({
  hasText: true, // Default to true to allow processing
  textConfidence: 0.5,
  documentType: 'unknown',
  recommendedProcessing: 'ocr',
  estimatedTextDensity: 'medium',
  imageQuality: 'good'
});