import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Plus, Settings, Languages, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GroupsManager } from "./GroupsManager";
import { useToast } from "@/hooks/use-toast";
import { generateColorFromName } from "@/utils/colorUtils";
import { useAutoTranslation } from '@/hooks/useAutoTranslation';

interface Group {
  id: string;
  name: string;
  name_en?: string;
  color: string;
  is_active: boolean;
}

interface QuickGroupSelectorProps {
  selectedGroups: string[];
  onGroupsChange: (groupIds: string[]) => void;
  placeholder?: string;
}

export const QuickGroupSelector = ({ 
  selectedGroups, 
  onGroupsChange, 
  placeholder = "Digite um grupo e pressione Enter..."
}: QuickGroupSelectorProps) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Group[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Hook de tradução automática
  const { translateText, isTranslating } = useAutoTranslation({
    context: 'group',
    debounceMs: 1000,
    enabled: true
  });

  const loadGroups = async () => {
    try {
      // Carregar grupos ativos
      const { data: activeGroups, error: activeError } = await supabase
        .from('site_product_groups')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (activeError) throw activeError;

      // Carregar grupos inativos que estão associados ao produto atual
      const { data: inactiveGroups, error: inactiveError } = await supabase
        .from('site_product_groups')
        .select('*')
        .eq('is_active', false)
        .in('id', selectedGroups)
        .order('name');

      if (inactiveError) throw inactiveError;

      // Combinar ambas as listas e garantir que color existe
      const allGroups = [...(activeGroups || []), ...(inactiveGroups || [])].map(group => ({
        ...group,
        color: (group as any).color || generateColorFromName(group.name)
      }));
      setGroups(allGroups);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [selectedGroups]);

  // Filtrar sugestões baseadas no input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = groups
        .filter(group => 
          group.name.toLowerCase().includes(inputValue.toLowerCase()) ||
          (group.name_en && group.name_en.toLowerCase().includes(inputValue.toLowerCase()))
        )
        .filter(group => !selectedGroups.includes(group.id))
        .slice(0, 5);
      
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, groups, selectedGroups]);

  const selectedGroupsData = groups.filter(group => 
    selectedGroups.includes(group.id)
  );

  const createNewGroup = async (name: string) => {
    if (!name.trim()) return;
    
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar se já existe
      const existing = groups.find(group => 
        group.name.toLowerCase() === name.trim().toLowerCase()
      );
      
      if (existing) {
        onGroupsChange([...selectedGroups, existing.id]);
        setInputValue('');
        setShowSuggestions(false);
        return;
      }

      // Criar novo grupo
      const groupData = {
        name: name.trim(),
        name_en: null,
        created_by: user.id,
        is_active: true
      };

      const { data, error } = await supabase
        .from('site_product_groups')
        .insert(groupData)
        .select()
        .single();

      if (error) throw error;

      // Traduzir automaticamente para inglês em background
      if (data) {
        translateText(name.trim(), 'group', async (translation) => {
          if (translation) {
            await supabase
              .from('site_product_groups')
              .update({ name_en: translation })
              .eq('id', data.id);
          }
        });

        // Adicionar à lista e selecionar
        const newGroup = { 
          ...groupData, 
          id: data.id, 
          name_en: null,
          color: generateColorFromName(name.trim())
        };
        setGroups(prev => [...prev, newGroup]);
        onGroupsChange([...selectedGroups, data.id]);
        
        setInputValue('');
        setShowSuggestions(false);
        
        toast({
          title: "Grupo criado",
          description: `"${name}" foi criado e adicionado ao produto`
        });
      }
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      toast({
        title: "Erro",
        description: (error as any)?.message || "Erro ao criar grupo",
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
      const exactMatch = suggestions.find(group => 
        group.name.toLowerCase() === inputValue.trim().toLowerCase()
      );
      
      if (exactMatch) {
        handleSelectSuggestion(exactMatch);
      } else {
        createNewGroup(inputValue.trim());
      }
    }
    
    if (e.key === 'Escape') {
      setInputValue('');
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectSuggestion = (group: Group) => {
    onGroupsChange([...selectedGroups, group.id]);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemoveGroup = (groupId: string) => {
    onGroupsChange(selectedGroups.filter(id => id !== groupId));
  };

  const handleReactivateGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('site_product_groups')
        .update({ is_active: true })
        .eq('id', groupId);

      if (error) throw error;

      await loadGroups();
      
      toast({
        title: "Grupo reativado",
        description: "O grupo foi reativado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao reativar grupo:', error);
      toast({
        title: "Erro",
        description: "Erro ao reativar grupo",
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
          
          <GroupsManager 
            trigger={
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            }
            onGroupsChange={loadGroups}
          />
        </div>

        {/* Sugestões dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-12 z-50 mt-1 bg-popover border rounded-md shadow-lg">
            <div className="max-h-48 overflow-y-auto">
              {suggestions.map((group) => (
                <div
                  key={group.id}
                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSelectSuggestion(group)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{group.name}</div>
                      {group.name_en && (
                        <div className="text-xs text-muted-foreground">{group.name_en}</div>
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
        💡 Digite o nome do grupo e pressione <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> para criar rapidamente
      </div>

      {/* Grupos selecionados */}
      {selectedGroupsData.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Grupos selecionados ({selectedGroupsData.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedGroupsData.map((group) => (
              <div key={group.id} className="relative group">
                <Badge
                  style={{ 
                    backgroundColor: group.is_active ? group.color : 'hsl(var(--muted))', 
                    color: group.is_active ? 'white' : 'hsl(var(--muted-foreground))'
                  }}
                  className={`text-xs font-medium pr-1 transition-all ${
                    group.is_active 
                      ? 'hover:opacity-80' 
                      : 'opacity-60 line-through border border-border'
                  }`}
                >
                  <span className="mr-1">{group.name}</span>
                  {!group.is_active && (
                    <span className="text-xs ml-1 opacity-70">(inativo)</span>
                  )}
                </Badge>
                
                {/* Botões de ação - aparecem no hover */}
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {!group.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 w-5 p-0 bg-background hover:bg-green-50 border-green-200"
                      onClick={() => handleReactivateGroup(group.id)}
                      title="Reativar grupo"
                    >
                      <RotateCcw className="w-3 h-3 text-green-600" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-5 w-5 p-0 bg-background hover:bg-red-50 border-red-200"
                    onClick={() => handleRemoveGroup(group.id)}
                    title={group.is_active ? "Remover grupo" : "Remover associação"}
                  >
                    <X className="w-3 h-3 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Avisos sobre grupos inativos */}
          {selectedGroupsData.some(group => !group.is_active) && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
              ⚠️ Alguns grupos estão inativos. Você pode reativá-los ou remover a associação.
            </div>
          )}
        </div>
      )}
    </div>
  );
};