import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BackgroundTranslationOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
}

export const useBackgroundTranslation = (options: BackgroundTranslationOptions = {}) => {
  const { batchSize = 5, delayBetweenBatches = 2000 } = options;
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const translateMissingFields = useCallback(async () => {
    setIsTranslating(true);
    setProgress(0);

    try {
      // Buscar produtos com campos em português mas sem tradução
      const { data: products, error: productsError } = await supabase
        .from('site_products')
        .select('id, name, name_en, compound_type, compound_type_en, cas_note, cas_note_en')
        .or('name_en.is.null,compound_type_en.is.null,cas_note_en.is.null');

      if (productsError) throw productsError;

      // Buscar famílias com campos sem tradução
      const { data: families, error: familiesError } = await supabase
        .from('site_product_families')
        .select('id, name, name_en')
        .is('name_en', null);

      if (familiesError) throw familiesError;

      // Buscar segmentos com campos sem tradução
      const { data: segments, error: segmentsError } = await supabase
        .from('site_product_segments')
        .select('id, name, name_en')
        .is('name_en', null);

      if (segmentsError) throw segmentsError;

      // Buscar aplicações com campos sem tradução
      const { data: applications, error: applicationsError } = await supabase
        .from('site_product_applications')
        .select('id, name, name_en')
        .is('name_en', null);

      if (applicationsError) throw applicationsError;

      // Preparar lista de traduções necessárias
      const translationsNeeded = [];

      // Produtos
      (products || []).forEach(product => {
        if (product.name && !product.name_en) {
          translationsNeeded.push({
            type: 'product',
            id: product.id,
            field: 'name_en',
            text: product.name,
            context: 'product_name'
          });
        }
        if (product.compound_type && !product.compound_type_en) {
          translationsNeeded.push({
            type: 'product',
            id: product.id,
            field: 'compound_type_en',
            text: product.compound_type,
            context: 'compound_type'
          });
        }
        if (product.cas_note && !product.cas_note_en) {
          translationsNeeded.push({
            type: 'product',
            id: product.id,
            field: 'cas_note_en',
            text: product.cas_note,
            context: 'cas_note'
          });
        }
      });

      // Famílias
      (families || []).forEach(family => {
        if (family.name && !family.name_en) {
          translationsNeeded.push({
            type: 'family',
            id: family.id,
            field: 'name_en',
            text: family.name,
            context: 'family'
          });
        }
      });

      // Segmentos
      (segments || []).forEach(segment => {
        if (segment.name && !segment.name_en) {
          translationsNeeded.push({
            type: 'segment',
            id: segment.id,
            field: 'name_en',
            text: segment.name,
            context: 'segment'
          });
        }
      });

      // Aplicações
      (applications || []).forEach(application => {
        if (application.name && !application.name_en) {
          translationsNeeded.push({
            type: 'application',
            id: application.id,
            field: 'name_en',
            text: application.name,
            context: 'application'
          });
        }
      });

      if (translationsNeeded.length === 0) {
        toast({
          title: "Nenhuma tradução necessária",
          description: "Todos os campos já estão traduzidos.",
        });
        return;
      }

      console.log(`Iniciando tradução de ${translationsNeeded.length} campos`);

      // Processar em lotes
      let completed = 0;
      for (let i = 0; i < translationsNeeded.length; i += batchSize) {
        const batch = translationsNeeded.slice(i, i + batchSize);
        
        // Preparar textos para tradução em lote
        const texts = batch.map(item => ({
          text: item.text,
          context: item.context,
          targetField: `${item.type}_${item.id}_${item.field}`
        }));

        try {
          // Traduzir lote
          const { data, error } = await supabase.functions.invoke('translate-batch', {
            body: { texts }
          });

          if (error) throw error;

          // Aplicar traduções no banco
          for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            const translation = data.translations[j];

            if (translation.success && translation.translation) {
              const updateData = { [item.field]: translation.translation };
              
              const tableName = item.type === 'product' ? 'site_products' 
                               : item.type === 'family' ? 'site_product_families'
                               : item.type === 'segment' ? 'site_product_segments'
                               : 'site_product_applications';

              await supabase
                .from(tableName)
                .update(updateData)
                .eq('id', item.id);

              console.log(`Traduzido: ${item.text} -> ${translation.translation}`);
            }
          }

          completed += batch.length;
          setProgress(Math.round((completed / translationsNeeded.length) * 100));

          // Delay entre lotes para não sobrecarregar API
          if (i + batchSize < translationsNeeded.length) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
          }

        } catch (error) {
          console.error(`Erro ao traduzir lote ${i}-${i + batchSize}:`, error);
        }
      }

      toast({
        title: "Tradução concluída",
        description: `${completed} campos foram traduzidos com sucesso.`,
      });

    } catch (error) {
      console.error('Erro na tradução em background:', error);
      toast({
        title: "Erro na tradução",
        description: "Não foi possível completar a tradução automática.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
      setProgress(0);
    }
  }, [batchSize, delayBetweenBatches, toast]);

  return {
    translateMissingFields,
    isTranslating,
    progress
  };
};