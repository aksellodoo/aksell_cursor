import { useState, useCallback } from 'react';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { usePowerpointOcrProcessor, PowerpointOcrResult } from './usePowerpointOcrProcessor';

interface ExtractedText {
  success: boolean;
  text: string;
  pageCount: number;
  error?: string;
}

export const useOfficeExtractor = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const { processWithOcr, isProcessing: isOcrProcessing } = usePowerpointOcrProcessor();

  const extractTextFromOffice = useCallback(async (file: File): Promise<ExtractedText> => {
    setIsExtracting(true);
    
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension) {
        throw new Error('Não foi possível identificar a extensão do arquivo');
      }

      let extractedText = '';
      let pageCount = 1; // Default for most office files

      switch (fileExtension) {
        case 'doc':
        case 'docx':
          extractedText = await extractFromWord(file);
          break;
          
        case 'xls':
        case 'xlsx':
        case 'ods':
          const xlsResult = await extractFromExcel(file);
          extractedText = xlsResult.text;
          pageCount = xlsResult.sheetCount;
          break;
          
        case 'txt':
        case 'rtf':
        case 'md':
        case 'log':
          extractedText = await extractFromText(file);
          break;
          
        case 'csv':
        case 'tsv':
          extractedText = await extractFromCSV(file);
          break;
          
        case 'json':
          extractedText = await extractFromJSON(file);
          break;
          
        case 'xml':
          extractedText = await extractFromXML(file);
          break;
          
        case 'ppt':
        case 'pptx':
          extractedText = await extractFromPowerPointHybrid(file);
          break;
          
        default:
          throw new Error(`Formato de arquivo não suportado: ${fileExtension}`);
      }

      return {
        success: true,
        text: extractedText,
        pageCount,
      };
      
    } catch (error) {
      console.error('Erro na extração de texto do Office:', error);
      return {
        success: false,
        text: '',
        pageCount: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido na extração'
      };
    } finally {
      setIsExtracting(false);
    }
  }, []);

  // Optimized hybrid PowerPoint extraction with timeout protection
  const extractFromPowerPointHybrid = async (file: File): Promise<string> => {
    console.log(`🎯 Starting optimized PowerPoint processing for: ${file.name}`);
    
    try {
      // Step 1: Quick text extraction (< 5s target)
      const basicText = await extractFromPowerPoint(file);
      console.log(`📝 Basic text extraction completed (${basicText.length} chars)`);
      
      // Step 2: Smart OCR decision based on content analysis
      const needsOcr = shouldUseOcr(basicText, file.size);
      
      if (!needsOcr) {
        console.log(`✅ Text content sufficient, skipping OCR for performance`);
        return basicText;
      }
      
      console.log(`🔍 Low text density detected, enabling OCR enhancement...`);
      
      // Step 3: Optimized OCR processing with performance settings
      const ocrResult = await processWithOcr(file, basicText, {
        enableOcr: true,
        ocrMode: 'auto', // Only process slides that need it
        targetDpi: 150   // Faster processing (was 300)
      });
      
      if (!ocrResult.success) {
        console.log(`⚠️ OCR processing failed, using text-only result`);
        return basicText;
      }
      
      // Step 4: Generate optimized content for RAG
      const combinedContent = formatForRAG(ocrResult, file.name);
      console.log(`✅ Hybrid processing completed: ${ocrResult.slides.length} slides, ${ocrResult.processingStats.slidesWithOcr} enhanced with OCR`);
      
      return combinedContent;
      
    } catch (error) {
      console.error('Hybrid PowerPoint processing error:', error);
      // Robust fallback chain
      try {
        const basicText = await extractFromPowerPoint(file);
        console.log('🔄 Using basic text extraction as fallback');
        return basicText;
      } catch (fallbackError) {
        console.error('All extraction methods failed:', fallbackError);
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        return `=== PowerPoint: ${fileName} ===\n\nConteúdo extraído com limitações devido a erro no processamento.\nRecomenda-se conversão manual para PDF para melhor extração.`;
      }
    }
  };

  // Optimized OCR decision logic with performance consideration
  const shouldUseOcr = (extractedText: string, fileSize: number): boolean => {
    const textLength = extractedText.trim().length;
    const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
    const fileSizeMB = fileSize / (1024 * 1024);
    const avgWordsPerMB = wordCount / Math.max(fileSizeMB, 0.1); // Avoid division by zero
    
    // Enhanced heuristics for smarter OCR decision:
    // 1. Text density analysis
    // 2. File size consideration (very large files get OCR limited)
    // 3. Content quality indicators
    
    const hasMinimalText = textLength < 150 || wordCount < 30;
    const hasLowDensity = avgWordsPerMB < 80;
    const hasErrorIndicators = extractedText.includes('Erro') || 
                               extractedText.includes('arquivo requer processamento');
    const isReasonableSize = fileSizeMB < 10; // Skip OCR for very large files (performance)
    
    const needsOcr = (hasMinimalText || hasLowDensity || hasErrorIndicators) && isReasonableSize;
    
    console.log(`🔍 OCR Analysis - Text: ${textLength}chars, Words: ${wordCount}, Density: ${avgWordsPerMB.toFixed(1)}w/MB, Size: ${fileSizeMB.toFixed(1)}MB, Needs OCR: ${needsOcr}`);
    
    return needsOcr;
  };

  // Format OCR results for optimal RAG processing
  const formatForRAG = (ocrResult: PowerpointOcrResult, fileName: string): string => {
    const sections: string[] = [];
    
    // Add header with metadata
    sections.push(`=== ${fileName} ===`);
    sections.push(`Apresentação PowerPoint processada com OCR híbrido`);
    sections.push(`Total de slides: ${ocrResult.totalSlides}`);
    sections.push(`Slides com OCR: ${ocrResult.processingStats.slidesWithOcr}`);
    sections.push(`Confiança média: ${(ocrResult.processingStats.avgConfidenceScore * 100).toFixed(1)}%`);
    sections.push('');
    
    // Add each slide with structured content
    ocrResult.slides.forEach(slide => {
      sections.push(`--- SLIDE ${slide.slideNumber} ---`);
      
      if (slide.combinedContent.trim()) {
        sections.push(slide.combinedContent.trim());
      }
      
      // Add semantic analysis if available
      if (slide.semanticAnalysis) {
        sections.push('');
        sections.push(`[Análise Visual: ${slide.semanticAnalysis}]`);
      }
      
      // Add confidence indicator for OCR content
      if (slide.ocrContent && slide.confidenceScore < 0.8) {
        sections.push(`[OCR - Confiança: ${(slide.confidenceScore * 100).toFixed(1)}%]`);
      }
      
      sections.push('');
    });
    
    // Add processing summary
    sections.push('--- RESUMO DO PROCESSAMENTO ---');
    sections.push(`Tempo de processamento: ${(ocrResult.processingStats.totalProcessingTime / 1000).toFixed(1)}s`);
    sections.push(`Extração de texto: ${(ocrResult.processingStats.textExtractionTime / 1000).toFixed(1)}s`);
    sections.push(`Processamento OCR: ${(ocrResult.processingStats.ocrProcessingTime / 1000).toFixed(1)}s`);
    
    return sections.join('\n');
  };

  return {
    extractTextFromOffice,
    isExtracting: isExtracting || isOcrProcessing
  };
};

// Extract text from PowerPoint documents
const extractFromPowerPoint = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    // Try using mammoth first for PPTX files
    if (file.name.toLowerCase().endsWith('.pptx')) {
      try {
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (result.value && result.value.trim()) {
          return result.value;
        }
      } catch (mammothError) {
        console.log('Mammoth extraction failed for PPTX, trying alternative approach');
      }
    }

    // Fallback: extract text using basic XML parsing for PPTX
    if (file.name.toLowerCase().endsWith('.pptx')) {
      const text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
      
      // Look for text patterns in PowerPoint XML structure
      const textMatches = text.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
      const slideTexts = textMatches.map(match => {
        const textContent = match.replace(/<[^>]+>/g, '');
        return textContent.trim();
      }).filter(text => text.length > 0);

      if (slideTexts.length > 0) {
        return `=== ${file.name} ===\n\n${slideTexts.join('\n\n')}`;
      }
    }

    // If all else fails, provide informative message
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    return `=== Apresentação PowerPoint: ${fileName} ===\n\nArquivo PowerPoint detectado. Para melhor extração de texto, considere:\n1. Exportar como PDF\n2. Usar processamento OCR\n3. Copiar e colar o conteúdo em um documento de texto`;
    
  } catch (error) {
    console.error('Error extracting from PowerPoint:', error);
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    return `=== Apresentação PowerPoint: ${fileName} ===\n\nErro na extração automática de texto. Recomenda-se usar processamento OCR para este arquivo.`;
  }
};

// Extract text from Word documents using mammoth
const extractFromWord = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.messages.length > 0) {
      console.warn('Mammoth warnings:', result.messages);
    }
    
    return result.value || '';
  } catch (error) {
    throw new Error(`Erro ao extrair texto do Word: ${error}`);
  }
};

// Extract text from Excel files using xlsx
const extractFromExcel = async (file: File): Promise<{ text: string; sheetCount: number }> => {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetNames = workbook.SheetNames;
    
    let allText = '';
    
    sheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to CSV-like text format
      const csvText = XLSX.utils.sheet_to_csv(worksheet);
      
      if (csvText.trim()) {
        allText += `\n=== ${sheetName} ===\n`;
        allText += csvText;
        allText += '\n';
      }
    });
    
    return {
      text: allText,
      sheetCount: sheetNames.length
    };
  } catch (error) {
    throw new Error(`Erro ao extrair texto do Excel: ${error}`);
  }
};

// Extract text from plain text files
const extractFromText = async (file: File): Promise<string> => {
  try {
    const text = await file.text();
    return text;
  } catch (error) {
    throw new Error(`Erro ao ler arquivo de texto: ${error}`);
  }
};

// Extract text from CSV/TSV files
const extractFromCSV = async (file: File): Promise<string> => {
  try {
    const text = await file.text();
    const isCSV = file.name.toLowerCase().endsWith('.csv');
    const separator = isCSV ? ',' : '\t';
    
    // Parse CSV/TSV and format as readable text
    const lines = text.split('\n');
    let formattedText = `=== ${file.name} ===\n\n`;
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        const columns = line.split(separator);
        if (index === 0) {
          // Header row
          formattedText += `Cabeçalhos: ${columns.join(' | ')}\n\n`;
        } else {
          // Data rows
          formattedText += `Linha ${index}: ${columns.join(' | ')}\n`;
        }
      }
    });
    
    return formattedText;
  } catch (error) {
    throw new Error(`Erro ao ler arquivo CSV/TSV: ${error}`);
  }
};

// Extract text from JSON files
const extractFromJSON = async (file: File): Promise<string> => {
  try {
    const text = await file.text();
    const jsonData = JSON.parse(text);
    
    // Convert JSON to readable text format
    const extractTextFromObject = (obj: any, level = 0): string => {
      let result = '';
      const indent = '  '.repeat(level);
      
      if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            result += `${indent}Item ${index + 1}:\n`;
            result += extractTextFromObject(item, level + 1);
          });
        } else {
          Object.entries(obj).forEach(([key, value]) => {
            result += `${indent}${key}: `;
            if (typeof value === 'object') {
              result += '\n';
              result += extractTextFromObject(value, level + 1);
            } else {
              result += `${value}\n`;
            }
          });
        }
      } else {
        result += `${indent}${obj}\n`;
      }
      
      return result;
    };
    
    return `=== ${file.name} ===\n\n${extractTextFromObject(jsonData)}`;
  } catch (error) {
    throw new Error(`Erro ao ler arquivo JSON: ${error}`);
  }
};

// Extract text from XML files
const extractFromXML = async (file: File): Promise<string> => {
  try {
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      // If XML parsing fails, return as plain text
      return `=== ${file.name} ===\n\n${text}`;
    }
    
    // Extract text content from XML nodes
    const extractTextFromNode = (node: Node): string => {
      let result = '';
      
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent?.trim();
        if (textContent) {
          result += textContent + ' ';
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        
        // Add element name as context
        if (element.tagName) {
          result += `[${element.tagName}] `;
        }
        
        // Process child nodes
        for (const child of Array.from(node.childNodes)) {
          result += extractTextFromNode(child);
        }
        
        result += '\n';
      }
      
      return result;
    };
    
    const extractedText = extractTextFromNode(xmlDoc.documentElement);
    return `=== ${file.name} ===\n\n${extractedText}`;
  } catch (error) {
    throw new Error(`Erro ao ler arquivo XML: ${error}`);
  }
};