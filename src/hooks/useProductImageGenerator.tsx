import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProductImageState {
  imageUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  lastUsedPrompt: string | null;
}

interface UseProductImageGeneratorReturn {
  imageUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  lastUsedPrompt: string | null;
  generateImage: (molecularFormula: string, productFormat: 'solid' | 'liquid', productId?: string) => Promise<void>;
  clearImage: () => void;
  setImageUrl: (url: string | null) => void;
  uploadImage: (file: File, productId?: string) => Promise<void>;
}

export const useProductImageGenerator = (): UseProductImageGeneratorReturn => {
  const [state, setState] = useState<ProductImageState>({
    imageUrl: null,
    isGenerating: false,
    error: null,
    lastUsedPrompt: null,
  });

  const generateImage = async (molecularFormula: string, productFormat: 'solid' | 'liquid', productId?: string) => {
    if (!molecularFormula.trim()) {
      toast({
        title: "Erro",
        description: "Fórmula molecular é obrigatória para gerar a imagem",
        variant: "destructive",
      });
      return;
    }

    if (!productFormat) {
      toast({
        title: "Erro", 
        description: "Estado físico é obrigatório para gerar a imagem",
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
    }));

    try {
      // Use temporary ID if no productId provided
      const tempProductId = productId || `temp-${Date.now()}`;
      console.log('Generating product image for:', { molecularFormula, productFormat, productId: tempProductId });
      
      const { data, error } = await supabase.functions.invoke('generate-product-image', {
        body: {
          molecular_formula: molecularFormula,
          product_format: productFormat,
          product_id: tempProductId,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao gerar imagem do produto');
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha na geração da imagem do produto');
      }

      setState(prev => ({
        ...prev,
        imageUrl: data.image_url,
        isGenerating: false,
        error: null,
        lastUsedPrompt: data.prompt_used || null,
      }));

      toast({
        title: "Sucesso",
        description: "Imagem do produto gerada com sucesso!",
      });

    } catch (error) {
      console.error('Error generating product image:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro inesperado ao gerar imagem do produto';

      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
      }));

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const uploadImage = async (file: File, productId?: string) => {
    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
    }));

    try {
      const fileExt = file.name.split('.').pop();
      // Use temporary ID if no productId provided
      const tempProductId = productId || `temp-${Date.now()}`;
      const fileName = `product-${tempProductId}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('site-products')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('site-products')
        .getPublicUrl(fileName);

      setState(prev => ({
        ...prev,
        imageUrl: publicUrl,
        isGenerating: false,
        error: null,
      }));

      toast({
        title: "Sucesso",
        description: productId ? "Imagem enviada com sucesso!" : "Imagem enviada! Será salva quando você criar o produto.",
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro inesperado ao enviar imagem';

      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
      }));

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const clearImage = () => {
    setState(prev => ({
      ...prev,
      imageUrl: null,
      error: null,
      lastUsedPrompt: null,
    }));
  };

  const setImageUrl = (url: string | null) => {
    setState(prev => ({
      ...prev,
      imageUrl: url,
      error: null,
    }));
  };

  return {
    imageUrl: state.imageUrl,
    isGenerating: state.isGenerating,
    error: state.error,
    lastUsedPrompt: state.lastUsedPrompt,
    generateImage,
    clearImage,
    setImageUrl,
    uploadImage,
  };
};