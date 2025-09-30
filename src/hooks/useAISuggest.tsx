import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AISuggestOptions {
  sourceValues: Record<string, any>;
  task: 'summarize' | 'classify' | 'extract' | 'correct' | 'generate';
  instructions: string;
  outputType: 'text' | 'json';
}

interface AISuggestResult {
  suggestion: string;
  confidence: number;
  tokensUsed: number;
}

export const useAISuggest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSuggestion, setLastSuggestion] = useState<string | null>(null);
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);
  const { toast } = useToast();

  const getSuggestion = async (options: AISuggestOptions): Promise<AISuggestResult | null> => {
    setIsLoading(true);
    
    try {
      console.log('Getting AI suggestion with options:', options);
      
      const { data, error } = await supabase.functions.invoke('ai-suggest', {
        body: options
      });

      if (error) {
        console.error('AI suggestion error:', error);
        throw new Error(error.message || 'Erro ao obter sugestão da IA');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const result: AISuggestResult = {
        suggestion: data.suggestion,
        confidence: data.confidence,
        tokensUsed: data.tokensUsed,
      };

      setLastSuggestion(result.suggestion);
      setLastConfidence(result.confidence);

      toast({
        title: "Sugestão da IA gerada",
        description: `Confiança: ${result.confidence}% • Tokens: ${result.tokensUsed}`,
      });

      return result;
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      toast({
        title: "Erro na sugestão da IA",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearSuggestion = () => {
    setLastSuggestion(null);
    setLastConfidence(null);
  };

  return {
    getSuggestion,
    clearSuggestion,
    isLoading,
    lastSuggestion,
    lastConfidence,
  };
};