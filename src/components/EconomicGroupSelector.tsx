import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Search, Building, Info } from 'lucide-react';
import { useCustomerGroupsWithId, type CustomerGroupWithId } from '@/hooks/useCustomerGroupsWithId';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PROTHEUS_TABLES } from '@/lib/config';
interface EconomicGroupSelectorProps {
  value?: number;
  onValueChange: (groupId: number | undefined) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  showCreateButton?: boolean;
  disabled?: boolean;
}
export const EconomicGroupSelector = ({
  value,
  onValueChange,
  label = "Grupo Econômico",
  placeholder = "Selecione um grupo econômico...",
  required = false,
  helperText,
  showCreateButton = true,
  disabled = false
}: EconomicGroupSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [missingGroup, setMissingGroup] = useState<CustomerGroupWithId | null>(null);

  const {
    groups,
    loading,
    createGroup,
    fetchGroups
  } = useCustomerGroupsWithId();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Check if selected value exists in groups, if not fetch it separately
  useEffect(() => {
    if (value) {
      const existsInGroups = groups.some(g => g.id_grupo === value);
      console.log('EconomicGroupSelector - value:', value, 'existsInGroups:', existsInGroups, 'groups count:', groups.length);
      
      if (!existsInGroups) {
        console.log('EconomicGroupSelector - fetching missing group details for:', value);
        // Fetch the missing group details from protheus_customer_groups
        supabase
          .from('protheus_customer_groups')
          .select('id_grupo, name, ai_suggested_name')
          .eq('id_grupo', value)
          .single()
          .then(({ data, error }) => {
            if (data && !error) {
              console.log('EconomicGroupSelector - found missing group:', data);
              setMissingGroup({
                id_grupo: data.id_grupo,
                group_id: null, // We don't have this from protheus_customer_groups
                filial: '',
                cod: '',
                nome_grupo: data.name || data.ai_suggested_name || `Grupo ${data.id_grupo}`,
                nome_grupo_sugerido: data.ai_suggested_name,
                member_count: 0, // We don't have the count here, but it's just for display
                vendor_names: []
              });
            } else {
              console.warn('EconomicGroupSelector - could not fetch missing group:', error);
            }
          });
      } else {
        setMissingGroup(null);
      }
    } else {
      setMissingGroup(null);
    }
  }, [value, groups, loading]);
  // Combine regular groups with missing group if needed
  const allGroups = [...groups];
  if (missingGroup && !groups.some(g => g.id_grupo === missingGroup.id_grupo)) {
    allGroups.push(missingGroup);
  }

  const filteredGroups = allGroups.filter(group => group.nome_grupo.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Nome do grupo é obrigatório');
      return;
    }
    setIsCreating(true);
    try {
      const result = await createGroup(newGroupName.trim());
      console.log('Create group result:', result);
      
      // Refresh groups first to get the latest list
      await fetchGroups();
      
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        const resultObj = result as Record<string, any>;
        
        // Try to find the newly created group by searching with the group_id
        if (resultObj.group_id) {
          const newGroup = groups.find(g => g.group_id === resultObj.group_id);
          if (newGroup) {
            console.log('Found newly created group:', newGroup.id_grupo);
            onValueChange(newGroup.id_grupo);
            setIsCreateModalOpen(false);
            setNewGroupName('');
            toast.success('Grupo econômico criado com sucesso!');
            return;
          }
        }
        
        // Fallback: search by name (case insensitive)
        const groupName = newGroupName.trim().toLowerCase();
        const foundGroup = groups.find(g => 
          g.nome_grupo?.toLowerCase() === groupName
        );
        
        if (foundGroup) {
          console.log('Found group by name:', foundGroup.id_grupo);
          onValueChange(foundGroup.id_grupo);
          setIsCreateModalOpen(false);
          setNewGroupName('');
          toast.success('Grupo econômico criado com sucesso!');
          return;
        }
      }
      
      // If we reach here, we couldn't find the group
      console.error('Could not find newly created group');
      toast.error('Grupo criado, mas não foi possível selecioná-lo automaticamente');
      setIsCreateModalOpen(false);
      setNewGroupName('');
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Erro ao criar grupo econômico');
    } finally {
      setIsCreating(false);
    }
  };
  const selectedGroup = value ? allGroups.find(g => g.id_grupo === value) : null;
  return <TooltipProvider>
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-nowrap">
          <Label className="text-sm font-medium whitespace-nowrap">
            Grupo Econômico
          </Label>
          {required && <span className="text-slate-950">*</span>}
          <div className="flex items-center gap-2 flex-nowrap shrink-0">
            {helperText && <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="flex items-center">
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-md p-4">
                  <p className="text-sm leading-relaxed">
                    {helperText}
                  </p>
                </TooltipContent>
              </Tooltip>}
            {showCreateButton && <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="h-8 gap-2 whitespace-nowrap">
                    <Plus className="h-3 w-3" />
                    Novo Grupo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Grupo Econômico</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="group-name">Nome do Grupo</Label>
                      <Input id="group-name" placeholder="Digite o nome do grupo econômico..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateGroup} disabled={isCreating || !newGroupName.trim()}>
                        {isCreating ? 'Criando...' : 'Criar Grupo'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>}
          </div>
        </div>
        <Select value={value?.toString() ?? ''} onValueChange={val => onValueChange(val ? parseInt(val) : undefined)} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder}>
              {selectedGroup && <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedGroup.nome_grupo}</span>
                  <span className="text-muted-foreground text-sm">
                    ({selectedGroup.member_count} {selectedGroup.member_count === 1 ? 'membro' : 'membros'})
                  </span>
                </div>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Buscar grupo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-8" />
              </div>
            </div>
            
            {loading ? <SelectItem value="loading" disabled>
                Carregando grupos...
              </SelectItem> : filteredGroups.length === 0 ? <SelectItem value="empty" disabled>
                {searchTerm ? 'Nenhum grupo encontrado' : 'Nenhum grupo disponível'}
              </SelectItem> : filteredGroups.map(group => <SelectItem key={group.id_grupo} value={group.id_grupo.toString()}>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{group.nome_grupo}</span>
                    <span className="text-muted-foreground text-xs">
                      ({group.member_count} {group.member_count === 1 ? 'membro' : 'membros'})
                    </span>
                  </div>
                </SelectItem>)}
          </SelectContent>
        </Select>
        
        {required && !value && <p className="text-xs text-muted-foreground">
            Selecione um grupo econômico para continuar
          </p>}
      </div>
    </TooltipProvider>;
};