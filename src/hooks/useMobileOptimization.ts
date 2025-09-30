import { useState, useCallback, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

export interface MobileUploadOptimization {
  maxFileSize: number;
  compressionQuality: number;
  enableProgressFeedback: boolean;
  showCameraButton: boolean;
  showGalleryButton: boolean;
}

export const useMobileOptimization = () => {
  const isMobile = useIsMobile();
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Configurações otimizadas para mobile
  const getMobileConfig = useCallback((): MobileUploadOptimization => {
    if (!isMobile) {
      return {
        maxFileSize: 20 * 1024 * 1024, // 20MB
        compressionQuality: 0.9,
        enableProgressFeedback: false,
        showCameraButton: true,
        showGalleryButton: true
      };
    }

    return {
      maxFileSize: 10 * 1024 * 1024, // 10MB para mobile (reduzido para evitar problemas de memória)
      compressionQuality: 0.75, // Compressão mais agressiva para mobile
      enableProgressFeedback: true, // Feedback importante no mobile
      showCameraButton: true,
      showGalleryButton: true
    };
  }, [isMobile]);

  // Detecta se é upload direto da câmera
  const detectCameraUpload = useCallback((file: File): boolean => {
    // Arquivos da câmera geralmente têm nomes específicos
    const cameraPatterns = [
      /^IMG_\d+\.(jpg|jpeg|heic)$/i, // iOS
      /^PANO_\d+\.(jpg|jpeg)$/i, // iOS Panorama
      /^\d{8}_\d{6}\.(jpg|jpeg)$/i, // Android padrão
      /^Camera_\d+\.(jpg|jpeg)$/i, // Alguns Android
      /^DCIM_\d+\.(jpg|jpeg|heic)$/i, // DCIM folder
      /^IMG-\d+-WA\d+\.(jpg|jpeg)$/i // WhatsApp camera
    ];

    const fileName = file.name;
    const isRecentFile = file.lastModified && (Date.now() - file.lastModified) < 5 * 60 * 1000; // 5 minutos

    return cameraPatterns.some(pattern => pattern.test(fileName)) || 
           (isRecentFile && file.type.startsWith('image/'));
  }, []);

  // Otimiza arquivo para mobile se necessário - MELHORADO
  const optimizeForMobile = useCallback(async (file: File): Promise<File> => {
    if (!isMobile) {
      return file;
    }

    setIsOptimizing(true);

    try {
      // Apenas para imagens
      if (!file.type.startsWith('image/')) {
        return file;
      }

      // Para iPhone/Android, sempre otimizar imagens > 2MB ou > 1600px
      const shouldOptimize = file.size > 2 * 1024 * 1024; // 2MB threshold para mobile
      
      if (!shouldOptimize) {
        return file;
      }

      console.log(`📱 Otimizando imagem mobile: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          // Dimensões otimizadas para mobile OCR - reduzidas para economizar memória
          const maxDimension = 1600; // Reduzido de 2048 para 1600px (adequado para OCR)
          let { width, height } = img;

          // Sempre redimensionar se muito grande
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            // Melhor qualidade de redimensionamento
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            
            // Qualidade otimizada para mobile (melhor compressão)
            const quality = getMobileConfig().compressionQuality * 0.9; // Reduzir mais 10%
            
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const optimizedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: file.lastModified
                  });
                  
                  const compressionRatio = Math.round(((file.size - blob.size) / file.size) * 100);
                  console.log(`✅ Otimização mobile concluída: ${(blob.size / 1024 / 1024).toFixed(1)}MB (-${compressionRatio}%)`);
                  
                  resolve(optimizedFile);
                } else {
                  resolve(file);
                }
              },
              'image/jpeg',
              quality
            );
          } else {
            resolve(file);
          }
        };

        img.onerror = () => {
          console.warn('Erro ao carregar imagem para otimização');
          resolve(file);
        };
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.warn('Erro ao otimizar arquivo para mobile:', error);
      return file;
    } finally {
      setIsOptimizing(false);
    }
  }, [isMobile, getMobileConfig]);

  // Detecta orientação da imagem (para rotação automática)
  const detectImageOrientation = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(1); // Orientação normal
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const dataView = new DataView(arrayBuffer);

        try {
          // Lê EXIF para orientação
          if (dataView.getUint16(0) === 0xFFD8) { // JPEG
            let offset = 2;
            let marker;

            while (offset < dataView.byteLength) {
              marker = dataView.getUint16(offset);
              if (marker === 0xFFE1) { // EXIF marker
                const exifOffset = offset + 4;
                if (dataView.getUint32(exifOffset) === 0x45786966) { // "Exif"
                  // Procura tag de orientação (0x0112)
                  const orientationOffset = findExifOrientation(dataView, exifOffset + 6);
                  if (orientationOffset) {
                    const orientation = dataView.getUint16(orientationOffset);
                    resolve(orientation);
                    return;
                  }
                }
              }
              offset += 2 + dataView.getUint16(offset + 2);
            }
          }
        } catch (error) {
          console.warn('Erro ao ler orientação da imagem:', error);
        }
        
        resolve(1); // Orientação normal como fallback
      };

      reader.readAsArrayBuffer(file);
    });
  }, []);

  // Helper para encontrar orientação no EXIF
  const findExifOrientation = (dataView: DataView, offset: number): number | null => {
    try {
      const isLittleEndian = dataView.getUint16(offset) === 0x4949;
      const tagCount = dataView.getUint16(offset + 8, isLittleEndian);

      for (let i = 0; i < tagCount; i++) {
        const tagOffset = offset + 10 + (i * 12);
        const tag = dataView.getUint16(tagOffset, isLittleEndian);
        
        if (tag === 0x0112) { // Orientation tag
          return tagOffset + 8;
        }
      }
    } catch (error) {
      console.warn('Erro ao processar EXIF:', error);
    }
    
    return null;
  };

  return {
    isMobile,
    isOptimizing,
    getMobileConfig,
    detectCameraUpload,
    optimizeForMobile,
    detectImageOrientation
  };
};