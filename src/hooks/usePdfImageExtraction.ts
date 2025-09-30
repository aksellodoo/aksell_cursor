import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

export interface ProcessedImage {
  originalBase64: string;
  processedBase64: string;
  pageNumber: number;
  width: number;
  height: number;
  processingApplied: string[];
}

export interface ExtractedImages {
  images: string[]; // Base64 encoded images (backward compatibility)
  processedImages: ProcessedImage[]; // Enhanced images with processing info
  pageCount: number;
  success: boolean;
  error?: string;
  processingStats: {
    dpi: number;
    originalDpi?: number;
    grayscaleApplied: boolean;
    contrastEnhanced: boolean;
    intelligentCompression?: boolean;
    compressionQuality?: number;
    fileSizeMB?: number;
    pagesProcessed?: number;
    totalPages?: number;
    totalProcessingTime: number;
  };
}

export const usePdfImageExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);

  // Configure PDF.js worker if not already configured
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }

  const applyImageProcessing = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): string[] => {
    const applied: string[] = [];
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert to grayscale and enhance contrast
    for (let i = 0; i < data.length; i += 4) {
      // Grayscale conversion using luminance formula
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      
      // Enhanced contrast (simple gamma correction)
      const enhanced = Math.min(255, Math.max(0, Math.pow(gray / 255, 0.8) * 255));
      
      data[i] = enhanced;     // Red
      data[i + 1] = enhanced; // Green
      data[i + 2] = enhanced; // Blue
      // Alpha stays the same
    }
    
    context.putImageData(imageData, 0, 0);
    applied.push('grayscale', 'contrast-enhancement');
    
    return applied;
  };

  const extractImagesFromPdf = useCallback(async (file: File, targetDpi: number = 300): Promise<ExtractedImages> => {
    setIsExtracting(true);
    
    try {
      console.log('🖼️ [PDF.js Client] Starting image extraction for:', file.name, 'Size:', file.size);
      
      // Validate file type
      if (!file.type.includes('pdf')) {
        throw new Error(`Invalid file type: ${file.type}. Expected PDF.`);
      }
      
      // Intelligent file size check with adaptive DPI
      const fileSizeMB = file.size / (1024 * 1024);
      let adaptiveDpi = targetDpi;
      
      if (fileSizeMB > 20) {
        throw new Error('File too large for client-side processing. Maximum supported size is 20MB.');
      } else if (fileSizeMB > 10) {
        // Reduce DPI for large files to prevent memory issues
        adaptiveDpi = Math.max(150, targetDpi * 0.6);
        console.log(`🎯 Large file detected (${fileSizeMB.toFixed(1)}MB), reducing DPI to ${adaptiveDpi}`);
      } else if (fileSizeMB > 5) {
        adaptiveDpi = Math.max(200, targetDpi * 0.75);
        console.log(`⚖️ Medium file detected (${fileSizeMB.toFixed(1)}MB), adjusting DPI to ${adaptiveDpi}`);
      }
      
      console.log('🖼️ [PDF.js Client] Converting to ArrayBuffer...');
      const arrayBuffer = await file.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('File appears to be empty or corrupted');
      }
      
      console.log('🖼️ [PDF.js Client] Loading PDF document...');
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0 // Reduce console noise
      }).promise;
      
      console.log(`🖼️ [PDF.js Client] PDF loaded: ${pdf.numPages} pages`);
      
      if (pdf.numPages === 0) {
        throw new Error('PDF contains no pages');
      }
      
      const images: string[] = [];
      const processedImages: ProcessedImage[] = [];
      const startTime = Date.now();
      
      // Apply intelligent compression based on file size
      let quality = 0.85; // Default quality
      if (fileSizeMB > 15) {
        quality = 0.6; // Aggressive compression for very large files
      } else if (fileSizeMB > 10) {
        quality = 0.7; // Moderate compression for large files
      }
      
      // Calculate scale for adaptive DPI (default PDF is ~72 DPI)
      const targetScale = adaptiveDpi / 72;
      
      // Determine processing strategy based on file size and page count
      const isLargeFile = fileSizeMB > 10;
      const maxPages = isLargeFile ? Math.min(pdf.numPages, 50) : pdf.numPages; // Limit pages for large files
      
      console.log(`📄 Processing strategy: ${maxPages}/${pdf.numPages} pages at ${adaptiveDpi} DPI`);
      
      // Extract and process images from pages
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: targetScale });
          
          // Create canvas for original render
          const originalCanvas = document.createElement('canvas');
          const originalContext = originalCanvas.getContext('2d');
          originalCanvas.height = viewport.height;
          originalCanvas.width = viewport.width;
          
          if (!originalContext) {
            throw new Error('Could not get canvas context');
          }
          
          // Render page to canvas
          const renderContext = {
            canvasContext: originalContext,
            viewport: viewport,
            canvas: originalCanvas
          };
          
          await page.render(renderContext).promise;
          
          // Get original image
          const originalBase64 = originalCanvas.toDataURL('image/jpeg', quality);
          
          // Create processed canvas
          const processedCanvas = document.createElement('canvas');
          const processedContext = processedCanvas.getContext('2d');
          processedCanvas.height = viewport.height;
          processedCanvas.width = viewport.width;
          
          if (!processedContext) {
            throw new Error('Could not get processed canvas context');
          }
          
          // Copy original to processed canvas
          processedContext.drawImage(originalCanvas, 0, 0);
          
          // Apply image processing
          const processingApplied = applyImageProcessing(processedCanvas, processedContext);
          
          // Get processed image with same compression
          const processedBase64 = processedCanvas.toDataURL('image/jpeg', quality);
          
          // Store both versions
          images.push(processedBase64); // For backward compatibility
          processedImages.push({
            originalBase64,
            processedBase64,
            pageNumber: pageNum,
            width: viewport.width,
            height: viewport.height,
            processingApplied
          });
          
          // Progress logging for large documents
          if (maxPages > 10 && pageNum % 5 === 0) {
            console.log(`🖼️ [PDF.js Client] Progress: ${pageNum}/${maxPages} pages processed (${adaptiveDpi} DPI, quality: ${quality})`);
          }
          
          // Memory management for large files
          if (isLargeFile && pageNum % 10 === 0) {
            // Force garbage collection every 10 pages for large files
            if (window.gc) {
              window.gc();
            }
          }
          
          // Clean up canvases
          originalCanvas.remove();
          processedCanvas.remove();
        } catch (pageError) {
          console.warn(`⚠️ [PDF.js Client] Failed to extract page ${pageNum}:`, pageError.message);
          // Continue with other pages
        }
      }
      
      const processingTime = Date.now() - startTime;
      
      console.log(`🖼️ [PDF.js Client] Enhanced extraction complete:`);
      console.log(`  - ${images.length}/${maxPages} pages processed (${pdf.numPages} total)`);
      console.log(`  - Adaptive DPI: ${adaptiveDpi} (requested: ${targetDpi})`);
      console.log(`  - Compression quality: ${quality || 0.85}`);
      console.log(`  - Processing time: ${processingTime}ms`);
      console.log(`  - File size: ${fileSizeMB.toFixed(2)}MB`);
      console.log(`  - Enhancements: grayscale, contrast, intelligent compression`);
      
      const success = images.length > 0;
      
      return {
        images,
        processedImages,
        pageCount: pdf.numPages,
        success,
        error: success ? undefined : `No images could be extracted from the PDF`,
        processingStats: {
          dpi: adaptiveDpi,
          originalDpi: targetDpi,
          grayscaleApplied: true,
          contrastEnhanced: true,
          intelligentCompression: true,
          compressionQuality: quality || 0.85,
          fileSizeMB: fileSizeMB,
          pagesProcessed: maxPages,
          totalPages: pdf.numPages,
          totalProcessingTime: processingTime
        }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown PDF.js error';
      console.error('❌ [PDF.js Client] Image extraction failed:', errorMessage);
      
      return {
        images: [],
        processedImages: [],
        pageCount: 0,
        success: false,
        error: errorMessage,
        processingStats: {
          dpi: 0,
          grayscaleApplied: false,
          contrastEnhanced: false,
          totalProcessingTime: 0
        }
      };
    } finally {
      setIsExtracting(false);
    }
  }, []);

  return {
    extractImagesFromPdf,
    isExtracting
  };
};