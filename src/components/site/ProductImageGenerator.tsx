import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useProductImageGenerator } from '@/hooks/useProductImageGenerator';
import { removeBackground, loadImage } from '@/lib/backgroundRemoval';
import { toast } from '@/hooks/use-toast';
import { Image, Wand2, Upload, Trash2, Download, Scissors, Eye, RotateCcw, ZoomIn } from 'lucide-react';

interface ProductImageGeneratorProps {
  molecularFormula: string | null;
  productFormat: 'solid' | 'liquid' | null;
  productId?: string;
  currentImageUrl: string | null;
  onImageGenerated: (imageUrl: string | null) => void;
  productName?: string;
}

export function ProductImageGenerator({
  molecularFormula,
  productFormat,
  productId,
  currentImageUrl,
  onImageGenerated,
  productName = "Produto"
}: ProductImageGeneratorProps) {
  const {
    imageUrl,
    generateImage,
    uploadImage,
    clearImage,
    setImageUrl,
    isGenerating,
    error,
    lastUsedPrompt
  } = useProductImageGenerator();

  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [backgroundRemovalError, setBackgroundRemovalError] = useState<string | null>(null);

  // Sync generated/uploaded image with parent form
  useEffect(() => {
    if (imageUrl && imageUrl !== currentImageUrl) {
      onImageGenerated(imageUrl);
    }
  }, [imageUrl, currentImageUrl, onImageGenerated]);

  const handleGenerateImage = async () => {
    if (!molecularFormula || !productFormat) {
      toast({
        title: "Erro",
        description: "Fórmula molecular e formato do produto são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateImage(molecularFormula, productFormat, productId);
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadImage(file, productId);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    }
  };

  const handleRemoveBackground = async () => {
    const displayedImageUrl = imageUrl || currentImageUrl;
    if (!displayedImageUrl) return;

    setIsRemovingBackground(true);
    setBackgroundRemovalError(null);

    try {
      // Create image element from URL
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = displayedImageUrl;
      });

      // Remove background
      const processedBlob = await removeBackground(img);
      
      // Create File from Blob
      const processedFile = new File([processedBlob], 'processed-image.png', {
        type: 'image/png',
        lastModified: Date.now()
      });
      
      // Upload processed image
      if (productId) {
        await uploadImage(processedFile, productId);
      }
    } catch (error) {
      console.error('Erro ao remover fundo:', error);
      setBackgroundRemovalError('Erro ao processar imagem. Tente novamente.');
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const handleClearImage = () => {
    clearImage();
    onImageGenerated(null);
  };

  const canGenerateAI = molecularFormula && productFormat;

  const generatePrompt = () => {
    const formatText = productFormat === 'solid' ? 'sólido em pó' : 'líquido';
    return `Gere uma imagem profissional de alta qualidade de um produto químico ${formatText} com fórmula molecular ${molecularFormula}. A imagem deve mostrar:
- O produto em sua forma física (${formatText})
- Em um recipiente apropriado (frasco, béquer, ou embalagem industrial)
- Com fundo limpo e profissional
- Iluminação adequada que destaque as características do produto
- Estilo fotográfico realista e profissional
- Qualidade comercial adequada para materiais de marketing`;
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Gerador de Imagem do Produto</Label>
      
      {/* Formula and Format Display */}
      {(molecularFormula?.trim() || productFormat) && (
        <div className="flex gap-2 flex-wrap">
          {molecularFormula?.trim() && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Fórmula:</span>
              <Badge variant="outline">{molecularFormula}</Badge>
            </div>
          )}
          {productFormat && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Formato:</span>
              <Badge variant="outline">
                {productFormat === 'solid' ? 'Sólido' : 'Líquido'}
              </Badge>
            </div>
          )}
        </div>
      )}
      
      {/* Control Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerateImage}
          disabled={!canGenerateAI || isGenerating}
          className="flex items-center gap-2"
        >
          <Wand2 className="h-4 w-4" />
          {(imageUrl || currentImageUrl) ? 'Regenerar Imagem' : 'Gerar Imagem'}
        </Button>

        <label className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isGenerating}
            className="flex items-center gap-2"
            asChild
          >
            <span>
              <Upload className="h-4 w-4" />
              Importar Imagem
            </span>
          </Button>
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        {(molecularFormula && productFormat) && (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Visualizar Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Prompt para Geração de Imagem</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-line">{generatePrompt()}</p>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const prompt = generatePrompt();
                      navigator.clipboard.writeText(prompt).then(() => {
                        toast({
                          title: "Prompt copiado!",
                          description: "O prompt foi copiado para a área de transferência.",
                        });
                      }).catch(() => {
                        toast({
                          title: "Erro ao copiar",
                          description: "Não foi possível copiar o prompt.",
                          variant: "destructive",
                        });
                      });
                    }}
                  >
                    Copiar Prompt
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        {(imageUrl || currentImageUrl) && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveBackground}
              disabled={isRemovingBackground}
              className="flex items-center gap-2"
            >
              {isRemovingBackground ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Scissors className="h-4 w-4" />
              )}
              Remover Fundo
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearImage}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Remover
            </Button>
          </>
        )}
      </div>

      {/* Help Text */}
      {!canGenerateAI && (
        <p className="text-xs text-muted-foreground">
          Preencha a fórmula molecular e o formato do produto para gerar imagem por IA
        </p>
      )}
      
      {!productId && (
        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
          Produto novo: as imagens serão salvas quando você clicar em "Criar Produto"
        </p>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="flex items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
          <LoadingSpinner size="md" text="Gerando imagem do produto..." />
        </div>
      )}

      {/* Background Removal Loading */}
      {isRemovingBackground && (
        <div className="flex items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
          <LoadingSpinner size="md" text="Removendo fundo da imagem..." />
        </div>
      )}

      {/* Error States */}
      {error && !isGenerating && (
        <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
          <p className="text-sm text-destructive font-medium">Erro na geração:</p>
          <p className="text-xs text-destructive/80 mt-1">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateImage}
            disabled={!canGenerateAI}
            className="mt-2 flex items-center gap-2"
          >
            <RotateCcw className="h-3 w-3" />
            Tentar novamente
          </Button>
        </div>
      )}

      {backgroundRemovalError && (
        <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
          <p className="text-sm text-destructive font-medium">Erro na remoção de fundo:</p>
          <p className="text-xs text-destructive/80 mt-1">{backgroundRemovalError}</p>
        </div>
      )}

      {/* Image Preview */}
      {(imageUrl || currentImageUrl) && !isGenerating && !isRemovingBackground && (
        <div className="space-y-2">
          <div className="relative border border-border rounded-lg overflow-hidden bg-white">
            <img
              src={imageUrl || currentImageUrl}
              alt="Imagem do produto"
              className="w-full h-48 object-contain"
              onError={(e) => {
                console.error('Failed to load product image:', imageUrl || currentImageUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
            
            {/* Zoom Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2 flex items-center gap-1"
                >
                  <ZoomIn className="h-3 w-3" />
                  Ampliar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    Imagem do Produto - {productName}
                    {molecularFormula && ` (${molecularFormula})`}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex justify-center p-4">
                  <img
                    src={imageUrl || currentImageUrl}
                    alt="Imagem do produto"
                    className="max-w-full max-h-[70vh] object-contain bg-white rounded border"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Imagem do produto{molecularFormula && ` para ${molecularFormula}`}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!(imageUrl || currentImageUrl) && !isGenerating && !isRemovingBackground && !error && canGenerateAI && (
        <div className="flex items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
          <div className="text-center">
            <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              Clique em "Gerar Imagem" para visualizar
            </p>
            {molecularFormula && (
              <p className="text-xs text-muted-foreground mt-1">
                Fórmula: {molecularFormula}
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}