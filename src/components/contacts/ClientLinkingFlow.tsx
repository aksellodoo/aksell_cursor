import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, ArrowLeft, Users, Building2, X, Plus } from 'lucide-react';
import { useCustomerGroupsWithId, type CustomerGroupWithId, type UnifiedGroupMember } from '@/hooks/useCustomerGroupsWithId';
import { useEnrichedContactLinks } from '@/hooks/useEnrichedContactLinks';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { LeadCreateFullscreen } from '@/components/sales/LeadCreateFullscreen';
import { supabase } from '@/integrations/supabase/client';

interface ClientLinkingFlowProps {
  onConfirm: (links: { link_type: 'cliente'; target_id: string; target_kind: string }[]) => void;
  onCancel: () => void;
}

type Step = 'select-group' | 'select-members';

export function ClientLinkingFlow({ onConfirm, onCancel }: ClientLinkingFlowProps) {
  const [step, setStep] = useState<Step>('select-group');
  const [selectedGroup, setSelectedGroup] = useState<CustomerGroupWithId | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [includeGroup, setIncludeGroup] = useState(false);
  const [groupMembers, setGroupMembers] = useState<UnifiedGroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [matchedGroupIds, setMatchedGroupIds] = useState<Set<number>>(new Set());
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const { groups, loading: loadingGroups, getGroupMembers, fetchGroups, searchCustomers } = useCustomerGroupsWithId();
  
  // Create contact links for enrichment
  const contactLinks = useMemo(() => {
    return groupMembers.map(member => ({
      link_type: 'cliente' as const,
      target_id: member.unified_id,
      target_kind: 'unified_customer' as const
    }));
  }, [groupMembers]);
  
  const { enrichedLinks, loading: loadingEnrichment } = useEnrichedContactLinks(contactLinks);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

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
        const searchResults = await searchCustomers(searchTermTrimmed);
        const groupIds = new Set(
          searchResults
            .map(result => result.current_group_id)
            .filter((id): id is number => id !== null && id !== undefined)
        );
        setMatchedGroupIds(groupIds);
      } catch (error) {
        console.error('Search error:', error);
        setMatchedGroupIds(new Set());
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchCustomers]);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    if (!searchLower) {
      return groups;
    }
    
    return groups.filter(group => {
      // Search by group name
      const groupName = group.nome_grupo?.toLowerCase() || '';
      if (groupName.includes(searchLower)) {
        return true;
      }
      
      // Search by vendor name
      const vendorNames = [
        group.vendor_names,
        group.group_vendor_name
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (vendorNames.includes(searchLower)) {
        return true;
      }
      
      // Search by matched group IDs (from member search)
      if (matchedGroupIds.has(group.id_grupo)) {
        return true;
      }
      
      return false;
    });
  }, [groups, searchTerm, matchedGroupIds]);

  const handleGroupSelect = async (group: CustomerGroupWithId) => {
    setSelectedGroup(group);
    setLoadingMembers(true);
    
    try {
      const members = await getGroupMembers(group.id_grupo);
      setGroupMembers(members || []);
    } catch (error) {
      console.error('Error loading group members:', error);
      setGroupMembers([]);
    } finally {
      setLoadingMembers(false);
    }
    
    setStep('select-members');
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
    const links: { link_type: 'cliente'; target_id: string; target_kind: string }[] = [];
    
    // Add group link if selected - use group_id (UUID) instead of id_grupo
    if (includeGroup && selectedGroup) {
      links.push({
        link_type: 'cliente',
        target_id: selectedGroup.group_id, // Use UUID instead of integer
        target_kind: 'economic_group_sales'
      });
    }
    
    // Add member links
    selectedMembers.forEach(memberId => {
      links.push({
        link_type: 'cliente',
        target_id: memberId,
        target_kind: 'unified_customer'
      });
    });
    
    onConfirm(links);
  };

  const handleLeadCreated = async (payload: { leadId: string; economicGroupId: number }) => {
    setIsLeadModalOpen(false);
    
    try {
      // Refresh the groups list to include the newly created group
      await fetchGroups();
      
      // Find the group and select it
      const updatedGroups = await new Promise<CustomerGroupWithId[]>((resolve) => {
        const checkGroups = () => {
          if (groups && groups.some(g => g.id_grupo === payload.economicGroupId)) {
            resolve(groups);
          } else {
            setTimeout(checkGroups, 500);
          }
        };
        checkGroups();
      });
      
      const targetGroup = updatedGroups.find(g => g.id_grupo === payload.economicGroupId);
      
      if (targetGroup) {
        await handleGroupSelect(targetGroup);
      } else {
        // Fallback: fetch group details directly
        const { data: groupData } = await supabase
          .from('protheus_customer_groups')
          .select('*')
          .eq('id_grupo', payload.economicGroupId)
          .single();
          
        if (groupData) {
          const fallbackGroup: CustomerGroupWithId = {
            id_grupo: groupData.id_grupo,
            nome_grupo: groupData.name || groupData.ai_suggested_name,
            group_id: groupData.id,
            filial: groupData.filial || null,
            cod: groupData.cod || null,
            member_count: groupData.unit_count || 0,
            vendor_names: groupData.vendors || [],
            group_vendor_name: ''
          };
          await handleGroupSelect(fallbackGroup);
        }
      }
    } catch (error) {
      console.error('Error handling lead creation:', error);
    }
  };

  const canConfirm = includeGroup || selectedMembers.size > 0;

  if (step === 'select-group') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Selecionar Grupo Econômico</Label>
          <p className="text-sm text-muted-foreground">
            Pesquise por: nome do grupo, nome fantasia/razão social, CNPJ, cidade, UF, vendedor e código Protheus
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar grupos por nome, membros, vendedor..."
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
                    <div className="font-medium">{group.nome_grupo}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {group.id_grupo} • {group.member_count} membro(s)
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
            onClick={() => setIsLeadModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Cadastrar Lead
          </Button>
          
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>

        <LeadCreateFullscreen
          open={isLeadModalOpen}
          onOpenChange={setIsLeadModalOpen}
          onCreated={handleLeadCreated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setStep('select-group')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="font-medium">Selecionar Vínculos</h3>
          <p className="text-sm text-muted-foreground">
            Grupo: {selectedGroup?.nome_grupo}
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
          Unidades do Grupo
        </Label>
        
        <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-2">
          {loadingMembers ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : groupMembers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Nenhum membro encontrado neste grupo
            </div>
          ) : (
            groupMembers.map((member) => {
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
                      {member.protheus_filial} • {member.protheus_cod} • {member.protheus_loja}
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