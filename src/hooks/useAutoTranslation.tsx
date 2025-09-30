import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TranslationCache {
  [key: string]: string;
}

interface UseAutoTranslationOptions {
  context?: string;
  debounceMs?: number;
  enabled?: boolean;
}

export const useAutoTranslation = (options: UseAutoTranslationOptions = {}) => {
  const { context = 'general', debounceMs = 1500, enabled = true } = options;
  const [isTranslating, setIsTranslating] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const cacheRef = useRef<TranslationCache>({});

  // Load cache from localStorage on first use
  const loadCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(`translation_cache_${context}`);
      if (cached) {
        cacheRef.current = JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Failed to load translation cache:', error);
    }
  }, [context]);

  // Save cache to localStorage
  const saveCache = useCallback(() => {
    try {
      localStorage.setItem(`translation_cache_${context}`, JSON.stringify(cacheRef.current));
    } catch (error) {
      console.warn('Failed to save translation cache:', error);
    }
  }, [context]);

  const translateText = useCallback(async (
    text: string,
    contextOverride: string = context,
    onTranslated: (translation: string) => void
  ) => {
    if (!enabled || !text?.trim()) return;

    // Check cache first
    const normalizedText = text.trim().toLowerCase();
    if (cacheRef.current[normalizedText]) {
      onTranslated(cacheRef.current[normalizedText]);
      return;
    }

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(async () => {
      if (!text?.trim()) return;

      setIsTranslating(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('translate-text', {
          body: { 
            text: text.trim(),
            context: contextOverride,
            targetLanguage: 'english'
          }
        });

        if (error) {
          console.error('Translation error:', error);
          toast({
            title: "Erro na tradução",
            description: "Não foi possível traduzir o texto automaticamente.",
            variant: "destructive",
          });
          return;
        }

        const translation = data?.translation;
        if (translation) {
          // Cache the translation
          if (!cacheRef.current) cacheRef.current = {};
          cacheRef.current[normalizedText] = translation;
          saveCache();
          
          onTranslated(translation);
        }
      } catch (error) {
        console.error('Translation error:', error);
        toast({
          title: "Erro na tradução",
          description: "Não foi possível traduzir o texto automaticamente.",
          variant: "destructive",
        });
      } finally {
        setIsTranslating(false);
      }
    }, debounceMs);
  }, [enabled, debounceMs, saveCache]);

  // Manually retranslate (bypass cache)
  const retranslate = useCallback(async (
    text: string,
    contextOverride: string = context,
    onTranslated: (translation: string) => void
  ) => {
    if (!enabled || !text?.trim()) return;

    setIsTranslating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { 
          text: text.trim(),
          context: contextOverride,
          targetLanguage: 'english'
        }
      });

      if (error) throw error;

      const translation = data?.translation;
      if (translation) {
        // Update cache
        const normalizedText = text.trim().toLowerCase();
        if (!cacheRef.current) cacheRef.current = {};
        cacheRef.current[normalizedText] = translation;
        saveCache();
        
        onTranslated(translation);
        
        toast({
          title: "Tradução atualizada",
          description: "O texto foi retraduzido com sucesso.",
        });
      }
    } catch (error) {
      console.error('Retranslation error:', error);
      toast({
        title: "Erro na retradução",
        description: "Não foi possível retraduzir o texto.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  }, [enabled, saveCache]);

  // Batch translate multiple texts
  const translateBatch = useCallback(async (
    texts: Array<{ text: string; context: string; targetField: string }>,
    onProgress?: (progress: number) => void
  ) => {
    if (!enabled || texts.length === 0) return [];

    try {
      const { data, error } = await supabase.functions.invoke('translate-batch', {
        body: { texts }
      });

      if (error) {
        console.error('Batch translation error:', error);
        throw error;
      }

      // Update cache for successful translations
      data.translations?.forEach((result: any) => {
        if (result.success && result.originalText?.trim()) {
          const normalizedText = result.originalText.trim().toLowerCase();
          if (!cacheRef.current) cacheRef.current = {};
          cacheRef.current[normalizedText] = result.translation;
        }
      });
      
      saveCache();
      
      return data.translations || [];
    } catch (error) {
      console.error('Batch translation error:', error);
      toast({
        title: "Erro na tradução em lote",
        description: "Não foi possível traduzir os textos automaticamente.",
        variant: "destructive",
      });
      return [];
    }
  }, [enabled, saveCache]);

  // Clear cache for specific context
  const clearCache = useCallback(() => {
    cacheRef.current = {};
    localStorage.removeItem(`translation_cache_${context}`);
    toast({
      title: "Cache limpo",
      description: "Cache de traduções foi limpo.",
    });
  }, [context]);

  // Initialize cache on mount
  useState(() => {
    loadCache();
  });

  return {
    translateText,
    retranslate,
    translateBatch,
    clearCache,
    isTranslating
  };
};