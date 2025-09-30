import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, ArrowLeft, Users, Building2, X, Plus } from 'lucide-react';
import { usePurchasesEconomicGroups, type PurchasesEconomicGroup } from '@/hooks/usePurchasesEconomicGroups';
import { usePurchasesGroupMembers, type PurchasesGroupMember } from '@/hooks/usePurchasesGroupMembers';
import { usePurchasesUnifiedSupplierSearch } from '@/hooks/usePurchasesUnifiedSupplierSearch';
import { useEnrichedContactLinks } from '@/hooks/useEnrichedContactLinks';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PotentialSupplierCreateFullscreen } from '@/components/PotentialSupplierCreateFullscreen';
import { supabase } from '@/integrations/supabase/client';

interface SupplierLinkingFlowProps {
  onConfirm: (links: { link_type: 'fornecedor'; target_id: string; target_kind: string }[]) => void;
  onCancel: () => void;
}

type Step = 'select-group' | 'select-members';

interface SelectedGroup extends PurchasesEconomicGroup {
  uuid?: string;
}

export function SupplierLinkingFlow({ onConfirm, onCancel }: SupplierLinkingFlowProps) {
  const [step, setStep] = useState<Step>('select-group');
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [includeGroup, setIncludeGroup] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [matchedGroupIds, setMatchedGroupIds] = useState<Set<number>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { 
    groups, 
    loading: loadingGroups, 
    fetchAllGroups, 
    searchGroups 
  } = usePurchasesEconomicGroups();
  
  const { members, loading: loadingMembers, fetchMembers } = usePurchasesGroupMembers();
  const { searchSuppliers, searchResults } = usePurchasesUnifiedSupplierSearch();
  
  // Create contact links for enrichment
  const contactLinks = useMemo(() => {
    return (members || []).map(member => ({
      link_type: 'fornecedor' as const,
      target_id: member.unified_id,
      target_kind: 'unified_supplier' as const
    }));
  }, [members]);
  
  const { enrichedLinks, loading: loadingEnrichment } = useEnrichedContactLinks(contactLinks);

  useEffect(() => {
    fetchAllGroups();
  }, [fetchAllGroups]);

  // Enhanced search effect with debouncing
  useEffect(() => {
    const searchTermTrimmed = searchTerm.trim();
    
    if (!searchTermTrimmed) {
      setMatchedGroupIds(new Set());
      setIsSearching(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Search groups by name/code/etc
        await searchGroups(searchTermTrimmed);
        
        // Search suppliers to find groups with matching members
        await searchSuppliers(searchTermTrimmed);
      } catch (error) {
        console.error('Search error:', error);
        setMatchedGroupIds(new Set());
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchGroups, searchSuppliers]);

  // Sync matchedGroupIds with search results
  useEffect(() => {
    const groupIds = new Set(
      searchResults
        .map(result => result.current_group_id)
        .filter((id): id is number => id !== null && id !== undefined)
    );
    setMatchedGroupIds(groupIds);
  }, [searchResults]);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    if (!searchLower) {
      return groups;
    }
    
    return groups.filter(group => {
      // Search by group name
      const groupName = group.name?.toLowerCase() || '';
      if (groupName.includes(searchLower)) {
        return true;
      }
      
      // Search by group code
      const groupCode = group.code?.toLowerCase() || '';
      if (groupCode.includes(searchLower)) {
        return true;
      }
      
      // Search by buyer names
      const buyerNames = [
        group.assigned_buyer_name,
        group.group_assigned_buyer_name,
        ...(group.member_buyer_names || [])
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (buyerNames.includes(searchLower)) {
        return true;
      }
      
      // Search by material types
      const materialTypes = (group.material_type_names || []).join(' ').toLowerCase();
      if (materialTypes.includes(searchLower)) {
        return true;
      }
      
      // Search by matched group IDs (from member search)
      if (matchedGroupIds.has(group.id_grupo)) {
        return true;
      }
      
      return false;
    });
  }, [groups, searchTerm, matchedGroupIds]);

  const handleGroupSelect = async (group: PurchasesEconomicGroup) => {
    // Reset selections
    setSelectedMembers(new Set());
    setIncludeGroup(false);
    
    try {
      // Get the UUID for the group
      const { data: groupData, error: groupError } = await supabase
        .from('purchases_economic_groups')
        .select('id')
        .eq('id_grupo', group.id_grupo)
        .single();

      if (groupError) throw groupError;
      
      const selectedGroupWithUuid = {
        ...group,
        uuid: groupData.id
      };
      
      setSelectedGroup(selectedGroupWithUuid);
      
      // Fetch members and proceed to next step
      await fetchMembers(group.id_grupo);
      setStep('select-members');
    } catch (error) {
      console.error('Error loading group details:', error);
    }
  };

  const handleMemberToggle = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleConfirm = () => {
    const links: { link_type: 'fornecedor'; target_id: string; target_kind: string }[] = [];
    
    // Add group link if selected
    if (includeGroup && selectedGroup?.uuid) {
      links.push({
        link_type: 'fornecedor',
        target_id: selectedGroup.uuid,
        target_kind: 'economic_group_purchases'
      });
    }
    
    // Add member links
    selectedMembers.forEach(memberId => {
      links.push({
        link_type: 'fornecedor',
        target_id: memberId,
        target_kind: 'unified_supplier'
      });
    });
    
    onConfirm(links);
  };

  const handleSupplierCreated = async (payload: { groupId: number }) => {
    setIsCreateModalOpen(false);
    
    try {
      // Refresh the groups list to include the newly updated group
      await fetchAllGroups();
      
      // Find the group and select it
      const updatedGroups = await new Promise<PurchasesEconomicGroup[]>((resolve) => {
        const checkGroups = () => {
          if (groups && groups.some(g => g.id_grupo === payload.groupId)) {
            resolve(groups);
          } else {
            setTimeout(checkGroups, 500);
          }
        };
        checkGroups();
      });
      
      const targetGroup = updatedGroups.find(g => g.id_grupo === payload.groupId);
      
      if (targetGroup) {
        await handleGroupSelect(targetGroup);
      }
    } catch (error) {
      console.error('Error handling supplier creation:', error);
    }
  };

  const canConfirm = includeGroup || selectedMembers.size > 0;

  if (step === 'select-group') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Selecionar Grupo Econômico de Compras</Label>
          <p className="text-sm text-muted-foreground">
            Pesquise por: nome do grupo, códigos Protheus, comprador, materiais, nome/razão/CNPJ de membros, cidade/UF, etc.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar grupos por nome, membros, comprador, materiais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {isSearching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoadingSpinner className="h-4 w-4" />
              Pesquisando...
            </div>
          )}
          {searchTerm && !isSearching && (
            <p className="text-sm text-muted-foreground">
              {filteredGroups.length} grupo(s) encontrado(s)
            </p>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {loadingGroups ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum grupo encontrado' : 'Nenhum grupo disponível'}
            </div>
          ) : (
            filteredGroups.map((group) => (
              <Card
                key={group.id_grupo}
                className="p-4 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleGroupSelect(group)}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="font-medium">{group.name || group.ai_suggested_name || `Grupo ${group.id_grupo}`}</div>
                    <div className="text-sm text-muted-foreground">
                      {group.code} • {group.member_count} membro(s)
                      {group.assigned_buyer_name && ` • ${group.assigned_buyer_name}`}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="flex gap-4 justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Cadastrar Potencial Fornecedor
          </Button>
          
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>

        <PotentialSupplierCreateFullscreen
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleSupplierCreated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => {
          setStep('select-group');
          setSelectedMembers(new Set());
          setIncludeGroup(false);
        }}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="font-medium">Selecionar Vínculos</h3>
          <p className="text-sm text-muted-foreground">
            Grupo: {selectedGroup?.name || selectedGroup?.ai_suggested_name || `Grupo ${selectedGroup?.id_grupo}`}
          </p>
        </div>
      </div>

      {/* Group selection */}
      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="include-group"
            checked={includeGroup}
            onCheckedChange={(checked) => setIncludeGroup(!!checked)}
          />
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <Label htmlFor="include-group" className="cursor-pointer">
              Matriz (Grupo Econômico)
            </Label>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 ml-6">
          Vincular ao grupo econômico como um todo
        </p>
      </Card>

      {/* Members selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Fornecedores do Grupo
        </Label>
        
        <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-2">
          {loadingMembers ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : (members || []).length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Nenhum fornecedor encontrado neste grupo
            </div>
          ) : (
            (members || []).map((member) => {
              const enrichedMember = enrichedLinks.find(link => link.target_id === member.unified_id);
              const cityInfo = enrichedMember?.city_info;
              
              return (
                <div
                  key={member.unified_id}
                  className="flex items-center space-x-3 p-3 rounded border hover:bg-accent"
                >
                  <Checkbox
                    id={`member-${member.unified_id}`}
                    checked={selectedMembers.has(member.unified_id)}
                    onCheckedChange={() => handleMemberToggle(member.unified_id)}
                  />
                  <Label htmlFor={`member-${member.unified_id}`} className="cursor-pointer flex-1">
                    <div className="font-medium text-sm">{member.display_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {member.protheus_filial && member.protheus_cod && member.protheus_loja && 
                        `${member.protheus_filial} • ${member.protheus_cod} • ${member.protheus_loja}`
                      }
                      {member.assigned_buyer_name && ` • ${member.assigned_buyer_name}`}
                    </div>
                    {cityInfo && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {cityInfo.name}, {cityInfo.uf} - {cityInfo.country} • {cityInfo.distance_km_to_indaiatuba} kms até Indaiatuba • {cityInfo.average_truck_travel_time_hours}hrs média até Indaiatuba
                      </div>
                    )}
                  </Label>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex gap-4 justify-end pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm} disabled={!canConfirm}>
          Confirmar Vínculos ({(includeGroup ? 1 : 0) + selectedMembers.size})
        </Button>
      </div>
    </div>
  );
}