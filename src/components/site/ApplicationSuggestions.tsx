import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Application {
  id: string;
  name: string;
  name_en?: string;
  color: string;
  usage_count: number;
}

interface ApplicationSuggestionsProps {
  productName: string;
  selectedApplications: string[];
  onApplicationsChange: (applicationIds: string[]) => void;
  maxSuggestions?: number;
}

export const ApplicationSuggestions = ({ 
  productName, 
  selectedApplications, 
  onApplicationsChange, 
  maxSuggestions = 5 
}: ApplicationSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productName.trim()) {
      loadSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [productName]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      // Buscar aplicações mais usadas que não estão selecionadas
      const { data, error } = await supabase
        .from('site_product_applications')
        .select(`
          id,
          name,
          name_en,
          color,
          site_product_applications_map!inner (
            product_id
          )
        `)
        .eq('is_active', true)
        .not('id', 'in', `(${selectedApplications.join(',') || 'null'})`)
        .limit(maxSuggestions * 2); // Buscar mais para filtrar depois

      if (error) throw error;

      // Contar uso de cada aplicação
      const applicationsWithCount = (data || []).map(app => {
        const usageCount = app.site_product_applications_map?.length || 0;
        return {
          id: app.id,
          name: app.name,
          name_en: app.name_en,
          color: app.color,
          usage_count: usageCount
        };
      });

      // Ordenar por uso e palavras-chave relevantes
      const sorted = applicationsWithCount
        .sort((a, b) => {
          // Priorizar aplicações que têm palavras em comum com o nome do produto
          const aRelevant = hasRelevantKeywords(a.name, productName);
          const bRelevant = hasRelevantKeywords(b.name, productName);
          
          if (aRelevant && !bRelevant) return -1;
          if (!aRelevant && bRelevant) return 1;
          
          // Se ambos são relevantes ou não relevantes, ordenar por uso
          return b.usage_count - a.usage_count;
        })
        .slice(0, maxSuggestions);

      setSuggestions(sorted);
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasRelevantKeywords = (applicationName: string, productName: string): boolean => {
    const productWords = productName.toLowerCase().split(' ').filter(w => w.length > 3);
    const appWords = applicationName.toLowerCase().split(' ');
    
    return productWords.some(productWord => 
      appWords.some(appWord => 
        appWord.includes(productWord) || productWord.includes(appWord)
      )
    );
  };

  const handleSelectSuggestion = (applicationId: string) => {
    onApplicationsChange([...selectedApplications, applicationId]);
  };

  if (!suggestions.length || loading) {
    return null;
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          Sugestões baseadas no nome do produto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((app) => (
            <Button
              key={app.id}
              variant="outline"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={() => handleSelectSuggestion(app.id)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: app.color }}
                />
                <span>{app.name}</span>
                <Plus className="w-3 h-3 ml-1" />
              </div>
            </Button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          Clique para adicionar rapidamente
        </div>
      </CardContent>
    </Card>
  );
};