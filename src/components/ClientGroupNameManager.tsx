
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PROTHEUS_TABLES } from '@/lib/config';
import { Edit3, Sparkles, Save, X, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { ClientGroup } from '@/hooks/useProtheusClientGroups';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ClientGroupNameManagerProps {
  group: ClientGroup;
  onUpdate: () => void;
}

export const ClientGroupNameManager: React.FC<ClientGroupNameManagerProps> = ({
  group,
  onUpdate
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(group?.display_name || '');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiConfidence, setAiConfidence] = useState(0);
  const [aiReasoning, setAiReasoning] = useState('');
  const [analyzedUnits, setAnalyzedUnits] = useState(0);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const generateAIName = async () => {
    try {
      setIsGeneratingAI(true);
      
      // Buscar nomes detalhados das unidades do grupo
      const { data: unitNames, error: unitsError } = await supabase.rpc('get_protheus_group_unit_names', {
        p_table_id: PROTHEUS_TABLES.SA1010_CLIENTES,
        p_filial: group?.a1_filial || '',
        p_cod: group?.a1_cod || ''
      });

      if (unitsError) throw unitsError;
      
      if (!unitNames || unitNames.length === 0) {
        throw new Error('Nenhuma unidade encontrada para o grupo');
      }

      // Análise local para extrair possível marca
      const extractBrandCandidate = (names: string[]) => {
        const words = names.join(' ').toLowerCase()
          .replace(/\b(ltda|s\.?a\.?|me|eireli|ss|filial|matriz|loja|unidade)\b/g, '')
          .split(/\s+/)
          .filter(word => word.length > 2);
        
        const wordFreq = words.reduce((acc, word) => {
          acc[word] = (acc[word] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(wordFreq)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([word]) => word);
      };

      const allNames = unitNames.map(u => u.unit_name).filter(Boolean);
      const shortNames = unitNames.map(u => u.short_name).filter(Boolean);
      const candidateWords = extractBrandCandidate([...allNames, ...shortNames]);
      
      // Contexto enriquecido para a IA
      const contextInfo = {
        group_id: `${group?.a1_filial || ''}-${group?.a1_cod || ''}`,
        unit_count: group?.unit_count || 0,
        sample_unit_names: allNames.slice(0, 5),
        sample_short_names: shortNames.slice(0, 5),
        vendors: group?.vendors || [],
        candidate_brand_words: candidateWords
      };
      
      const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-suggest', {
        body: {
          sourceValues: contextInfo,
          task: 'extract',
          instructions: `Analise os nomes das unidades empresariais e extraia o nome da marca/empresa principal que representa este grupo corporativo.

OBJETIVO: Identificar a marca/razão social principal, não criar um nome genérico.

REGRAS IMPORTANTES:
- Use os nomes reais das unidades como base
- Identifique padrões nos nomes (ex: "Heineken" aparece em várias unidades)
- Evite termos genéricos como "Grupo", "Unificado", "Corporação"
- Prefira nomes de 1-3 palavras
- Se houver uma marca clara, use-a (ex: se várias unidades têm "Heineken", sugira "Heineken")

EXEMPLO:
Se as unidades são: "Heineken Brasil S.A.", "Heineken Nordeste Ltda", "Heineken SP"
Sugestão correta: "Heineken"
Sugestão INCORRETA: "Grupo Unificado 15"`,
          outputType: 'json',
          context: {
            total_units: unitNames.length,
            has_vendors: group.vendors?.length > 0
          }
        }
      });

      if (aiError) throw aiError;
      
      setAiSuggestion(aiData.suggestion);
      setAiConfidence(aiData.confidence || 0.8);
      setAiReasoning(aiData.reasoning || 'Análise baseada nos nomes das unidades');
      setAnalyzedUnits(unitNames.length);
      
      toast({
        title: "Sugestão gerada",
        description: `IA analisou ${unitNames.length} unidades. Confiança: ${Math.round((aiData.confidence || 0.8) * 100)}%`,
      });
    } catch (error) {
      console.error('Error generating AI suggestion:', error);
      toast({
        title: "Erro na sugestão",
        description: "Não foi possível gerar sugestão da IA.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const saveGroupName = async () => {
    try {
      setIsSaving(true);

      const finalName = name.trim() || aiSuggestion.trim();
      if (!finalName) {
        toast({
          title: "Nome obrigatório",
          description: "Informe um nome para o grupo.",
          variant: "destructive"
        });
        return;
      }

      // Upsert do grupo
      const { error } = await supabase
        .from('protheus_customer_groups')
        .upsert({
          protheus_table_id: PROTHEUS_TABLES.SA1010_CLIENTES,
          filial: group?.a1_filial || '',
          cod: group?.a1_cod || '',
          name: finalName,
          ai_suggested_name: aiSuggestion || null,
          name_source: name.trim() ? 'manual' : 'ai',
          unit_count: group?.unit_count || 0
        }, {
          onConflict: 'protheus_table_id,filial,cod'
        });

      if (error) throw error;

      toast({
        title: "Nome salvo",
        description: "Nome do grupo atualizado com sucesso."
      });

      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving group name:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o nome do grupo.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit3 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Gerenciar Nome do Grupo</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <strong>Grupo:</strong> {group?.a1_filial || 'N/A'} - {group?.a1_cod || 'N/A'} ({group?.unit_count || 0} unidades)
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-name">Nome do Grupo</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do grupo..."
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Sugestão da IA</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={generateAIName}
                disabled={isGeneratingAI}
              >
                {isGeneratingAI ? (
                  <LoadingSpinner className="w-4 h-4 mr-1" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-1" />
                )}
                {isGeneratingAI ? 'Analisando...' : 'Gerar Sugestão'}
              </Button>
            </div>
            
            {aiSuggestion && (
              <div className="space-y-3">
                <Textarea
                  value={aiSuggestion}
                  onChange={(e) => setAiSuggestion(e.target.value)}
                  className="min-h-[60px]"
                  placeholder="Sugestão será gerada aqui..."
                />
                
                {/* AI Analysis Results */}
                <Alert className={aiConfidence > 0.8 ? "border-green-200 bg-green-50" : aiConfidence > 0.6 ? "border-yellow-200 bg-yellow-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-start gap-2">
                    {aiConfidence > 0.8 ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    ) : aiConfidence > 0.6 ? (
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <AlertDescription className="text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">
                            Confiança: {Math.round(aiConfidence * 100)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {analyzedUnits} unidades analisadas
                          </span>
                        </div>
                        {aiReasoning && (
                          <p className="text-xs text-muted-foreground">
                            {aiReasoning}
                          </p>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>

                {aiConfidence < 0.7 && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <Info className="w-4 h-4 text-orange-600" />
                    <AlertDescription className="text-sm text-orange-800">
                      Confiança baixa na sugestão. Recomenda-se revisar manualmente o nome baseado nos dados das unidades.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveGroupName} disabled={isSaving}>
              {isSaving ? (
                <LoadingSpinner className="w-4 h-4 mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
