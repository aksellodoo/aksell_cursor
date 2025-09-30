import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FormLabel } from "@/components/ui/form";
import { Plus, Loader2 } from "lucide-react";
import { usePurchasesEconomicGroups, type PurchasesEconomicGroup } from "@/hooks/usePurchasesEconomicGroups";
import { toast } from "@/hooks/use-toast";

interface PurchasesEconomicGroupSelectorProps {
  value?: number | null;
  onValueChange: (value: number | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  showCreateButton?: boolean;
  disabled?: boolean;
}

interface SelectedGroupInfo {
  id_grupo: number;
  name: string;
  member_count: number;
}

export function PurchasesEconomicGroupSelector({
  value,
  onValueChange,
  label = "Grupo Econômico (Compras)",
  placeholder = "Buscar por nome, CNPJ, código, cidade, UF...",
  required = false,
  helperText,
  showCreateButton = true,
  disabled = false
}: PurchasesEconomicGroupSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedGroupInfo, setSelectedGroupInfo] = useState<SelectedGroupInfo | null>(null);
  
  const { groups, loading, refreshGroups, createGroup, searchGroups } = usePurchasesEconomicGroups();

  // Debounced search function using unified approach
  const debouncedSearch = useCallback(
    async (term: string) => {
      if (term.length >= 1) {
        // Use the unified searchGroups which calls fetchGroups with search term
        await searchGroups(term);
      } else {
        // Load first page without search term when cleared
        await refreshGroups(1, null);
      }
    },
    [searchGroups, refreshGroups]
  );

  // Handle search with debounce (increased for better UX)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchTerm);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, debouncedSearch]);

  // Load initial groups on mount
  useEffect(() => {
    refreshGroups(1, null);
  }, [refreshGroups]);

  // Update selectedGroupInfo when value changes or groups are loaded
  useEffect(() => {
    if (value) {
      const foundGroup = groups.find(g => g.id_grupo === value);
      if (foundGroup) {
        setSelectedGroupInfo({
          id_grupo: foundGroup.id_grupo,
          name: foundGroup.name || foundGroup.ai_suggested_name || `Grupo ${foundGroup.id_grupo}`,
          member_count: foundGroup.member_count || 0
        });
      }
    } else {
      setSelectedGroupInfo(null);
    }
  }, [value, groups]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do grupo é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const newGroup = await createGroup(newGroupName.trim());
      
      toast({
        title: "Sucesso",
        description: `Grupo "${newGroup.name}" criado com sucesso`,
      });
      
      // Immediately update selected group info
      const newGroupInfo: SelectedGroupInfo = {
        id_grupo: newGroup.id_grupo,
        name: newGroup.name || newGroupName.trim(),
        member_count: 0
      };
      setSelectedGroupInfo(newGroupInfo);
      
      // Set the newly created group as selected
      onValueChange(newGroup.id_grupo);
      
      // Close modal and reset form
      setShowCreateModal(false);
      setNewGroupName("");
      
      // Clear search and refresh groups to show the new group
      setSearchTerm("");
      await refreshGroups(1, newGroupInfo.name);
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar grupo",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleValueChange = (val: string) => {
    if (val === "__clear__") {
      setSelectedGroupInfo(null);
      onValueChange(null);
      return;
    }
    
    const parsed = parseInt(val);
    if (isNaN(parsed)) {
      onValueChange(null);
      return;
    }
    
    const foundGroup = groups.find(g => g.id_grupo === parsed);
    if (foundGroup) {
      const groupInfo: SelectedGroupInfo = {
        id_grupo: foundGroup.id_grupo,
        name: foundGroup.name || foundGroup.ai_suggested_name || `Grupo ${foundGroup.id_grupo}`,
        member_count: foundGroup.member_count || 0
      };
      setSelectedGroupInfo(groupInfo);
    }
    
    onValueChange(parsed);
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          {showCreateButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-1" />
              Criar grupo econômico
            </Button>
          )}
        </div>
        
        {helperText && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
        
          <Select
            value={value?.toString() || ""}
            onValueChange={handleValueChange}
            disabled={disabled || loading}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder={loading ? "Carregando grupos..." : placeholder}>
                {selectedGroupInfo && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedGroupInfo.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({selectedGroupInfo.member_count} {selectedGroupInfo.member_count === 1 ? 'membro' : 'membros'})
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <div className="p-2 space-y-2">
                <Input
                  placeholder="Buscar por nome, CNPJ, código, cidade, UF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-1"
                />
                <p className="text-xs text-muted-foreground">
                  Pesquise por nome (grupo/membros), CNPJ, código Protheus, cidade, UF
                </p>
              </div>
              
              <SelectItem value="__clear__">
                <span className="text-muted-foreground">Limpar seleção</span>
              </SelectItem>
            
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Carregando...</span>
              </div>
            ) : groups.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm ? "Nenhum grupo encontrado" : "Nenhum grupo disponível"}
              </div>
            ) : (
              groups.map((group) => (
                <SelectItem key={group.id_grupo} value={group.id_grupo.toString()}>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{group.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({group.member_count} {group.member_count === 1 ? 'membro' : 'membros'})
                      </span>
                    </div>
                    {group.code && (
                      <span className="text-xs text-muted-foreground">
                        Código: {group.code}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Create Group Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Grupo Econômico</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <FormLabel htmlFor="group-name">Nome do Grupo</FormLabel>
              <Input
                id="group-name"
                placeholder="Digite o nome do grupo..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreating) {
                    handleCreateGroup();
                  }
                }}
                disabled={isCreating}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setNewGroupName("");
              }}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateGroup}
              disabled={isCreating || !newGroupName.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Grupo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}