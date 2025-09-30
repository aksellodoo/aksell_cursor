import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Plus, Settings, Languages, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SegmentsManager } from "./SegmentsManager";
import { useToast } from "@/hooks/use-toast";
import { generateColorFromName } from "@/utils/colorUtils";
import { useAutoTranslation } from '@/hooks/useAutoTranslation';

interface Segment {
  id: string;
  name: string;
  name_en?: string;
  color: string;
  is_active: boolean;
}

interface QuickSegmentSelectorProps {
  selectedSegments: string[];
  onSegmentsChange: (segmentIds: string[]) => void;
  placeholder?: string;
}

export const QuickSegmentSelector = ({ 
  selectedSegments, 
  onSegmentsChange, 
  placeholder = "Digite um segmento e pressione Enter..."
}: QuickSegmentSelectorProps) => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Segment[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Hook de tradução automática
  const { translateText, isTranslating } = useAutoTranslation({
    context: 'segment',
    debounceMs: 1000,
    enabled: true
  });

  const loadSegments = async () => {
    try {
      // Carregar segmentos ativos
      const { data: activeSegments, error: activeError } = await supabase
        .from('site_product_segments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (activeError) throw activeError;

      // Carregar segmentos inativos que estão associados ao produto atual
      const { data: inactiveSegments, error: inactiveError } = await supabase
        .from('site_product_segments')
        .select('*')
        .eq('is_active', false)
        .in('id', selectedSegments)
        .order('name');

      if (inactiveError) throw inactiveError;

      // Combinar ambas as listas e garantir que color existe
      const allSegments = [...(activeSegments || []), ...(inactiveSegments || [])].map(segment => ({
        ...segment,
        color: (segment as any).color || generateColorFromName(segment.name)
      }));
      setSegments(allSegments);
    } catch (error) {
      console.error('Erro ao carregar segmentos:', error);
    }
  };

  useEffect(() => {
    loadSegments();
  }, [selectedSegments]);

  // Filtrar sugestões baseadas no input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = segments
        .filter(segment => 
          segment.name.toLowerCase().includes(inputValue.toLowerCase()) ||
          (segment.name_en && segment.name_en.toLowerCase().includes(inputValue.toLowerCase()))
        )
        .filter(segment => !selectedSegments.includes(segment.id))
        .slice(0, 5);
      
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, segments, selectedSegments]);

  const selectedSegs = segments.filter(segment => 
    selectedSegments.includes(segment.id)
  );

  const createNewSegment = async (name: string) => {
    if (!name.trim()) return;
    
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar se já existe
      const existing = segments.find(segment => 
        segment.name.toLowerCase() === name.trim().toLowerCase()
      );
      
      if (existing) {
        onSegmentsChange([...selectedSegments, existing.id]);
        setInputValue('');
        setShowSuggestions(false);
        return;
      }

      // Criar novo segmento
      const segmentData = {
        name: name.trim(),
        name_en: null,
        color: generateColorFromName(name.trim()),
        created_by: user.id,
        is_active: true
      };

      const { data, error } = await supabase
        .from('site_product_segments')
        .insert(segmentData)
        .select()
        .single();

      if (error) throw error;

      // Traduzir automaticamente para inglês em background
      if (data) {
        translateText(name.trim(), 'segment', async (translation) => {
          if (translation) {
            await supabase
              .from('site_product_segments')
              .update({ name_en: translation })
              .eq('id', data.id);
          }
        });

        // Adicionar à lista e selecionar
        const newSegment = { ...segmentData, id: data.id, name_en: null };
        setSegments(prev => [...prev, newSegment]);
        onSegmentsChange([...selectedSegments, data.id]);
        
        setInputValue('');
        setShowSuggestions(false);
        
        toast({
          title: "Segmento criado",
          description: `"${name}" foi criado e adicionado ao produto`
        });
      }
    } catch (error) {
      console.error('Erro ao criar segmento:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar segmento",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      
      // Se há uma sugestão exata, usar ela
      const exactMatch = suggestions.find(segment => 
        segment.name.toLowerCase() === inputValue.trim().toLowerCase()
      );
      
      if (exactMatch) {
        handleSelectSuggestion(exactMatch);
      } else {
        createNewSegment(inputValue.trim());
      }
    }
    
    if (e.key === 'Escape') {
      setInputValue('');
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectSuggestion = (segment: Segment) => {
    onSegmentsChange([...selectedSegments, segment.id]);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemoveSegment = (segmentId: string) => {
    onSegmentsChange(selectedSegments.filter(id => id !== segmentId));
  };

  const handleReactivateSegment = async (segmentId: string) => {
    try {
      const { error } = await supabase
        .from('site_product_segments')
        .update({ is_active: true })
        .eq('id', segmentId);

      if (error) throw error;

      await loadSegments();
      
      toast({
        title: "Segmento reativado",
        description: "O segmento foi reativado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao reativar segmento:', error);
      toast({
        title: "Erro",
        description: "Erro ao reativar segmento",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Input rápido */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => inputValue.trim() && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={placeholder}
              disabled={isCreating}
              className="pr-8"
            />
            {(isCreating || isTranslating) && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Languages className="w-4 h-4 animate-pulse text-muted-foreground" />
              </div>
            )}
          </div>
          
          <SegmentsManager 
            trigger={
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            }
            onSegmentsChange={loadSegments}
          />
        </div>

        {/* Sugestões dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-12 z-50 mt-1 bg-popover border rounded-md shadow-lg">
            <div className="max-h-48 overflow-y-auto">
              {suggestions.map((segment) => (
                <div
                  key={segment.id}
                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSelectSuggestion(segment)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: segment.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{segment.name}</div>
                      {segment.name_en && (
                        <div className="text-xs text-muted-foreground">{segment.name_en}</div>
                      )}
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dica de uso */}
      <div className="text-xs text-muted-foreground">
        💡 Digite o nome do segmento e pressione <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> para criar rapidamente
      </div>

      {/* Segmentos selecionados */}
      {selectedSegs.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Segmentos selecionados ({selectedSegs.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedSegs.map((segment) => (
              <div key={segment.id} className="relative group">
                <Badge
                  style={{ 
                    backgroundColor: segment.is_active ? segment.color : 'hsl(var(--muted))', 
                    color: segment.is_active ? 'white' : 'hsl(var(--muted-foreground))'
                  }}
                  className={`text-xs font-medium pr-1 transition-all ${
                    segment.is_active 
                      ? 'hover:opacity-80' 
                      : 'opacity-60 line-through border border-border'
                  }`}
                >
                  <span className="mr-1">{segment.name}</span>
                  {!segment.is_active && (
                    <span className="text-xs ml-1 opacity-70">(inativo)</span>
                  )}
                </Badge>
                
                {/* Botões de ação - aparecem no hover */}
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {!segment.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 w-5 p-0 bg-background hover:bg-green-50 border-green-200"
                      onClick={() => handleReactivateSegment(segment.id)}
                      title="Reativar segmento"
                    >
                      <RotateCcw className="w-3 h-3 text-green-600" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-5 w-5 p-0 bg-background hover:bg-red-50 border-red-200"
                    onClick={() => handleRemoveSegment(segment.id)}
                    title={segment.is_active ? "Remover segmento" : "Remover associação"}
                  >
                    <X className="w-3 h-3 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Avisos sobre segmentos inativos */}
          {selectedSegs.some(segment => !segment.is_active) && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
              ⚠️ Alguns segmentos estão inativos. Você pode reativá-los ou remover a associação.
            </div>
          )}
        </div>
      )}
    </div>
  );
};