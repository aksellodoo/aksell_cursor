import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Atom, RotateCcw, Trash2, ZoomIn, Upload, Eye, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface MolecularStructureViewerProps {
  molecularFormula: string | null;
  productFormat?: 'solid' | 'liquid' | null;
  productId?: string;
  imageUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
  onClear: () => void;
  onUpload?: (file: File) => void;
  productName?: string;
  onImageGenerated?: (imageUrl: string) => void;
}

export const MolecularStructureViewer: React.FC<MolecularStructureViewerProps> = ({
  molecularFormula,
  productFormat,
  productId,
  imageUrl,
  isGenerating,
  error,
  onGenerate,
  onClear,
  onUpload,
  productName = "Produto",
}) => {
  const canGenerate = molecularFormula?.trim().length > 0 && !isGenerating;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  const generatePrompt = (formula: string) => {
    return `Generate a detailed 2D molecular structure diagram of ${formula}. The image should:
- Show a clear, scientifically accurate 2D structural representation
- Use standard chemical notation with proper bond angles and lengths
- Include all atoms and bonds clearly labeled
- Have a clean white background
- Be high resolution and professional quality
- Follow IUPAC standards for molecular representation
- Show the complete structural formula with all atoms visible`;
  };

  const handleCopyPrompt = async () => {
    if (!molecularFormula?.trim()) return;
    
    const prompt = generatePrompt(molecularFormula);
    try {
      await navigator.clipboard.writeText(prompt);
      toast({
        title: "Prompt copiado!",
        description: "O prompt foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o prompt.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Visualizador de Fórmula Molecular</Label>
      
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
          onClick={onGenerate}
          disabled={!canGenerate}
          className="flex items-center gap-2"
        >
          <Atom className="h-4 w-4" />
          {imageUrl ? 'Regenerar Estrutura' : 'Gerar Estrutura'}
        </Button>

        {onUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Importar Imagem
            </Button>
          </>
        )}

        {molecularFormula?.trim() && (
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
                <DialogTitle>Prompt da Estrutura Molecular</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{generatePrompt(molecularFormula)}</p>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleCopyPrompt}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-3 w-3" />
                    Copiar Prompt
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        {imageUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClear}
            className="flex items-center gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Remover
          </Button>
        )}
      </div>

      {/* Help Text */}
      {!molecularFormula?.trim() && (
        <p className="text-xs text-muted-foreground">
          Preencha a fórmula molecular para gerar a estrutura
        </p>
      )}
      
      {molecularFormula?.trim() && !productId && (
        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
          Produto novo: a estrutura molecular será salva quando você clicar em "Criar Produto"
        </p>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="flex items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
          <LoadingSpinner size="md" text="Gerando estrutura molecular..." />
        </div>
      )}

      {/* Error State */}
      {error && !isGenerating && (
        <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
          <p className="text-sm text-destructive font-medium">Erro na geração:</p>
          <p className="text-xs text-destructive/80 mt-1">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="mt-2 flex items-center gap-2"
          >
            <RotateCcw className="h-3 w-3" />
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Image Preview */}
      {imageUrl && !isGenerating && (
        <div className="space-y-2">
          <div className="relative border border-border rounded-lg overflow-hidden bg-white">
            <img
              src={imageUrl}
              alt={`Estrutura molecular de ${molecularFormula}`}
              className="w-full h-48 object-contain"
              onError={(e) => {
                console.error('Failed to load molecular structure image:', imageUrl);
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
                    Estrutura Molecular - {productName} ({molecularFormula})
                  </DialogTitle>
                </DialogHeader>
                <div className="flex justify-center p-4">
                  <img
                    src={imageUrl}
                    alt={`Estrutura molecular de ${molecularFormula}`}
                    className="max-w-full max-h-[70vh] object-contain bg-white rounded border"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Estrutura molecular gerada para {molecularFormula}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!imageUrl && !isGenerating && !error && molecularFormula?.trim() && (
        <div className="flex items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
          <div className="text-center">
            <Atom className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              Clique em "Gerar Estrutura" para visualizar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Fórmula: {molecularFormula}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};