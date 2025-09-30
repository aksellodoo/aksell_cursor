import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Plus, Settings, Languages, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ApplicationsManager } from "./ApplicationsManager";
import { useToast } from "@/hooks/use-toast";
import { generateColorFromName } from "@/utils/colorUtils";
import { useAutoTranslation } from '@/hooks/useAutoTranslation';

interface Application {
  id: string;
  name: string;
  name_en?: string;
  color: string;
  is_active: boolean;
}

interface QuickApplicationSelectorProps {
  selectedApplications: string[];
  onApplicationsChange: (applicationIds: string[]) => void;
  placeholder?: string;
}

export const QuickApplicationSelector = ({ 
  selectedApplications, 
  onApplicationsChange, 
  placeholder = "Digite uma aplicação e pressione Enter..."
}: QuickApplicationSelectorProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Application[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Hook de tradução automática
  const { translateText, isTranslating } = useAutoTranslation({
    context: 'application',
    debounceMs: 1000,
    enabled: true
  });

  const loadApplications = async () => {
    try {
      // Carregar aplicações ativas
      const { data: activeApps, error: activeError } = await supabase
        .from('site_product_applications')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (activeError) throw activeError;

      // Carregar aplicações inativas que estão associadas ao produto atual
      const { data: inactiveApps, error: inactiveError } = await supabase
        .from('site_product_applications')
        .select('*')
        .eq('is_active', false)
        .in('id', selectedApplications)
        .order('name');

      if (inactiveError) throw inactiveError;

      // Combinar ambas as listas
      setApplications([...(activeApps || []), ...(inactiveApps || [])]);
    } catch (error) {
      console.error('Erro ao carregar aplicações:', error);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [selectedApplications]);

  // Filtrar sugestões baseadas no input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = applications
        .filter(app => 
          app.name.toLowerCase().includes(inputValue.toLowerCase()) ||
          (app.name_en && app.name_en.toLowerCase().includes(inputValue.toLowerCase()))
        )
        .filter(app => !selectedApplications.includes(app.id))
        .slice(0, 5);
      
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, applications, selectedApplications]);

  const selectedApps = applications.filter(app => 
    selectedApplications.includes(app.id)
  );

  const createNewApplication = async (name: string) => {
    if (!name.trim()) return;
    
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar se já existe
      const existing = applications.find(app => 
        app.name.toLowerCase() === name.trim().toLowerCase()
      );
      
      if (existing) {
        onApplicationsChange([...selectedApplications, existing.id]);
        setInputValue('');
        setShowSuggestions(false);
        return;
      }

      // Criar nova aplicação
      const applicationData = {
        name: name.trim(),
        name_en: null,
        color: generateColorFromName(name.trim()),
        created_by: user.id,
        is_active: true
      };

      const { data, error } = await supabase
        .from('site_product_applications')
        .insert(applicationData)
        .select()
        .single();

      if (error) throw error;

      // Traduzir automaticamente para inglês em background
      if (data) {
        translateText(name.trim(), 'application', async (translation) => {
          if (translation) {
            await supabase
              .from('site_product_applications')
              .update({ name_en: translation })
              .eq('id', data.id);
          }
        });

        // Adicionar à lista e selecionar
        const newApp = { ...applicationData, id: data.id, name_en: null };
        setApplications(prev => [...prev, newApp]);
        onApplicationsChange([...selectedApplications, data.id]);
        
        setInputValue('');
        setShowSuggestions(false);
        
        toast({
          title: "Aplicação criada",
          description: `"${name}" foi criada e adicionada ao produto`
        });
      }
    } catch (error) {
      console.error('Erro ao criar aplicação:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar aplicação",
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
      const exactMatch = suggestions.find(app => 
        app.name.toLowerCase() === inputValue.trim().toLowerCase()
      );
      
      if (exactMatch) {
        handleSelectSuggestion(exactMatch);
      } else {
        createNewApplication(inputValue.trim());
      }
    }
    
    if (e.key === 'Escape') {
      setInputValue('');
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectSuggestion = (application: Application) => {
    onApplicationsChange([...selectedApplications, application.id]);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemoveApplication = (applicationId: string) => {
    onApplicationsChange(selectedApplications.filter(id => id !== applicationId));
  };

  const handleReactivateApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('site_product_applications')
        .update({ is_active: true })
        .eq('id', applicationId);

      if (error) throw error;

      await loadApplications();
      
      toast({
        title: "Aplicação reativada",
        description: "A aplicação foi reativada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao reativar aplicação:', error);
      toast({
        title: "Erro",
        description: "Erro ao reativar aplicação",
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
          
          <ApplicationsManager 
            trigger={
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            }
            onApplicationsChange={loadApplications}
          />
        </div>

        {/* Sugestões dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-12 z-50 mt-1 bg-popover border rounded-md shadow-lg">
            <div className="max-h-48 overflow-y-auto">
              {suggestions.map((app) => (
                <div
                  key={app.id}
                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSelectSuggestion(app)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: app.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{app.name}</div>
                      {app.name_en && (
                        <div className="text-xs text-muted-foreground">{app.name_en}</div>
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
        💡 Digite o nome da aplicação e pressione <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> para criar rapidamente
      </div>

      {/* Aplicações selecionadas */}
      {selectedApps.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Aplicações selecionadas ({selectedApps.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedApps.map((app) => (
              <div key={app.id} className="relative group">
                <Badge
                  style={{ 
                    backgroundColor: app.is_active ? app.color : 'hsl(var(--muted))', 
                    color: app.is_active ? 'white' : 'hsl(var(--muted-foreground))'
                  }}
                  className={`text-xs font-medium pr-1 transition-all ${
                    app.is_active 
                      ? 'hover:opacity-80' 
                      : 'opacity-60 line-through border border-border'
                  }`}
                >
                  <span className="mr-1">{app.name}</span>
                  {!app.is_active && (
                    <span className="text-xs ml-1 opacity-70">(inativa)</span>
                  )}
                </Badge>
                
                {/* Botões de ação - aparecem no hover */}
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {!app.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 w-5 p-0 bg-background hover:bg-green-50 border-green-200"
                      onClick={() => handleReactivateApplication(app.id)}
                      title="Reativar aplicação"
                    >
                      <RotateCcw className="w-3 h-3 text-green-600" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-5 w-5 p-0 bg-background hover:bg-red-50 border-red-200"
                    onClick={() => handleRemoveApplication(app.id)}
                    title={app.is_active ? "Remover aplicação" : "Remover associação"}
                  >
                    <X className="w-3 h-3 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Avisos sobre aplicações inativas */}
          {selectedApps.some(app => !app.is_active) && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
              ⚠️ Algumas aplicações estão inativas. Você pode reativá-las ou remover a associação.
            </div>
          )}
        </div>
      )}
    </div>
  );
};