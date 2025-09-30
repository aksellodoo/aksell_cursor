import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateColorFromName } from "@/utils/colorUtils";

interface ImportProgress {
  total: number;
  processed: number;
  translated: number;
  errors: string[];
}

export const useApplicationsCSVImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    translated: 0,
    errors: []
  });
  const { toast } = useToast();

  const importApplicationsFromCSV = async (
    csvData: string,
    onComplete?: () => void
  ) => {
    setIsImporting(true);
    setProgress({ total: 0, processed: 0, translated: 0, errors: [] });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Parse CSV data
      const lines = csvData.trim().split('\n');
      const applications = lines
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#')) // Remover comentários e linhas vazias
        .map(line => ({
          name: line,
          name_en: null,
          color: generateColorFromName(line),
          created_by: user.id,
          is_active: true
        }));

      if (applications.length === 0) {
        throw new Error('Nenhuma aplicação válida encontrada no CSV');
      }

      setProgress(prev => ({ ...prev, total: applications.length }));

      // Buscar aplicações existentes para evitar duplicatas
      const { data: existingApps } = await supabase
        .from('site_product_applications')
        .select('name')
        .eq('is_active', true);

      const existingNames = new Set(
        (existingApps || []).map(app => app.name.toLowerCase())
      );

      // Filtrar aplicações que não existem
      const newApplications = applications.filter(app => 
        !existingNames.has(app.name.toLowerCase())
      );

      const duplicates = applications.length - newApplications.length;
      if (duplicates > 0) {
        toast({
          title: "Duplicatas encontradas",
          description: `${duplicates} aplicação(ões) já existem e foram ignoradas`
        });
      }

      if (newApplications.length === 0) {
        toast({
          title: "Nenhuma aplicação nova",
          description: "Todas as aplicações já existem no sistema"
        });
        setIsImporting(false);
        return;
      }

      // Inserir aplicações em lotes
      const batchSize = 50;
      const createdIds: string[] = [];

      for (let i = 0; i < newApplications.length; i += batchSize) {
        const batch = newApplications.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('site_product_applications')
          .insert(batch)
          .select('id, name');

        if (error) {
          setProgress(prev => ({
            ...prev,
            errors: [...prev.errors, `Erro no lote ${i / batchSize + 1}: ${error.message}`]
          }));
          continue;
        }

        if (data) {
          createdIds.push(...data.map(item => item.id));
          setProgress(prev => ({
            ...prev,
            processed: prev.processed + data.length
          }));
        }
      }

      // Traduzir aplicações em background usando a função translate-batch
      if (createdIds.length > 0) {
        translateApplicationsInBackground(createdIds);
      }

      toast({
        title: "Import concluído",
        description: `${newApplications.length} aplicação(ões) criadas. Tradução automática iniciada em background.`
      });

      onComplete?.();

    } catch (error: any) {
      console.error('Erro no import:', error);
      toast({
        title: "Erro no import",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const translateApplicationsInBackground = async (applicationIds: string[]) => {
    try {
      // Buscar aplicações sem tradução
      const { data: applications } = await supabase
        .from('site_product_applications')
        .select('id, name')
        .in('id', applicationIds)
        .is('name_en', null);

      if (!applications || applications.length === 0) return;

      // Preparar dados para tradução em lote
      const textsToTranslate = applications.map(app => ({
        text: app.name,
        context: 'application',
        targetField: `application_${app.id}_name_en`
      }));

      // Chamar função de tradução em lote
      const { data: translationResult, error } = await supabase.functions.invoke(
        'translate-batch',
        { body: { texts: textsToTranslate } }
      );

      if (error) {
        console.error('Erro na tradução em lote:', error);
        return;
      }

      // Aplicar traduções
      if (translationResult?.translations) {
        const updates = applications.map(app => {
          const translation = translationResult.translations.find(
            (t: any) => t.targetField === `application_${app.id}_name_en`
          );
          
          return translation ? {
            id: app.id,
            name_en: translation.translatedText
          } : null;
        }).filter(Boolean);

        // Atualizar em lotes
        for (const update of updates) {
          if (update) {
            await supabase
              .from('site_product_applications')
              .update({ name_en: update.name_en })
              .eq('id', update.id);
            
            setProgress(prev => ({
              ...prev,
              translated: prev.translated + 1
            }));
          }
        }

        toast({
          title: "Tradução concluída",
          description: `${updates.length} aplicação(ões) traduzidas automaticamente`
        });
      }

    } catch (error) {
      console.error('Erro na tradução em background:', error);
    }
  };

  return {
    importApplicationsFromCSV,
    isImporting,
    progress
  };
};