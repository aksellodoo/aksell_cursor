import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MolecularImageState {
  imageUrl: string | null;
  isGenerating: boolean;
  error: string | null;
}

interface UseMolecularImageGeneratorReturn {
  imageUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  generateImage: (molecularFormula: string, productId?: string) => Promise<void>;
  clearImage: () => void;
  setImageUrl: (url: string | null) => void;
  uploadImage: (file: File, productId?: string) => Promise<void>;
}

export const useMolecularImageGenerator = (): UseMolecularImageGeneratorReturn => {
  const [state, setState] = useState<MolecularImageState>({
    imageUrl: null,
    isGenerating: false,
    error: null,
  });

  const generateImage = async (molecularFormula: string, productId?: string) => {
    if (!molecularFormula.trim()) {
      toast({
        title: "Erro",
        description: "Fórmula molecular é obrigatória para gerar a estrutura",
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
      console.log('Generating molecular structure for:', molecularFormula);
      
      const { data, error } = await supabase.functions.invoke('generate-molecular-structure', {
        body: {
          molecular_formula: molecularFormula,
          product_id: tempProductId,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao gerar estrutura molecular');
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha na geração da estrutura molecular');
      }

      setState(prev => ({
        ...prev,
        imageUrl: data.image_url,
        isGenerating: false,
        error: null,
      }));

      toast({
        title: "Sucesso",
        description: "Estrutura molecular gerada com sucesso!",
      });

    } catch (error) {
      console.error('Error generating molecular structure:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro inesperado ao gerar estrutura molecular';

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
    }));
  };

  const uploadImage = async (file: File, productId?: string) => {
    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
    }));

    try {
      // Sanitize filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timestamp = Date.now();
      const fileName = `${timestamp}-${sanitizedName}`;
      // Use temporary ID if no productId provided
      const tempProductId = productId || `temp-${Date.now()}`;
      const filePath = `molecular-structures/${tempProductId}/${fileName}`;

      console.log('Uploading molecular structure image:', filePath);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-molecular-images')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-molecular-images')
        .getPublicUrl(filePath);

      setState(prev => ({
        ...prev,
        imageUrl: urlData.publicUrl,
        isGenerating: false,
        error: null,
      }));

      toast({
        title: "Sucesso",
        description: productId ? "Imagem da estrutura molecular carregada com sucesso!" : "Imagem carregada! Será salva quando você criar o produto.",
      });

    } catch (error) {
      console.error('Error uploading molecular structure image:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro inesperado no upload da imagem';

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
    generateImage,
    clearImage,
    setImageUrl,
    uploadImage,
  };
};