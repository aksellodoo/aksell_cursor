
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, X, AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NamesManagerModal } from './NamesManagerModal';

interface ProductName {
  id: string;
  name: string;
  name_en: string | null;
  is_active: boolean;
}

interface QuickNameSelectorProps {
  selectedNameId: string | null;
  onNameChange: (nameId: string | null) => void;
  placeholder?: string;
}

export const QuickNameSelector: React.FC<QuickNameSelectorProps> = ({
  selectedNameId,
  onNameChange,
  placeholder = "Digite o nome do produto..."
}) => {
  const [productNames, setProductNames] = useState<ProductName[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<ProductName[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNamesModal, setShowNamesModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Hook de tradução automática
  const { translateText, isTranslating } = useAutoTranslation({
    enabled: true,
    debounceMs: 1500
  });

  // Carregar nomes de produtos
  const loadProductNames = async () => {
    try {
      setLoading(true);
      console.log('=== QuickNameSelector: Carregando nomes de produtos ===');
      
      const { data, error } = await supabase
        .from('site_product_names')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao carregar nomes:', error);
        throw error;
      }

      console.log('Nomes carregados:', data?.length || 0, 'itens');
      setProductNames(data || []);
    } catch (error) {
      console.error('Erro ao carregar nomes de produtos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os nomes de produtos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductNames();
  }, []);

  // Filtrar sugestões baseadas no input
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      return;
    }

    const filtered = productNames.filter(name =>
      name.name.toLowerCase().includes(inputValue.toLowerCase()) ||
      (name.name_en && name.name_en.toLowerCase().includes(inputValue.toLowerCase()))
    );
    setSuggestions(filtered);
  }, [inputValue, productNames]);

  // Nome selecionado
  const selectedName = useMemo(() => {
    return productNames.find(name => name.id === selectedNameId);
  }, [productNames, selectedNameId]);

  // Criar novo nome de produto
  const createNewProductName = async (name: string) => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      console.log('=== Criando novo nome de produto ===', name);
      
      // Verificar se já existe um nome similar
      const existingName = productNames.find(
        p => p.name.toLowerCase() === name.toLowerCase()
      );

      if (existingName) {
        if (!existingName.is_active) {
          // Reativar nome inativo
          await handleReactivateProductName(existingName.id);
          return;
        } else {
          // Selecionar nome existente
          onNameChange(existingName.id);
          setInputValue('');
          setShowSuggestions(false);
          return;
        }
      }

      // Obter ID do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Criar novo nome
      const { data, error } = await supabase
        .from('site_product_names')
        .insert({
          name: name.trim(),
          name_en: null,
          is_active: true,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar nome:', error);
        throw error;
      }

      console.log('Nome criado com sucesso:', data);

      // Traduzir automaticamente
      if (data) {
        translateText(data.name, `product-name-${data.id}`, async (translatedText) => {
          if (translatedText && translatedText !== data.name) {
            try {
              await supabase
                .from('site_product_names')
                .update({ name_en: translatedText })
                .eq('id', data.id);
              
              // Atualizar estado local com tradução
              setProductNames(prev => 
                prev.map(name => 
                  name.id === data.id 
                    ? { ...name, name_en: translatedText }
                    : name
                )
              );
            } catch (updateError) {
              console.error('Erro ao atualizar tradução:', updateError);
            }
          }
        });

        // Adicionar à lista e selecionar
        const newName: ProductName = {
          ...data,
          name_en: null
        };
        setProductNames(prev => [newName, ...prev]);
        onNameChange(data.id);
        setInputValue('');
        setShowSuggestions(false);

        toast({
          title: "Nome criado",
          description: `Nome "${name}" foi criado e está sendo traduzido.`,
        });
      }
    } catch (error) {
      console.error('Erro ao criar nome:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o nome do produto.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Manipular tecla pressionada
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        // Selecionar primeira sugestão
        handleSelectSuggestion(suggestions[0]);
      } else if (inputValue.trim()) {
        // Criar novo nome
        createNewProductName(inputValue.trim());
      }
    } else if (e.key === 'Escape') {
      setInputValue('');
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Selecionar sugestão
  const handleSelectSuggestion = (name: ProductName) => {
    onNameChange(name.id);
    setInputValue('');
    setShowSuggestions(false);
  };

  // Remover nome selecionado
  const handleRemoveProductName = () => {
    onNameChange(null);
  };

  // Reativar nome inativo
  const handleReactivateProductName = async (nameId: string) => {
    try {
      const { error } = await supabase
        .from('site_product_names')
        .update({ is_active: true })
        .eq('id', nameId);

      if (error) throw error;

      // Atualizar estado local
      setProductNames(prev =>
        prev.map(name =>
          name.id === nameId ? { ...name, is_active: true } : name
        )
      );

      onNameChange(nameId);
      setInputValue('');
      setShowSuggestions(false);

      toast({
        title: "Nome reativado",
        description: "O nome foi reativado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao reativar nome:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reativar o nome.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Carregando nomes..."
              disabled
              className="animate-pulse"
            />
          </div>
          <Button variant="outline" size="sm" disabled>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            className="pr-10"
            disabled={isCreating}
          />
          {(isCreating || isTranslating) && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {/* Dropdown de sugestões */}
          {showSuggestions && inputValue && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto bg-background border shadow-lg">
              <CardContent className="p-0">
                {suggestions.length > 0 ? (
                  <div className="py-1">
                    {suggestions.map((name) => (
                      <div
                        key={name.id}
                        className={cn(
                          "px-3 py-2 cursor-pointer hover:bg-accent text-sm flex items-center justify-between",
                          !name.is_active && "opacity-60"
                        )}
                        onClick={() => handleSelectSuggestion(name)}
                      >
                        <div>
                          <div className="font-medium">{name.name}</div>
                          {name.name_en && (
                            <div className="text-muted-foreground text-xs">{name.name_en}</div>
                          )}
                        </div>
                        {!name.is_active && (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Pressione Enter para criar "{inputValue}"
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNamesModal(true)}
          title="Gerenciar nomes de produtos"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Nome selecionado */}
      {selectedName && (
        <div className="flex items-center gap-2">
          <Badge 
            variant={selectedName.is_active ? "default" : "secondary"}
            className="text-sm py-1 px-2 flex items-center gap-1"
          >
            <span>{selectedName.name}</span>
            {selectedName.name_en && (
              <span className="opacity-70">({selectedName.name_en})</span>
            )}
            <button
              onClick={handleRemoveProductName}
              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
          
          {!selectedName.is_active && (
            <div className="flex items-center gap-1 text-orange-600 text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span>Inativo</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1"
                onClick={() => handleReactivateProductName(selectedName.id)}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal de gestão de nomes */}
      <NamesManagerModal
        open={showNamesModal}
        onOpenChange={setShowNamesModal}
        onNameCreated={() => {
          // Recarregar lista de nomes após criação
          loadProductNames();
        }}
      />
    </div>
  );
};
